import { useState, useRef, useEffect } from 'react';
import { useAiStore } from '../../store/aiStore';
import { useCanvasStore } from '../../store/canvasStore';
import { useUiStore } from '../../store/uiStore';
import { sendAiMessage, setAiConfig, getAiConfig, switchProvider, getProviders } from '../../api/aiApi';
import { executeToolCalls } from './AIActionHandler';
import Icon from '../common/Icon';

export default function AIAssistant() {
  const ai = useAiStore();
  const canvasStore = useCanvasStore();
  const ui = useUiStore();
  const [input, setInput] = useState('');
  const [apiKeyDialog, setApiKeyDialog] = useState(false);
  const [pos, setPos] = useState(null); // 拖拽后的 {x, y}，null 表示默认停靠右下角
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const dragRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ai.messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (ai.panelOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [ai.panelOpen]);

  // ── 拖拽：按住面板头部移动 ──
  const startDrag = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('button')) return; // 头部按钮不触发拖拽
    const rect = panelRef.current.getBoundingClientRect();
    dragRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const moveDrag = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const x = clamp(e.clientX - d.dx, 8, window.innerWidth - PANEL_W - 8);
    const y = clamp(e.clientY - d.dy, 8, window.innerHeight - PANEL_H - 8);
    setPos({ x, y });
  };
  const endDrag = () => { dragRef.current = null; };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || ai.loading) return;
    setInput('');

    // Add user message
    ai.addMessage({ role: 'user', content: text });
    ai.setLoading(true);
    ai.clearError();

    try {
      // Build canvas state for context
      const canvasState = {
        canvasName: canvasStore.canvasName,
        canvasType: canvasStore.canvasType,
        columns: canvasStore.columns,
        pageCode: canvasStore.pageCode,
        systemCode: canvasStore.systemCode,
        // 容器层级摘要 —— 便于 AI 定位区块/组件/标签页
        containers: summarizeContainers(canvasStore.items),
        // 元素清单 —— 便于 AI 按名称定位已有元素（改必填、改名等）
        elements: summarizeElements(canvasStore.items),
        // 顶层功能块清单（按顺序）—— 便于 AI 按名称定位并排序
        blocks: summarizeBlocks(canvasStore.items),
        items: canvasStore.items.map((item) => {
          const { _rowIdx, _colIdx, ...rest } = item;
          return rest;
        }),
        buttons: canvasStore.buttons,
      };

      // Send to AI. 必须读取 store 的最新状态：此闭包里的 ai.messages 是
      // addMessage 之前的旧快照，直接使用会漏掉当前这条用户消息。
      const history = useAiStore.getState().messages.map((m) => ({ role: m.role, content: m.content }));
      // 动作意图 → 强制模型至少调用一次工具（tool_choice: required），避免只回文字不执行
      const result = await sendAiMessage(history, canvasState, {
        toolChoice: hasActionIntent(text) ? 'required' : 'auto',
      });

      // 执行工具调用；若模型未返回任何工具调用，则走本地关键词兜底
      let toolCalls = result.toolCalls;
      if (toolCalls.length === 0) {
        toolCalls = detectLocalActions(text);
      }
      let toolResults = [];
      if (toolCalls.length > 0) {
        toolResults = await executeToolCalls(toolCalls);
      }

      // Build assistant reply
      let reply = '';
      if (result.text) {
        reply = result.text;
      }
      if (toolResults.length > 0) {
        reply += (reply ? '\n\n' : '') + toolResults.join('\n');
      }
      if (!reply) {
        reply = '✅ 操作已完成';
      }

      ai.addMessage({ role: 'assistant', content: reply });
    } catch (e) {
      const errMsg = e.message || '未知错误';
      ai.setError(errMsg);
      ai.addMessage({
        role: 'assistant',
        content: `❌ 出错了: ${errMsg}\n\n请检查:\n1. AI API key 是否已配置\n2. 网络连接是否正常\n3. API 额度是否充足`,
      });
    } finally {
      ai.setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!ai.panelOpen) return null;

  return (
    <div ref={panelRef} style={panelStyle(pos)}>
      {/* Header（可拖拽） */}
      <div
        style={headerStyle}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <span style={{ fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 26, height: 26, borderRadius: 8,
            background: 'rgba(255,255,255,.22)', border: '1px solid rgba(255,255,255,.25)',
            color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="ai" size={14} />
          </span>
          AI 智能助手
        </span>
        <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <button onClick={() => setApiKeyDialog(true)} className="hb-ai-header-btn" title="设置 API Key"><Icon name="settings" size={15} /></button>
          <button
            onClick={() => { ai.clearMessages(); ui.addToast('对话已重置，AI 已加载最新工具', 'info'); }}
            className="hb-ai-header-btn" title="清除对话"><Icon name="trash" size={15} /></button>
          <button onClick={ai.closePanel} className="hb-ai-header-btn" title="关闭"><Icon name="close" size={16} /></button>
        </div>
      </div>

      {/* Messages */}
      <div style={messagesStyle}>
        {ai.messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 8px', color: '#94a3b8', fontSize: 13 }}>
            <div style={{
              width: 58, height: 58, margin: '0 auto 12px', borderRadius: 18,
              background: 'linear-gradient(135deg, #5d9cec, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
              boxShadow: '0 8px 20px rgba(93,156,236,.35)',
            }}>
              <Icon name="ai" size={28} strokeWidth={1.7} />
            </div>
            <p style={{ color: '#475569', fontWeight: 600, marginBottom: 2 }}>告诉我你想做什么</p>
            <div style={{ textAlign: 'left', margin: '14px auto 0', maxWidth: 340 }}>
              <Example onClick={() => { setInput('把"折算系数"字段设为必填'); inputRef.current?.focus(); }}>
                "把折算系数字段设为必填"
              </Example>
              <Example onClick={() => { setInput('增加一个"被保人信息"区块'); inputRef.current?.focus(); }}>
                "增加一个被保人信息区块"
              </Example>
              <Example onClick={() => { setInput('保存并发布当前画布'); inputRef.current?.focus(); }}>
                "保存并发布当前画布"
              </Example>
              <Example onClick={() => { setInput('将当前画布同步到产品工厂'); inputRef.current?.focus(); }}>
                "将当前画布同步到产品工厂"
              </Example>
              <Example onClick={() => { setInput('查询当前系统的元件定义'); inputRef.current?.focus(); }}>
                "查询当前系统的元件定义"
              </Example>
            </div>
            <p style={{ fontSize: 11, color: '#cbd5e1', marginTop: 14 }}>
              支持改画布 / 保存 / 预览 / 发布 / 同步，以及元件、组件、画布、模板、系统的增删查
            </p>
          </div>
        )}
        {ai.messages.map((msg, i) => (
          <Bubble key={i} role={msg.role} content={msg.content} />
        ))}
        {ai.loading && (
          <Bubble role="assistant" content="思考中..." loading />
        )}
        {ai.error && (
          <div style={{ color: '#ff4d4f', fontSize: 11, padding: '4px 8px', margin: '4px 0', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Icon name="alert" size={13} /> {ai.error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={inputAreaStyle}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入指令，Enter 发送，Shift+Enter 换行..."
          rows={1}
          disabled={ai.loading}
          className="hb-ai-input"
          style={textAreaStyle}
        />
        <button onClick={handleSend}
          disabled={ai.loading || !input.trim()}
          style={sendBtnStyle(ai.loading || !input.trim())}>
          <Icon name="send" size={14} /> {ai.loading ? '处理中' : '发送'}
        </button>
      </div>

      {/* API Key Dialog */}
      {apiKeyDialog && <ApiKeyDialog onClose={() => setApiKeyDialog(false)} />}
    </div>
  );
}

/**
 * 生成容器层级摘要，帮助 AI 定位「区块 / 组件 / 标签页」，
 * 从而能把元素加到指定容器内部而非画布底部。
 */
function summarizeContainers(items) {
  const out = [];
  const walk = (list, path) => {
    for (const it of list || []) {
      if (it.itemType === 'section') {
        out.push({
          id: it._id,
          type: 'section',
          name: it.refName || '区块',
          path: path,
        });
        walk(it.childItems, path + '/' + (it.refName || '区块'));
      } else if (it.itemType === 'component') {
        out.push({
          id: it._id,
          type: 'component',
          name: it.refName || '组件',
          path: path,
        });
        walk(it.childItems, path + '/' + (it.refName || '组件'));
      } else if (it.itemType === 'tabGroup') {
        const tabs = (it.tabs || []).map((t) => ({
          id: t._id,
          name: t.name || '标签',
          tabId: t._id,
        }));
        out.push({
          id: it._id,
          type: 'tabGroup',
          name: it.refName || '标签页',
          path: path,
          tabs,
        });
        for (const t of it.tabs || []) {
          walk(t.childItems, path + '/' + (it.refName || '标签页') + '/' + (t.name || '标签'));
        }
      }
    }
  };
  walk(items, '');
  return out;
}

/**
 * 生成元素清单（含嵌套容器内的元素），让 AI 能按名称/路径定位已有元素，
 * 从而在「把折算系数设为必填」这类场景下调用 updateElement 而不是新建。
 */
function summarizeElements(items) {
  const out = [];
  const pushEl = (el, path) => {
    out.push({
      id: el._id,
      name: el.elem_name || el.refName || '未命名',
      controlType: el.control_type || 'text',
      required: el.required_flag === '1' || el.required_flag === true,
      path,
    });
  };
  const walk = (list, path) => {
    for (const it of list || []) {
      if (it.itemType === 'element') {
        pushEl(it, path);
      } else if (it.itemType === 'section') {
        walk(it.childItems, path + '/' + (it.refName || '区块'));
      } else if (it.itemType === 'component') {
        // 组件的字段位于 childElements（扁平元素列表），嵌套块位于 childItems
        for (const el of it.childElements || []) {
          pushEl(el, path + '/' + (it.refName || '组件'));
        }
        walk(it.childItems, path + '/' + (it.refName || '组件'));
      } else if (it.itemType === 'table') {
        for (const el of it.childElements || []) {
          pushEl(el, path + '/' + (it.refName || '数据列表'));
        }
      } else if (it.itemType === 'tabGroup') {
        for (const t of it.tabs || []) {
          walk(t.childItems, path + '/' + (it.refName || '标签页') + '/' + (t.name || '标签'));
        }
      }
    }
  };
  walk(items, '');
  return out;
}

/**
 * 生成顶层功能块清单（按当前顺序），供 AI 按名称定位块并调用 reorderBlock 排序。
 * 只列出顶层块（section/component/table/tabGroup），不包含嵌套子块。
 */
function summarizeBlocks(items) {
  const label = (it) => {
    if (it.refName) return it.refName;
    switch (it.itemType) {
      case 'section': return '区块';
      case 'component': return '组件';
      case 'table': return '数据列表';
      case 'tabGroup': return '标签页';
      default: return '块';
    }
  };
  const out = [];
  (items || []).forEach((it, i) => {
    if (['section', 'component', 'table', 'tabGroup'].includes(it.itemType)) {
      out.push({ index: i, id: it._id, type: it.itemType, name: label(it) });
    }
  });
  return out;
}

/** 判断用户文本是否含「动作」意图（用于决定 tool_choice 是否强制 required）。 */
function hasActionIntent(text) {
  return /预览|保存|发布|同步|打开|加载|切换|创建|新建|删除|排序|移动|添加|修改|必填|改名/.test(text || '');
}

/**
 * 本地关键词兜底：当模型未返回任何工具调用时，按关键词直接构造动作。
 * 覆盖最明确的画布级动作（预览 / 保存 / 发布 / 同步），保证不依赖模型也可靠执行。
 */
function detectLocalActions(text) {
  const t = text || '';
  const actions = [];
  if (/预览|查看效果|看下效果/.test(t)) actions.push({ name: 'previewCanvas', input: {} });
  if (/保存/.test(t)) actions.push({ name: 'saveCanvas', input: {} });
  if (/发布/.test(t)) actions.push({ name: 'publishCanvas', input: {} });
  if (/同步/.test(t)) actions.push({ name: 'syncToProd', input: {} });
  return actions;
}

/** Single chat bubble */
function Bubble({ role, content, loading }) {
  const isUser = role === 'user';
  return (
    <div style={{
      display: 'flex', gap: 8, justifyContent: isUser ? 'flex-end' : 'flex-start',
      alignItems: 'flex-end', marginBottom: 10, animation: 'fadeUp .22s ease',
    }}>
      {!isUser && <Avatar tone="ai" />}
      <div style={{
        maxWidth: '82%',
        padding: '10px 14px',
        borderRadius: isUser ? '16px 16px 5px 16px' : '16px 16px 16px 5px',
        background: isUser
          ? 'linear-gradient(135deg, #5d9cec, #4a8ad4)'
          : '#ffffff',
        color: isUser ? '#fff' : '#334155',
        fontSize: 13.5, lineHeight: 1.7,
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        border: isUser ? 'none' : '1px solid #e8ecf1',
        boxShadow: isUser ? '0 2px 8px rgba(93,156,236,.32)' : '0 1px 2px rgba(15,23,42,.04)',
      }}>
        {loading ? <Thinking /> : content}
      </div>
      {isUser && <Avatar tone="user" />}
    </div>
  );
}

/** Chat avatar — AI (渐变) / user (中性灰) */
function Avatar({ tone }) {
  return (
    <span style={{
      width: 27, height: 27, borderRadius: 9, flexShrink: 0,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: tone === 'user'
        ? 'linear-gradient(135deg, #cbd5e1, #94a3b8)'
        : 'linear-gradient(135deg, #8b5cf6, #5d9cec)',
      color: '#fff', boxShadow: '0 2px 5px rgba(15,23,42,.12)',
    }}>
      <Icon name={tone === 'user' ? 'user' : 'ai'} size={13} />
    </span>
  );
}

/** 三点跳动加载指示 */
function Thinking() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 1px' }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6',
          animation: 'aiDot 1.2s infinite', animationDelay: `${i * 0.15}s`,
        }} />
      ))}
    </span>
  );
}

/** Clickable example prompt */
function Example({ children, onClick }) {
  return (
    <div onClick={onClick} className="hb-ai-example">
      <Icon name="chevronRight" size={13} style={{ color: '#8b5cf6', flexShrink: 0, marginTop: 1 }} />
      <span>{children}</span>
    </div>
  );
}

/** AI configuration dialog — provider, endpoint, model, API key */
function ApiKeyDialog({ onClose }) {
  const [config, setConfig] = useState(() => {
    const cfg = getAiConfig();
    return {
      provider: cfg.provider,
      endpoint: cfg.endpoint,
      model: cfg.model,
      apiKey: '',
      thinking: cfg.thinking,
      availableModels: cfg.availableModels,
    };
  });
  const providers = getProviders();

  useEffect(() => {
    const saved = loadSavedKey();
    if (saved) setConfig((c) => ({ ...c, apiKey: saved }));
  }, []);

  const handleProviderChange = (pid) => {
    switchProvider(pid);
    const cfg = getAiConfig();
    setConfig({ provider: pid, endpoint: cfg.endpoint, model: cfg.model, apiKey: config.apiKey, thinking: cfg.thinking, availableModels: cfg.availableModels });
  };

  const handleSave = () => {
    setAiConfig({
      provider: config.provider,
      endpoint: config.endpoint,
      model: config.model,
      apiKey: config.apiKey.trim(),
      thinking: config.thinking,
    });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', padding: 20, borderRadius: 8, width: 420,
        boxShadow: '0 6px 20px rgba(0,0,0,0.15)', maxHeight: '80vh', overflow: 'auto',
      }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, display: 'flex', alignItems: 'center', gap: 7 }}>
          <Icon name="settings" size={16} /> AI 配置
        </h3>

        {/* Provider selector */}
        <label style={lbl}>LLM 提供商</label>
        <select value={config.provider} onChange={(e) => handleProviderChange(e.target.value)}
          style={inputStyle}>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Endpoint */}
        <label style={lbl}>API 地址</label>
        <input value={config.endpoint}
          onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
          placeholder="https://api.deepseek.com/v1/chat/completions"
          style={inputStyle} />

        {/* Model */}
        <label style={lbl}>模型</label>
        {(config.availableModels && config.availableModels.length > 0) ? (
          <select value={config.model} onChange={(e) => setConfig({ ...config, model: e.target.value })} style={inputStyle}>
            {config.availableModels.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
            {!config.availableModels.includes(config.model) && (
              <option value={config.model}>{config.model}</option>
            )}
          </select>
        ) : (
          <input value={config.model}
            onChange={(e) => setConfig({ ...config, model: e.target.value })}
            placeholder="deepseek-chat"
            style={inputStyle} />
        )}

        {/* Thinking toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>思考模式</div>
            <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
              {config.provider === 'deepseek' ? '关闭可加速响应；deepseek-reasoner 恒为思考模式' : '当前提供商不支持，此开关无效'}
            </div>
          </div>
          <label style={{ position: 'relative', display: 'inline-flex', cursor: 'pointer', flexShrink: 0, marginLeft: 12 }}>
            <input
              type="checkbox"
              checked={config.thinking}
              onChange={(e) => setConfig({ ...config, thinking: e.target.checked })}
              style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
            />
            <span style={{
              width: 40, height: 22, borderRadius: 999,
              background: config.thinking ? 'linear-gradient(135deg, #5d9cec, #8b5cf6)' : '#cbd5e1',
              transition: 'background .2s', display: 'inline-block', position: 'relative',
            }}>
              <span style={{
                position: 'absolute', top: 3, left: config.thinking ? 21 : 3,
                width: 16, height: 16, borderRadius: '50%', background: '#fff',
                transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.25)',
              }} />
            </span>
          </label>
        </div>

        {/* API Key */}
        <label style={lbl}>API Key</label>
        <input type="password" value={config.apiKey}
          onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
          placeholder={config.provider === 'deepseek' ? 'sk-...' : '输入 API Key'}
          style={inputStyle} />

        <p style={{ fontSize: 11, color: '#999', margin: '8px 0 12px' }}>
          密钥仅存储在浏览器 localStorage，通过后端 relay 转发请求。
          {config.provider === 'deepseek' ? (
            <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noreferrer"
              style={{ color: '#5d9cec' }}> 获取 DeepSeek API Key</a>
          ) : null}
        </p>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={secondaryBtnStyle}>取消</button>
          <button onClick={handleSave} style={primaryBtnStyle}>保存</button>
        </div>
      </div>
    </div>
  );
}

function loadSavedKey() {
  try {
    const cfg = JSON.parse(localStorage.getItem('ai_config') || 'null');
    return cfg?.apiKey || '';
  } catch { return ''; }
}

const lbl = { fontSize: 12, color: '#666', display: 'block', marginBottom: 3, marginTop: 10 };
const inputStyle = {
  width: '100%', padding: '7px 10px', border: '1px solid #d9d9d9',
  borderRadius: 4, fontSize: 13, background: '#ffffff',
};

// ================================================================
// Styles
// ================================================================
const PANEL_W = 460;
const PANEL_H = 600;

const clamp = (v, min, max) => Math.min(Math.max(v, min), Math.max(min, max));

/** 面板：默认停靠右下角（给属性面板留位），拖拽后切换为 left/top 定位 */
const panelStyle = (pos) => ({
  position: 'fixed',
  ...(pos
    ? { left: pos.x, top: pos.y, right: 'auto', bottom: 'auto' }
    : { right: 20, bottom: 16 }),
  width: PANEL_W,
  height: PANEL_H,
  background: '#ffffff',
  borderRadius: 16,
  border: '1px solid #e8ecf1',
  boxShadow: '0 24px 64px rgba(15,23,42,.22), 0 4px 12px rgba(15,23,42,.08)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  zIndex: 1000,
});

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '13px 16px',
  background: 'linear-gradient(135deg, #5d9cec 0%, #8b5cf6 100%)',
  color: '#fff',
  cursor: 'move',
  flexShrink: 0,
  userSelect: 'none',
  touchAction: 'none',
  boxShadow: '0 2px 8px rgba(93,156,236,.25)',
};

const messagesStyle = {
  flex: 1,
  overflow: 'auto',
  padding: '16px 16px 12px',
  background: 'linear-gradient(180deg, #f8fafc 0%, #f3f6fb 100%)',
};

const inputAreaStyle = {
  display: 'flex',
  gap: 9,
  alignItems: 'flex-end',
  padding: '13px 16px',
  borderTop: '1px solid #eef2f7',
  background: '#ffffff',
  flexShrink: 0,
};

const textAreaStyle = {
  flex: 1,
  padding: '10px 13px',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  fontSize: 13,
  resize: 'none',
  outline: 'none',
  fontFamily: 'inherit',
  background: '#f8fafc',
  lineHeight: 1.5,
  maxHeight: 110,
  transition: 'border-color .15s, box-shadow .15s, background .15s',
};

const sendBtnStyle = (disabled) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '9px 15px',
  background: disabled ? '#cbd5e1' : 'linear-gradient(135deg, #5d9cec, #8b5cf6)',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontSize: 13,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  boxShadow: disabled ? 'none' : '0 3px 10px rgba(93,156,236,.35)',
  transition: 'all .15s',
});

const primaryBtnStyle = {
  padding: '6px 16px', background: '#5d9cec', color: '#fff',
  border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500,
};

const secondaryBtnStyle = {
  padding: '6px 16px', background: '#f5f5f5', color: '#666',
  border: '1px solid #d9d9d9', borderRadius: 6, cursor: 'pointer', fontSize: 13,
};
