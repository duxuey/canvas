import { useState } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useUiStore } from '../../store/uiStore';
import ChildBlock from './ChildBlock';
import CanvasElementRender from './CanvasElementRender';
import ReorderHandle from './ReorderHandle';
import Icon from '../common/Icon';

/**
 * 标签页容器 —— 把一个画布内容按多个标签分页。
 * 每个标签下可放区块/组件/表格/元件（与 SectionBlock 类似的子项模型）。
 */
export default function TabGroupBlock({ item, isSelected, onSelect, reorderable }) {
  const store = useCanvasStore();
  const ui = useUiStore();
  const [over, setOver] = useState(false);
  const [editingTabId, setEditingTabId] = useState(null);
  const [tabDraft, setTabDraft] = useState('');

  const tabs = item.tabs || [];
  const activeId = item.activeTabId ?? tabs[0]?._id ?? null;
  const active = tabs.find((t) => t._id === activeId) || tabs[0] || { childItems: [] };
  const children = active.childItems || [];

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
      store.addTabChild(item._id, active._id, 'element', data);
      return;
    }
    if (compRaw) {
      const comp = JSON.parse(compRaw);
      store.addTabChild(item._id, active._id, 'component', comp);
    }
  };

  const dropReorder = (e) => {
    const fromId = Number(e.dataTransfer.getData('application/section-move'));
    if (!fromId || fromId === item._id) return;
    e.preventDefault();
    e.stopPropagation();
    setOver(false);
    store.reorderItemById(fromId, item._id);
  };

  /** 在当前激活标签内新增一个区块 */
  const addSectionToTab = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const id = store.addTabChild(item._id, active._id, 'section', { name: '区块' });
    ui.select(id, 'section', 'section');
  };

  /** 进入标签重命名态 */
  const startEditTab = (t) => {
    setEditingTabId(t._id);
    setTabDraft(t.name || '');
  };
  const commitTab = () => {
    const name = tabDraft.trim();
    if (name && editingTabId != null) store.renameTab(item._id, editingTabId, name);
    setEditingTabId(null);
  };

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onSelect && onSelect(item._id, 'tabGroup', 'tabGroup'); }}
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
      {/* Tab bar */}
      <div
        onDragOver={(e) => { if (reorderable) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; } }}
        onDrop={reorderable ? dropReorder : undefined}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '6px 12px', background: '#eff5fd',
          borderBottom: '2px solid #5d9cec',
        }}
      >
        {reorderable && <ReorderHandle itemId={item._id} color="#cbd5e1" hoverColor="#5d9cec" />}

        {/* 标签页 */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 2,
          minWidth: 0, overflowX: 'auto',
        }}>
          {tabs.map((t) => {
            const isActive = t._id === active._id;
            if (editingTabId === t._id) {
              return (
                <input
                  key={t._id}
                  autoFocus
                  value={tabDraft}
                  onChange={(e) => setTabDraft(e.target.value)}
                  onBlur={commitTab}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); commitTab(); }
                    if (e.key === 'Escape') { setEditingTabId(null); }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="hb-input"
                  style={{ width: 90, padding: '3px 8px', fontSize: 12 }}
                />
              );
            }
            return (
              <div key={t._id}
                onClick={(e) => { e.stopPropagation(); store.setActiveTab(item._id, t._id); }}
                onDoubleClick={(e) => { e.stopPropagation(); startEditTab(t); }}
                title="双击修改标签名"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 11px', borderRadius: 6,
                  fontSize: 12, cursor: 'pointer', userSelect: 'none', flexShrink: 0,
                  background: isActive ? '#ffffff' : 'transparent',
                  color: isActive ? '#5d9cec' : '#64748b',
                  fontWeight: isActive ? 600 : 400,
                  boxShadow: isActive ? '0 1px 3px rgba(15,23,42,.08)' : 'none',
                  whiteSpace: 'nowrap',
                }}>
                {t.name || '标签'}
              </div>
            );
          })}

          <button
            onClick={(e) => { e.stopPropagation(); store.addTab(item._id); }}
            title="添加标签"
            style={{
              width: 22, height: 22, borderRadius: 6, border: 'none', background: 'transparent',
              color: '#94a3b8', cursor: 'pointer', display: 'inline-flex', flexShrink: 0,
              alignItems: 'center', justifyContent: 'center',
            }}>
            <Icon name="plus" size={13} />
          </button>
        </div>

        {/* 右侧操作 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            onClick={addSectionToTab}
            title="在当前标签添加区块"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 9px', borderRadius: 6, border: '1px dashed #b3d4f7',
              background: '#fff', color: '#5d9cec', cursor: 'pointer', fontSize: 11,
              fontFamily: 'inherit', flexShrink: 0,
            }}>
            <Icon name="plus" size={11} /> 区块
          </button>
          <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>{tabs.length} 个标签</span>
          {reorderable && (
            <>
              <button onClick={() => store.moveItemUp(item._id)} title="上移" style={moveBtn}>
                <Icon name="chevronUp" size={13} />
              </button>
              <button onClick={() => store.moveItemDown(item._id)} title="下移" style={moveBtn}>
                <Icon name="chevronDown" size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Body — active tab content */}
      <div style={{ padding: 12 }}>
        {children.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', padding: 22 }}>
            拖入元件或组件到此标签
            <button
              onClick={addSectionToTab}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 12px', marginTop: 8, borderRadius: 6,
                border: '1px dashed #b3d4f7', background: '#fff', color: '#5d9cec',
                cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
              }}>
              <Icon name="plus" size={12} /> 添加区块
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {buildSegments(children).map((seg, si) => {
              if (seg.kind === 'block') {
                return (
                  <div key={seg.item._id}>
                    <ChildBlock item={seg.item} />
                  </div>
                );
              }
              const cols = store.columns || 2;
              return (
                <div key={`grid-${si}`} style={{
                  display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10,
                }}>
                  {seg.items.map((el) => (
                    <CanvasElementRender key={el._id} el={el}
                      isSelected={ui.selectedId === el._id}
                      onSelect={(id) => ui.select(id, 'element', 'element')}
                      onRemove={(id) => store.removeTabChild(item._id, active._id, id)} />
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const moveBtn = {
  width: 22, height: 22, borderRadius: 5, border: '1px solid #e2e8f0',
  background: '#fff', color: '#64748b', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  padding: 0, flexShrink: 0, fontFamily: 'inherit',
};

/** 将连续元件分组为网格，块级项（组件/表格）单独成段 */
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
