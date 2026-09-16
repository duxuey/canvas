import { useCanvasStore } from '../../store/canvasStore';
import Icon from '../common/Icon';
import DateTimePicker from '../common/DateTimePicker';

/**
 * WYSIWYG form control renderer for canvas elements.
 * Label + widget on the same row (horizontal layout).
 */
export default function CanvasElementRender({ el, index, isSelected, onSelect, onDblClick, onRemove, compact, interactive = true }) {
  const store = useCanvasStore();

  const shellStyle = {
    position: 'relative',
    cursor: interactive ? 'pointer' : 'default',
    background: isSelected ? '#eff5fd' : 'transparent',
    border: isSelected ? '2px solid #5d9cec' : '2px solid transparent',
    borderRadius: 4,
    padding: compact ? '2px 4px' : '2px 4px',
    transition: 'border-color .15s, background .15s',
  };

  // 非交互（组件内只读展示）：不拖拽、不选中、不拦截点击，点击可冒泡选中外层组件
  const shellHandlers = interactive ? {
    onClick: (e) => { e.stopPropagation(); onSelect && onSelect(el._id); },
    onDoubleClick: (e) => {
      e.stopPropagation();
      if (onDblClick) { onDblClick(); return; }
      const code = prompt('元素代码:', el.elem_code || '');
      if (code) store.updateItem(el._id, { elem_code: code, rel_field_name: code });
    },
    draggable: true,
    onDragStart: (e) => {
      e.dataTransfer.setData('application/canvas-reorder', JSON.stringify({ id: el._id }));
      e.dataTransfer.effectAllowed = 'move';
    },
    onDragOver: (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; },
    onDrop: (e) => {
      const raw = e.dataTransfer.getData('application/canvas-reorder');
      if (!raw) return;
      e.preventDefault(); e.stopPropagation();
      const { id } = JSON.parse(raw);
      if (id !== el._id) {
        const fromIdx = store.items.findIndex((x) => x._id === id);
        const toIdx = store.items.findIndex((x) => x._id === el._id);
        if (fromIdx >= 0 && toIdx >= 0) store.reorderItems(fromIdx, toIdx);
      }
    },
  } : {};

  const label = el.elem_name || '未命名';
  const required = el.required_flag === '1';
  const placeholder = el.placeholder || '';
  const ct = el.control_type || 'text';

  /** Label column — fixed width, right-aligned */
  const renderLabel = (w = 96) => (
    <span style={{
      width: w, flexShrink: 0, textAlign: 'right', paddingRight: 8,
      fontSize: 12.5, color: '#334155', fontWeight: 500,
      lineHeight: `${inputH}px`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    }}>
      {label}{required && <span style={{ color: '#ff4d4f', marginLeft: 1 }}> *</span>}
    </span>
  );

  /** Shared wrapper that gives all inputs identical sizing */
  const Wrapper = ({ children }) => (
    <div style={{ position: 'relative', flex: 1, minWidth: 0, maxWidth: 235 }}>{children}</div>
  );

  const renderControl = () => {
    switch (ct) {

      // ── text ──
      case 'text':
        return (
          <div style={row}>
            {renderLabel()}
            <Wrapper><input type="text" placeholder={placeholder} readOnly style={inputS} /></Wrapper>
          </div>
        );

      // ── number ──
      case 'number':
        return (
          <div style={row}>
            {renderLabel()}
            <Wrapper><input type="number" placeholder={placeholder} readOnly style={inputS} /></Wrapper>
          </div>
        );

      // ── textarea ──
      case 'textarea':
        return (
          <div style={{ ...row, alignItems: 'flex-start' }}>
            {renderLabel()}
            <Wrapper><textarea rows={2} placeholder={placeholder} readOnly style={{ ...inputS, resize: 'vertical', height: 44 }} /></Wrapper>
          </div>
        );

  // ── select ──
      case 'select':
        { const options = parseOptions(el);
        return (
          <div style={row}>
            {renderLabel()}
            <Wrapper>
              <select disabled style={{ ...inputS, appearance: 'none', paddingRight: 28 }}>
                {options.length > 0
                  ? options.map((o, i) => <option key={i} value={o.value}>{o.label}</option>)
                  : <option>{placeholder || '请选择'}</option>
                }
              </select>
              <span style={downArrow}><Icon name="chevronDown" size={13} /></span>
            </Wrapper>
          </div>
        );}

      // ── datePicker（日期 + 时间） ──
      case 'datePicker':
        return (
          <div style={row}>
            {renderLabel()}
            <Wrapper>
              <DateTimePicker readOnly compact placeholder="YYYY-MM-DD HH:mm" />
            </Wrapper>
          </div>
        );

      // ── checkbox ──
      case 'checkbox':
        { const options = parseOptions(el);
        const checkOptions = options.length > 0 ? options : [{ value: '', label: label }];
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            {checkOptions.map((o, i) => (
              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#334155' }}>
                <input type="checkbox" disabled style={{ width: 16, height: 16, accentColor: '#5d9cec' }} />
                {o.label}
              </label>
            ))}
          </div>
        );}

      // ── radio ──
      case 'radio':
        { const options = parseOptions(el);
        const radioOptions = options.length > 0 ? options : [{ value: '1', label: '选项1' }, { value: '2', label: '选项2' }];
        return (
          <div style={row}>
            {renderLabel()}
            <Wrapper>
              <div style={{ display: 'flex', gap: 16, height: inputH, alignItems: 'center', flexWrap: 'wrap' }}>
                {radioOptions.map((o, i) => (
                  <label key={i} style={opt}>
                    <input type="radio" name={`r-${el._id}`} disabled style={{ accentColor: '#5d9cec' }} />
                    {o.label}
                  </label>
                ))}
              </div>
            </Wrapper>
          </div>
        );}

      // ── switch ──
      case 'switch':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 22, borderRadius: 11, background: '#d1d5db', position: 'relative' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
            <span style={{ fontSize: 13, color: '#334155' }}>{label}</span>
          </div>
        );

      // ── file ──
      case 'file':
        return (
          <div style={row}>
            {renderLabel()}
            <Wrapper>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, height: inputH,
                padding: '0 10px', border: '1px dashed #d1d5db',
                borderRadius: 4, background: '#f9fafb', color: '#94a3b8', fontSize: 12,
                boxSizing: 'border-box',
              }}>
                <Icon name="file" size={14} /> 点击或拖拽上传
              </div>
            </Wrapper>
          </div>
        );

      // ── label ──
      case 'label':
        return <span style={{ fontSize: 14, color: '#334155', fontWeight: 500 }}>{label}</span>;

      // ── divider ──
      case 'divider':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            <span style={{ color: '#94a3b8', fontSize: 11, whiteSpace: 'nowrap' }}>— 分割线 —</span>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          </div>
        );

      // ── button（产品工厂 Element UI 风格：主按钮渐变 + 次按钮白底描边）──
      case 'button':
        return (
          <button style={btnPrimary} tabIndex={-1}>{label}</button>
        );

      // ── search ──
      case 'search':
        return (
          <div style={row}>
            {renderLabel()}
            <Wrapper>
              <input type="text" placeholder={placeholder || '搜索...'} readOnly
                style={{ ...inputS, paddingLeft: 32 }} />
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><Icon name="search" size={14} /></span>
            </Wrapper>
          </div>
        );

      // ── hidden ──
      case 'hidden':
        return (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '2px 8px',
            background: '#fefce8', borderRadius: 3, border: '1px dashed #fde68a',
            fontSize: 11, color: '#a16207',
          }}>
            <span><Icon name="hidden" size={13} /></span> 隐藏域: {el.elem_code || '—'}
            <span style={{ color: '#ca8a04' }}>{el.rel_field_name}</span>
          </div>
        );

      // ── groupFields ──
      case 'groupFields':
        return (
          <div style={{
            border: '1px dashed #cbd5e1', borderRadius: 6, padding: 12,
            background: '#f8fafc', minHeight: 60, width: '100%',
          }}>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="groupFields" size={13} /> {label || '字段组'}
            </div>
            <div style={{ color: '#c0c0c0', fontSize: 11, textAlign: 'center' }}>
              将元件拖入此区域
            </div>
          </div>
        );

      // ── fallback ──
      default:
        return (
          <div style={row}>
            {renderLabel()}
            <Wrapper><input type="text" placeholder={placeholder} readOnly style={inputS} /></Wrapper>
          </div>
        );
    }
  };

  return (
    <div {...shellHandlers} style={shellStyle}>

      {/* Index badge */}
      {index && !compact && (
        <span style={{
          position: 'absolute', top: -8, left: -8, zIndex: 2,
          color: '#fff', fontSize: 10, minWidth: 18, textAlign: 'center',
          background: '#94a3b8', borderRadius: 10, padding: '1px 5px', fontWeight: 'bold',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        }}>{index}</span>
      )}

      {/* Delete button */}
      {isSelected && onRemove && (
        <button onClick={(ee) => { ee.stopPropagation(); onRemove(el._id); }}
          style={{
            position: 'absolute', top: -10, right: -10, zIndex: 3,
            width: 22, height: 22, borderRadius: '50%',
            background: '#ff4d4f', color: '#fff', border: '2px solid #fff',
            cursor: 'pointer', fontSize: 12, fontWeight: 'bold',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}>
          <Icon name="close" size={11} strokeWidth={3} />
        </button>
      )}

      {/* Type + code badge（选中时显示，便于区分同名元件） */}
      {isSelected && (
        <span style={{
          position: 'absolute', bottom: 3, right: 6, zIndex: 1,
          fontSize: 9, color: '#5d9cec', background: '#eff5fd',
          padding: '0px 4px', borderRadius: 2,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        }}>
          {ct}{el.elem_code ? ` · ${el.elem_code}` : ''}
        </span>
      )}

      {/* The real control */}
      <div style={{ pointerEvents: 'none' }}>
        {renderControl()}
      </div>
    </div>
  );
}

/* ── Styles ── */

// 产品工厂 Element UI 风格主按钮：蓝紫渐变、圆角、投影
const btnPrimary = {
  padding: '6px 18px',
  background: 'linear-gradient(135deg, #5d9cec 0%, #4a8ad4 100%)',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 500,
  boxShadow: '0 2px 6px rgba(93,156,236,.32)',
  transition: 'all .15s',
  fontFamily: 'inherit',
  lineHeight: 1.4,
  whiteSpace: 'nowrap',
};

const row = {
  display: 'flex', alignItems: 'center', gap: 0,
  justifyContent: 'center',
};

const inputH = 28;

const inputS = {
  width: '100%',
  height: inputH,
  padding: '0 8px',
  border: '1px solid #d1d5db',
  borderRadius: 4,
  fontSize: 12.5,
  color: '#1e293b',
  background: '#ffffff',
  outline: 'none',
  boxSizing: 'border-box',
  lineHeight: `${inputH - 2}px`,
};

const downArrow = {
  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
  color: '#94a3b8', pointerEvents: 'none',
};

/** Parse options from control_attr JSON string, or return empty array */
function parseOptions(el) {
  try {
    const attr = el.control_attr;
    if (!attr) return [];
    const parsed = typeof attr === 'string' ? JSON.parse(attr) : attr;
    if (Array.isArray(parsed)) return parsed;
    if (parsed && parsed.options && Array.isArray(parsed.options)) return parsed.options;
    return [];
  } catch { return []; }
}

const opt = {
  display: 'flex', alignItems: 'center', gap: 4,
  fontSize: 13, color: '#64748b',
};
