import { useState, useEffect } from 'react';
import { useElementDefStore } from '../store/elementDefStore';
import { useUiStore } from '../store/uiStore';
import { useSystemStore } from '../store/systemStore';
import { CONTROL_TYPES } from '../utils/constants';
import {
  Hero, heroAction, Toolbar, Card, Tag, btnPrimary, btnDefault, btnDanger,
  overlay, modal, Field, SelectField, BoolField, Pagination,
} from '../components/common/FormFields';
import Icon from '../components/common/Icon';

export default function ElementManager() {
  const store = useElementDefStore();
  const ui = useUiStore();
  const sysStore = useSystemStore();
  const [sysCode, setSysCode] = useState('SYS01');
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => { store.loadDefs(sysCode).catch(() => {}); }, [sysCode]);

  // 数据变化后页码越界时，渲染期自动 clamp 到合法页
  const defs = store.defs;
  const totalPages = Math.max(1, Math.ceil(defs.length / pageSize));
  const curPage = Math.min(page, totalPages);
  const pagedDefs = defs.slice((curPage - 1) * pageSize, curPage * pageSize);

  const handleSave = async () => {
    if (!form.elem_name.trim()) { ui.addToast('请输入元件名称', 'error'); return; }
    setSaving(true);
    try {
      await store.saveDef({ ...form, systemCode: sysCode });
      ui.addToast('元件保存成功', 'success');
      setShowEditor(false);
      setForm(emptyForm());
      await store.loadDefs(sysCode);
    } catch (e) {
      ui.addToast('保存失败: ' + (e.message || ''), 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (code) => {
    try {
      await store.deleteDef(code, sysCode);
      ui.addToast('元件已删除', 'success');
      await store.loadDefs(sysCode);
    } catch (e) {
      ui.addToast('删除失败: ' + (e.message || ''), 'error');
    }
  };

  const stats = [
    { icon: 'elements', label: '元件总数', value: defs.length },
    { icon: 'select', label: '控件类型', value: new Set(defs.map((d) => d.control_type || d.controlType).filter(Boolean)).size },
    { icon: 'check', label: '必填项', value: defs.filter((d) => d.required_flag === '1' || d.required).length },
    { icon: 'list', label: '已绑定表', value: defs.filter((d) => d.rel_table_name || d.tableName).length },
  ];

  const handleEdit = (def) => {
    setForm({
      elem_code: def.elem_code || def.code || '',
      elem_name: def.elem_name || def.name || '',
      elem_ename: def.elem_ename || def.ename || '',
      control_type: def.control_type || def.controlType || 'text',
      rel_table_name: def.rel_table_name || def.tableName || '',
      rel_field_name: def.rel_field_name || def.fieldName || '',
      data_type: def.data_type || def.dataType || 'varchar',
      default_value: def.default_value || def.defaultValue || '',
      placeholder: def.placeholder || '',
      tooltip_title: def.tooltip_title || def.tooltip || '',
      required_flag: def.required_flag || def.required || '0',
      check_type: def.check_type || def.checkType || 'none',
      min_value: def.min_value || '',
      max_value: def.max_value || '',
      string_length: def.string_length || def.stringLength || '',
      code_list_name: def.code_list_name || def.codeListName || '',
      control_attr: def.control_attr || def.controlAttr || '',
    });
    setShowEditor(true);
  };

  return (
    <div className="hb-page">
      <div className="hb-page-inner" style={{ maxWidth: 1040, margin: '0 auto' }}>
        <Hero
          icon="elements"
          title="元件管理"
          desc="管理可拖拽的基础表单元件定义"
          actions={
            <button onClick={() => { setForm(emptyForm()); setShowEditor(true); }} className={heroAction}>
              <Icon name="plus" size={14} /> 新建元件
            </button>
          }
          stats={stats}
        />

        <Toolbar
          systemCode={sysCode}
          systems={sysStore.systems}
          count={store.defs.length}
          onSystemChange={(e) => {
            if (e.target.value === '__manage__') { window.location.hash = 'system'; return; }
            setSysCode(e.target.value);
            setPage(1);
          }}
          onRefresh={() => store.loadDefs(sysCode)}
        />

        {/* Editor modal */}
        {showEditor && (
          <div style={overlay} onClick={() => setShowEditor(false)}>
            <div style={{ ...modal, width: 880 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <h3 style={{ color: '#1e293b', fontSize: 16, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: 'linear-gradient(135deg, #5d9cec 0%, #8b5cf6 100%)',
                    color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 3px 8px rgba(93,156,236,.35)',
                  }}>
                    <Icon name="elements" size={17} />
                  </span>
                  {form.elem_code ? '编辑元件' : '新建元件'}
                </h3>
                <button onClick={() => setShowEditor(false)} className="hb-icon-btn"><Icon name="close" size={16} /></button>
              </div>

              {/* 基础信息 */}
              <EditorSection icon="elements" title="基础信息" desc="元件的基本标识与控件类型" tone="blue">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                  <Field label="元件代码 (code)" value={form.elem_code}
                    onChange={(v) => setForm({ ...form, elem_code: v })} />
                  <SelectField label="控件类型" value={form.control_type}
                    onChange={(v) => setForm({ ...form, control_type: v })}
                    options={CONTROL_TYPES.map((c) => ({ label: c.label, value: c.type, icon: c.icon }))} />
                  <Field label="元件名称" value={form.elem_name}
                    onChange={(v) => setForm({ ...form, elem_name: v })} />
                  <Field label="英文名称" value={form.elem_ename}
                    onChange={(v) => setForm({ ...form, elem_ename: v })} />
                  <Field label="默认值" value={form.default_value}
                    onChange={(v) => setForm({ ...form, default_value: v })} />
                  <BoolField label="必填" value={form.required_flag === '1'}
                    onChange={(v) => setForm({ ...form, required_flag: v ? '1' : '0' })} />
                </div>
              </EditorSection>

              {/* 数据库元数据绑定 */}
              <EditorSection icon="list" title="数据库元数据绑定" desc="关联表与字段的映射信息" tone="green">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                  <Field label="关联表名 (tableName)" value={form.rel_table_name}
                    onChange={(v) => setForm({ ...form, rel_table_name: v })} />
                  <Field label="关联字段名 (fieldName)" value={form.rel_field_name}
                    onChange={(v) => setForm({ ...form, rel_field_name: v })} />
                  <Field label="数据类型 (dataType)" value={form.data_type}
                    onChange={(v) => setForm({ ...form, data_type: v })} />
                  <Field label="数据字典代码" value={form.code_list_name}
                    placeholder="如 CLAIM_STATUS，下拉框运行时按此取选项"
                    onChange={(v) => setForm({ ...form, code_list_name: v })} />
                  <Field label="占位提示 (placeholder)" value={form.placeholder}
                    onChange={(v) => setForm({ ...form, placeholder: v })} />
                  <Field label="提示标题 (tooltip)" value={form.tooltip_title}
                    onChange={(v) => setForm({ ...form, tooltip_title: v })} />
                </div>
              </EditorSection>

              {/* 校验与属性 */}
              <EditorSection icon="check" title="校验与属性" desc="输入校验规则与控件扩展属性" tone="amber">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                  <Field label="校验类型" value={form.check_type}
                    onChange={(v) => setForm({ ...form, check_type: v })} />
                  <Field label="最小值" value={form.min_value}
                    onChange={(v) => setForm({ ...form, min_value: v })} />
                  <Field label="最大值" value={form.max_value}
                    onChange={(v) => setForm({ ...form, max_value: v })} />
                  <Field label="字符串长度" value={form.string_length}
                    onChange={(v) => setForm({ ...form, string_length: v })} />
                  <Field label="控件属性(JSON)" value={form.control_attr}
                    onChange={(v) => setForm({ ...form, control_attr: v })} />
                </div>
              </EditorSection>

              {/* 选项配置（仅下拉框/单选框/复选框） */}
              {['select', 'radio', 'checkbox'].includes(form.control_type) && (
                <EditorSection icon="select" title="选项配置" desc="下拉框 / 单选框 / 复选框的可选值" tone="violet">
                  <OptionsEditor controlAttr={form.control_attr}
                    onChange={(v) => setForm({ ...form, control_attr: v })} />
                </EditorSection>
              )}

              {/* 底部按钮 —— 居中 */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 22, paddingTop: 16, borderTop: '1px solid #eef2f7' }}>
                <button onClick={() => setShowEditor(false)} className={btnDefault}>取消</button>
                <button onClick={handleSave} disabled={saving} className={btnPrimary}>
                  <Icon name="save" size={13} /> {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Defs table */}
        <Card bodyStyle={{ padding: 0 }} style={{ overflow: 'hidden' }}>
          <table className="hb-table">
            <thead>
              <tr>
                <th>元件代码</th>
                <th>名称</th>
                <th>控件类型</th>
                <th>关联表</th>
                <th>关联字段</th>
                <th>必填</th>
                <th style={{ textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {store.loading && (
                <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>加载中...</td></tr>
              )}
              {!store.loading && store.defs.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>暂无元件定义，点击"新建元件"开始</td></tr>
              )}
              {!store.loading && pagedDefs.map((def, i) => (
                <tr key={def.elem_code || def.code || i}>
                  <td><code style={{ background: '#f1f5f9', padding: '2px 7px', borderRadius: 5, fontSize: 12, color: '#334155' }}>
                    {def.elem_code || def.code}
                  </code></td>
                  <td style={{ fontWeight: 500 }}>{def.elem_name || def.name}</td>
                  <td><Tag>{def.control_type || def.controlType}</Tag></td>
                  <td>{def.rel_table_name || def.tableName || '—'}</td>
                  <td>{def.rel_field_name || def.fieldName || '—'}</td>
                  <td>{def.required_flag === '1' || def.required ? <Tag tone="green"><Icon name="check" size={11} /> 是</Tag> : <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button onClick={() => handleEdit(def)} className={btnDefault} style={{ marginRight: 6 }}><Icon name="edit" size={12} /> 编辑</button>
                    <button onClick={() => handleDelete(def.elem_code || def.code)} className={btnDanger}>删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!store.loading && defs.length > 0 && (
            <Pagination
              page={curPage}
              pageSize={pageSize}
              total={defs.length}
              onPageChange={setPage}
              onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
            />
          )}
        </Card>
      </div>
    </div>
  );
}

/** 编辑器分组块 —— 图标锚点 + 标题 + 描述 + 分色调底色 */
const EDITOR_TONES = {
  blue:   { glyph: 'linear-gradient(135deg, #eff5fd, #f5f3ff)', color: '#5d9cec' },
  green:  { glyph: 'linear-gradient(135deg, #ecfdf5, #f0fdf4)', color: '#16a34a' },
  amber:  { glyph: 'linear-gradient(135deg, #fffbeb, #fefce8)', color: '#d97706' },
  violet: { glyph: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', color: '#8b5cf6' },
};

function EditorSection({ icon, title, desc, tone = 'blue', children }) {
  const t = EDITOR_TONES[tone] || EDITOR_TONES.blue;
  return (
    <div className="hb-section" style={{ padding: 16, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{
          width: 30, height: 30, borderRadius: 9, flexShrink: 0,
          background: t.glyph, color: t.color,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.6)',
        }}>
          <Icon name={icon} size={15} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{title}</div>
          {desc && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{desc}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

/** Inline options editor for radio/select/checkbox — stores JSON in control_attr */
function OptionsEditor({ controlAttr, onChange }) {
  const options = (() => {
    try {
      if (!controlAttr) return [];
      const parsed = typeof controlAttr === 'string' ? JSON.parse(controlAttr) : controlAttr;
      return Array.isArray(parsed) ? parsed : parsed.options || [];
    } catch { return []; }
  })();

  const save = (newOptions) => onChange(JSON.stringify(newOptions));

  const addOption = () => {
    const idx = options.length + 1;
    save([...options, { value: `opt${idx}`, label: `选项${idx}` }]);
  };

  const updateOption = (i, key, val) => {
    save(options.map((o, j) => j === i ? { ...o, [key]: val } : o));
  };

  const removeOption = (i) => save(options.filter((_, j) => j !== i));

  return (
    <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
      {options.length === 0 && (
        <div style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', padding: '14px 0' }}>
          暂无选项，点击下方按钮添加
        </div>
      )}
      {options.map((opt, i) => (
        <div key={i} style={{
          display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center',
          padding: '6px 8px', background: '#fff', borderRadius: 8,
          border: '1px solid #eef2f7',
        }}>
          <span style={{
            width: 20, height: 20, borderRadius: 6, flexShrink: 0,
            background: 'linear-gradient(135deg, #eff5fd, #f5f3ff)',
            color: '#5d9cec', fontSize: 11, fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>{i + 1}</span>
          <input value={opt.value}
            onChange={(e) => updateOption(i, 'value', e.target.value)}
            placeholder="值"
            className="hb-input" style={{ width: 110, padding: '5px 8px', fontSize: 12 }} />
          <input value={opt.label}
            onChange={(e) => updateOption(i, 'label', e.target.value)}
            placeholder="显示文字"
            className="hb-input" style={{ flex: 1, padding: '5px 8px', fontSize: 12 }} />
          <button onClick={() => removeOption(i)} className="hb-icon-btn" style={{ color: '#94a3b8' }}>
            <Icon name="close" size={14} />
          </button>
        </div>
      ))}
      <button onClick={addOption}
        style={{
          marginTop: 4, padding: '6px 16px', background: '#fff',
          border: '1px dashed #5d9cec', borderRadius: 7, cursor: 'pointer',
          fontSize: 12, color: '#5d9cec', fontFamily: 'inherit',
          display: 'inline-flex', alignItems: 'center', gap: 5,
        }}>
        <Icon name="plus" size={13} /> 添加选项
      </button>
    </div>
  );
}

function emptyForm() {
  return {
    elem_code: '', elem_name: '', elem_ename: '', control_type: 'text',
    rel_table_name: '', rel_field_name: '', data_type: 'varchar',
    default_value: '', placeholder: '', tooltip_title: '',
    required_flag: '0', check_type: 'none',
    min_value: '', max_value: '', string_length: '',
    code_list_name: '', control_attr: '',
  };
}
