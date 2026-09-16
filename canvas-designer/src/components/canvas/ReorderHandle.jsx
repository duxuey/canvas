import Icon from '../common/Icon';

/**
 * Drag handle for reordering top-level items. Emits `application/section-move`
 * with the item id; the drop target resolves the reorder via the store.
 */
export default function ReorderHandle({ itemId, color = '#94a3b8', hoverColor = '#5d9cec' }) {
  return (
    <span
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        e.dataTransfer.setData('application/section-move', String(itemId));
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setDragImage(e.currentTarget, 0, 0);
      }}
      title="按住拖拽以调整块顺序"
      style={{
        flexShrink: 0, width: 22, height: 22, borderRadius: 5,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'grab', color, background: '#fff',
        border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(15,23,42,.06)',
        transition: 'color .15s, border-color .15s, background .15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = hoverColor;
        e.currentTarget.style.borderColor = hoverColor;
        e.currentTarget.style.background = '#eff5fd';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = color;
        e.currentTarget.style.borderColor = '#e2e8f0';
        e.currentTarget.style.background = '#fff';
      }}
    >
      <Icon name="grip" size={16} />
    </span>
  );
}
