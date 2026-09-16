import { useCanvasStore } from '../../store/canvasStore';
import Icon from '../common/Icon';

export default function TableProperties({ item }) {
  const store = useCanvasStore();
  const update = (patch) => store.updateItem(item._id, patch);
  const cols = item.childElements || [];

  const handleRemove = () => store.removeItem(item._id);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <h3 style={{ color: '#1e293b', fontSize: 14, flex: 1, display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={glyph}><Icon name="list" size={13} /></span>
          表格属性: {item.refName || '数据列表'}
        </h3>
        <button onClick={handleRemove} className="hb-btn danger sm">删除</button>
      </div>

      <Field label="表格标题" value={item.refName || ''}
        onChange={(v) => update({ refName: v })} />

      <div style={{ marginTop: 14, padding: '10px 12px', background: '#f6f9fc', borderRadius: 8, border: '1px solid #eef2f7' }}>
        <div style={{ color: '#64748b', fontSize: 11, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="elements" size={13} /> 表格列 ({cols.length})
        </div>
        {cols.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: 11, margin: 0 }}>
            从左侧元件区拖入元件到此表格以添加列
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {cols.map((el) => (
              <div key={el._id} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '6px 9px', background: '#fff', borderRadius: 7, border: '1px solid #eef2f7',
                fontSize: 12, color: '#334155',
              }}>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {el.elem_name || el.elem_code || '未命名'}
                </span>
                <span style={{ fontSize: 10, color: '#5d9cec', background: '#eff5fd', padding: '1px 6px', borderRadius: 7 }}>
                  {el.control_type}
                </span>
                <button onClick={() => store.removeTableColumn(item._id, el._id)} className="hb-icon-btn" style={{ width: 22, height: 22, color: '#ff4d4f' }}>
                  <Icon name="close" size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
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
