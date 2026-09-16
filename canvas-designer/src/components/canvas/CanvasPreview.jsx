import { useState, useEffect, useRef } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import Icon from '../common/Icon';
import DateTimePicker from '../common/DateTimePicker';
import PageButtons from './PageButtons';

/* ============================================================
   1:1 Form Preview — label + control on the same row
   预览支持交互：标签页可切换、区块可折叠/展开
   ============================================================ */

const S = {
  wrap: { height: '100%', overflow: 'auto', background: 'linear-gradient(180deg, #f3f6fb 0%, #e9edf4 100%)', padding: '0 24px 24px' },
  card: { background: '#fff', padding: '28px 32px', borderRadius: 14, boxShadow: '0 4px 18px rgba(15,23,42,.07)', border: '1px solid #eef2f7', width: '100%' },
  row: (cols) => ({
    display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gap: '10px 20px', marginBottom: 10,
  }),
  field: { display: 'flex', alignItems: 'center', gap: 0, justifyContent: 'center' },
  lbl: {
    width: 96, flexShrink: 0, textAlign: 'right', paddingRight: 8,
    fontSize: 12.5, color: '#334155', fontWeight: 500,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  req: { color: '#ff4d4f', marginLeft: 1 },
  ctrlWrap: { position: 'relative', flex: 1, minWidth: 0, maxWidth: 235 },
  ctrl: {
    width: '100%', height: 28, padding: '0 8px',
    border: '1px solid #d1d5db', borderRadius: 4,
    fontSize: 12.5, color: '#1e293b', background: '#fff',
    outline: 'none', boxSizing: 'border-box',
  },
  textarea: {
    width: '100%', padding: '5px 10px',
    border: '1px solid #d1d5db', borderRadius: 4,
    fontSize: 13, color: '#1e293b', background: '#fff',
    minHeight: 56, resize: 'vertical', outline: 'none', boxSizing: 'border-box',
  },
  btn: (c) => ({
    padding: '6px 22px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
    border: c === 'primary' ? 'none' : '1px solid #b3d4f7',
    background: c === 'primary' ? 'linear-gradient(135deg, #5d9cec 0%, #4a8ad4 100%)' : '#fff',
    color: c === 'primary' ? '#fff' : '#5d9cec',
    fontWeight: 500, fontFamily: 'inherit', lineHeight: 1.4, whiteSpace: 'nowrap',
    boxShadow: c === 'primary' ? '0 2px 6px rgba(93,156,236,.32)' : 'none',
  }),
  divider: { border: 'none', borderTop: '1px solid #e8ecf1', margin: '2px 0 10px' },
};

/* ── 字段渲染（模块级，纯函数） ── */
function renderLabel(el) {
  return (
    <span style={S.lbl}>
      {el.elem_name || el.elem_code || '—'}
      {el.required_flag === '1' && <span style={S.req}>*</span>}
    </span>
  );
}

function renderField(el) {
  const ct = el.control_type || 'text';
  const ph = el.placeholder || '';
  const isFull = ['label', 'divider', 'button', 'hidden', 'checkbox', 'switch', 'groupFields'].includes(ct);

  if (isFull) {
    switch (ct) {
      case 'label':
        return <span style={{ fontSize: 14, color: '#334155', fontWeight: 600 }}>{el.elem_name}</span>;
      case 'divider':
        return <hr style={S.divider} />;
      case 'button':
        return <button style={S.btn('primary')}>{el.elem_name || '按钮'}</button>;
      case 'hidden':
        return null;
      case 'checkbox':
        return (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" style={{ width: 16, height: 16, accentColor: '#5d9cec' }} />
            <span style={{ fontSize: 13, color: '#334155' }}>{el.elem_name || '选项'}</span>
          </label>
        );
      case 'switch':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" style={{ width: 36, height: 20, accentColor: '#5d9cec' }} />
            <span style={{ fontSize: 13, color: '#334155' }}>{el.elem_name}</span>
          </div>
        );
      default:
        return null;
    }
  }

  let control;
  const s = S.ctrl;
  switch (ct) {
    case 'text':
      control = <input type="text" placeholder={ph} style={s} />;
      break;
    case 'number':
      control = <input type="number" placeholder={ph} style={s} />;
      break;
    case 'textarea':
      control = <textarea placeholder={ph} style={S.textarea} />;
      break;
    case 'select':
      control = (
        <div style={S.ctrlWrap}>
          <select style={{ ...s, appearance: 'none', paddingRight: 28 }}>
            <option value="">{ph || '请选择'}</option>
          </select>
          <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}><Icon name="chevronDown" size={13} /></span>
        </div>
      );
      break;
    case 'datePicker':
      control = <DateTimePicker placeholder={ph || '选择日期时间'} />;
      break;
    case 'radio':
      control = (
        <div style={{ display: 'flex', gap: 18, height: 32, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 13, color: '#475569' }}>
            <input type="radio" name={el.elem_code || 'r'} style={{ accentColor: '#5d9cec' }} /> 选项1
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 13, color: '#475569' }}>
            <input type="radio" name={el.elem_code || 'r'} style={{ accentColor: '#5d9cec' }} /> 选项2
          </label>
        </div>
      );
      break;
    case 'file':
      control = (
        <div style={{
          ...S.ctrlWrap, display: 'flex', alignItems: 'center', height: 32,
          padding: '0 10px', border: '1px dashed #d1d5db', borderRadius: 4,
          background: '#f9fafb', color: '#94a3b8', fontSize: 12, boxSizing: 'border-box',
        }}>
          <Icon name="file" size={14} style={{ marginRight: 6 }} /> 选择文件
        </div>
      );
      break;
    case 'search':
      control = (
        <div style={S.ctrlWrap}>
          <input type="text" placeholder={ph || '搜索...'} style={{ ...s, paddingLeft: 30 }} />
          <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><Icon name="search" size={14} /></span>
        </div>
      );
      break;
    default:
      control = <input type="text" placeholder={ph} style={s} />;
  }

  return (
    <div style={S.field}>
      {renderLabel(el)}
      <div style={S.ctrlWrap}>{control}</div>
    </div>
  );
}

/** 与设计器一致的标题栏：无图标、浅蓝底、底部蓝色细线 */
function renderHeader(icon, title, tag, meta, { onClick, chevron } = {}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 14px', background: '#eff5fd',
      borderBottom: '2px solid #5d9cec', userSelect: 'none',
      ...(onClick ? { cursor: 'pointer' } : {}),
    }} onClick={onClick}>
      <span style={{
        flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: '#1e293b',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {title}
      </span>
      {tag && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0,
          padding: '2px 9px', borderRadius: 999, fontSize: 11, fontWeight: 600,
          color: '#5d9cec', background: '#5d9cec14', border: '1px solid #5d9cec26',
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#5d9cec' }} />
          {tag}
        </span>
      )}
      {meta && <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>{meta}</span>}
      {chevron && <span style={{ color: '#94a3b8', flexShrink: 0 }}><Icon name={chevron} size={14} /></span>}
    </div>
  );
}

/** 将连续元件分组为网格，块级项（区块/组件/表格/标签页）单独成段 */
function buildSegments(children) {
  const segments = [];
  let pending = [];
  for (const c of children || []) {
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

/* ── 递归渲染一组 items（元件网格 + 块级容器） ── */
function ItemList({ items }) {
  const columns = useCanvasStore((s) => s.columns);
  return buildSegments(items).map((seg, si) => {
    if (seg.kind === 'block') {
      return <Item key={seg.item._id} item={seg.item} />;
    }
    return (
      <div key={`grid-${si}`} style={S.row(columns || 2)}>
        {seg.items.map((el) => <div key={el._id}>{renderField(el)}</div>)}
      </div>
    );
  });
}

function Item({ item }) {
  if (!item) return null;
  if (item.itemType === 'section') return <Section item={item} />;
  if (item.itemType === 'tabGroup') return <TabGroup item={item} />;
  if (item.itemType === 'component') return <Component item={item} />;
  if (item.itemType === 'table') return <Table item={item} />;
  if (item.itemType === 'element') return renderField(item);
  return null;
}

function Section({ item }) {
  const [collapsed, setCollapsed] = useState(false);
  const collapsible = item.collapsible !== false;
  const children = item.childItems || [];
  return (
    <div
      data-block-id={item._id}
      data-block-title={item.refName || '区块'}
      data-block-type="区块"
      style={{
      marginBottom: 20, border: '1px solid #e2e8f0', borderRadius: 12,
      overflow: 'hidden', background: '#ffffff',
    }}>
      {renderHeader('groupFields', item.refName || '区块', '区块', `${children.length} 项`, {
        onClick: collapsible ? () => setCollapsed(!collapsed) : undefined,
        chevron: collapsible ? (collapsed ? 'chevronDown' : 'chevronUp') : undefined,
      })}
      {!collapsed && (
        <div style={{ padding: 12 }}>
          <ItemList items={children} />
        </div>
      )}
    </div>
  );
}

function TabGroup({ item }) {
  const srcTabs = item.tabs || [];
  const [tabs, setTabs] = useState(srcTabs);
  const [activeId, setActiveId] = useState(item.activeTabId ?? srcTabs[0]?._id ?? null);
  const [editingTabId, setEditingTabId] = useState(null);
  const [tabDraft, setTabDraft] = useState('');
  const active = tabs.find((t) => t._id === activeId) || tabs[0] || { childItems: [] };

  const startEditTab = (t) => { setEditingTabId(t._id); setTabDraft(t.name || ''); };
  const commitTab = () => {
    const name = tabDraft.trim();
    if (name && editingTabId != null) {
      setTabs((prev) => prev.map((t) => (t._id === editingTabId ? { ...t, name } : t)));
    }
    setEditingTabId(null);
  };

  return (
    <div
      data-block-id={item._id}
      data-block-title={item.refName || '标签页'}
      data-block-type="标签页"
      style={{
      marginBottom: 20, border: '1px solid #e2e8f0', borderRadius: 12,
      overflow: 'hidden', background: '#ffffff',
    }}>
      <div style={{ display: 'flex', gap: 2, padding: '6px 12px', background: '#eff5fd', borderBottom: '2px solid #5d9cec' }}>
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
            <span key={t._id}
              onClick={() => setActiveId(t._id)}
              onDoubleClick={() => startEditTab(t)}
              title="双击修改标签名"
              style={{
                padding: '4px 11px', borderRadius: 6, fontSize: 12,
                cursor: 'pointer', userSelect: 'none',
                background: isActive ? '#ffffff' : 'transparent',
                color: isActive ? '#5d9cec' : '#64748b',
                fontWeight: isActive ? 600 : 400,
                boxShadow: isActive ? '0 1px 3px rgba(15,23,42,.08)' : 'none',
                whiteSpace: 'nowrap',
              }}>
              {t.name || '标签'}
            </span>
          );
        })}
      </div>
      <div style={{ padding: 12 }}>
        <ItemList items={active.childItems} />
      </div>
    </div>
  );
}

function Component({ item }) {
  const cCols = item.compColumns || 2;
  const elems = item.childElements || [];
  const nested = item.childItems || [];
  // 按钮与表单控件分离，按钮按 btn_layout 分顶部/底部（与设计界面一致）
  const headButtons = elems.filter((el) => el.control_type === 'button' && el.btn_layout === 'head');
  const footButtons = elems.filter((el) => el.control_type === 'button' && el.btn_layout !== 'head');
  const formElements = elems.filter((el) => el.control_type !== 'button');
  const empty = elems.length === 0 && nested.length === 0;
  return (
    <div
      data-block-id={item._id}
      data-block-title={item.refName || '组件'}
      data-block-type="组件"
      style={{
      marginBottom: 12, border: '1px solid #e2e8f0', borderRadius: 9,
      overflow: 'hidden', background: '#ffffff',
    }}>
      {renderHeader('components', item.refName || '组件')}

      {/* 顶部操作栏（head 按钮，居中） */}
      {headButtons.length > 0 && (
        <div style={{
          padding: '8px 14px', background: '#fafbfd', borderBottom: '1px solid #eef2f7',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap',
        }}>
          {headButtons.map((el, i) => (
            <button key={el._id || i} style={{ ...S.btn('secondary'), whiteSpace: 'nowrap' }}>
              {el.elem_name || el.elem_code || '按钮'}
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: 12 }}>
        {empty ? (
          <div style={{ padding: 12, fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>空组件</div>
        ) : (
          <>
            {formElements.length > 0 && (
              <div style={{
                display: 'grid', gridTemplateColumns: `repeat(${cCols}, 1fr)`,
                gap: '10px 20px',
              }}>
                {formElements.map((el) => <div key={el._id}>{renderField(el)}</div>)}
              </div>
            )}
            {nested.length > 0 && (
              <div style={{ marginTop: formElements.length > 0 ? 12 : 0 }}>
                <ItemList items={nested} />
              </div>
            )}
            {/* 底部按钮栏（foot/null 按钮，居中） */}
            {footButtons.length > 0 && (
              <div style={{
                marginTop: 12, paddingTop: 10, borderTop: '1px solid #eef2f7',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap',
              }}>
                {footButtons.map((el, i) => (
                  <button key={el._id || i} style={{ ...S.btn(i === footButtons.length - 1 ? 'primary' : 'secondary'), whiteSpace: 'nowrap' }}>
                    {el.elem_name || el.elem_code || '按钮'}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Table({ item }) {
  const cols = item.childElements || [];
  return (
    <div
      data-block-id={item._id}
      data-block-title={item.refName || '数据列表'}
      data-block-type="表格"
      style={{
      marginBottom: 20, border: '1px solid #e2e8f0', borderRadius: 10,
      overflow: 'hidden', background: '#ffffff',
    }}>
      {renderHeader('list', item.refName || '数据列表', '表格', `${cols.length} 列`)}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {cols.map((el, i) => (
              <th key={i} style={{ padding: '10px 14px', background: '#f8fafc', fontSize: 13, fontWeight: 600, color: '#334155', textAlign: 'left', borderBottom: '1px solid #e8ecf1' }}>
                {el.elem_name || el.elem_code || '—'}
                {el.required_flag === '1' && <span style={S.req}>*</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5].map((row) => (
            <tr key={row}>
              {cols.map((el, ci) => (
                <td key={ci} style={{ padding: '6px 14px', borderBottom: '1px solid #f1f5f9', fontSize: 13, color: '#475569' }}>
                  {renderField(el)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CanvasPreview() {
  const store = useCanvasStore();
  const isEmpty = store.items.length === 0;
  const [activeBlock, setActiveBlock] = useState(null);
  const [navOpen, setNavOpen] = useState(true);
  const [navExpanded, setNavExpanded] = useState(false);
  const scrollRef = useRef(null);

  // 顶层块（组件/表格/区块/标签页）作为快捷导航项
  // 注意：_id 统一转字符串，与 data-block-id 属性（DOM 字符串）保持一致
  const blocks = store.items
    .filter((it) => ['component', 'table', 'section', 'tabGroup'].includes(it.itemType))
    .map((it) => ({
      id: String(it._id),
      title: it.refName || (it.itemType === 'table' ? '数据列表' : it.itemType === 'section' ? '区块' : '组件'),
    }));

  const scrollToBlock = (id) => {
    const el = scrollRef.current?.querySelector(`[data-block-id="${id}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 监听滚动高亮当前块：id 已统一为字符串，直接遍历取视口顶部最近的块
  useEffect(() => {
    if (isEmpty) return;
    const computeActive = () => {
      const line = 120; // 视口顶部下方判定线
      let current = null;
      let best = -Infinity;
      const blockEls = document.querySelectorAll('[data-block-id]');
      blockEls.forEach((el) => {
        const top = el.getBoundingClientRect().top;
        if (top <= line && top > best) {
          best = top;
          current = el.getAttribute('data-block-id');
        }
      });
      if (current !== null) setActiveBlock(current);
    };
    computeActive();
    document.addEventListener('scroll', computeActive, { capture: true, passive: true });
    window.addEventListener('scroll', computeActive, { passive: true });
    return () => {
      document.removeEventListener('scroll', computeActive, { capture: true });
      window.removeEventListener('scroll', computeActive);
    };
  }, [store.items, isEmpty]);

  return (
    <div style={{ height: '100%', display: 'flex', position: 'relative' }}>
      <div style={{ flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div ref={scrollRef} style={S.wrap}>
          <PageButtons />
          <div style={S.card}>
            {isEmpty ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontSize: 14 }}>返回设计器添加组件</div>
            ) : (
              <ItemList items={store.items} />
            )}
          </div>
        </div>
      </div>

      {/* 右侧悬浮快捷导航（可收缩/展开） */}
      {!isEmpty && blocks.length > 0 && (
        <div style={{
          position: 'absolute', top: 16, right: 16,
          width: navOpen ? 150 : 40,
          background: '#fbfcfe', border: '1px solid #e8ecf1', borderRadius: 10,
          boxShadow: '0 4px 16px rgba(15,23,42,.12)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          zIndex: 10, transition: 'width .2s',
        }}>
          {/* 头部 + 收缩/展开按钮 */}
          <div style={{
            padding: '8px 10px', fontSize: 12, fontWeight: 600, color: '#475569',
            background: '#f6f9fc', borderBottom: '1px solid #e8ecf1',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {navOpen && <span style={{ flex: 1, whiteSpace: 'nowrap', textAlign: 'center' }}>快速导航</span>}
            <button
              onClick={() => setNavOpen(!navOpen)}
              title={navOpen ? '收缩' : '展开'}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#5d9cec', padding: 0, display: 'flex', alignItems: 'center',
                fontFamily: 'inherit', marginLeft: navOpen ? 0 : 'auto', flexShrink: 0,
              }}>
              <Icon name={navOpen ? 'chevronRight' : 'chevronLeft'} size={16} />
            </button>
          </div>
          {navOpen && (() => {
            const MAX_VISIBLE = 15; // 默认展示的导航项数
            const visibleBlocks = navExpanded ? blocks : blocks.slice(0, MAX_VISIBLE);
            const hasMore = blocks.length > MAX_VISIBLE;
            return (
              <div style={{
                overflow: 'visible',
                padding: 8,
              }}>
                {visibleBlocks.map((b) => {
                  const isActive = activeBlock === b.id;
                  return (
                    <button key={b.id}
                      onClick={() => scrollToBlock(b.id)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',
                        padding: '7px 10px', marginBottom: 4,
                        background: isActive ? 'linear-gradient(135deg, #5d9cec 0%, #4a8ad4 100%)' : '#f1f5f9',
                        border: isActive ? '1px solid #5d9cec' : '1px solid #e8ecf1',
                        borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit',
                        textAlign: 'center', color: isActive ? '#fff' : '#334155', fontSize: 12,
                        fontWeight: isActive ? 600 : 400,
                        transition: 'all .15s',
                        boxShadow: isActive ? '0 2px 6px rgba(93,156,236,.32)' : 'none',
                      }}>
                      <span style={{
                        flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{b.title}</span>
                    </button>
                  );
                })}
                {hasMore && !navExpanded && (
                  <button
                    onClick={() => setNavExpanded(true)}
                    title="展开全部导航"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',
                      padding: '6px 10px', background: '#fff', border: '1px dashed #b3d4f7',
                      borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit',
                      color: '#5d9cec', fontSize: 16, lineHeight: 1,
                    }}>
                    +
                  </button>
                )}
                {navExpanded && (
                  <button
                    onClick={() => setNavExpanded(false)}
                    title="收起导航"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',
                      padding: '6px 10px', marginTop: 4, background: '#fff',
                      border: '1px dashed #b3d4f7', borderRadius: 7, cursor: 'pointer',
                      fontFamily: 'inherit', color: '#5d9cec', fontSize: 11,
                    }}>
                    收起
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
