import { useState, useEffect } from 'react';
import { useTemplateStore } from '../../store/templateStore';
import { useCanvasStore } from '../../store/canvasStore';
import { useUiStore } from '../../store/uiStore';
import { pageTemplateApi } from '../../api/pageTemplateApi';
import { canvasApi } from '../../api/canvasApi';

export default function TemplatePicker({ onClose }) {
  const tplStore = useTemplateStore();
  const canvasStore = useCanvasStore();
  const ui = useUiStore();
  const [sysCode, setSysCode] = useState('SYS01');
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [expanded, setExpanded] = useState(null); // templateCode of expanded row
  const [canvases, setCanvases] = useState([]);

  useEffect(() => {
    loadTemplates();
  }, [sysCode]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await pageTemplateApi.queryBySystem(sysCode);
      setTemplates(data?.templates || []);
    } catch (e) {
      ui.addToast('加载模板失败: ' + (e.message || ''), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = async (templateCode) => {
    if (expanded === templateCode) { setExpanded(null); setCanvases([]); return; }
    setExpanded(templateCode);
    try {
      const data = await pageTemplateApi.queryCanvases(templateCode);
      setCanvases(data?.canvases || []);
    } catch (e) {
      setCanvases([]);
    }
  };

  const handleLoadCanvas = async (canvasCode) => {
    try {
      const data = await canvasApi.queryByCode(canvasCode);
      const c = data?.canvas;
      if (!c) { ui.addToast('画布未找到', 'error'); return; }
      const json = typeof c.c_canvas_json === 'string' ? JSON.parse(c.c_canvas_json || '{}') : (c.c_canvas_json || {});
      canvasStore.setFromCanvas(json, {
        canvasCode: c.c_canvas_code,
        canvasName: c.c_canvas_name,
        canvasEname: c.c_canvas_ename,
        canvasType: c.c_canvas_type,
        systemCode: c.c_system_code,
        pageCode: c.c_page_code,
      });
      canvasStore.setMeta({ templateCode: expanded || '' });
      ui.addToast('画布加载成功: ' + canvasCode, 'success');
      onClose();
    } catch (e) {
      ui.addToast('加载失败: ' + (e.message || ''), 'error');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998,
    }} onClick={onClose}>
      <div style={{
        background: '#ffffff', borderRadius: 8, padding: 20, width: 700, maxHeight: '80vh',
        display: 'flex', flexDirection: 'column', border: '1px solid #e0e0e0',
        boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ color: '#333', fontSize: 16 }}>选择模板</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#999', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <input value={sysCode} onChange={(e) => setSysCode(e.target.value)}
            placeholder="系统代码" style={{
              padding: '6px 10px', background: '#ffffff', color: '#333',
              border: '1px solid #d9d9d9', borderRadius: 4, width: 120, fontSize: 13,
            }} />
          <button onClick={loadTemplates} style={{
            padding: '6px 14px', background: '#5d9cec', color: '#fff',
            border: '1px solid #5d9cec', borderRadius: 4, cursor: 'pointer', fontSize: 13,
          }}>刷新</button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', minHeight: 200 }}>
          {loading && <p style={{ color: '#999', fontSize: 13, textAlign: 'center', padding: 40 }}>加载中...</p>}
          {!loading && templates.length === 0 && (
            <p style={{ color: '#999', fontSize: 13, textAlign: 'center', padding: 40 }}>暂无模板</p>
          )}
          {!loading && templates.map((tpl, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              <div
                onClick={() => handleExpand(tpl.c_template_code)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                  background: expanded === tpl.c_template_code ? '#eff5fd' : '#fafafa',
                  borderRadius: 4, cursor: 'pointer',
                  border: expanded === tpl.c_template_code ? '1px solid #5d9cec' : '1px solid #e0e0e0',
                }}>
                <span style={{ color: '#333', flex: 1, fontSize: 14 }}>
                  {tpl.c_template_name || tpl.c_template_code}
                </span>
                <span style={{ color: '#666', fontSize: 12 }}>{tpl.c_template_code}</span>
                <span style={{ color: '#999', fontSize: 11 }}>{tpl.c_template_type}</span>
                <span style={{ color: '#5d9cec', fontSize: 12 }}>
                  {expanded === tpl.c_template_code ? '收起 ▲' : '展开 ▼'}
                </span>
              </div>
              {expanded === tpl.c_template_code && (
                <div style={{ marginLeft: 20, marginTop: 4, marginBottom: 8 }}>
                  {canvases.length === 0 && (
                    <p style={{ color: '#999', fontSize: 12, padding: 8 }}>该模板下暂无画布</p>
                  )}
                  {canvases.map((cv, ci) => (
                    <div key={ci} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                      background: '#fafafa', borderRadius: 3, marginBottom: 2,
                      border: '1px solid #e0e0e0',
                    }}>
                      <span style={{ color: '#333', flex: 1, fontSize: 13 }}>
                        {cv.c_canvas_name || cv.c_canvas_code}
                      </span>
                      <span style={{ color: '#666', fontSize: 11 }}>{cv.c_canvas_type}</span>
                      <span style={{ color: '#999', fontSize: 11 }}>{cv.c_canvas_code}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleLoadCanvas(cv.c_canvas_code); }}
                        style={{
                          padding: '3px 12px', background: '#5d9cec', color: '#fff',
                          border: 'none', borderRadius: 3, cursor: 'pointer', fontSize: 12,
                        }}>
                        打开
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
