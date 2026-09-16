import { useCanvasStore } from '../../store/canvasStore';
import { useUiStore } from '../../store/uiStore';
import { useAiStore } from '../../store/aiStore';
import { useSystemStore } from '../../store/systemStore';

import { canvasApi } from '../../api/canvasApi';

import { useState, useEffect, useRef } from 'react';
import { loadTemplate } from '../canvas/quickTemplates';
import PublishDialog from '../dialogs/PublishDialog';
import Icon from '../common/Icon';
import Select from '../common/Select';

/* ============================================================
   Styles
   ============================================================ */

// ── Shared atoms ──
const ctrl = {
  padding: '4px 9px', border: '1px solid #e2e8f0', borderRadius: 7,
  background: '#fff', color: '#334155', fontSize: 12.5, outline: 'none',
  fontFamily: 'inherit', lineHeight: 1.45,
  transition: 'border-color .15s, box-shadow .15s',
};
const inp = { ...ctrl, width: 124 };
const sel = {
  ...ctrl, cursor: 'pointer', appearance: 'none', paddingRight: 24,
  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2710%27 height=%2710%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2394a3b8%27 stroke-width=%272%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E")',
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 7px center',
};

// ── Nav ──
const navWrap  = { background: 'linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%)', borderBottom: '1px solid #e8ecf1', flexShrink: 0, boxShadow: '0 1px 0 rgba(15,23,42,.02)' };
const navRow   = { display: 'flex', alignItems: 'center', height: 50, padding: '0 18px', gap: 2 };
const brand    = { fontSize: 12, color: '#5d9cec', display: 'flex', alignItems: 'center', gap: 8, marginRight: 10, fontFamily: '"Microsoft Yahei", sans-serif' };

const brandName = {
  fontWeight: 700, fontSize: 15, letterSpacing: '.3px',
  background: 'linear-gradient(135deg, #5d9cec 0%, #8b5cf6 100%)',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  fontFamily: '"Microsoft Yahei", sans-serif',
};
const brandSub  = {
  fontWeight: 600, fontSize: 15,
  background: 'linear-gradient(135deg, #5d9cec 0%, #8b5cf6 100%)',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  fontFamily: '"Microsoft Yahei", sans-serif',
};
const navSep   = { width: 1, height: 22, background: '#e8ecf1', margin: '0 8px' };

const tab = (active) => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '6px 13px', border: 'none', borderRadius: 8,
  background: active ? 'linear-gradient(135deg, #5d9cec, #4a8ad4)' : 'transparent',
  color: active ? '#fff' : '#5d9cec',
  cursor: 'pointer', fontSize: 12, fontWeight: active ? 600 : 500, whiteSpace: 'nowrap',
  boxShadow: active ? '0 2px 6px rgba(93,156,236,.32)' : 'none',
  transition: 'all .18s', fontFamily: '"Microsoft Yahei", sans-serif', lineHeight: 1.4,
});

// ── Toolbar ──
const tbar = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px',
  background: 'linear-gradient(180deg, #fafbfc 0%, #f4f7fb 100%)',
  flexShrink: 0, borderTop: '1px solid #e8ecf1', flexWrap: 'nowrap', overflowX: 'auto',
};
const card = {
  display: 'flex', alignItems: 'center', gap: 7,
  background: '#fff', borderRadius: 9, padding: '5px 11px',
  border: '1px solid #e8ecf1', boxShadow: '0 1px 2px rgba(15,23,42,.04)',
  flexShrink: 0, whiteSpace: 'nowrap',
};
const cardLabel = {
  fontSize: 11, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap',
  display: 'inline-flex', alignItems: 'center', gap: 5, marginRight: 2,
};
const cardLabelGlyph = {
  width: 20, height: 20, borderRadius: 6,
  background: 'linear-gradient(135deg, #eff5fd, #f5f3ff)',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  color: '#5d9cec', flexShrink: 0,
};

/* ============================================================
   Component
   ============================================================ */

export default function Header({ route, navigate }) {
  const store = useCanvasStore();
  const ui = useUiStore();
  const ai = useAiStore();
  const sysStore = useSystemStore();
  const [saving, setSaving] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  // ── 画布下拉列表 ──
  const [canvasList, setCanvasList] = useState([]);
  const [canvasLoading, setCanvasLoading] = useState(false);
  const [showNewCanvasInput, setShowNewCanvasInput] = useState(false);
  const prevSysRef = useRef(store.systemCode);

  const loadCanvasList = async (sysCode) => {
    setCanvasLoading(true);
    try {
      const data = await canvasApi.queryBySystem(sysCode);
      setCanvasList(data?.canvases || []);
    } catch { setCanvasList([]); }
    finally { setCanvasLoading(false); }
  };

  // systemCode 变化时重新加载画布列表
  useEffect(() => {
    if (prevSysRef.current !== store.systemCode) {
      prevSysRef.current = store.systemCode;
      loadCanvasList(store.systemCode);
    }
  }, [store.systemCode]);

  // 设计器激活时加载一次
  useEffect(() => {
    if (route.view === 'designer') {
      loadCanvasList(store.systemCode);
    }
  }, [route.view]);

  // 选择已有画布加载
  const handleSelectCanvas = async (canvasCode) => {
    if (canvasCode === '__loading__') return;
    if (!canvasCode || canvasCode === '__new__') {
      store.reset();
      store.setMeta({ systemCode: store.systemCode });
      setShowNewCanvasInput(true);
      return;
    }
    try {
      const data = await canvasApi.queryByCode(canvasCode);
      const cv = data?.canvas;
      if (!cv) {
        ui.addToast('画布未找到', 'error');
        return;
      }
      loadCanvasIntoStore(cv, store);
      ui.addToast('画布已加载', 'success');
    } catch (e) {
      ui.addToast('加载画布失败: ' + (e.message || ''), 'error');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const json = store.getCanvasJson();
      const result = await canvasApi.save({
        canvasCode: store.canvasCode || undefined,
        canvasName: store.canvasName, canvasEname: store.canvasEname,
        canvasType: store.canvasType, canvasJson: JSON.stringify(json),
        showOrder: 1, relJsFile: '', baseFlag: '0',
        systemCode: store.systemCode, pageCode: store.pageCode, templateCode: store.templateCode,
      });
      const savedCode = result?.canvasCode;
      if (savedCode) {
        store.setMeta({ canvasCode: savedCode });
        ui.addToast('画布保存成功: ' + savedCode, 'success');
        // 刷新画布列表
        loadCanvasList(store.systemCode);
        setShowNewCanvasInput(false);
      }
    } catch (e) { ui.addToast('保存失败: ' + e.message, 'error'); }
    finally { setSaving(false); }
  };

  /* ---- shared selects ---- */
  const sysOptions = [
    ...sysStore.systems.map((s) => ({ value: s.code, label: s.name })),
    ...(!sysStore.systems.some((s) => s.code === store.systemCode)
      ? [{ value: store.systemCode, label: store.systemCode }]
      : []),
    { value: '__manage__', label: '+ 管理' },
  ];
  const sysSelect = (w) => (
    <div style={{ width: w || 104 }}>
      <Select
        value={store.systemCode}
        options={sysOptions}
        onChange={(v) => { v === '__manage__' ? navigate('system') : store.setMeta({ systemCode: v }); }}
      />
    </div>
  );

  const NAV = [
    { key: 'designer', label: '设计器', icon: 'designer' },
    { key: 'canvases', label: '画布管理', icon: 'canvases' },
    { key: 'elements', label: '元件管理', icon: 'elements' },
    { key: 'components', label: '组件管理', icon: 'components' },
    { key: 'system', label: '系统管理', icon: 'system' },
    { key: 'templates', label: '模板管理', icon: 'templates' },
    { key: 'pageGenerator', label: 'AI 生成', icon: 'ai' },
  ];

  /* ============================================================
     Render
     ============================================================ */

  return (
    <>
      {/* ═══════════════════════ Nav ═══════════════════════ */}
      <div style={navWrap}>
        <div style={navRow}>

          {/* Brand */}
          <div style={brand}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0 }}>
              <defs>
                <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#5d9cec"/>
                  <stop offset="100%" stopColor="#8b5cf6"/>
                </linearGradient>
              </defs>
              <rect x="1" y="1" width="26" height="26" rx="7" fill="url(#bg)" />
              <rect x="6.5" y="6.5" width="6" height="15" rx="2.5" fill="#fff" opacity="0.95"/>
              <rect x="14.5" y="6.5" width="6" height="6.5" rx="2.5" fill="#fff" opacity="0.72"/>
              <rect x="14.5" y="15" width="6" height="6.5" rx="2.5" fill="#fff" opacity="0.5"/>
            </svg>
            <span style={brandName}>Canvas</span>
            <span style={brandSub}>Designer</span>
          </div>
          <div style={navSep} />

          {/* Nav tabs */}
          {NAV.map((item, i) => (
            <span key={item.key} style={{ display: 'inline-flex' }}>
              <button style={tab(route.view === item.key)}
                onClick={() => navigate(item.key)}>
                <Icon name={item.icon} size={14} strokeWidth={2} />
                {item.label}
              </button>
              {i === 0 && <div style={navSep} />}
              {i === 1 && <div style={navSep} />}
              {i === 3 && <div style={navSep} />}
              {i === 5 && <div style={navSep} />}
            </span>
          ))}

          {/* 返回设计（预览时显示，位于 AI 生成之后） */}
          {ui.previewOpen && (
            <span style={{ display: 'inline-flex' }}>
              <div style={navSep} />
              <button style={tab(false)} onClick={ui.togglePreview}>
                <Icon name="back" size={14} strokeWidth={2} /> 返回设计
              </button>
            </span>
          )}

          <div style={{ flex: 1 }} />

          {route.view !== 'designer' && (
            <button className="hb-btn sm" onClick={() => navigate('designer')}>
              <Icon name="back" size={13} /> 返回设计器
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════ Designer Toolbar ═══════════════════ */}
      {route.view === 'designer' && !ui.previewOpen && (
        <>
        <div style={{ height: 3, flexShrink: 0, background: 'linear-gradient(90deg, #5d9cec 0%, #8b5cf6 55%, #f0a6d8 100%)' }} />
        <div style={tbar}>

          {/* ── ① 系统归属 ── */}
          <div style={card}>
            <span style={cardLabel}><span style={cardLabelGlyph}><Icon name="system" size={12} /></span>系统</span>
            {sysSelect(130)}
          </div>

          {/* ── ② 画布选择（下拉） ── */}
          <div style={card}>
            <span style={cardLabel}><span style={cardLabelGlyph}><Icon name="canvases" size={12} /></span>画布</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 180 }}>
                <Select
                  value={store.canvasCode || '__new__'}
                  popMinWidth={300}
                  searchable
                  searchPlaceholder="搜索画布（代码 / 名称）"
                  options={[
                    { value: '__new__', label: '+ 新建画布' },
                    ...(canvasLoading
                      ? [{ value: '__loading__', label: '加载中...' }]
                      : canvasList.map((cv) => ({ value: cv.c_canvas_code, label: formatCanvasLabel(cv) }))),
                  ]}
                  onChange={(v) => handleSelectCanvas(v)}
                />
              </div>
              {showNewCanvasInput || (!store.canvasCode && canvasList.length === 0) ? (
                <input style={{ ...inp, width: 110 }}
                  value={store.canvasName}
                  onChange={(e) => store.setMeta({ canvasName: e.target.value })}
                  placeholder="画布名称" />
              ) : null}
            </div>
          </div>

          {/* ── ③ 表单列数 ── */}
          <div style={card}>
            <span style={cardLabel}><span style={cardLabelGlyph}><Icon name="designer" size={12} /></span>表单列数</span>
            <input type="number" min={1} max={6}
              style={{ ...inp, width: 36, textAlign: 'center', padding: '4px 2px' }}
              value={store.columns} onChange={(e) => store.setColumns(Number(e.target.value))} />
          </div>

          {/* ── ④ 快捷添加 ── */}
          <div style={card}>
            <span style={cardLabel}><span style={cardLabelGlyph}><Icon name="plus" size={12} /></span>添加</span>
            <button onClick={() => { const id = store.addTable(); ui.select(id, 'table', 'table'); }} title="添加表格块" className="hb-btn sm">
              <Icon name="list" size={12} /> 表格
            </button>
            <button onClick={() => { const id = store.addSection(); ui.select(id, 'section', 'section'); }} title="添加区块" className="hb-btn sm">
              <Icon name="groupFields" size={12} /> 区块
            </button>
            <button onClick={() => { const id = store.addTabGroup(); ui.select(id, 'tabGroup', 'tabGroup'); }} title="添加标签页" className="hb-btn sm">
              <Icon name="tabs" size={12} /> 标签页
            </button>
          </div>

          {/* ── ⑤ 快速模板 ── */}
          <div style={card}>
            <span style={cardLabel}><span style={cardLabelGlyph}><Icon name="templates" size={12} /></span>模板</span>
            <div style={{ width: 130 }}>
              <Select
                value=""
                placeholder="选择预设模板"
                options={[
                  { value: 'userAdd', label: '用户新增' },
                  { value: 'userEdit', label: '用户编辑' },
                  { value: 'searchBox', label: '搜索区域' },
                ]}
                onChange={(key) => { if (key) loadTemplate(store, ui, key, store.columns || 2); }}
              />
            </div>
          </div>

          {/* spacer */}
          <div style={{ flex: 1, minWidth: 8 }} />

          {/* ── 操作区 ── */}
          <div style={{
            ...card, gap: 4, padding: '4px 8px',
            background: 'linear-gradient(135deg, #fafbfc, #f0f4f8)',
            border: '1px solid #dce3ea',
          }}>
            <span style={{
              fontSize: 11, color: '#5d9cec', fontWeight: 600,
              background: '#eff5fd', borderRadius: 10, padding: '2px 10px',
              marginRight: 4,
            }}>
              {store.items.length} 项
            </span>

            <button onClick={() => setPublishOpen(true)} title="发布画布" style={actionBtn}>
              <Icon name="publish" size={13} /> 发布
            </button>

            <button onClick={ui.togglePreview} title="预览画布" style={actionBtn}>
              <Icon name="eye" size={13} /> 预览
            </button>

            <button onClick={handleSave} disabled={saving} title="保存画布" style={{
              ...actionBtn,
              padding: '5px 14px', border: 'none',
              background: saving ? '#94a3b8' : 'linear-gradient(135deg, #5d9cec, #4a8ad4)',
              color: '#fff', fontWeight: 600,
              boxShadow: '0 2px 6px rgba(93,156,236,.35)',
              opacity: saving ? .7 : 1,
            }}>
              <Icon name="save" size={13} /> {saving ? '保存中…' : '保存'}
            </button>

            <button onClick={ai.togglePanel} title="AI 智能助手" style={{
              ...actionBtn,
              padding: '5px 12px',
              border: `1.5px solid ${ai.panelOpen ? '#8b5cf6' : '#dce3ea'}`,
              background: ai.panelOpen ? 'linear-gradient(135deg, #f5f3ff, #ede9fe)' : '#fff',
              color: ai.panelOpen ? '#7c3aed' : '#475569',
              boxShadow: ai.panelOpen ? '0 0 0 2px rgba(139,92,246,.15)' : 'none',
            }}>
              <Icon name="ai" size={13} /> AI助手
            </button>
          </div>
        </div>
        </>
      )}

      {/* Publish dialog */}
      {publishOpen && <PublishDialog onClose={() => setPublishOpen(false)} />}
    </>
  );
}

const actionBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '5px 12px', border: '1px solid #dce3ea', borderRadius: 7,
  background: '#fff', color: '#475569', cursor: 'pointer',
  fontSize: 12, fontWeight: 500, fontFamily: 'inherit', lineHeight: 1.4,
  transition: 'all .15s', whiteSpace: 'nowrap',
};

/** 画布下拉标签：产品代码-产品名-投保页/报价页，如「01003-财产基本险-投保页」 */
function formatCanvasLabel(cv) {
  const code = cv.c_canvas_code || '';
  const name = cv.c_canvas_name || '';
  // c_canvas_code 形如 "01003_1"（产品号_contentType），把 _ 换成 - 作为产品代码前缀
  const prodCode = code.replace('_', '-');
  // 名称已含「-投保页/报价页」，若已以产品代码开头则不再重复
  if (name && !name.startsWith(prodCode)) {
    return `${prodCode}-${name}`;
  }
  return name || code;
}

/** 将后端返回的画布数据加载到 store */
function loadCanvasIntoStore(c, store) {
  const json = typeof c.c_canvas_json === 'string'
    ? JSON.parse(c.c_canvas_json || '{}')
    : (c.c_canvas_json || {});
  store.setFromCanvas(json, {
    canvasCode: c.c_canvas_code,
    canvasName: c.c_canvas_name,
    canvasEname: c.c_canvas_ename,
    canvasType: c.c_canvas_type,
    systemCode: c.c_system_code || 'SYS01',
    pageCode: c.c_page_code || 'PAGE01',
  });
  store.setMeta({ templateCode: c.c_template_code || '' });
}
