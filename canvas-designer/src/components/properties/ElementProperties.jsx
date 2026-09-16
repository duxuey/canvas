import { useCanvasStore } from '../../store/canvasStore';
import { CONTROL_TYPES, CHECK_TYPES } from '../../utils/constants';
import { useState } from 'react';
import Icon from '../common/Icon';

export default function ElementProperties({ el }) {
  const store = useCanvasStore();
  const update = (patch) => store.updateItem(el._id, patch);
  const [section, setSection] = useState('basic');

  const sections = ['basic', 'data', 'validation', 'events', 'style'];
  const isOptionType = ['select', 'radio', 'checkbox'].includes(el.control_type);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <h3 style={{ color: '#1e293b', fontSize: 14, flex: 1, display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={glyph}><Icon name="elements" size={13} /></span>
          元素属性: {el.elem_name || el.control_type}
        </h3>
        <button onClick={() => store.removeItem(el._id)} className="hb-btn danger sm">删除</button>
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap', background: '#f1f5f9', padding: 3, borderRadius: 8 }}>
        {sections.map((s) => (
          <button key={s} onClick={() => setSection(s)}
            style={{
              padding: '5px 11px', fontSize: 12, cursor: 'pointer', flex: 1,
              background: section === s ? '#fff' : 'transparent',
              color: section === s ? '#5d9cec' : '#64748b', border: 'none', borderRadius: 6,
              fontWeight: section === s ? 600 : 400,
              boxShadow: section === s ? '0 1px 3px rgba(15,23,42,.1)' : 'none',
              fontFamily: 'inherit', transition: 'all .15s',
            }}>
            {s === 'basic' ? '基础' : s === 'data' ? '数据' : s === 'validation' ? '校验' : s === 'events' ? '事件' : '样式'}
          </button>
        ))}
      </div>

      {section === 'basic' && (
        <>
          <SelectField label="控件类型" value={el.control_type}
            options={CONTROL_TYPES.map((c) => ({ label: c.label, value: c.type }))}
            onChange={(v) => update({ control_type: v })} />
          <Field label="元素代码 (elem_code)" value={el.elem_code} onChange={(v) => update({ elem_code: v })} />
          <Field label="元素名称 (label)" value={el.elem_name} onChange={(v) => update({ elem_name: v })} />
          <Field label="英文名称" value={el.elem_ename} onChange={(v) => update({ elem_ename: v })} />
          <Field label="关联字段名" value={el.rel_field_name} onChange={(v) => update({ rel_field_name: v })} />
          <Field label="关联表名" value={el.rel_table_name} onChange={(v) => update({ rel_table_name: v })} />
          <Field label="占位提示 (placeholder)" value={el.placeholder || ''}
            onChange={(v) => update({ placeholder: v })} />
          <Field label="提示标题 (tooltip)" value={el.tooltip_title || ''}
            onChange={(v) => update({ tooltip_title: v })} />
          <BoolField label="必填 (required)" value={el.required_flag}
            onChange={(v) => update({ required_flag: v ? '1' : '0' })} />
          <BoolField label="可见 (visible)" value={el.visible_flag}
            onChange={(v) => update({ visible_flag: v ? '1' : '0' })} />
          <BoolField label="只读 (readonly)" value={el.readonly_flag}
            onChange={(v) => update({ readonly_flag: v ? '1' : '0' })} />
          <BoolField label="启用 (enabled)" value={el.enabled_flag}
            onChange={(v) => update({ enabled_flag: v ? '1' : '0' })} />
        </>
      )}

      {section === 'data' && (
        <>
          <Field label="默认值" value={el.default_value || ''} onChange={(v) => update({ default_value: v })} />
          <Field label="数据字典代码" value={el.code_list_name || ''} onChange={(v) => update({ code_list_name: v })} />
          <Field label="控件属性(JSON)" value={el.control_attr || ''} onChange={(v) => update({ control_attr: v })} />
          <Field label="校验控件属性" value={el.valid_control_attr || ''} onChange={(v) => update({ valid_control_attr: v })} />
        </>
      )}

      {section === 'validation' && (
        <>
          <SelectField label="校验类型 (check_type)" value={el.check_type || 'none'}
            options={CHECK_TYPES.map((t) => ({ label: t, value: t }))}
            onChange={(v) => update({ check_type: v })} />
          <Field label="最小值" value={el.min_value || ''} type="number" onChange={(v) => update({ min_value: String(v) })} />
          <Field label="最大值" value={el.max_value || ''} type="number" onChange={(v) => update({ max_value: String(v) })} />
          <Field label="精度" value={el.precision || ''} type="number" onChange={(v) => update({ precision: String(v) })} />
          <Field label="字符串长度" value={el.string_length || ''} type="number" onChange={(v) => update({ string_length: String(v) })} />
        </>
      )}

      {/* Options editor for select / radio / checkbox */}
      {isOptionType && (
        <div style={{
          marginTop: 12, padding: 10, background: '#f8fafc',
          border: '1px solid #e2e8f0', borderRadius: 6,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="select" size={14} /> 选项配置
          </div>
          <OptionsEditor el={el} update={update} />
        </div>
      )}

      {section === 'events' && (
        <>
          <Field label="点击事件方法" value={el.click_event_func || ''} onChange={(v) => update({ click_event_func: v })} />
          <Field label="前端事件" value={el.frontend_event || ''} onChange={(v) => update({ frontend_event: v })} />
          <Field label="搜索URL" value={el.search_url || ''} onChange={(v) => update({ search_url: v })} />
          <Field label="搜索参数Key" value={el.search_param_key || ''} onChange={(v) => update({ search_param_key: v })} />
          <Field label="搜索结果Key" value={el.search_result_key || ''} onChange={(v) => update({ search_result_key: v })} />
          <Field label="搜索选择事件" value={el.search_select_event || ''} onChange={(v) => update({ search_select_event: v })} />
        </>
      )}

      {section === 'style' && (
        <>
          <Field label="日期格式" value={el.date_format || ''} onChange={(v) => update({ date_format: v })} />
          <Field label="分组标志" value={el.group_flag || ''} onChange={(v) => update({ group_flag: v })} />
          <Field label="客户端分组" value={el.client_group || ''} onChange={(v) => update({ client_group: v })} />
          <BoolField label="自动选择首项" value={el.auto_select_first}
            onChange={(v) => update({ auto_select_first: v ? '1' : '0' })} />
        </>
      )}
    </div>
  );
}

/** Inline editable options list for radio / select / checkbox */
function OptionsEditor({ el, update }) {
  const options = (() => {
    try {
      if (!el.control_attr) return [];
      const parsed = typeof el.control_attr === 'string' ? JSON.parse(el.control_attr) : el.control_attr;
      return Array.isArray(parsed) ? parsed : parsed.options || [];
    } catch { return []; }
  })();

  const save = (newOptions) => {
    update({ control_attr: JSON.stringify(newOptions) });
  };

  const addOption = () => {
    const idx = options.length + 1;
    save([...options, { value: `opt${idx}`, label: `选项${idx}` }]);
  };

  const updateOption = (i, key, val) => {
    const copy = options.map((o, j) => j === i ? { ...o, [key]: val } : o);
    save(copy);
  };

  const removeOption = (i) => {
    save(options.filter((_, j) => j !== i));
  };

  return (
    <div>
      {options.map((opt, i) => (
        <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 4, alignItems: 'center' }}>
          <input
            value={opt.value}
            onChange={(e) => updateOption(i, 'value', e.target.value)}
            placeholder="值"
            style={{ width: 60, padding: '3px 6px', border: '1px solid #d9d9d9', borderRadius: 3, fontSize: 11, color: '#333' }}
          />
          <input
            value={opt.label}
            onChange={(e) => updateOption(i, 'label', e.target.value)}
            placeholder="显示文字"
            style={{ flex: 1, padding: '3px 6px', border: '1px solid #d9d9d9', borderRadius: 3, fontSize: 11, color: '#333' }}
          />
          <button onClick={() => removeOption(i)}
            style={{
              background: 'none', border: 'none', color: '#94a3b8',
              cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1,
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ff4d4f'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
            ✕
          </button>
        </div>
      ))}
      <button onClick={addOption}
        style={{
          marginTop: 4, padding: '3px 10px', background: '#fff',
          border: '1px dashed #5d9cec', borderRadius: 4, cursor: 'pointer',
          fontSize: 11, color: '#5d9cec', fontFamily: 'inherit',
        }}>
        + 添加选项
      </button>
    </div>
  );
}

const glyph = {
  width: 24, height: 24, borderRadius: 7, background: 'linear-gradient(135deg, #eff5fd, #f5f3ff)',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#5d9cec', flexShrink: 0,
};

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div style={{ marginBottom: 7 }}>
      <label style={{ color: '#64748b', fontSize: 11, display: 'block', marginBottom: 3 }}>{label}</label>
      <input type={type} value={value}
        onChange={(e) => onChange(e.target.value)}
        className="hb-input" style={{ padding: '5px 8px', fontSize: 12 }} />
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <div style={{ marginBottom: 7 }}>
      <label style={{ color: '#64748b', fontSize: 11, display: 'block', marginBottom: 3 }}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="hb-select" style={{ padding: '5px 8px', fontSize: 12 }}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function BoolField({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: 7, display: 'flex', alignItems: 'center', gap: 8 }}>
      <input type="checkbox" checked={value === '1'}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: '#5d9cec', width: 14, height: 14 }} />
      <label style={{ color: '#64748b', fontSize: 11.5 }}>{label}</label>
    </div>
  );
}
