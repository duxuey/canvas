import { useState, useEffect } from 'react';
import { useComponentStore } from '../store/componentStore';
import { useCanvasStore } from '../store/canvasStore';
import { useUiStore } from '../store/uiStore';
import { useSystemStore } from '../store/systemStore';
import { useElementDefStore } from '../store/elementDefStore';

import {
  Hero, heroAction, Toolbar, Card, EmptyState, Tag, btnPrimary, btnDefault, btnDanger, Pagination,
} from '../components/common/FormFields';
import CanvasElementRender from '../components/canvas/CanvasElementRender';
import Icon from '../components/common/Icon';
import { groupDefsByModule } from '../utils/tableModules';

const TYPE_TONE = { form: 'blue', table: 'green', search: 'violet' };
const TYPE_ICON = {
  text: 'type', number: 'number', textarea: 'textarea', select: 'select',
  datePicker: 'datePicker', checkbox: 'checkbox', radio: 'radio', label: 'label',
  divider: 'divider', button: 'button', switch: 'switch', file: 'file',
  search: 'search', hidden: 'hidden', groupFields: 'groupFields',
};

export default function ComponentManager() {
  const store = useComponentStore();
  const canvasStore = useCanvasStore();
  const ui = useUiStore();
  const sysStore = useSystemStore();
  const [sysCode, setSysCode] = useState('SYS01');
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ groupCode: '', groupName: '', groupDesc: '', groupType: 'form' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => { store.loadComponents(sysCode).catch(() => {}); }, [sysCode]);

  const handleSave = async () => {
    if (!form.groupName.trim()) { ui.addToast('请输入组件名称', 'error'); return; }
    setSaving(true);
    try {
      const result = await store.saveComponent({ ...form, systemCode: sysCode });
      const groupCode = result?.groupCode || form.groupCode;
      ui.addToast('组件保存成功', 'success');
      await store.loadComponents(sysCode);
      if (groupCode) {
        store.startEdit({
          c_group_code: groupCode,
          c_group_name: form.groupName,
          c_group_desc: form.groupDesc,
          c_group_type: form.groupType,
        });
      }
    } catch (e) {
      ui.addToast('保存失败: ' + (e.message || ''), 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (code) => {
    try {
      await store.deleteComponent(code);
      ui.addToast('组件已删除', 'success');
      await store.loadComponents(sysCode);
    } catch (e) {
      ui.addToast('删除失败: ' + (e.message || ''), 'error');
    }
  };

  const handleEditLayout = (comp) => {
    store.startEdit(comp);
    setShowEditor(true);
  };

  const handleOpenInDesigner = (comp) => {
    // 明确语义：这是「展开为新画布」，不是「编辑组件」
    const ok = window.confirm(
      `「展开为新画布」会将组件 "${comp.c_group_name || comp.c_group_code}" 的元件平铺展开成一个新画布草稿，\n` +
      `保存时会生成一个新画布，不会修改组件本身。\n\n` +
      `如需修改组件本身，请使用「编辑布局」。\n\n是否继续？`
    );
    if (!ok) return;
    canvasStore.reset();
    let raw = comp.elements || comp.c_elements_json || [];
    if (typeof raw === 'string') { try { raw = JSON.parse(raw); } catch { raw = []; } }
    let elements = [];
    let compCols = 2;
    if (raw && !Array.isArray(raw) && raw.elements) {
      compCols = raw.columns || 2;
      elements = raw.elements;
    } else if (Array.isArray(raw)) {
      elements = raw;
    }
    canvasStore.setMeta({
      canvasName: (comp.c_group_name || comp.c_group_code) + '-新画布',
      templateCode: comp.c_group_code,
      systemCode: comp.c_system_code || sysCode,
      columns: compCols,
    });
    elements.forEach((el, i) => {
      canvasStore.addItem('element', {
        controlType: el.control_type,
        code: el.elem_code,
        name: el.elem_name,
        fieldName: el.rel_field_name,
        tableName: el.rel_table_name,
        placeholder: el.placeholder,
        required: el.required_flag === '1',
      }, el._rowIdx || 0, el._colIdx || i);
    });
    ui.addToast(`组件 "${comp.c_group_name || comp.c_group_code}" 已展开为新画布草稿`, 'success');
    ui.setSidebarTab('elements'); // 展开后侧边栏显示元件
    window.location.hash = 'designer';
  };

  // Layout Editor inline
  if (store.editingCode && showEditor) {
    return <LayoutEditor store={store} ui={ui} sysCode={sysCode} saving={saving} setSaving={setSaving}
      onClose={() => { store.cancelEdit(); setShowEditor(false); }} />;
  }

  const comps = store.components;
  const totalPages = Math.max(1, Math.ceil(comps.length / pageSize));
  const curPage = Math.min(page, totalPages);
  const pagedComps = comps.slice((curPage - 1) * pageSize, curPage * pageSize);
  const stats = [
    { icon: 'components', label: '组件总数', value: comps.length },
    { icon: 'type', label: '表单组件', value: comps.filter((c) => c.c_group_type === 'form').length },
    { icon: 'list', label: '表格组件', value: comps.filter((c) => c.c_group_type === 'table').length },
    { icon: 'search', label: '搜索组件', value: comps.filter((c) => c.c_group_type === 'search').length },
  ];

  return (
    <div className="hb-page">
      <div className="hb-page-inner" style={{ maxWidth: 1040, margin: '0 auto' }}>
        <Hero
          icon="components"
          title="组件管理"
          desc="将多个元件组合成可复用的组件"
          actions={
            <button onClick={() => { setForm({ groupCode: '', groupName: '', groupDesc: '', groupType: 'form' }); setShowEditor(true); }}
              className={heroAction}>
              <Icon name="plus" size={14} /> 新建组件
            </button>
          }
          stats={stats}
        />

        <Toolbar
          systemCode={sysCode}
          systems={sysStore.systems}
          count={store.components.length}
          onSystemChange={(e) => {
            if (e.target.value === '__manage__') { window.location.hash = 'system'; return; }
            setSysCode(e.target.value);
            setPage(1);
          }}
          onRefresh={() => store.loadComponents(sysCode)}
        />

        {/* New component form */}
        {showEditor && !store.editingCode && (
          <Card title={form.groupCode ? '编辑组件' : '新建组件'} icon="components" style={{ marginBottom: 16 }}
            actions={<button onClick={() => setShowEditor(false)} className="hb-icon-btn"><Icon name="close" size={15} /></button>}>
            <input placeholder="组件代码 (留空自动生成)" value={form.groupCode}
              onChange={(e) => setForm({ ...form, groupCode: e.target.value })} className="hb-input" style={{ marginBottom: 10 }} />
            <input placeholder="组件名称 *必填" value={form.groupName}
              onChange={(e) => setForm({ ...form, groupName: e.target.value })} className="hb-input" style={{ marginBottom: 10 }} />
            <input placeholder="组件描述" value={form.groupDesc}
              onChange={(e) => setForm({ ...form, groupDesc: e.target.value })} className="hb-input" style={{ marginBottom: 10 }} />
            <select value={form.groupType}
              onChange={(e) => setForm({ ...form, groupType: e.target.value })}
              className="hb-select" style={{ width: 'auto' }}>
              <option value="form">form - 表单组件</option>
              <option value="table">table - 表格组件</option>
              <option value="search">search - 搜索组件</option>
            </select>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={handleSave} disabled={saving} className={btnPrimary}>
                <Icon name="save" size={13} /> {saving ? '保存中...' : '保存并编辑布局'}
              </button>
              <button onClick={() => setShowEditor(false)} className={btnDefault}>取消</button>
            </div>
          </Card>
        )}

        {/* Component list */}
        {store.loading && <p style={{ color: '#94a3b8', fontSize: 13 }}>加载中...</p>}
        {!store.loading && store.components.length === 0 && (
          <EmptyState icon="components" title="暂无组件" hint="新建一个组件开始" />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pagedComps.map((comp, i) => (
            <Card key={comp.c_group_code || i} hoverable bodyStyle={{ padding: '13px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: 'linear-gradient(135deg, #eff5fd, #f5f3ff)',
                  color: '#5d9cec', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="components" size={18} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#1e293b', fontSize: 14, fontWeight: 500 }}>{comp.c_group_name || comp.c_group_code}</div>
                  <div style={{ color: '#94a3b8', fontSize: 12, fontFamily: 'monospace' }}>
                    {comp.c_group_tag ? `产品 ${comp.c_group_tag} · ` : ''}{comp.c_group_code}
                  </div>
                </div>
                <Tag tone={TYPE_TONE[comp.c_group_type] || 'gray'}>{comp.c_group_type || 'form'}</Tag>
                <button onClick={() => {
                  setForm({
                    groupCode: comp.c_group_code || '',
                    groupName: comp.c_group_name || '',
                    groupDesc: comp.c_group_desc || '',
                    groupType: comp.c_group_type || 'form',
                  });
                  setShowEditor(true);
                }} className={btnDefault} style={{ fontSize: 11 }}>
                  <Icon name="edit" size={12} /> 编辑信息
                </button>
                <button onClick={() => handleEditLayout(comp)} className={btnPrimary} style={{ fontSize: 11, padding: '4px 10px' }}>
                  编辑布局
                </button>
                <button onClick={() => handleOpenInDesigner(comp)} className={btnDefault} style={{ fontSize: 11 }} title="将组件平铺展开为一个新画布草稿">
                  展开为新画布
                </button>
                <button onClick={() => handleDelete(comp.c_group_code)} className={btnDanger}>删除</button>
              </div>
            </Card>
          ))}
        </div>

        {!store.loading && comps.length > 0 && (
          <Card bodyStyle={{ padding: 0 }} style={{ marginTop: 8 }}>
            <Pagination
              page={curPage}
              pageSize={pageSize}
              total={comps.length}
              onPageChange={setPage}
              onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
            />
          </Card>
        )}
      </div>
    </div>
  );
}

/** Layout editor — left sidebar with draggable elements, middle canvas, right property panel */
function LayoutEditor({ store, ui, sysCode, saving, setSaving, onClose }) {
  const elemDefStore = useElementDefStore();
  const cols = store.editColumns;
  const elements = store.editElements;
  const [collapsed, setCollapsed] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const selectedEl = elements.find((e) => e._id === selectedId) || null;

  useEffect(() => {
    elemDefStore.loadDefs(sysCode).catch(() => {});
  }, [sysCode]);

  const rows = [];
  for (let i = 0; i < elements.length; i += cols) {
    rows.push(elements.slice(i, i + cols));
  }

  const handleSaveLayout = async () => {
    setSaving(true);
    try {
      const json = store.getComponentJson();
      await store.saveComponent({ ...json, systemCode: sysCode });
      ui.addToast('组件布局已保存', 'success');
      await store.loadComponents(sysCode);
      store.cancelEdit();
      onClose();
    } catch (e) {
      ui.addToast('保存失败: ' + (e.message || ''), 'error');
    } finally { setSaving(false); }
  };

  const elementData = (data) => ({
    elem_code: data.elemCode || data.elem_code || '',
    elem_name: data.elemName || data.elem_name || '',
    elem_ename: data.elemEname || data.elem_ename || '',
    rel_field_name: data.relFieldName || data.rel_field_name || '',
    rel_table_name: data.relTableName || data.rel_table_name || '',
    default_value: data.defaultValue || data.default_value || '',
    placeholder: data.placeholder || '',
    required_flag: data.requiredFlag || data.required_flag || '0',
    check_type: data.checkType || data.check_type || '',
    min_value: data.minValue || data.min_value || '',
    max_value: data.maxValue || data.max_value || '',
    string_length: data.stringLength || data.string_length || '',
    code_list_name: data.codeListName || data.code_list_name || '',
    control_attr: data.controlAttr || data.control_attr || '',
  });

  const handleDropElement = (e, rowIdx, colIdx) => {
    e.preventDefault();
    e.stopPropagation();
    const raw = e.dataTransfer.getData('application/canvas-element');
    if (!raw) return;
    const data = JSON.parse(raw);
    store.addElement(data.controlType || 'text', rowIdx, colIdx, elementData(data));
  };

  const handleCanvasDrop = (e) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/canvas-element');
    if (!raw) return;
    const last = elements[elements.length - 1];
    let ri = last ? last._rowIdx : 0;
    let ci = last ? last._colIdx + 1 : 0;
    if (!last || ci >= cols) { ri = last ? ri + 1 : 0; ci = 0; }
    const data = JSON.parse(raw);
    store.addElement(data.controlType || 'text', ri, ci, elementData(data));
  };

  const defs = elemDefStore.defs;
  const groups = groupDefsByModule(defs);
  const toggle = (module) => setCollapsed((c) => ({ ...c, [module]: !c[module] }));
  const expandAll = () => setCollapsed({});
  const collapseAll = () => setCollapsed(Object.fromEntries(groups.map(([m]) => [m, true])));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#eef3fa' }}>
      {/* Header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', background: '#fff', borderBottom: '1px solid #e8ecf1', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #eff5fd, #f5f3ff)',
            color: '#5d9cec', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="components" size={16} />
          </span>
          <div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>编辑布局: {store.editName}</span>
            {store.editDesc && <span style={{ color: '#94a3b8', fontSize: 12, marginLeft: 12 }}>{store.editDesc}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>列数:</span>
          <input type="number" min={1} max={6} value={cols}
            onChange={(e) => store.setEditMeta({ editColumns: Number(e.target.value) || 2 })}
            style={{ width: 40, padding: '5px 6px', border: '1px solid #dce3ea', borderRadius: 6, fontSize: 12, textAlign: 'center' }} />
          <span style={{
            fontSize: 11, color: '#5d9cec', background: '#eff5fd',
            borderRadius: 9, padding: '2px 9px', fontWeight: 600,
          }}>{elements.length} 项</span>
          <button onClick={onClose} className="hb-btn sm">取消</button>
          <button onClick={handleSaveLayout} disabled={saving} className="hb-btn primary sm">
            <Icon name="save" size={12} /> {saving ? '保存中…' : '保存组件'}
          </button>
        </div>
      </div>

      {/* Body: sidebar + canvas */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left sidebar: element definitions */}
        <div style={{
          width: 210, background: '#fbfcfe', borderRight: '1px solid #e8ecf1',
          display: 'flex', flexDirection: 'column', flexShrink: 0,
        }}>
          <div style={{
            padding: '8px 10px', fontSize: 12, fontWeight: 600, color: '#475569',
            background: '#f6f9fc', borderBottom: '1px solid #e8ecf1',
            display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
          }}>
            <span style={{ flexShrink: 0 }}>元件列表</span>
            {defs.length > 0 && (
              <span style={{
                fontSize: 10, color: '#fff', background: '#5d9cec',
                borderRadius: 9, padding: '1px 6px', fontWeight: 600, flexShrink: 0,
              }}>{defs.length}</span>
            )}
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
              <button onClick={collapseAll}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 11, cursor: 'pointer', padding: 0, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                全部折叠
              </button>
              <button onClick={expandAll}
                style={{ background: 'none', border: 'none', color: '#5d9cec', fontSize: 11, cursor: 'pointer', padding: 0, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                全部展开
              </button>
            </span>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 10 }}>
            {elemDefStore.loading && (
              <p style={{ color: '#94a3b8', fontSize: 11, textAlign: 'center', padding: 16 }}>加载中...</p>
            )}
            {!elemDefStore.loading && defs.length === 0 && (
              <p style={{ color: '#94a3b8', fontSize: 11, textAlign: 'center', padding: 16 }}>
                暂无元件，先去元件管理创建
              </p>
            )}
            {groups.map(([module, moduleDefs]) => (
              <div key={module} style={{ marginBottom: 6 }}>
                <button onClick={() => toggle(module)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, width: '100%',
                    padding: '6px 8px', background: '#f1f5f9', border: 'none',
                    borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit',
                    color: '#475569', textAlign: 'left',
                  }}>
                  <Icon name={collapsed[module] ? 'chevronRight' : 'chevronDown'} size={12} style={{ color: '#94a3b8' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {module}
                  </span>
                  <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>{moduleDefs.length}</span>
                </button>
                {!collapsed[module] && (
                  <div style={{ padding: '4px 0 2px' }}>
                    {moduleDefs.map((def, i) => {
                      const onDragStart = (e) => {
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
                      return (
                        <div key={def.elem_code || i}
                          draggable
                          onDragStart={onDragStart}
                          title={def.elem_ename ? `${def.elem_name} (${def.elem_ename})` : def.elem_name}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 7,
                            padding: '6px 8px 6px 20px', marginBottom: 3, background: '#fff',
                            borderRadius: 7, cursor: 'grab', border: '1px solid #e8ecf1',
                            fontSize: 12, color: '#334155', userSelect: 'none',
                            boxShadow: '0 1px 2px rgba(15,23,42,.04)',
                            transition: 'border-color .15s, box-shadow .15s',
                            whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#5d9cec'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(93,156,236,.18)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e8ecf1'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(15,23,42,.04)'; }}>
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {def.elem_name || '未命名'}
                          </span>
                          <span style={{
                            fontSize: 9, color: '#5d9cec', background: '#eff5fd',
                            padding: '1px 5px', borderRadius: 8, flexShrink: 0,
                          }}>
                            {def.control_type}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Canvas area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', padding: 20, background: '#eef3fa' }}>
          <div style={{
            flex: 1, background: '#fafafa', borderRadius: 12,
            border: '2px dashed #d3dce8', padding: 20, minHeight: 300,
          }}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
            onDrop={handleCanvasDrop}>
            {elements.length === 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100%', minHeight: 200, color: '#94a3b8', fontSize: 14, userSelect: 'none',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 64, height: 64, margin: '0 auto 12px', borderRadius: 18, background: 'linear-gradient(135deg, #eff5fd, #f5f3ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5d9cec' }}>
                    <Icon name="components" size={28} strokeWidth={1.6} />
                  </div>
                  <div>从左侧拖拽元件到下方网格区域</div>
                </div>
              </div>
            )}
            {rows.map((row, ri) => (
              <div key={ri} style={{
                display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gap: 10, marginBottom: 10,
              }}>
                {row.map((el) => (
                  <div key={el._id}
                    onClick={(e) => { e.stopPropagation(); setSelectedId(el._id); }}
                    style={{ position: 'relative', display: 'flex', background: selectedId === el._id ? '#eff5fd' : '#fff', borderRadius: 8, border: selectedId === el._id ? '2px solid #5d9cec' : '1px solid #dce3ea', cursor: 'pointer' }}>
                    <div style={{ flex: 1 }}>
                      <CanvasElementRender el={el} compact isSelected={selectedId === el._id} interactive={false} />
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); store.removeElement(el._id); if (selectedId === el._id) setSelectedId(null); }}
                      style={{
                        position: 'absolute', top: -8, right: -8, zIndex: 3,
                        width: 20, height: 20, borderRadius: '50%',
                        background: '#ff4d4f', color: '#fff', border: '2px solid #fff',
                        cursor: 'pointer', fontSize: 11, fontWeight: 'bold',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)', lineHeight: 1, padding: 0,
                      }}>✕</button>
                  </div>
                ))}
                {Array.from({ length: cols - row.length }).map((_, ci) => {
                  const globalCi = row.length + ci;
                  return (
                    <div key={`empty-${ci}`}
                      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; e.currentTarget.style.background = '#eff5fd'; }}
                      onDragLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                      onDrop={(e) => {
                        e.currentTarget.style.background = '#f8fafc';
                        handleDropElement(e, ri, globalCi);
                      }}
                      style={{
                        minHeight: 60, border: '1px dashed #d3dce8', borderRadius: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#cbd5e1', fontSize: 11, background: '#f8fafc',
                        transition: 'background .15s',
                      }}>
                      拖放到此
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Right property panel */}
        <div style={{
          width: 280, background: '#fbfcfe', borderLeft: '1px solid #e8ecf1',
          display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'auto',
        }}>
          <LayoutElementProperties el={selectedEl} store={store} onClose={() => setSelectedId(null)} />
        </div>
      </div>
    </div>
  );
}

/** 组件布局编辑器里的元件属性面板 */
function LayoutElementProperties({ el, store, onClose }) {
  if (!el) {
    return (
      <div style={{ padding: 20, color: '#94a3b8', fontSize: 12, textAlign: 'center' }}>
        点击左侧画布中的元件以编辑其属性
      </div>
    );
  }
  const update = (patch) => store.updateElement(el._id, patch);
  return (
    <div style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{
          width: 24, height: 24, borderRadius: 6, flexShrink: 0,
          background: 'linear-gradient(135deg, #eff5fd, #f5f3ff)',
          color: '#5d9cec', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="elements" size={13} />
        </span>
        <h3 style={{ color: '#1e293b', fontSize: 14, flex: 1, margin: 0 }}>元件属性</h3>
        <button onClick={onClose} className="hb-icon-btn" style={{ width: 22, height: 22 }} title="关闭">
          <Icon name="close" size={13} />
        </button>
      </div>

      <Field label="元素代码 (elem_code)" value={el.elem_code} onChange={(v) => update({ elem_code: v })} />
      <Field label="元素名称 (label)" value={el.elem_name} onChange={(v) => update({ elem_name: v })} />
      <Field label="英文名称" value={el.elem_ename} onChange={(v) => update({ elem_ename: v })} />
      <Field label="关联字段名" value={el.rel_field_name} onChange={(v) => update({ rel_field_name: v })} />
      <Field label="关联表名" value={el.rel_table_name} onChange={(v) => update({ rel_table_name: v })} />
      <Field label="占位提示" value={el.placeholder || ''} onChange={(v) => update({ placeholder: v })} />
      <Field label="提示标题 (tooltip)" value={el.tooltip_title || ''} onChange={(v) => update({ tooltip_title: v })} />
      <Field label="默认值" value={el.default_value || ''} onChange={(v) => update({ default_value: v })} />
      <Field label="数据字典代码" value={el.code_list_name || ''} onChange={(v) => update({ code_list_name: v })} />
      <Field label="控件属性(JSON)" value={el.control_attr || ''} onChange={(v) => update({ control_attr: v })} />
      <Field label="校验类型" value={el.check_type || ''} onChange={(v) => update({ check_type: v })} />
      <Field label="最小值" value={el.min_value || ''} type="number" onChange={(v) => update({ min_value: v })} />
      <Field label="最大值" value={el.max_value || ''} type="number" onChange={(v) => update({ max_value: v })} />
      <Field label="字符串长度" value={el.string_length || ''} type="number" onChange={(v) => update({ string_length: v })} />

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b', cursor: 'pointer' }}>
          <input type="checkbox" checked={el.required_flag === '1'}
            onChange={(e) => update({ required_flag: e.target.checked ? '1' : '0' })}
            style={{ accentColor: '#5d9cec', width: 14, height: 14 }} />
          必填
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b', cursor: 'pointer' }}>
          <input type="checkbox" checked={el.visible_flag !== '0'}
            onChange={(e) => update({ visible_flag: e.target.checked ? '1' : '0' })}
            style={{ accentColor: '#5d9cec', width: 14, height: 14 }} />
          可见
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b', cursor: 'pointer' }}>
          <input type="checkbox" checked={el.readonly_flag === '1'}
            onChange={(e) => update({ readonly_flag: e.target.checked ? '1' : '0' })}
            style={{ accentColor: '#5d9cec', width: 14, height: 14 }} />
          只读
        </label>
      </div>
    </div>
  );
}

/** 属性面板里的文本/数字输入字段 */
function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <label style={{ color: '#64748b', fontSize: 11, display: 'block', marginBottom: 3 }}>{label}</label>
      <input type={type} value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="hb-input" style={{ padding: '5px 8px', fontSize: 12 }} />
    </div>
  );
}
