import { useCanvasStore } from '../../store/canvasStore';
import CanvasElementRender from './CanvasElementRender';

export default function CanvasRow({ rowIndex, elements, colSpan, cols, startIndex = 0, onSelect, selectedId, onRemove }) {
  const emptySlots = cols - elements.length;

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: 16, marginBottom: 10, minHeight: 44,
    }}>
      {elements.map((el, ci) => (
        <CanvasCell key={el._id || ci} rowIdx={rowIndex} colIdx={ci} el={el} colSpan={colSpan}
          globalIndex={startIndex + ci + 1}
          isSelected={selectedId === el._id}
          onSelect={onSelect}
          onRemove={onRemove} />
      ))}
      {Array.from({ length: emptySlots }).map((_, ci) => (
        <CanvasCell key={`empty-${ci}`} rowIdx={rowIndex} colIdx={elements.length + ci} el={null} colSpan={colSpan} />
      ))}
    </div>
  );
}

function CanvasCell({ rowIdx, colIdx, el, colSpan, isSelected, onSelect, onRemove }) {
  const store = useCanvasStore();

  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Try component
    const compRaw = e.dataTransfer.getData('application/canvas-component');
    if (compRaw) {
      const comp = JSON.parse(compRaw);
      const id = store.addItem('component', comp, rowIdx, colIdx);
      onSelect && onSelect(id);
      return;
    }
    // Try element
    const raw = e.dataTransfer.getData('application/canvas-element');
    if (raw) {
      const data = JSON.parse(raw);
      const id = store.addItem('element', data, rowIdx, colIdx);
      onSelect && onSelect(id);
    }
  };

  if (el) {
    return (
      <div onDragOver={onDragOver} onDrop={onDrop}>
        <CanvasElementRender
          el={el}
          isSelected={isSelected}
          onSelect={onSelect}
          onRemove={onRemove}
        />
      </div>
    );
  }

  return (
    <div onDragOver={onDragOver} onDrop={onDrop} style={{
      minHeight: 50, border: '1px dashed #d9d9d9', borderRadius: 4,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#ccc', fontSize: 12, background: '#fafafa', transition: 'background 0.2s',
    }}
      onDragEnter={(e) => e.currentTarget.style.background = '#eff5fd'}
      onDragLeave={(e) => e.currentTarget.style.background = '#fafafa'}>
      拖放到此
    </div>
  );
}
