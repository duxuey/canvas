import { useState } from 'react';
import Icon from '../common/Icon';

/**
 * Inline-editable block title. Double-click the text or click the pencil
 * button to edit; Enter/blur to save, Esc to cancel.
 */
export default function EditableTitle({ value, onChange, style, editButton = true, light = false, grow = true }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const [hover, setHover] = useState(false);

  const commit = () => {
    const v = draft.trim();
    if (v && v !== value) onChange(v);
    else setDraft(value || '');
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); commit(); }
          if (e.key === 'Escape') { setDraft(value || ''); setEditing(false); }
        }}
        onClick={(e) => e.stopPropagation()}
        className="hb-input"
        style={{ flex: grow ? 1 : 'none', minWidth: grow ? 0 : 72, padding: '3px 8px', fontSize: 13, fontWeight: 600, ...style }}
      />
    );
  }

  return (
    <span
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onDoubleClick={(e) => { e.stopPropagation(); setDraft(value || ''); setEditing(true); }}
      title="双击编辑名称"
      style={{ flex: grow ? 1 : 'none', minWidth: 0, display: 'inline-flex', alignItems: 'center', gap: 5 }}
    >
      <span style={{
        fontSize: 13, fontWeight: 600, color: light ? '#ffffff' : '#1e293b',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...style,
      }}>
        {value || '未命名'}
      </span>
      {editButton && (
        <span
          onClick={(e) => { e.stopPropagation(); setDraft(value || ''); setEditing(true); }}
          title="编辑名称"
          style={{
            flexShrink: 0, width: 18, height: 18, borderRadius: 5,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: light ? 'rgba(255,255,255,.9)' : '#94a3b8', cursor: 'pointer',
            opacity: hover ? 1 : 0, transition: 'opacity .12s',
          }}
        >
          <Icon name="edit" size={12} />
        </span>
      )}
    </span>
  );
}
