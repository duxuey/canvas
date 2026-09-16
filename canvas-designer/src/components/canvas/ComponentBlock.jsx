import { useState } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import ReorderHandle from './ReorderHandle';
import CanvasElementRender from './CanvasElementRender';
import ChildBlock from './ChildBlock';
import BlockHeader from './BlockHeader';

/**
 * Renders a component block on the canvas.
 * Displays the component's child elements in a grid layout, and any nested
 * containers (sections / tabGroups) below them.
 *
 * `reorderable` — when true (top-level), shows a drag handle and accepts
 * drops to reorder among top-level items.
 */
export default function ComponentBlock({ item, isSelected, onSelect, reorderable }) {
  const store = useCanvasStore();
  const [over, setOver] = useState(false);

  const childItems = item.childItems || [];
  const childElements = item.childElements || [];
  // 按钮与表单控件分离：按钮按 btn_layout 分顶部操作栏(head)和底部按钮栏(foot/null)
  const allButtons = childElements.filter((el) => el.control_type === 'button');
  const headButtons = allButtons.filter((el) => el.btn_layout === 'head');
  const footButtons = allButtons.filter((el) => el.btn_layout !== 'head');
  const formElements = childElements.filter((el) => el.control_type !== 'button');

  const dropReorder = (e) => {
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
      store.addComponentChild(item._id, 'element', data);
      return;
    }
    if (compRaw) {
      const comp = JSON.parse(compRaw);
      store.addComponentChild(item._id, 'component', comp);
    }
  };

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onSelect && onSelect(item._id, 'component', 'component'); }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        border: isSelected ? '2px solid #5d9cec' : '1px solid #e2e8f0',
        borderRadius: 9,
        background: '#ffffff',
        overflow: 'hidden',
        boxShadow: isSelected ? '0 0 0 3px rgba(93,156,236,0.15)' : '0 1px 2px rgba(15,23,42,.04)',
        cursor: 'pointer',
        transition: 'border-color 0.2s',
        outline: over ? '2px dashed #5d9cec' : 'none',
        outlineOffset: 2,
      }}
    >
      {/* Component header */}
      <BlockHeader
        title={item.refName || '组件'}
        onChange={(v) => store.updateItem(item._id, { refName: v })}
        meta={childItems.length > 0 ? `${childItems.length} 个嵌套` : undefined}
        onDragOver={(e) => { if (reorderable) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; } }}
        onDrop={reorderable ? dropReorder : undefined}
        dragHandle={reorderable ? <ReorderHandle itemId={item._id} /> : null}
        onMoveUp={reorderable ? () => store.moveItemUp(item._id) : undefined}
        onMoveDown={reorderable ? () => store.moveItemDown(item._id) : undefined}
      />

      {/* 顶部操作栏（head 按钮：识别/查询/重置等） */}
      <ComponentHeadBar buttons={headButtons} />

      <div style={{ padding: 11 }}>
        {/* Render child elements as real form controls */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${item.compColumns || 2}, 1fr)`,
          gap: '10px 20px',
        }}>
          {formElements.map((el, i) => (
            <div key={el._id || i} style={{
              padding: 0, background: '#ffffff', borderRadius: 4,
            }}>
              <CanvasElementRender el={el} compact interactive={false} />
            </div>
          ))}
          {childElements.length === 0 && childItems.length === 0 && (
            <div style={{ color: '#cbd5e1', fontSize: 12, gridColumn: '1/-1', textAlign: 'center', padding: 8 }}>
              空组件
            </div>
          )}
        </div>

        {/* Nested containers (sections / tabGroups) */}
        {childItems.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
            {childItems.map((c) => <ChildBlock key={c._id} item={c} />)}
          </div>
        )}

        {/* 底部按钮栏（产品工厂样式：按钮分组展示在底部，居中对齐） */}
        <ComponentButtonBar buttons={footButtons} />
      </div>
    </div>
  );
}

/** 顶部操作栏 —— head 按钮（识别/查询/重置等），居中对齐白底描边小按钮 */
function ComponentHeadBar({ buttons }) {
  if (!buttons || buttons.length === 0) return null;
  return (
    <div style={{
      padding: '8px 14px',
      background: '#fafbfd',
      borderBottom: '1px solid #eef2f7',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap',
    }}>
      {buttons.map((b, i) => (
        <button key={b._id || i} tabIndex={-1} style={btnSecondary}>
          {b.elem_name || b.elem_code || '按钮'}
        </button>
      ))}
    </div>
  );
}

/**
 * 组件底部按钮栏 —— 参考产品工厂：按钮居中对齐，主按钮（保存）渐变、次按钮白底描边。
 * 按钮按顺序排列，主按钮在最后。
 */
function ComponentButtonBar({ buttons }) {
  if (!buttons || buttons.length === 0) return null;
  return (
    <div style={{
      marginTop: 12, paddingTop: 10,
      borderTop: '1px solid #eef2f7',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    }}>
      {buttons.map((b, i) => {
        const isLast = i === buttons.length - 1;
        const isPrimary = /保存|提交|确认|确定|查询|新增/.test(b.elem_name || '');
        return (
          <button
            key={b._id || i}
            tabIndex={-1}
            style={isLast || isPrimary ? btnPrimary : btnSecondary}
          >
            {b.elem_name || b.elem_code || '按钮'}
          </button>
        );
      })}
    </div>
  );
}

// 主按钮：蓝紫渐变
const btnPrimary = {
  padding: '6px 18px',
  background: 'linear-gradient(135deg, #5d9cec 0%, #4a8ad4 100%)',
  color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer',
  fontSize: 13, fontWeight: 500,
  boxShadow: '0 2px 6px rgba(93,156,236,.32)',
  fontFamily: 'inherit', lineHeight: 1.4,
  whiteSpace: 'nowrap',
};

// 次按钮：白底描边
const btnSecondary = {
  padding: '6px 18px',
  background: '#fff', color: '#5d9cec',
  border: '1px solid #b3d4f7', borderRadius: 6, cursor: 'pointer',
  fontSize: 13, fontWeight: 500,
  fontFamily: 'inherit', lineHeight: 1.4,
  transition: 'all .15s',
  whiteSpace: 'nowrap',
};

