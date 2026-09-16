import { useUiStore } from '../../store/uiStore';
import SectionBlock from './SectionBlock';
import ComponentBlock from './ComponentBlock';
import TableBlock from './TableBlock';
import TabGroupBlock from './TabGroupBlock';

/**
 * 递归渲染一个「块级」子项（区块 / 组件 / 表格 / 标签页容器）。
 * 用于 section.childItems、component.childItems、tabGroup.tabs[].childItems 的统一渲染。
 */
export default function ChildBlock({ item }) {
  const ui = useUiStore();
  const isSelected = ui.selectedId === item._id;

  if (item.itemType === 'section') {
    return <SectionBlock item={item} nested isSelected={isSelected} onSelect={(id) => ui.select(id, 'section', 'section')} />;
  }
  if (item.itemType === 'component') {
    return <ComponentBlock item={item} isSelected={isSelected} onSelect={(id) => ui.select(id, 'component', 'component')} />;
  }
  if (item.itemType === 'table') {
    return <TableBlock item={item} isSelected={isSelected} onSelect={(id) => ui.select(id, 'table', 'table')} />;
  }
  if (item.itemType === 'tabGroup') {
    return <TabGroupBlock item={item} isSelected={isSelected} onSelect={(id) => ui.select(id, 'tabGroup', 'tabGroup')} />;
  }
  return null;
}
