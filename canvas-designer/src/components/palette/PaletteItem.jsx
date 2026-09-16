import Icon from '../common/Icon';

export default function PaletteItem({ controlType, label, icon }) {
  const onDragStart = (e) => {
    e.dataTransfer.setData('application/canvas-element', JSON.stringify({ controlType }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div style={itemStyle} draggable onDragStart={onDragStart}>
      <span style={glyphStyle}><Icon name={icon} size={15} /></span>
      <span style={{ color: '#334155' }}>{label}</span>
      <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: 10.5 }}>{controlType}</span>
    </div>
  );
}

const itemStyle = {
  display: 'flex', alignItems: 'center', gap: 9, padding: '8px 11px',
  margin: '5px 0', background: '#ffffff', borderRadius: 8, cursor: 'grab',
  color: '#334155', fontSize: 13, userSelect: 'none', border: '1px solid #e8ecf1',
  boxShadow: '0 1px 2px rgba(15,23,42,.04)',
  transition: 'border-color .15s, box-shadow .15s',
};

const glyphStyle = {
  width: 26, height: 26, borderRadius: 7, flexShrink: 0,
  background: 'linear-gradient(135deg, #eff5fd, #f5f3ff)',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  color: '#5d9cec',
};
