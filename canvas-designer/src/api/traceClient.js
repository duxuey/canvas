/**
 * Trace 上报 client —— 把 AI 调用轨迹上报到可观测看板。
 *
 * 用法：
 *   const trace = createTraceClient();
 *   trace.startRun({ task, model });            // run_start
 *   const id = trace.emit({ type, name, parentId, input, output, meta });  // 返回本地 eventId
 *   trace.finish({ finalOutput, error, inputTokens, outputTokens });       // run_end
 *
 * 设计要点：
 *   - 事件 id / run_id 由本端用 crypto.randomUUID() 生成，parent_id 无需等服务端返回即可关联
 *   - 内部串行队列（Promise 链）保证服务端写入顺序；单条失败仅 console.warn，不阻断主流程
 *   - 经 vite proxy `/ai-trace` → 看板(8000)，避免 CORS；生产可用 VITE_TRACE_BASE 覆盖
 *
 * 环境变量：
 *   VITE_TRACE_BASE  看板地址（默认走 /ai-trace 代理）
 *   VITE_TRACE_FULL  设为 '1' 时关闭输入截断，上报全量 prompt（仅排查问题时临时开）
 */

const BASE = import.meta.env.VITE_TRACE_BASE || '/ai-trace';

function genId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// 截断过大的 input（如 llm_call 里含完整画布 state 的 system prompt），避免落盘/传输膨胀。
// 仅影响上报副本，实际 LLM 调用仍发全量。
//
// 注意两件事：
//   1. 被截掉的往往正是决定 AI 行为的那部分（画布 state），所以截断这件事本身
//      必须可核算——下面会把原始字符数一并上报，而不是只留一个 "…(truncated)"。
//   2. 排查具体问题时，把 VITE_TRACE_FULL 设为 1 可临时关闭截断，看到全量输入。
//      默认关闭是刻意的：单条 llm_call 的真实 prompt 可达百万字符，
//      全量落盘会让每个 run 的 trace 文件涨到 MB 级。
const TRACE_FULL = import.meta.env.VITE_TRACE_FULL === '1';
const TRACE_MAX_CHARS = 4000;

/**
 * 截断上报副本，并返回截断信息供 meta 使用。
 * @returns {{ value: any, truncated: boolean, originalChars: number }}
 */
function truncateForTrace(value, maxLen = TRACE_MAX_CHARS) {
  const originalChars = countChars(value);
  if (TRACE_FULL || value == null || !Array.isArray(value)) {
    return { value, truncated: false, originalChars };
  }
  let truncated = false;
  const out = value.map((m) => {
    if (m && typeof m === 'object' && typeof m.content === 'string' && m.content.length > maxLen) {
      truncated = true;
      return { ...m, content: m.content.slice(0, maxLen) + '…(truncated)' };
    }
    return m;
  });
  return { value: out, truncated, originalChars };
}

/** 消息数组的字符总量（含 content 与 tool_calls）。 */
function countChars(value) {
  if (!Array.isArray(value)) return 0;
  let n = 0;
  for (const m of value) {
    if (!m || typeof m !== 'object') continue;
    if (typeof m.content === 'string') n += m.content.length;
    if (Array.isArray(m.tool_calls)) n += JSON.stringify(m.tool_calls).length;
  }
  return n;
}

export function createTraceClient() {
  let runId = null;
  let chain = Promise.resolve();

  const queue = (fn) => {
    chain = chain.then(fn).catch((e) => console.warn('[trace] 上报失败:', e?.message || e));
  };

  async function post(path, body) {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`trace ${res.status}`);
    return res.json();
  }

  return {
    /** 创建 run，返回 runId（幂等：看板端重复调用会复用） */
    startRun({ task, model }) {
      runId = genId();
      queue(() => post('/api/ingest/runs', { run_id: runId, task, model, source: 'canvas' }));
      return runId;
    },

    /** 上报一条事件，同步返回本地 eventId（供 parent_id 关联） */
    emit({ type, name, parentId, input, output, meta }) {
      if (!runId) return null;
      const id = genId();
      const t = truncateForTrace(input);
      const payload = {
        id,
        parent_id: parentId ?? null,
        type,
        name,
        input: t.value,
        output,
        meta: {
          ...(meta || {}),
          // 截断信息单独放 meta，让看板能显眼地标出来，
          // 而不是让人从内容里的 "…(truncated)" 自己去发现
          ...(t.truncated
            ? { input_truncated: true, input_original_chars: t.originalChars }
            : {}),
        },
      };
      queue(() => post(`/api/ingest/runs/${runId}/events`, { events: [payload] }));
      return id;
    },

    /**
     * 结束 run。
     *
     * endedBy 说明「怎么结束的」（取值见 AI_project/app/tracer.py 的 ENDED_BY）：
     *   finish_tool / text_response  正常完成
     *   iteration_cap / empty_output 没做完——看板会记成 incomplete 而不是 completed
     * 不传时看板按老规矩推断，老调用方不受影响。
     */
    finish({ finalOutput, error, inputTokens = 0, outputTokens = 0, endedBy }) {
      if (!runId) return;
      queue(() =>
        post(`/api/ingest/runs/${runId}/finish`, {
          final_output: finalOutput,
          error,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          ended_by: endedBy ?? null,
        }),
      );
    },
  };
}
