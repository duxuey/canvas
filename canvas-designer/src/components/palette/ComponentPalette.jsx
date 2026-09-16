import { useEffect, useState } from 'react';
import { useComponentStore } from '../../store/componentStore';
import { useCanvasStore } from '../../store/canvasStore';
import Icon from '../common/Icon';

/**
 * 组件列表 —— 按画面名（c_group_name）分组折叠展示。
 * 组件是「产品专属实例」（c_group_code = c_screen_no，c_group_tag = 产品号），
 * 同名画面在不同产品下是多个实例，组内用产品号区分。
 */
export default function ComponentPalette() {
  const compStore = useComponentStore();
  const store = useCanvasStore();
  const [collapsed, setCollapsed] = useState({});

  useEffect(() => {
    // 每次进入设计器都重新加载，确保拿到组件库最新数据（避免拖入旧组件）
    compStore.loadComponents(store.systemCode).catch(() => {});
  }, [store.systemCode]);

  const comps = compStore.components;
  const groups = groupComponentsByName(comps);

  const onDragStart = (e, comp) => {
    // Parse elements from JSON string or array
    let raw = comp.elements || comp.c_elements_json || [];
    let cols = 2;
    let elems = [];
    if (typeof raw === 'string') { try { raw = JSON.parse(raw); } catch { raw = []; } }
    if (raw && !Array.isArray(raw) && raw.elements) {
      cols = raw.columns || 2;
      elems = raw.elements;
    } else if (Array.isArray(raw)) {
      elems = raw;
    }
    e.dataTransfer.setData('application/canvas-component', JSON.stringify({
      code: comp.c_group_code,
      name: comp.c_group_name,
      type: comp.c_group_type,
      tag: comp.c_group_tag,
      elements: elems,
      columns: cols,
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const toggle = (name) => setCollapsed((c) => ({ ...c, [name]: !c[name] }));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          组件列表
          {comps.length > 0 && (
            <span style={{
              fontSize: 10, color: '#fff', background: 'linear-gradient(135deg, #5d9cec, #4a8ad4)',
              borderRadius: 9, padding: '1px 7px', fontWeight: 600,
            }}>{comps.length}</span>
          )}
        </span>
        <span style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setCollapsed(Object.fromEntries(groups.map(([n]) => [n, true])))}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 11, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
            全部折叠
          </button>
          <button onClick={() => setCollapsed({})}
            style={{ background: 'none', border: 'none', color: '#5d9cec', fontSize: 11, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
            全部展开
          </button>
        </span>
      </div>
      {compStore.loading && <p style={{ color: '#94a3b8', fontSize: 12 }}>加载中...</p>}
      {!compStore.loading && comps.length === 0 && (
        <p style={{ color: '#94a3b8', fontSize: 12 }}>
          暂无组件，去<a href="#components" style={{ color: '#5d9cec' }}>组件管理</a>创建
        </p>
      )}
      {groups.map(([name, nameComps]) => (
        <div key={name} style={{ marginBottom: 6 }}>
          <button onClick={() => toggle(name)} style={groupHeaderStyle}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#eef3fb'; e.currentTarget.style.borderColor = '#d8e3f2'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5fb'; e.currentTarget.style.borderColor = '#e7ecf3'; }}>
            <Icon name={collapsed[name] ? 'chevronRight' : 'chevronDown'} size={13} style={{ color: '#94a3b8' }} />
            <span style={{ fontSize: 12, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {name}
            </span>
            <span style={countPill}>{nameComps.length}</span>
          </button>
          {!collapsed[name] && (
            <div style={{ padding: '4px 0 2px' }}>
              {nameComps.map((comp, i) => (
                <div key={comp.c_group_code || i}
                  draggable
                  onDragStart={(e) => onDragStart(e, comp)}
                  title={comp.c_group_desc || ''}
                  style={itemStyle}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#5d9cec'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(93,156,236,.20)'; e.currentTarget.style.transform = 'translateX(2px)'; e.currentTarget.style.background = '#f8fbff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e7ecf3'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(15,23,42,.04)'; e.currentTarget.style.transform = ''; e.currentTarget.style.background = '#ffffff'; }}>
                  <span style={glyphStyle}><Icon name="components" size={15} /></span>
                  <span style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: '#334155' }}>
                      {comp.c_group_tag ? `产品 ${comp.c_group_tag}` : comp.c_group_code}
                    </div>
                    <div style={{
                      fontSize: 10, color: '#94a3b8', overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                    }}>
                      {comp.c_group_code}
                    </div>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function PaletteHeader({ title, count, onRefresh }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {title}
        {count > 0 && (
          <span style={{
            fontSize: 10, color: '#fff', background: 'linear-gradient(135deg, #5d9cec, #4a8ad4)',
            borderRadius: 9, padding: '1px 7px', fontWeight: 600,
          }}>{count}</span>
        )}
      </span>
      {onRefresh && (
        <button onClick={onRefresh} className="hb-icon-btn" style={{ width: 24, height: 24 }} title="刷新">
          <Icon name="refresh" size={13} />
        </button>
      )}
    </div>
  );
}

/** 按 c_group_name 分组，返回 [[name, comps[]]]，按组件数量降序 */
function groupComponentsByName(comps) {
  const groups = new Map();
  for (const comp of comps) {
    const name = comp.c_group_name || comp.c_group_code || '未命名';
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(comp);
  }
  const entries = [...groups.entries()];
  entries.sort((a, b) => b[1].length - a[1].length);
  return entries;
}

const groupHeaderStyle = {
  display: 'flex', alignItems: 'center', gap: 7, width: '100%',
  padding: '7px 10px', background: '#f1f5fb', border: '1px solid #e7ecf3',
  borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
  color: '#475569', textAlign: 'left',
  transition: 'background .15s, border-color .15s',
};

const countPill = {
  fontSize: 10, fontWeight: 700, color: '#64748b',
  background: '#e3e9f2', borderRadius: 8, padding: '1px 7px',
  flexShrink: 0, lineHeight: 1.6,
};

const itemStyle = {
  display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px 7px 26px',
  margin: '3px 0', background: '#ffffff', borderRadius: 8, cursor: 'grab',
  color: '#334155', fontSize: 13, userSelect: 'none', border: '1px solid #e7ecf3',
  boxShadow: '0 1px 2px rgba(15,23,42,.04)',
  transition: 'border-color .15s, box-shadow .15s, transform .15s, background .15s',
};

const glyphStyle = {
  width: 26, height: 26, borderRadius: 7, flexShrink: 0,
  background: 'linear-gradient(135deg, #eef4ff, #f3efff)',
  color: '#5d9cec',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: 'inset 0 0 0 1px rgba(93,156,236,.10)',
};
