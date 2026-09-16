import { useCanvasStore } from '../../store/canvasStore';
import Icon from '../common/Icon';

export default function TabGroupProperties({ item }) {
  const store = useCanvasStore();
  const update = (patch) => store.updateItem(item._id, patch);
  const tabs = item.tabs || [];

  const handleRemove = () => store.removeItem(item._id);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <h3 style={{ color: '#1e293b', fontSize: 14, flex: 1, display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={glyph}><Icon name="tabs" size={13} /></span>
          标签页属性: {item.refName || '标签页'}
        </h3>
        <button onClick={handleRemove} className="hb-btn danger sm">删除</button>
      </div>

      <Field label="容器标题" value={item.refName || ''}
        onChange={(v) => update({ refName: v })} />

      <div style={{ marginTop: 14 }}>
        <div style={{ color: '#64748b', fontSize: 11, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="tabs" size={13} /> 标签页 ({tabs.length})
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {tabs.map((t) => {
            const count = (t.childItems || []).length;
            return (
              <div key={t._id} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '7px 9px', background: '#fff', borderRadius: 7, border: '1px solid #eef2f7',
                fontSize: 12, color: '#334155',
              }}>
                <Icon name="tabs" size={13} style={{ color: '#5d9cec', flexShrink: 0 }} />
                <input
                  value={t.name || ''}
                  onChange={(e) => store.renameTab(item._id, t._id, e.target.value)}
                  className="hb-input"
                  style={{ flex: 1, padding: '4px 8px', fontSize: 12 }} />
                <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>{count} 项</span>
                <button onClick={() => store.removeTab(item._id, t._id)}
                  className="hb-icon-btn" style={{ width: 22, height: 22, color: '#ff4d4f' }}
                  title="删除标签">
                  <Icon name="close" size={13} />
                </button>
              </div>
            );
          })}
        </div>

        <button onClick={() => store.addTab(item._id)} style={{
          marginTop: 8, width: '100%', padding: '7px', background: '#fff',
          color: '#5d9cec', border: '1px dashed #b3d4f7', borderRadius: 7, cursor: 'pointer',
          fontSize: 12, fontFamily: 'inherit', display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', gap: 5,
        }}>
          <Icon name="plus" size={13} /> 添加标签
        </button>
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
