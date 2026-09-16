import { useState, useEffect } from 'react';
import { useUiStore } from '../../store/uiStore';
import { useCanvasStore } from '../../store/canvasStore';
import { useElementDefStore } from '../../store/elementDefStore';
import { pageTemplateApi } from '../../api/pageTemplateApi';
import { canvasApi } from '../../api/canvasApi';
import ComponentPalette from '../palette/ComponentPalette';
import Icon from '../common/Icon';
import { groupDefsByModule } from '../../utils/tableModules';

/** 分组内默认展示的元件数，超出后显示「更多」 */
const INITIAL_COUNT = 20;

/**
 * 画布设计器侧边栏。
 * 根据 ui.sidebarTab 显示「组件」或「元件」：
 *   - 打开画布设计 -> 组件列表
 *   - 「加载到设计器」/「编辑组件布局」时 -> 元件列表
 * 不显示 tab 切换按钮，由进入方式决定。
 */
export default function Sidebar() {
  const ui = useUiStore();

  return (
    <div style={{
      width: 224, background: '#fbfcfe', display: 'flex', flexDirection: 'column',
      borderRight: '1px solid #e8ecf1', flexShrink: 0, overflow: 'hidden',
    }}>
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {ui.sidebarTab === 'elements' ? <ElementDefList /> : <ComponentPalette />}
      </div>

      {/* Template quick-load at bottom (collapsible) */}
      <TemplateQuickLoad />
    </div>
  );
}

/** Saved element definitions — grouped by business module */
function ElementDefList() {
  const store = useElementDefStore();
  const canvasStore = useCanvasStore();
  const [collapsed, setCollapsed] = useState({});
  const [showMore, setShowMore] = useState({});

  useEffect(() => {
    store.loadDefs(canvasStore.systemCode).catch(() => {});
  }, [canvasStore.systemCode]);

  const defs = store.defs;
  const groups = groupDefsByModule(defs);

  const onDragStart = (e, def) => {
    e.dataTransfer.setData('application/canvas-element', JSON.stringify({
      controlType: def.control_type,
      elemCode: def.elem_code,
      elemName: def.elem_name,
      elemEname: def.elem_ename,
      relTableName: def.rel_table_name,
      relFieldName: def.rel_field_name,
      defaultValue: def.default_value,
      placeholder: def.placeholder,
      tooltipTitle: def.tooltip_title,
      requiredFlag: def.required_flag,
      checkType: def.check_type,
      minValue: def.min_value,
      maxValue: def.max_value,
      stringLength: def.string_length,
      codeListName: def.code_list_name,
      controlAttr: def.control_attr,
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const toggle = (module) => setCollapsed((c) => ({ ...c, [module]: !c[module] }));
  const expandAll = () => setCollapsed({});
  const collapseAll = () => setCollapsed(Object.fromEntries(groups.map(([m]) => [m, true])));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
          元件定义
          {defs.length > 0 && (
            <span style={{ fontSize: 10, color: '#fff', background: 'linear-gradient(135deg, #5d9cec, #4a8ad4)', borderRadius: 9, padding: '1px 7px', marginLeft: 6, fontWeight: 600 }}>
              {defs.length}
            </span>
          )}
        </span>
        <span style={{ display: 'flex', gap: 8 }}>
          <button onClick={collapseAll}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 11, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
            全部折叠
          </button>
          <button onClick={expandAll}
            style={{ background: 'none', border: 'none', color: '#5d9cec', fontSize: 11, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
            全部展开
          </button>
        </span>
      </div>
      {store.loading && (
        <p style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', padding: 16 }}>加载中...</p>
      )}
      {!store.loading && defs.length === 0 && (
        <p style={{ color: '#94a3b8', fontSize: 12 }}>
          暂无元件，去<a href="#elements" style={{ color: '#5d9cec' }}>元件管理</a>创建
        </p>
      )}
      {groups.map(([module, moduleDefs]) => {
        const isCollapsed = collapsed[module];
        const isMore = showMore[module];
        const visibleDefs = isMore ? moduleDefs : moduleDefs.slice(0, INITIAL_COUNT);
        const hiddenCount = moduleDefs.length - visibleDefs.length;
        return (
        <div key={module} style={{ marginBottom: 6 }}>
          <button onClick={() => toggle(module)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, width: '100%',
              padding: '7px 10px', background: '#f1f5f9', border: 'none',
              borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit',
              color: '#475569', textAlign: 'left',
            }}>
            <Icon name={isCollapsed ? 'chevronRight' : 'chevronDown'} size={13} style={{ color: '#94a3b8' }} />
            <span style={{ fontSize: 12, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {module}
            </span>
            <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>{moduleDefs.length}</span>
          </button>
          {!isCollapsed && (
            <div style={{ padding: '4px 0 2px' }}>
              {visibleDefs.map((def, i) => (
                <div key={def.elem_code || i}
                  draggable
                  onDragStart={(e) => onDragStart(e, def)}
                  title={def.elem_ename ? `${def.elem_name} (${def.elem_ename})` : def.elem_name}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 10px 7px 26px', marginBottom: 3, background: '#fff',
                    borderRadius: 7, cursor: 'grab', border: '1px solid #e8ecf1',
                    fontSize: 12, color: '#334155', userSelect: 'none',
                    boxShadow: '0 1px 2px rgba(15,23,42,.04)',
                    transition: 'border-color .15s, box-shadow .15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#5d9cec'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(93,156,236,.18)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e8ecf1'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(15,23,42,.04)'; }}>
                  <span style={{ flex: 1, overflow: 'hidden', minWidth: 0, whiteSpace: 'nowrap' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {def.elem_name || '未命名'}
                    </span>
                    {def.elem_code && (
                      <span style={{
                        fontSize: 10, color: '#94a3b8', marginLeft: 6,
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                      }}>
                        {def.elem_code}
                      </span>
                    )}
                  </span>
                  <span style={{
                    fontSize: 9, color: '#5d9cec', background: '#eff5fd',
                    padding: '1px 6px', borderRadius: 8, flexShrink: 0,
                  }}>
                    {def.control_type}
                  </span>
                </div>
              ))}
              {hiddenCount > 0 && (
                <button
                  onClick={() => setShowMore((s) => ({ ...s, [module]: true }))}
                  style={{
                    display: 'block', width: '100%', padding: '5px 0 5px 26px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#5d9cec', fontSize: 11, textAlign: 'left', fontFamily: 'inherit',
                  }}>
                  更多 ({hiddenCount}) ⌄
                </button>
              )}
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
}

/** Compact template loader at the bottom of the sidebar */
function TemplateQuickLoad() {
  const ui = useUiStore();
  const canvasStore = useCanvasStore();
  const [templates, setTemplates] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open && templates.length === 0) {
      pageTemplateApi.queryBySystem(canvasStore.systemCode).then((data) => {
        setTemplates(data?.templates || []);
      }).catch(() => {});
    }
  }, [open, canvasStore.systemCode]);

  const handleOpenTemplate = async (tpl) => {
    try {
      const data = await pageTemplateApi.queryCanvases(tpl.c_template_code);
      const canvases = data?.canvases || [];
      if (canvases.length === 0) {
        canvasStore.reset();
        canvasStore.setMeta({ templateCode: tpl.c_template_code, systemCode: tpl.c_system_code || 'SYS01' });
        ui.addToast('模板已应用到设计器（无画布，请新建）', 'info');
        return;
      }
      const cv = canvases[0];
      const cvd = await canvasApi.queryByCode(cv.c_canvas_code);
      const c = cvd?.canvas;
      if (!c) return;
      const json = typeof c.c_canvas_json === 'string' ? JSON.parse(c.c_canvas_json || '{}') : (c.c_canvas_json || {});
      canvasStore.setFromCanvas(json, {
        canvasCode: c.c_canvas_code,
        canvasName: c.c_canvas_name,
        canvasEname: c.c_canvas_ename,
        canvasType: c.c_canvas_type,
        systemCode: c.c_system_code,
        pageCode: c.c_page_code,
      });
      canvasStore.setMeta({ templateCode: tpl.c_template_code });
      ui.addToast('模板画布已加载: ' + c.c_canvas_name, 'success');
    } catch (e) {
      ui.addToast('加载模板失败: ' + (e.message || ''), 'error');
    }
  };

  return (
    <div style={{ borderTop: '1px solid #e8ecf1' }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', padding: '10px 14px', background: 'none', border: 'none',
        cursor: 'pointer', color: '#64748b', fontSize: 12, textAlign: 'left',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: 'inherit',
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <Icon name="templates" size={14} /> 模板快速加载
        </span>
        <Icon name={open ? 'chevronUp' : 'chevronDown'} size={14} style={{ color: '#94a3b8' }} />
      </button>
      {open && (
        <div style={{ padding: '0 10px 10px', maxHeight: 200, overflow: 'auto' }}>
          {templates.length === 0 && (
            <p style={{ color: '#94a3b8', fontSize: 11, padding: '4px 0' }}>暂无模板</p>
          )}
          {templates.map((tpl, i) => (
            <div key={i} onClick={() => handleOpenTemplate(tpl)} style={{
              padding: '7px 10px', marginBottom: 3, background: '#fff',
              borderRadius: 7, cursor: 'pointer', border: '1px solid #e8ecf1',
              fontSize: 12, color: '#334155', transition: 'border-color .15s',
            }}>
              {tpl.c_template_name || tpl.c_template_code}
            </div>
          ))}
          <button onClick={ui.openTemplatePicker} style={{
            marginTop: 6, width: '100%', padding: '6px', background: '#fff',
            color: '#5d9cec', border: '1px dashed #b3d4f7', borderRadius: 7, cursor: 'pointer', fontSize: 11,
            fontFamily: 'inherit',
          }}>
            完整模板浏览器...
          </button>
        </div>
      )}
    </div>
  );
}
