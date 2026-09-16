import { useUiStore } from '../../store/uiStore';
import Icon from './Icon';

const TOAST_META = {
  success: { icon: 'checkCircle', color: '#16a34a', bg: '#f0fdf4' },
  error: { icon: 'alert', color: '#ff4d4f', bg: '#fef2f2' },
  info: { icon: 'info', color: '#5d9cec', bg: '#eff5fd' },
};

export default function Toast() {
  const toasts = useUiStore((s) => s.toasts);

  return (
    <div style={{ position: 'fixed', top: 64, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map((t) => {
        const meta = TOAST_META[t.type] || TOAST_META.info;
        return (
          <div key={t.id} style={{
            padding: '10px 14px', borderRadius: 9, fontSize: 13,
            background: '#fff', color: '#1e293b',
            boxShadow: '0 8px 24px rgba(15,23,42,.16)',
            border: '1px solid #e8ecf1', borderLeft: `3px solid ${meta.color}`,
            animation: 'slideIn 0.3s ease', minWidth: 220,
            display: 'flex', alignItems: 'center', gap: 9,
            pointerEvents: 'none',
          }}>
            <span style={{
              width: 22, height: 22, borderRadius: 6, flexShrink: 0,
              background: meta.bg, color: meta.color,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={meta.icon} size={13} strokeWidth={2.2} />
            </span>
            {t.message}
          </div>
        );
      })}
    </div>
  );
}
