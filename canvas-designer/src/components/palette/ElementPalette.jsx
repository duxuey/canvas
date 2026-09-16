import { CONTROL_TYPES } from '../../utils/constants';
import PaletteItem from './PaletteItem';

export default function ElementPalette() {
  return (
    <div>
      <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 8px' }}>拖拽元件到画布区域</p>
      {CONTROL_TYPES.map((ct) => (
        <PaletteItem key={ct.type} controlType={ct.type} label={ct.label} icon={ct.icon} />
      ))}
    </div>
  );
}
