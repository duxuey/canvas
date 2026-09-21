import { useState, useRef, useEffect } from 'react';
import { useUiStore } from '../store/uiStore';
import { useSystemStore } from '../store/systemStore';
import { useCanvasStore } from '../store/canvasStore';
import { canvasApi } from '../api/canvasApi';
import { sendPageGenMessage, setAiConfig, getAiConfig } from '../api/aiApi';
import { executePageGenToolCalls } from '../components/ai/AIPageActionHandler';
import { useHashRouter } from '../hooks/useHashRouter';
import { Hero, Toolbar, Card, btnPrimary, btnDefault, overlay, modal } from '../components/common/FormFields';
import Icon from '../components/common/Icon';

const EXAMPLE_PROMPTS = [
  {
    label: '标准CRUD管理页面',
    text: '创建一个用户管理页面，包含搜索区域（用户名、手机号、状态）和用户列表表格，支持增删改查功能',
    icon: 'list',
  },
  {
    label: '数据详情页',
    text: '创建一个客户详情页面，展示客户基本信息（姓名、手机号、地址、等级），支持编辑保存',
    icon: 'detail',
  },
  {
    label: '简单表单页',
    text: '创建一个意见反馈页面，包含反馈类型（下拉选择）、反馈内容（文本域）、联系方式（文本框）和提交按钮',
    icon: 'type',
  },
  {
    label: '仪表盘页面',
    text: '创建一个数据统计仪表盘，包含统计卡片区域（总用户数、今日新增、活跃用户）和最近操作日志表格',
    icon: 'stat',
  },
];

export default function AIPageGenerator() {
  const { navigate } = useHashRouter();
  const ui = useUiStore();
  const sysStore = useSystemStore();
  const canvasStore = useCanvasStore();
  const [systemCode, setSystemCode] = useState('SYS01');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [apiKeyDialog, setApiKeyDialog] = useState(false);
  const [openingCode, setOpeningCode] = useState(null);
  const resultRef = useRef(null);

  useEffect(() => {
    if (result) {
      resultRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [result]);

  const handleGenerate = async () => {
    const desc = description.trim();
    if (!desc) {
      ui.addToast('请输入页面描述', 'error');
      return;
    }

    setLoading(true);
    setError(null);
    setProgress([]);
    setResult(null);

    const addProgress = (msg) => {
      setProgress((p) => [...p, msg]);
    };

    try {
      addProgress('正在分析您的需求...');

      const aiResult = await sendPageGenMessage(desc, systemCode);

      if (aiResult.toolCalls.length === 0) {
        setResult({
          summary: aiResult.text || 'AI 已处理您的请求。',
          toolCalls: [],
          pages: [],
        });
        addProgress('AI 分析完成');
        setLoading(false);
        return;
      }

      addProgress(`AI 规划了 ${aiResult.toolCalls.length} 个操作步骤`);

      for (const tc of aiResult.toolCalls) {
        const labels = {
          createElementDef: '创建元件定义',
          queryElementDefs: '查询已有元件',
          createComponent: '创建组件',
          queryComponents: '查询已有组件',
          createPage: '创建页面',
        };
        addProgress(`  → ${labels[tc.name] || tc.name}: ${JSON.stringify(tc.input).substring(0, 80)}...`);
      }

      addProgress('正在执行操作...');
      const toolResults = await executePageGenToolCalls(aiResult.toolCalls);

      const pages = [];
      for (let i = 0; i < aiResult.toolCalls.length; i++) {
        if (aiResult.toolCalls[i].name === 'createPage') {
          pages.push(aiResult.toolCalls[i].input);
        }
      }

      for (const r of toolResults) {
        addProgress(r);
      }

      addProgress('页面生成完成！');

      setResult({
        summary: aiResult.text || '页面已根据您的描述生成。',
        toolCalls: aiResult.toolCalls,
        toolResults,
        pages,
        systemCode,
      });

      ui.addToast('页面生成成功!', 'success');
    } catch (e) {
      const errMsg = e.message || '未知错误';
      setError(errMsg);
      addProgress(`出错: ${errMsg}`);
      ui.addToast('生成失败: ' + errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInDesigner = async (pageCode, pageName) => {
    setOpeningCode(pageCode);
    try {
      const data = await canvasApi.queryByCode(pageCode);
      const c = data?.canvas;
      if (!c) {
        ui.addToast(`未找到页面「${pageName}」，请确认页面已保存`, 'error');
        return;
      }
      const json = typeof c.c_canvas_json === 'string'
        ? JSON.parse(c.c_canvas_json || '{}')
        : (c.c_canvas_json || {});
      canvasStore.openCanvas(json, {
        canvasCode: c.c_canvas_code,
        canvasName: c.c_canvas_name,
        canvasEname: c.c_canvas_ename,
        canvasType: c.c_canvas_type,
        systemCode: c.c_system_code || systemCode,
        pageCode: c.c_page_code || pageCode,
      });
      canvasStore.setMeta({ templateCode: c.c_template_code || '' });
      navigate('designer');
      ui.addToast(`已加载页面「${c.c_canvas_name || pageName}」到设计器`, 'success');
    } catch (e) {
      ui.addToast('加载页面失败: ' + (e.message || ''), 'error');
    } finally {
      setOpeningCode(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="hb-page">
      <div className="hb-page-inner" style={{ maxWidth: 980, margin: '0 auto' }}>
        <Hero
          tone="violet"
          icon="ai"
          title="AI 页面生成器"
          desc="用自然语言描述你想要的页面，AI 会自动创建元件、组件并组装成页面"
          actions={
            <button onClick={() => setApiKeyDialog(true)} className="hb-btn ghost-light lg">
              <Icon name="settings" size={14} /> AI 设置
            </button>
          }
          stats={[
            { icon: 'system', label: '归属系统', value: sysStore.systems.length },
            { icon: 'templates', label: '示例模板', value: EXAMPLE_PROMPTS.length },
            { icon: 'components', label: '可生成资源', value: 2 },
          ]}
        />

        {/* Main input area */}
        <Card style={{ marginBottom: 16 }}>
          <Toolbar
            systemCode={systemCode}
            systems={sysStore.systems}
            onSystemChange={(e) => {
              if (e.target.value === '__manage__') { window.location.hash = 'system'; return; }
              setSystemCode(e.target.value);
            }}
          >
            <span style={{ color: '#94a3b8', fontSize: 11 }}>生成的内容将归属到此系统下</span>
          </Toolbar>

          <label style={{ color: '#1e293b', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
            页面描述
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="例如：创建一个客户管理页面，包含顶部的搜索区域（客户姓名、手机号、客户状态下拉框）和下方的客户列表表格，支持新增、编辑、删除功能..."
            rows={4}
            disabled={loading}
            className="hb-textarea"
            style={{ minHeight: 110, fontSize: 13 }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
            <span style={{ color: '#94a3b8', fontSize: 11 }}>Ctrl+Enter 快速生成</span>
            <button
              onClick={handleGenerate}
              disabled={loading || !description.trim()}
              className={btnPrimary}
              style={{ padding: '10px 32px', fontSize: 15 }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    display: 'inline-block', width: 14, height: 14,
                    border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                  }} /> 生成中...
                </span>
              ) : (
                <>
                  <Icon name="ai" size={16} /> 生成页面
                </>
              )}
            </button>
          </div>
        </Card>

        {/* Example prompts */}
        {!loading && !result && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: '#64748b', fontSize: 12, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="info" size={13} /> 试试这些示例：
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {EXAMPLE_PROMPTS.map((ex, i) => (
                <div key={i} onClick={() => setDescription(ex.text)}
                  className="hb-card hoverable"
                  style={{ padding: '13px 15px', cursor: 'pointer' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: 'linear-gradient(135deg, #eff5fd, #f5f3ff)',
                      color: '#5d9cec', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon name={ex.icon} size={14} />
                    </span>
                    <span style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{ex.label}</span>
                  </span>
                  <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: 11.5, lineHeight: 1.5 }}>
                    {ex.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress */}
        {progress.length > 0 && (
          <Card title="执行进度" icon="refresh" style={{ marginBottom: 16 }} bodyStyle={{ maxHeight: 300, overflow: 'auto' }}>
            <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12 }}>
              {progress.map((msg, i) => (
                <div key={i} style={{
                  color: msg.startsWith('出错') ? '#ff4d4f' : '#475569',
                  marginBottom: 4, lineHeight: 1.7,
                }}>
                  {msg}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Error */}
        {error && (
          <div className="hb-note tone-red" style={{ padding: 16, marginBottom: 16 }}>
            <p style={{ color: '#ff4d4f', fontSize: 13, margin: 0, display: 'flex', alignItems: 'center', gap: 7 }}>
              <Icon name="alert" size={15} /> {error}
            </p>
            <p style={{ color: '#94a3b8', fontSize: 11, margin: '8px 0 0' }}>
              请检查：1. AI API Key 是否配置 2. 网络连接 3. 后端 canvas-service 是否运行
            </p>
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div ref={resultRef} style={{ maxWidth: 980, margin: '0 auto', padding: '0 24px 24px' }}>
          <Card bodyStyle={{ padding: 24, background: 'linear-gradient(180deg, #f0fdf4, #ffffff)' }} style={{ borderColor: '#bbf7d0' }}>
            <h3 style={{ color: '#1e293b', fontSize: 16, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 26, height: 26, borderRadius: 8, background: '#f0fdf4', color: '#16a34a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="checkCircle" size={15} />
              </span>
              生成完成
            </h3>
            {result.summary && (
              <p style={{ color: '#475569', fontSize: 13, margin: '0 0 16px', lineHeight: 1.6 }}>
                {result.summary}
              </p>
            )}

            {/* Created pages */}
            {result.pages.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ color: '#1e293b', fontSize: 13, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="detail" size={14} /> 创建的页面:
                </p>
                {result.pages.map((p, i) => (
                  <div key={i} className="hb-card" style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', marginBottom: 8,
                  }}>
                    <span style={{
                      width: 34, height: 34, borderRadius: 9,
                      background: 'linear-gradient(135deg, #eff5fd, #f5f3ff)',
                      color: '#5d9cec', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon name="detail" size={16} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#1e293b', fontSize: 14, fontWeight: 500 }}>
                        {p.pageName || '未命名页面'}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: 11 }}>
                        代码: {p.pageCode || '—'} · 类型: {p.pageType || 'form'} · 列数: {p.columns || 2}
                      </div>
                    </div>
                    <button onClick={() => handleOpenInDesigner(p.pageCode, p.pageName)}
                      disabled={openingCode === p.pageCode}
                      className={btnPrimary} style={{ fontSize: 12, opacity: openingCode === p.pageCode ? 0.6 : 1 }}>
                      {openingCode === p.pageCode ? '加载中...' : '在设计器中打开'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Tool call summary */}
            <details style={{ marginTop: 12 }}>
              <summary style={{ color: '#64748b', fontSize: 12, cursor: 'pointer' }}>
                查看操作详情 ({result.toolCalls.length} 步)
              </summary>
              <div style={{ marginTop: 8, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 11, color: '#94a3b8' }}>
                {result.toolCalls.map((tc, i) => (
                  <div key={i} style={{ marginBottom: 4 }}>
                    <span style={{ color: '#5d9cec' }}>{tc.name}</span>
                    {' — '}
                    {result.toolResults?.[i] || '—'}
                  </div>
                ))}
              </div>
            </details>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button onClick={() => {
                setDescription('');
                setResult(null);
                setProgress([]);
                setError(null);
              }} className={btnPrimary}>
                <Icon name="ai" size={13} /> 继续生成新页面
              </button>
              <button onClick={() => navigate('designer')} className={btnDefault}>前往设计器</button>
              <button onClick={() => navigate('elements')} className={btnDefault}>查看元件定义</button>
            </div>
          </Card>
        </div>
      )}

      {/* API Key Dialog */}
      {apiKeyDialog && <ApiKeyDialog onClose={() => setApiKeyDialog(false)} />}

      {/* Inject keyframes for spinner */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/** Minimal API Key config dialog (same as in AIAssistant) */
function ApiKeyDialog({ onClose }) {
  const [config, setConfig] = useState(() => {
    const cfg = getAiConfig();
    return {
      provider: cfg.provider,
      endpoint: cfg.endpoint,
      model: cfg.model,
      apiKey: '',
    };
  });

  useEffect(() => {
    try {
      const cfg = JSON.parse(localStorage.getItem('ai_config') || 'null');
      if (cfg?.apiKey) setConfig((c) => ({ ...c, apiKey: cfg.apiKey }));
    } catch {}
  }, []);

  const handleSave = () => {
    setAiConfig({
      provider: config.provider,
      endpoint: config.endpoint,
      model: config.model,
      apiKey: config.apiKey.trim(),
    });
    onClose();
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={{ ...modal, width: 420 }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, display: 'flex', alignItems: 'center', gap: 7 }}>
          <Icon name="settings" size={16} /> AI 配置
        </h3>

        <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 3, marginTop: 10 }}>
          API 地址
        </label>
        <input value={config.endpoint}
          onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
          placeholder="https://api.deepseek.com/v1/chat/completions"
          className="hb-input" style={{ marginBottom: 0 }} />

        <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 3, marginTop: 12 }}>
          模型
        </label>
        <input value={config.model}
          onChange={(e) => setConfig({ ...config, model: e.target.value })}
          placeholder="deepseek-v4-flash"
          className="hb-input" style={{ marginBottom: 0 }} />

        <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 3, marginTop: 12 }}>
          API Key
        </label>
        <input type="password" value={config.apiKey}
          onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
          placeholder="sk-..."
          className="hb-input" style={{ marginBottom: 0 }} />

        <p style={{ fontSize: 11, color: '#94a3b8', margin: '8px 0 12px' }}>
          密钥仅存储在浏览器 localStorage，通过后端 relay 转发请求。
        </p>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} className={btnDefault}>取消</button>
          <button onClick={handleSave} className={btnPrimary}>保存</button>
        </div>
      </div>
    </div>
  );
}
