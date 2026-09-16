import { useCanvasStore } from '../../store/canvasStore';
import Icon from '../common/Icon';

export default function ComponentProperties({ item }) {
  const store = useCanvasStore();
  const update = (patch) => store.updateItem(item._id, patch);

  const handleRemove = () => {
    store.removeItem(item._id);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <h3 style={{ color: '#1e293b', fontSize: 14, flex: 1, display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={glyph}><Icon name="components" size={13} /></span>
          组件属性: {item.refName || '组件'}
        </h3>
        <button onClick={handleRemove} className="hb-btn danger sm">删除</button>
      </div>

      <Field label="组件引用代码" value={item.refCode || ''}
        onChange={(v) => update({ refCode: v })} />
      <Field label="组件名称" value={item.refName || ''}
        onChange={(v) => update({ refName: v })} />
      <Field label="列数" value={String(item.compColumns || 2)} type="number"
        onChange={(v) => update({ compColumns: Number(v) })} />

      <div style={{ marginTop: 12, padding: '10px 12px', background: '#f6f9fc', borderRadius: 8, border: '1px solid #eef2f7' }}>
        <div style={{ color: '#64748b', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="elements" size={13} /> 包含元件: {(item.childElements || []).length} 个
        </div>
        <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 5 }}>
          {(item.childElements || []).map((el, i) => (
            <span key={i} style={{
              display: 'inline-block', margin: '1px 4px 1px 0', padding: '2px 7px',
              background: '#eff5fd', color: '#5d9cec', borderRadius: 8, fontSize: 10,
            }}>
              {el.control_type}:{el.elem_name || '—'}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const glyph = {
  width: 24, height: 24, borderRadius: 7, background: 'linear-gradient(135deg, #eff5fd, #f5f3ff)',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#5d9cec', flexShrink: 0,
};

const lbl = { color: '#64748b', fontSize: 11.5, display: 'block', marginBottom: 4 };

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <label style={lbl}>{label}</label>
      <input type={type} value={value}
        onChange={(e) => onChange(e.target.value)}
        className="hb-input" style={{ padding: '6px 9px', fontSize: 12.5 }} />
    </div>
  );
}
