import { useCanvasStore } from '../../store/canvasStore';
import { useUiStore } from '../../store/uiStore';
import { computeLayout } from '../../utils/canvasLayout';
import CanvasRow from './CanvasRow';
import ComponentBlock from './ComponentBlock';
import TableBlock from './TableBlock';
import SectionBlock from './SectionBlock';
import TabGroupBlock from './TabGroupBlock';
import PageButtons from './PageButtons';
import Icon from '../common/Icon';

export default function CanvasArea() {
  const store = useCanvasStore();
  const ui = useUiStore();
  const { columns, items } = store;

  // Separate element-type items for the form grid；按钮按 btn_layout 分顶部/底部
  const elementItems = items.filter((x) => x.itemType === 'element');
  const allFreeButtons = elementItems.filter((x) => x.control_type === 'button');
  const freeHeadButtons = allFreeButtons.filter((x) => x.btn_layout === 'head');
  const freeFootButtons = allFreeButtons.filter((x) => x.btn_layout !== 'head');
  const formElementItems = elementItems.filter((x) => x.control_type !== 'button');
  const layout = computeLayout(formElementItems, 'form', columns);

  const onCanvasClick = () => ui.clearSelection();

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Canvas surface — 内容超出视口时纵向滚动 */}
      <div onClick={onCanvasClick} style={{ flex: 1, minHeight: 0, padding: '0 20px 20px', overflow: 'auto', background: '#ffffff' }}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
        onDrop={(e) => {
          e.preventDefault();
          // Try component drop
          const compRaw = e.dataTransfer.getData('application/canvas-component');
          if (compRaw) {
            const comp = JSON.parse(compRaw);
            const last = items[items.length - 1];
            let ri = last ? last._rowIdx : 0;
            let ci = last ? last._colIdx + 1 : 0;
            if (ci >= (columns || 2)) { ri++; ci = 0; }
            const id = store.addItem('component', comp, ri, ci);
            ui.select(id, 'component', 'component');
            return;
          }
          // Try element drop
          const elemRaw = e.dataTransfer.getData('application/canvas-element');
          if (elemRaw) {
            const data = JSON.parse(elemRaw);
            const last = items[items.length - 1];
            let ri = last ? last._rowIdx : 0;
            let ci = last ? last._colIdx + 1 : 0;
            if (ci >= (columns || 2)) { ri++; ci = 0; }
            const id = store.addItem('element', data, ri, ci);
            ui.select(id, 'element', 'element');
          }
        }}
      >
        {/* 页面级按钮条（sticky 固定在顶部） */}
        <PageButtons />
        <div style={{ minHeight: '100%', background: '#fafafa', borderRadius: 12,
          border: '2px dashed #d3dce8', padding: 24,
          boxShadow: '0 0 0 1px #f0f3f8', display: 'flex', flexDirection: 'column' }}>
          {items.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 15, userSelect: 'none' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 68, height: 68, margin: '0 auto 14px', borderRadius: 20, background: 'linear-gradient(135deg, #eff5fd, #f5f3ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5d9cec' }}>
                  <Icon name="designer" size={30} strokeWidth={1.6} />
                </div>
                <div style={{ color: '#64748b' }}>从左侧拖拽元件/组件到此处</div>
                <div style={{ fontSize: 13, marginTop: 6, color: '#a8b6c8' }}>或点击上方 + 添加 快速创建</div>
              </div>
            </div>
          ) : (
            /* Render items in order — tables, components, and free elements */
            <>
              {items.map((item) => {
                if (item.itemType === 'section') {
                  return (
                    <SectionBlock key={item._id} item={item}
                      isSelected={ui.selectedId === item._id}
                      onSelect={(id) => ui.select(id, 'section', 'section')} />
                  );
                }
                if (item.itemType === 'table') {
                  return (
                    <TableBlock key={item._id} item={item} reorderable
                      isSelected={ui.selectedId === item._id}
                      onSelect={(id) => ui.select(id, 'table', 'table')} />
                  );
                }
                if (item.itemType === 'tabGroup') {
                  return (
                    <TabGroupBlock key={item._id} item={item} reorderable
                      isSelected={ui.selectedId === item._id}
                      onSelect={(id) => ui.select(id, 'tabGroup', 'tabGroup')} />
                  );
                }
                if (item.itemType === 'component') {
                  return (
                    <div key={item._id} style={{ marginBottom: 12 }}>
                      <ComponentBlock item={item} reorderable
                        isSelected={ui.selectedId === item._id}
                        onSelect={(id) => ui.select(id, 'component', 'component')} />
                    </div>
                  );
                }
                // Free element — rendered as part of the grid below
                return null;
              })}

              {/* Free elements in form grid（不含按钮） */}
              {formElementItems.length > 0 && (
                <div style={{ marginTop: items.some((x) => x.itemType !== 'element') ? 20 : 0 }}>
                  {layout.rows && layout.rows.map((row, i) => (
                    <CanvasRow key={i} rowIndex={i} elements={row} colSpan={layout.colSpan} cols={layout.cols}
                      startIndex={layout.rows.slice(0, i).reduce((s, r) => s + r.length, 0)}
                      onSelect={(id) => ui.select(id, 'element', 'element')}
                      selectedId={ui.selectedId}
                      onRemove={(id) => { store.removeItem(id); ui.clearSelection(); }} />
                  ))}
                </div>
              )}

              {/* 顶部操作栏（head 按钮，居中对齐） */}
              {freeHeadButtons.length > 0 && (
                <div style={{
                  marginTop: 12, padding: '8px 12px',
                  background: '#fafbfd', border: '1px solid #eef2f7', borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap',
                }}>
                  {freeHeadButtons.map((b, i) => (
                    <button key={b._id || i} tabIndex={-1}
                      onClick={(e) => { e.stopPropagation(); ui.select(b._id, 'element', 'element'); }}
                      style={canvasBtnSecondary}>
                      {b.elem_name || b.elem_code || '按钮'}
                    </button>
                  ))}
                </div>
              )}

              {/* 底部按钮栏（foot/null 按钮，居中对齐） */}
              {freeFootButtons.length > 0 && (
                <div style={{
                  marginTop: 20, paddingTop: 12,
                  borderTop: '1px solid #eef2f7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  {freeFootButtons.map((b, i) => (
                    <button key={b._id || i} tabIndex={-1}
                      onClick={(e) => { e.stopPropagation(); ui.select(b._id, 'element', 'element'); }}
                      style={i === freeFootButtons.length - 1 ? canvasBtnPrimary : canvasBtnSecondary}>
                      {b.elem_name || b.elem_code || '按钮'}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// 画布底部按钮栏样式（产品工厂 Element UI 风格）
const canvasBtnPrimary = {
  padding: '6px 18px',
  background: 'linear-gradient(135deg, #5d9cec 0%, #4a8ad4 100%)',
  color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer',
  fontSize: 13, fontWeight: 500,
  boxShadow: '0 2px 6px rgba(93,156,236,.32)',
  fontFamily: 'inherit', lineHeight: 1.4,
  whiteSpace: 'nowrap',
};

const canvasBtnSecondary = {
  padding: '6px 18px',
  background: '#fff', color: '#5d9cec',
  border: '1px solid #b3d4f7', borderRadius: 6, cursor: 'pointer',
  fontSize: 13, fontWeight: 500,
  fontFamily: 'inherit', lineHeight: 1.4,
  whiteSpace: 'nowrap',
};

