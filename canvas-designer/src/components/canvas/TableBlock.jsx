import { useState } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import Icon from '../common/Icon';
import ReorderHandle from './ReorderHandle';
import BlockHeader from './BlockHeader';

/**
 * Renders a table block on the canvas.
 * A table block holds its own column definitions (childElements) and renders
 * a preview grid. Columns are added by dragging element definitions onto it.
 *
 * `reorderable` — when true (top-level), shows a drag handle and accepts
 * drops to reorder among top-level items.
 */
export default function TableBlock({ item, isSelected, onSelect, reorderable }) {
  const store = useCanvasStore();
  const [over, setOver] = useState(false);
  const cols = item.childElements || [];

  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setOver(true);
  };

  const onDragLeave = () => setOver(false);

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOver(false);
    const raw = e.dataTransfer.getData('application/canvas-element');
    if (!raw) return;
    const data = JSON.parse(raw);
    // Build a column element from the dragged element definition
    store.addTableColumn(item._id, {
      elem_code: data.elemCode || data.elem_code || '',
      elem_name: data.elemName || data.elem_name || '未命名',
      control_type: data.controlType || data.control_type || 'text',
      rel_field_name: data.relFieldName || data.rel_field_name || '',
      rel_table_name: data.relTableName || data.rel_table_name || '',
    });
  };

  const dropReorder = (e) => {
    const fromId = Number(e.dataTransfer.getData('application/section-move'));
    if (!fromId || fromId === item._id) return;
    e.preventDefault();
    e.stopPropagation();
    setOver(false);
    store.reorderItemById(fromId, item._id);
  };

  const removeColumn = (elId) => store.removeTableColumn(item._id, elId);

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onSelect && onSelect(item._id, 'table', 'table'); }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        marginBottom: 14,
        border: isSelected ? '2px solid #5d9cec' : '1px solid #e2e8f0',
        borderRadius: 10,
        background: '#ffffff',
        boxShadow: isSelected ? '0 0 0 3px rgba(93,156,236,0.15)' : '0 1px 3px rgba(15,23,42,0.05)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color .2s, box-shadow .2s',
        outline: over ? '2px dashed #5d9cec' : 'none',
        outlineOffset: 2,
      }}
    >
      {/* Header */}
      <BlockHeader
        title={item.refName || '数据列表'}
        onChange={(v) => store.updateItem(item._id, { refName: v })}
        tag="表格"
        meta={`${cols.length} 列`}
        onDragOver={(e) => { if (reorderable) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; } }}
        onDrop={reorderable ? dropReorder : undefined}
        dragHandle={reorderable ? <ReorderHandle itemId={item._id} /> : null}
        onMoveUp={reorderable ? () => store.moveItemUp(item._id) : undefined}
        onMoveDown={reorderable ? () => store.moveItemDown(item._id) : undefined}
      />

      {/* Table preview */}
      <div style={{ padding: 12, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {cols.length === 0 && (
                <th style={thStyle}>
                  <span style={{ color: '#94a3b8', fontWeight: 400 }}>拖入元件以添加列</span>
                </th>
              )}
              {cols.map((el) => (
                <th key={el._id} style={{ ...thStyle, position: 'relative' }}>
                  {el.elem_name || el.elem_code || '—'}
                  {isSelected && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removeColumn(el._id); }}
                      title="移除该列"
                      style={{
                        position: 'absolute', top: 2, right: 2,
                        width: 16, height: 16, borderRadius: '50%',
                        background: '#fff', color: '#ff4d4f', border: '1px solid #ffccc7',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, lineHeight: 1, padding: 0,
                      }}
                    >
                      <Icon name="close" size={9} strokeWidth={3} />
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[0, 1, 2].map((r) => (
              <tr key={r}>
                {cols.length === 0 ? (
                  <td style={tdStyle}>&nbsp;</td>
                ) : cols.map((el) => (
                  <td key={el._id} style={tdStyle}>{cellText(el)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function cellText(el) {
  const ct = el.control_type;
  if (ct === 'checkbox' || ct === 'switch') return '✓';
  if (ct === 'button') return '操作';
  if (ct === 'select') return '选项';
  if (ct === 'datePicker') return '2026-01-01 12:00';
  if (ct === 'number') return '0';
  return '—';
}

const thStyle = {
  padding: '7px 10px', textAlign: 'left', background: '#f6f9fc',
  fontSize: 12, fontWeight: 600, color: '#334155',
  borderBottom: '1px solid #e8ecf1',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '6px 10px', borderBottom: '1px solid #f1f5f9',
  fontSize: 12, color: '#475569',
};
