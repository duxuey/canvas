import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';

/**
 * 现代日期时间选择器 —— 与全局蓝白设计系统一致的弹层，
 * 替代浏览器原生 date/datetime-local 的灰色弹层。
 *
 * 受控：  <DateTimePicker value={v} onChange={setV} />
 * 非受控：<DateTimePicker />（内部自管理状态，用于预览展示）
 * 只读：  <DateTimePicker value={v} readOnly />（设计器画布展示态，不弹层）
 *
 * 弹层通过 Portal 挂载到 document.body，并用 fixed 定位，
 * 避免被外层 overflow:auto/hidden 容器裁切。
 *
 * value 格式：'YYYY-MM-DDTHH:mm'（空字符串表示未选择）
 */

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const pad = (n) => String(n).padStart(2, '0');

function parseValue(v) {
  if (!v) return null;
  const d = new Date(String(v).replace(' ', 'T'));
  return isNaN(d.getTime()) ? null : d;
}
function toValue(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function toDisplay(v) {
  const d = parseValue(v);
  return d
    ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
    : '';
}

export default function DateTimePicker({ value, onChange, placeholder = '选择日期时间', readOnly = false, compact = false }) {
  const [inner, setInner] = useState(value ?? '');
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => {
    const d = parseValue(value ?? '') || new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [anchor, setAnchor] = useState(null); // 输入框的 getBoundingClientRect 快照
  const [pos, setPos] = useState(null);       // 弹层最终 fixed 坐标
  const wrapRef = useRef(null);
  const popRef = useRef(null);

  const cur = value !== undefined ? value : inner;
  const sel = parseValue(cur);

  const emit = (d) => {
    const v = toValue(d);
    if (onChange) onChange(v);
    else setInner(v);
  };

  const openPanel = () => {
    if (readOnly) return;
    const d = sel || new Date();
    setView({ y: d.getFullYear(), m: d.getMonth() });
    setAnchor(wrapRef.current.getBoundingClientRect());
    setPos(null);
    setOpen(true);
  };

  // 计算弹层位置（优先下方，越界则翻转到上方 / 收进视口）
  useLayoutEffect(() => {
    if (!open || !anchor) return;
    const el = popRef.current;
    if (!el) return;
    const pw = el.offsetWidth;
    const ph = el.offsetHeight;
    const gap = 6;
    const M = 8;

    let top = anchor.bottom + gap;
    if (top + ph > window.innerHeight - M) {
      top = anchor.top - ph - gap; // 翻转到上方
    }
    if (top < M) top = M;

    let left = anchor.left;
    left = Math.min(left, window.innerWidth - pw - M);
    left = Math.max(M, left);

    setPos({ top, left });
  }, [open, anchor]);

  // 点击外部关闭（Portal 弹层需同时排除输入框与弹层本体）
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current?.contains(e.target)) return;
      if (popRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const nav = (delta) => {
    const d = new Date(view.y, view.m + delta, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  };

  const selectDay = (day) => {
    const base = sel || new Date();
    emit(new Date(view.y, view.m, day, base.getHours(), base.getMinutes()));
  };

  const bump = (unit, delta) => {
    const base = sel || new Date();
    if (unit === 'h') emit(new Date(base.getFullYear(), base.getMonth(), base.getDate(), base.getHours() + delta, base.getMinutes()));
    else emit(new Date(base.getFullYear(), base.getMonth(), base.getDate(), base.getHours(), base.getMinutes() + delta));
  };

  const setNow = () => emit(new Date());
  const clear = () => { if (onChange) onChange(''); else setInner(''); };

  const today = new Date();
  const first = new Date(view.y, view.m, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selInView = sel && sel.getFullYear() === view.y && sel.getMonth() === view.m;
  const selDay = sel ? sel.getDate() : -1;
  const selH = sel ? sel.getHours() : 12;
  const selM = sel ? sel.getMinutes() : 0;

  const popover = (
    <div
      ref={popRef}
      className="hb-dtp-popover"
      style={{
        position: 'fixed',
        top: (pos?.top ?? (anchor ? anchor.bottom + 6 : 0)),
        left: (pos?.left ?? (anchor ? anchor.left : 0)),
        visibility: pos ? 'visible' : 'hidden',
      }}
    >
      <div style={{ display: 'flex' }}>
        {/* ── 日历 ── */}
        <div style={{ padding: 14, paddingRight: 10 }}>
          <div style={headRow}>
            <button type="button" className="hb-dtp-nav" onClick={() => nav(-12)} title="上一年">
              <Icon name="back" size={12} />
            </button>
            <button type="button" className="hb-dtp-nav" onClick={() => nav(-1)} title="上个月">
              <Icon name="chevronLeft" size={15} />
            </button>
            <div style={headLabel}>{view.y} 年 {view.m + 1} 月</div>
            <button type="button" className="hb-dtp-nav" onClick={() => nav(1)} title="下个月">
              <Icon name="chevronRight" size={15} />
            </button>
            <button type="button" className="hb-dtp-nav" onClick={() => nav(12)} title="下一年">
              <Icon name="back" size={12} style={{ transform: 'rotate(180deg)' }} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 28px)', gap: 2, marginBottom: 4 }}>
            {WEEKDAYS.map((w) => <span key={w} style={weekCell}>{w}</span>)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 28px)', gap: 2 }}>
            {cells.map((d, i) => {
              if (d === null) return <span key={`e${i}`} />;
              const isSel = selInView && selDay === d;
              const isToday = today.getFullYear() === view.y && today.getMonth() === view.m && today.getDate() === d;
              const cls = 'hb-dtp-day' + (isSel ? ' selected' : '') + (isToday ? ' today' : '');
              return (
                <button type="button" key={d} className={cls} onClick={() => selectDay(d)}>
                  {d}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 时间 ── */}
        <div style={{ borderLeft: '1px solid #eef2f7', padding: '14px 10px', width: 122 }}>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 10, textAlign: 'center', letterSpacing: 1 }}>
            时间
          </div>
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', alignItems: 'center' }}>
            <Spinner value={selH} onUp={() => bump('h', 1)} onDown={() => bump('h', -1)} />
            <span style={{ fontSize: 20, color: '#cbd5e1', fontWeight: 300, margin: '0 1px' }}>:</span>
            <Spinner value={selM} onUp={() => bump('m', 1)} onDown={() => bump('m', -1)} />
          </div>
        </div>
      </div>

      {/* ── 底部操作 ── */}
      <div style={footRow}>
        <button type="button" className="hb-dtp-foot-btn" onClick={setNow}><Icon name="clock" size={12} /> 现在</button>
        <button type="button" className="hb-dtp-foot-btn" onClick={clear}>清除</button>
        <div style={{ flex: 1 }} />
        <button type="button" className="hb-dtp-confirm" onClick={() => setOpen(false)}>确定</button>
      </div>
    </div>
  );

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <input
          readOnly
          value={toDisplay(cur) || (readOnly ? placeholder : '')}
          placeholder={placeholder}
          onClick={openPanel}
          className="hb-date-input"
          style={{
            paddingRight: 34,
            height: compact ? 32 : 36,
            fontSize: compact ? 12 : 13,
            cursor: readOnly ? 'default' : 'pointer',
          }}
        />
        <span
          onClick={readOnly ? undefined : openPanel}
          style={{
            position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
            display: 'inline-flex', ...(readOnly ? { pointerEvents: 'none' } : { cursor: 'pointer' }),
          }}
        >
          <span style={glyph}><Icon name="datePicker" size={13} /></span>
        </span>
      </div>

      {open && !readOnly && createPortal(popover, document.body)}
    </div>
  );
}

/** 时 / 分 上下调节器 */
function Spinner({ value, onUp, onDown }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <button type="button" className="hb-dtp-spin" onClick={onUp}><Icon name="chevronUp" size={13} /></button>
      <div style={spinVal}>{pad(value)}</div>
      <button type="button" className="hb-dtp-spin" onClick={onDown}><Icon name="chevronDown" size={13} /></button>
    </div>
  );
}

/* ── 仅内联样式（无 hover 需求） ── */
const glyph = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
  background: 'linear-gradient(135deg, #eff5fd, #f5f3ff)', color: '#5d9cec',
};

const headRow = { display: 'flex', alignItems: 'center', gap: 2, marginBottom: 8 };

const headLabel = { flex: 1, textAlign: 'center', fontWeight: 600, fontSize: 13, color: '#1e293b' };

const weekCell = {
  width: 28, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 11, color: '#94a3b8', fontWeight: 500,
};

const spinVal = {
  fontSize: 20, fontWeight: 700, color: '#1e293b', lineHeight: '40px',
  fontVariantNumeric: 'tabular-nums',
};

const footRow = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '10px 14px', borderTop: '1px solid #eef2f7', background: '#fafbfc',
  borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
};
