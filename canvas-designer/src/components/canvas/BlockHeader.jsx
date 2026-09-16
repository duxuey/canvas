import Icon from '../common/Icon';
import EditableTitle from './EditableTitle';

/**
 * 各容器（区块 / 组件 / 表格 / 标签页）的统一标题栏。
 * 统一系统蓝 #5d9cec，无图标，标题左对齐，底部一条蓝色细线贯穿整行。
 */

const BLUE = '#5d9cec';
const BLUE_BG = 'linear-gradient(90deg, #eff5fd 0%, #f6f8fc 100%)';

export default function BlockHeader({
  title, onChange,
  tag, meta, collapsed, onCollapse,
  dragHandle, right, onClick, onDragOver, onDrop,
  onMoveUp, onMoveDown,
}) {
  return (
    <div
      onClick={onClick}
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 14px',
        background: BLUE_BG,
        borderBottom: `2px solid ${BLUE}`,
        userSelect: 'none',
        cursor: onClick ? 'pointer' : (dragHandle ? 'grab' : 'default'),
        ...(onClick ? {} : {}),
      }}
    >
      {dragHandle}

      <EditableTitle
        value={title}
        onChange={onChange}
        style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}
      />

      {tag && <TagPill color={BLUE} label={tag} />}
      {meta && <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>{meta}</span>}

      <div style={{ flex: 1 }} />
      {right}
      {onMoveUp && (
        <button
          onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
          title="上移"
          style={{
            width: 22, height: 22, borderRadius: 5, border: '1px solid #e2e8f0',
            background: '#fff', color: '#64748b', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0, flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#5d9cec'; e.currentTarget.style.borderColor = '#5d9cec'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
        >
          <Icon name="chevronUp" size={14} />
        </button>
      )}
      {onMoveDown && (
        <button
          onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
          title="下移"
          style={{
            width: 22, height: 22, borderRadius: 5, border: '1px solid #e2e8f0',
            background: '#fff', color: '#64748b', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0, flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#5d9cec'; e.currentTarget.style.borderColor = '#5d9cec'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
        >
          <Icon name="chevronDown" size={14} />
        </button>
      )}
      {onCollapse && (
        <Icon name={collapsed ? 'chevronDown' : 'chevronUp'} size={14}
          style={{ color: '#94a3b8', flexShrink: 0 }} />
      )}
    </div>
  );
}

/** 轻量类型标签 —— 彩色圆点 + 文字 */
function TagPill({ color, label }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0,
      padding: '2px 9px', borderRadius: 999, fontSize: 11, fontWeight: 600,
      color, background: `${color}14`, border: `1px solid ${color}26`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
      {label}
    </span>
  );
}
