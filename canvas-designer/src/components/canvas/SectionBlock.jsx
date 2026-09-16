import { useState } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useUiStore } from '../../store/uiStore';
import ChildBlock from './ChildBlock';
import CanvasElementRender from './CanvasElementRender';
import BlockHeader from './BlockHeader';
import Icon from '../common/Icon';

/**
 * Renders a section block — a grouping container that holds nested
 * children (elements, components, tables, sections, tabGroups) in order,
 * supports collapsing, and lets children be reordered via drag.
 *
 * `nested` — 当区块被嵌在其他容器内部时隐藏顶部拖拽排序把手。
 */
export default function SectionBlock({ item, isSelected, onSelect, nested = false }) {
  const store = useCanvasStore();
  const ui = useUiStore();
  const [collapsed, setCollapsed] = useState(false);
  const [over, setOver] = useState(false);

  const collapsible = item.collapsible !== false;
  const children = item.childItems || [];
  const segments = buildSegments(children);

  const dragSection = (e) => {
    e.stopPropagation();
    e.dataTransfer.setData('application/section-move', String(item._id));
    e.dataTransfer.effectAllowed = 'move';
  };
  const dropSection = (e) => {
    const fromId = Number(e.dataTransfer.getData('application/section-move'));
    if (!fromId || fromId === item._id) return;
    e.preventDefault();
    e.stopPropagation();
    store.reorderItemById(fromId, item._id);
  };

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
    const elemRaw = e.dataTransfer.getData('application/canvas-element');
    const compRaw = e.dataTransfer.getData('application/canvas-component');
    if (elemRaw) {
      const data = JSON.parse(elemRaw);
      store.addSectionChild(item._id, 'element', data);
      return;
    }
    if (compRaw) {
      const comp = JSON.parse(compRaw);
      store.addSectionChild(item._id, 'component', comp);
    }
  };

  const dragChild = (e, childId) => {
    e.dataTransfer.setData('application/section-reorder', String(childId));
    e.dataTransfer.effectAllowed = 'move';
  };
  const dropChild = (e, targetId) => {
    const fromId = Number(e.dataTransfer.getData('application/section-reorder'));
    // 非「重排」拖拽（如拖入新元件/组件）时，让事件冒泡给外层 SectionBlock 处理
    if (!fromId || fromId === targetId) return;
    e.preventDefault();
    e.stopPropagation();
    store.reorderSectionChild(item._id, fromId, targetId);
  };

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onSelect && onSelect(item._id, 'section', 'section'); }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        marginBottom: 16,
        border: isSelected ? '2px solid #5d9cec' : '1px solid #e2e8f0',
        borderRadius: 12,
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
        title={item.refName || '区块'}
        onChange={(v) => store.updateItem(item._id, { refName: v })}
        tag="区块"
        meta={`${children.length} 项`}
        collapsed={collapsed}
        onCollapse={collapsible ? () => setCollapsed(!collapsed) : undefined}
        onClick={collapsible ? () => setCollapsed(!collapsed) : undefined}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
        onDrop={dropSection}
        onMoveUp={!nested ? () => store.moveItemUp(item._id) : undefined}
        onMoveDown={!nested ? () => store.moveItemDown(item._id) : undefined}
        dragHandle={
          <span
            draggable={!nested}
            onDragStart={nested ? undefined : dragSection}
            title="拖拽排序"
            style={{
              flexShrink: 0, width: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: nested ? 'default' : 'grab', color: '#cbd5e1',
              visibility: nested ? 'hidden' : 'visible',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#5d9cec'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#cbd5e1'; }}
          >
            <Icon name="grip" size={14} />
          </span>
        }
      />

      {/* Body */}
      {!collapsed && (
        <div style={{ padding: 12 }}>
          {children.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', padding: 22 }}>
              拖入元件或组件到此区块
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {segments.map((seg, si) => {
                if (seg.kind === 'block') {
                  return (
                    <SortableWrap key={seg.item._id} onDragStart={dragChild} onDrop={dropChild} childId={seg.item._id}>
                      <ChildBlock item={seg.item} />
                    </SortableWrap>
                  );
                }
                // grid of element children
                const cols = store.columns || 2;
                return (
                  <div key={`grid-${si}`} style={{
                    display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10,
                  }}>
                    {seg.items.map((el) => (
                      <SortableWrap key={el._id} onDragStart={dragChild} onDrop={dropChild} childId={el._id}>
                        <CanvasElementRender el={el}
                          isSelected={ui.selectedId === el._id}
                          onSelect={(id) => ui.select(id, 'element', 'element')}
                          onRemove={(id) => store.removeItem(id)} />
                      </SortableWrap>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

/** Wrapper that makes a section child draggable/reorderable via a grip handle. */
function SortableWrap({ childId, onDragStart, onDrop, children }) {
  return (
    <div
      onDragOver={(e) => {
        // 仅「重排」拖拽在此层 preventDefault；新增元件/组件拖拽冒泡给外层处理
        if (e.dataTransfer.types?.includes('application/section-reorder')) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }
      }}
      onDrop={(e) => onDrop(e, childId)}
      style={{ position: 'relative', display: 'flex', alignItems: 'stretch', gap: 2, minWidth: 0 }}
    >
      <div
        draggable
        onDragStart={(e) => onDragStart(e, childId)}
        title="拖拽排序"
        style={{
          flexShrink: 0, width: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'grab', color: '#cbd5e1', borderRadius: 4,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#5d9cec'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#cbd5e1'; }}
      >
        <Icon name="grip" size={14} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

/** Group consecutive elements into grids while keeping block items in order. */
function buildSegments(children) {
  const segments = [];
  let pending = [];
  for (const c of children) {
    if (c.itemType === 'element') {
      pending.push(c);
    } else {
      if (pending.length) { segments.push({ kind: 'grid', items: pending }); pending = []; }
      segments.push({ kind: 'block', item: c });
    }
  }
  if (pending.length) segments.push({ kind: 'grid', items: pending });
  return segments;
}
