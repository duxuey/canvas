import { useCanvasStore } from '../../store/canvasStore';
import Icon from '../common/Icon';

const CHILD_META = {
  element: { label: '元件', icon: 'elements', tone: 'blue' },
  component: { label: '组件', icon: 'components', tone: 'violet' },
  table: { label: '表格', icon: 'list', tone: 'green' },
};

export default function SectionProperties({ item }) {
  const store = useCanvasStore();
  const update = (patch) => store.updateItem(item._id, patch);
  const children = item.childItems || [];

  const handleRemove = () => store.removeItem(item._id);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <h3 style={{ color: '#1e293b', fontSize: 14, flex: 1, display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={glyph}><Icon name="groupFields" size={13} /></span>
          区块属性: {item.refName || '区块'}
        </h3>
        <button onClick={handleRemove} className="hb-btn danger sm">删除</button>
      </div>

      <Field label="区块标题" value={item.refName || ''}
        onChange={(v) => update({ refName: v })} />

      <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={item.collapsible !== false}
          onChange={(e) => update({ collapsible: e.target.checked })}
          style={{ accentColor: '#5d9cec', width: 14, height: 14 }} />
        <label style={{ color: '#64748b', fontSize: 12 }}>可折叠</label>
      </div>

      <div style={{ marginTop: 14, padding: '10px 12px', background: '#f6f9fc', borderRadius: 8, border: '1px solid #eef2f7' }}>
        <div style={{ color: '#64748b', fontSize: 11, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="components" size={13} /> 区块内容 ({children.length})
        </div>
        {children.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: 11, margin: 0 }}>
            从左侧拖入元件或组件到此区块
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {children.map((child) => {
              const meta = CHILD_META[child.itemType] || CHILD_META.element;
              const name = child.itemType === 'element'
                ? (child.elem_name || child.elem_code || '未命名')
                : (child.refName || '未命名');
              return (
                <div key={child._id} style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '6px 9px', background: '#fff', borderRadius: 7, border: '1px solid #eef2f7',
                  fontSize: 12, color: '#334155',
                }}>
                  <Icon name={meta.icon} size={13} style={{ color: '#5d9cec', flexShrink: 0 }} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                  <span style={{ fontSize: 10, color: '#5d9cec', background: '#eff5fd', padding: '1px 6px', borderRadius: 7 }}>
                    {meta.label}
                  </span>
                  <button onClick={() => store.removeSectionChild(item._id, child._id)} className="hb-icon-btn" style={{ width: 22, height: 22, color: '#ff4d4f' }}>
                    <Icon name="close" size={13} />
                  </button>
                </div>
              );
            })}
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
