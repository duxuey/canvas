import { useUiStore } from '../../store/uiStore';
import { useCanvasStore } from '../../store/canvasStore';
import ElementProperties from './ElementProperties';
import ComponentProperties from './ComponentProperties';
import TableProperties from './TableProperties';
import SectionProperties from './SectionProperties';
import TabGroupProperties from './TabGroupProperties';
import PageProperties from './PageProperties';

const panelStyle = {
  width: 300, background: '#f5f7fb', borderLeft: '1px solid #e6eaf1',
  overflow: 'auto', flexShrink: 0, padding: 14,
};

export default function PropertyPanel() {
  const ui = useUiStore();
  const store = useCanvasStore();
  const { selectedId, selectedType, selectedItemType } = ui;

  // No selection → show page properties
  if (!selectedId) {
    return (
      <div style={panelStyle}>
        <PageProperties />
      </div>
    );
  }

  // Find the selected item (recursive — includes section children)
  const item = selectedId ? store.findItem(selectedId) : null;

  // Section item
  if (selectedType === 'section' || selectedItemType === 'section' || (item && item.itemType === 'section')) {
    if (!item) {
      return (
        <div style={panelStyle}>
          <h3 style={{ color: '#333', fontSize: 14 }}>区块未找到</h3>
          <p style={{ color: '#999', fontSize: 12 }}>该区块可能已被删除</p>
        </div>
      );
    }
    return (
      <div style={panelStyle}>
        <SectionProperties item={item} />
      </div>
    );
  }

  // Component item
  if (selectedType === 'component' || selectedItemType === 'component' || (item && item.itemType === 'component')) {
    if (!item) {
      return (
        <div style={panelStyle}>
          <h3 style={{ color: '#333', fontSize: 14 }}>组件未找到</h3>
          <p style={{ color: '#999', fontSize: 12 }}>该组件可能已被删除</p>
        </div>
      );
    }
    return (
      <div style={panelStyle}>
        <ComponentProperties item={item} />
      </div>
    );
  }

  // TabGroup item
  if (selectedType === 'tabGroup' || selectedItemType === 'tabGroup' || (item && item.itemType === 'tabGroup')) {
    if (!item) {
      return (
        <div style={panelStyle}>
          <h3 style={{ color: '#333', fontSize: 14 }}>标签页未找到</h3>
          <p style={{ color: '#999', fontSize: 12 }}>该标签页可能已被删除</p>
        </div>
      );
    }
    return (
      <div style={panelStyle}>
        <TabGroupProperties item={item} />
      </div>
    );
  }

  // Table item
  if (selectedType === 'table' || selectedItemType === 'table' || (item && item.itemType === 'table')) {
    if (!item) {
      return (
        <div style={panelStyle}>
          <h3 style={{ color: '#333', fontSize: 14 }}>表格未找到</h3>
          <p style={{ color: '#999', fontSize: 12 }}>该表格可能已被删除</p>
        </div>
      );
    }
    return (
      <div style={panelStyle}>
        <TableProperties item={item} />
      </div>
    );
  }

  // Element item (free element)
  if (selectedType === 'element' || selectedItemType === 'element' || (item && item.itemType === 'element')) {
    if (!item) {
      return (
        <div style={panelStyle}>
          <h3 style={{ color: '#333', fontSize: 14 }}>元素未找到</h3>
          <p style={{ color: '#999', fontSize: 12 }}>该元素可能已被删除</p>
          <PageProperties />
        </div>
      );
    }
    return (
      <div style={panelStyle}>
        <ElementProperties el={item} />
      </div>
    );
  }

  // Fallback
  return (
    <div style={panelStyle}>
      <h3 style={{ color: '#333', fontSize: 14 }}>未选择元素</h3>
      <p style={{ color: '#999', fontSize: 12 }}>点击画布上的区块/表格/组件/元件以编辑属性</p>
      <div style={{ marginTop: 16 }}>
        <PageProperties />
      </div>
    </div>
  );
}
