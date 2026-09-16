import { useCanvasStore } from '../../store/canvasStore';
import Icon from '../common/Icon';

/** 已保存 / 已命名（非默认名）的画布标签 */
function isNamed(c) {
  return !!(c.canvasCode || (c.canvasName && c.canvasName !== 'Untitled Canvas'));
}

export default function TabBar() {
  const tabs = useCanvasStore((s) => s.tabs);
  const activeTabId = useCanvasStore((s) => s.activeTabId);
  const liveName = useCanvasStore((s) => s.canvasName);
  const liveCode = useCanvasStore((s) => s.canvasCode);
  const newTab = useCanvasStore((s) => s.newTab);
  const switchTab = useCanvasStore((s) => s.switchTab);
  const closeTab = useCanvasStore((s) => s.closeTab);

  return (
    <div style={barStyle}>
      <div style={tabsWrap}>
        {tabs.map((t) => {
          const active = t.id === activeTabId;
          // 活动标签的名称/编码以 store 实时状态为准：快照仅在新建/切换标签时回写，
          // 加载画布后不会即时同步，直接读快照会导致页签名不刷新。
          const c = active
            ? { ...t.snapshot, canvasName: liveName, canvasCode: liveCode }
            : t.snapshot;
          const named = isNamed(c);
          return (
            <div key={t.id}
              onClick={() => switchTab(t.id)}
              title={c.canvasName || '未命名画布'}
              style={{
                ...tabStyle, ...(active ? tabActive : {}),
              }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Icon name={named ? 'canvases' : 'designer'} size={12}
                  style={{ color: active ? '#5d9cec' : '#94a3b8' }} />
                <span style={{
                  maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {c.canvasName || '未命名画布'}
                </span>
                {named && <span style={savedDot} />}
              </span>
              <span
                onClick={(e) => { e.stopPropagation(); closeTab(t.id); }}
                title="关闭"
                className="hb-tab-close"
                style={closeBtn}>
                <Icon name="close" size={11} strokeWidth={2.6} />
              </span>
            </div>
          );
        })}
      </div>

      <button onClick={newTab} title="新建标签" className="hb-tab-add" style={addBtn}>
        <Icon name="plus" size={13} strokeWidth={2.4} />
      </button>
    </div>
  );
}

/* ── Styles ── */
const barStyle = {
  display: 'flex', alignItems: 'center',
  background: '#f3f6fa', borderBottom: '1px solid #e6eaf1',
  padding: '0 10px', flexShrink: 0, minHeight: 40,
};

const tabsWrap = {
  display: 'flex', alignItems: 'center', gap: 3,
  flex: 1, overflow: 'auto', scrollbarWidth: 'none',
  whiteSpace: 'nowrap', alignSelf: 'stretch',
};

const tabStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '7px 8px 7px 12px', borderRadius: '7px 7px 0 0',
  fontSize: 12, color: '#64748b', cursor: 'pointer',
  background: 'transparent', border: '1px solid transparent',
  borderBottom: 'none', userSelect: 'none', whiteSpace: 'nowrap',
  transition: 'background .15s, color .15s',
};

const tabActive = {
  background: '#ffffff', color: '#334155',
  borderColor: '#e8ecf1', fontWeight: 600,
  boxShadow: '0 -1px 0 #e8ecf1',
};

const savedDot = {
  width: 6, height: 6, borderRadius: '50%',
  background: '#16a34a', flexShrink: 0,
};

const closeBtn = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 18, height: 18, borderRadius: 5, color: '#cbd5e1',
  transition: 'background .15s, color .15s', flexShrink: 0,
};

const addBtn = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 26, height: 26, marginLeft: 6, borderRadius: 6,
  border: 'none', background: 'transparent', color: '#64748b',
  cursor: 'pointer', flexShrink: 0, transition: 'background .15s, color .15s',
};
