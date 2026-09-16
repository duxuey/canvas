/** Shared form fields, button styles, and layout components used across management pages. */
import { colors, radius, shadow, space } from '../../styles/theme';
import Icon from './Icon';
import Select from './Select';

// ================================================================
// Button className shortcuts (global .hb-btn defined in global.css)
// ================================================================
export const btnPrimary = 'hb-btn primary lg';
export const btnDefault = 'hb-btn sm';
export const btnDanger = 'hb-btn danger sm';

// ================================================================
// Layout styles
// ================================================================
export const pageStyle = {
  padding: space.xl, height: '100%', overflow: 'auto',
  background: colors.bgPage,
};

export const cardStyle = { maxWidth: 1000, margin: '0 auto' };

export const hStyle = { fontSize: 20, fontWeight: 700, color: colors.text, margin: 0 };

export const inputStyle = {
  padding: '7px 11px', border: `1px solid ${colors.border}`, borderRadius: radius.sm,
  fontSize: 13, color: colors.textBody, background: colors.white, width: '100%', marginBottom: 8,
  outline: 'none',
};

export const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998,
};

export const modal = {
  background: colors.white, borderRadius: radius.lg, padding: 24, width: 640, maxHeight: '80vh',
  overflow: 'auto', boxShadow: shadow.modal, border: `1px solid ${colors.border}`,
};

export const th = {
  padding: '10px 14px', textAlign: 'left', background: colors.bgSection, color: colors.textSecondary,
  fontSize: 12, fontWeight: 600, borderBottom: `1px solid ${colors.border}`,
};

export const td = {
  padding: '9px 14px', fontSize: 13, color: colors.textBody,
};

// ================================================================
// Field components
// ================================================================

export function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div style={{ marginBottom: 6 }}>
      {label && <label style={{ color: colors.textSecondary, fontSize: 11, display: 'block', marginBottom: 3 }}>{label}</label>}
      <input type={type} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} style={inputStyle} />
    </div>
  );
}

export function SelectField({ label, value, options, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 6 }}>
      {label && <label style={{ color: colors.textSecondary, fontSize: 11, display: 'block', marginBottom: 3 }}>{label}</label>}
      <Select value={value} options={options} onChange={onChange} placeholder={placeholder} />
    </div>
  );
}

export function BoolField({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, paddingTop: 18 }}>
      <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: colors.primary, width: 16, height: 16 }} />
      <label style={{ color: colors.textSecondary, fontSize: 13 }}>{label}</label>
    </div>
  );
}

/** Section divider label for form groups */
export function SectionLabel({ children, icon }) {
  return (
    <div style={{
      gridColumn: '1 / -1', margin: '8px 0 4px', color: colors.primary,
      fontSize: 13, fontWeight: 600, borderBottom: `1px solid ${colors.border}`, paddingBottom: 4,
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      {icon && <Icon name={icon} size={15} />}
      {children}
    </div>
  );
}

// ================================================================
// Layout components (分块 / 图标 / 层级 / 底色)
// ================================================================

/** Page header block — icon tile + title + desc + actions */
export function PageHeader({ icon, title, desc, actions }) {
  return (
    <div className="hb-page-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, minWidth: 0 }}>
        {icon && (
          <div className="hb-icon-tile">
            <Icon name={icon} size={22} strokeWidth={1.9} />
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <h2>{title}</h2>
          {desc && <p>{desc}</p>}
        </div>
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}

/** Card block — white surface with optional title bar */
export function Card({ title, icon, actions, children, style, bodyStyle, hoverable }) {
  const cls = `hb-card${hoverable ? ' hoverable' : ''}`;
  return (
    <div className={cls} style={style}>
      {(title || actions) && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '13px 16px', borderBottom: `1px solid ${colors.borderLight}`,
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: colors.text, display: 'flex', alignItems: 'center', gap: 7 }}>
            {icon && (
              <span style={{
                width: 24, height: 24, borderRadius: 6, background: colors.bgAccent,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: colors.primary,
              }}>
                <Icon name={icon} size={14} />
              </span>
            )}
            {title}
          </span>
          {actions && <div style={{ display: 'flex', gap: 6 }}>{actions}</div>}
        </div>
      )}
      <div style={{ padding: 16, ...bodyStyle }}>{children}</div>
    </div>
  );
}

/** Section block — subtle background group inside a card */
export function Section({ title, icon, children, style }) {
  return (
    <div className="hb-section" style={{ padding: 14, marginBottom: 12, ...style }}>
      {title && (
        <div style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          {icon && <Icon name={icon} size={14} />}
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

/** System filter + refresh + count toolbar */
export function Toolbar({ systemCode, onSystemChange, onRefresh, count, systems, children }) {
  const sysList = systems || [];
  const sysOptions = [
    ...sysList.map((s) => ({ value: s.code, label: s.name })),
    ...(!sysList.some((s) => s.code === systemCode)
      ? [{ value: systemCode, label: systemCode }]
      : []),
    { value: '__manage__', label: '+ 管理系统...' },
  ];
  return (
    <div className="hb-card" style={{ padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <label style={{ color: colors.textSecondary, fontSize: 13, whiteSpace: 'nowrap' }}>系统:</label>
      <div style={{ width: 160 }}>
        <Select
          value={systemCode}
          options={sysOptions}
          onChange={(v) => { onSystemChange && onSystemChange({ target: { value: v } }); }}
        />
      </div>
      {onRefresh && <button onClick={onRefresh} className={btnDefault}><Icon name="refresh" size={12} /> 刷新</button>}
      {children}
      {count !== undefined && (
        <span style={{ marginLeft: 'auto', color: colors.textMuted, fontSize: 12 }}>
          {count} 项
        </span>
      )}
    </div>
  );
}

/** Empty state block — flat glyph + title + hint + optional action */
export function EmptyState({ icon = 'list', title, hint, action }) {
  return (
    <div className="hb-empty">
      <div className="glyph"><Icon name={icon} size={28} strokeWidth={1.6} /></div>
      <p style={{ color: colors.textSecondary, fontSize: 15, margin: 0 }}>{title}</p>
      {hint && <p style={{ color: colors.textMuted, fontSize: 13, margin: '6px 0 0' }}>{hint}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

/** Type/status tag */
export function Tag({ children, tone = 'blue' }) {
  const cls = `hb-tag${tone && tone !== 'blue' ? ` tone-${tone}` : ''}`;
  return <span className={cls}>{children}</span>;
}

/** Stat badge — label + value chip */
export function StatBadge({ label, value, icon }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: colors.bgSection, borderRadius: radius.sm, padding: '5px 10px',
      border: `1px solid ${colors.borderLight}`,
    }}>
      {icon && <Icon name={icon} size={13} style={{ color: colors.textMuted }} />}
      <span style={{ fontSize: 10.5, color: colors.textMuted, whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ fontSize: 12, color: colors.text, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

// ================================================================
// 渐变 Hero 横幅（页面头部 + KPI 统计卡片）
// ================================================================

/**
 * 渐变 Hero —— 顶部横幅，承载标题/描述/操作按钮，并可内嵌一行 KPI 统计卡片。
 * 用法：
 *   <Hero icon="elements" title="元件管理" desc="..." actions={<button className={heroAction}>...</button>}
 *     stats={[{ icon:'elements', label:'元件总数', value: 12 }, ...]} />
 */
export function Hero({ icon, title, desc, actions, stats = [], tone = 'blue' }) {
  const statCols = stats.length > 0 ? `repeat(${Math.min(stats.length, 4)}, 1fr)` : 'auto';
  const bg = tone === 'violet'
    ? 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 55%, #c026d3 100%)'
    : 'linear-gradient(135deg, #5d9cec 0%, #7c6cf0 55%, #8b5cf6 100%)';
  const glow = tone === 'violet' ? 'rgba(139, 92, 246, .3)' : 'rgba(93, 156, 236, .28)';
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: bg,
      borderRadius: 16, padding: '22px 24px', marginBottom: 20,
      color: '#fff', boxShadow: `0 12px 32px ${glow}`,
    }}>
      {/* decorative blobs */}
      <div style={{ position: 'absolute', top: -60, right: -40, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,.08)' }} />
      <div style={{ position: 'absolute', bottom: -80, right: 120, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
      <div style={{ position: 'absolute', bottom: -50, left: '38%', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }} />

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.25)',
        }}>
          <Icon name={icon} size={26} strokeWidth={1.9} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0, lineHeight: 1.25 }}>{title}</h2>
          {desc && <p style={{ color: 'rgba(255,255,255,.84)', fontSize: 13, margin: '5px 0 0' }}>{desc}</p>}
        </div>
        {actions && <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>{actions}</div>}
      </div>

      {stats.length > 0 && (
        <div style={{
          position: 'relative', display: 'grid', gridTemplateColumns: statCols,
          gap: 10, marginTop: 18,
        }}>
          {stats.map((s) => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.22)',
              borderRadius: 12, padding: '12px 14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Icon name={s.icon} size={15} style={{ color: 'rgba(255,255,255,.9)' }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,.82)', whiteSpace: 'nowrap' }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, marginTop: 6, lineHeight: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Hero 上的操作按钮 className（白色按钮） */
export const heroAction = 'hb-btn light lg';

// ================================================================
// 分页
// ================================================================

/** 生成带省略号的页码序列，如 [1, '...', 4, 5, 6, '...', 20] */
function pageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push('...');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push('...');
  pages.push(total);
  return pages;
}

/**
 * 分页控件 —— 置于表格卡片底部。
 * props: page, pageSize, total, onPageChange, onPageSizeChange
 */
export function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const cur = Math.min(Math.max(1, page), totalPages);

  const navBtn = (disabled) => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    minWidth: 28, height: 28, padding: '0 7px', borderRadius: 7,
    border: '1px solid #e2e8f0', background: '#fff', color: '#64748b',
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
    fontSize: 12, transition: 'all .15s', fontFamily: 'inherit',
  });

  const pageBtn = (active) => ({
    minWidth: 28, height: 28, padding: '0 6px', borderRadius: 7,
    border: '1px solid ' + (active ? 'transparent' : '#e2e8f0'),
    background: active ? 'linear-gradient(135deg, #5d9cec, #4a8ad4)' : '#fff',
    color: active ? '#fff' : '#64748b', cursor: active ? 'default' : 'pointer',
    fontSize: 12, fontWeight: active ? 600 : 400, transition: 'all .15s',
    fontFamily: 'inherit', boxShadow: active ? '0 2px 5px rgba(93,156,236,.35)' : 'none',
  });

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 10, padding: '12px 16px', borderTop: '1px solid #eef2f7',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748b' }}>
        <span>共 <b style={{ color: '#334155' }}>{total}</b> 条</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange && onPageSizeChange(Number(e.target.value))}
          className="hb-select"
          style={{ width: 82, padding: '4px 26px 4px 8px', fontSize: 12 }}>
          {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n} 条/页</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button style={navBtn(cur <= 1)} disabled={cur <= 1}
          onClick={() => onPageChange && onPageChange(cur - 1)} title="上一页">
          <Icon name="chevronLeft" size={14} />
        </button>
        {pageList(cur, totalPages).map((p, i) => (
          p === '...' ? (
            <span key={`e${i}`} style={{ minWidth: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>…</span>
          ) : (
            <button key={p} style={pageBtn(p === cur)}
              onClick={() => p !== cur && onPageChange && onPageChange(p)}>{p}</button>
          )
        ))}
        <button style={navBtn(cur >= totalPages)} disabled={cur >= totalPages}
          onClick={() => onPageChange && onPageChange(cur + 1)} title="下一页">
          <Icon name="chevronRight" size={14} />
        </button>
      </div>
    </div>
  );
}
