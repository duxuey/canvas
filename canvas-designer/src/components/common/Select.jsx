import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';

/**
 * 自定义下拉选择器 —— 美化弹出选项面板（原生 <select> 的弹层无法用 CSS 美化）。
 * 触发器外观与 .hb-select 一致，弹层通过 Portal + fixed 定位渲染。
 *
 * options: [{ value, label, icon? }]
 * 受控：  <Select value={v} onChange={setV} options={...} />
 * 非受控：<Select onChange={setV} options={...} />
 */
export default function Select({
  value,
  onChange,
  options = [],
  placeholder = '请选择',
  iconKey = 'icon',
  labelKey = 'label',
  valueKey = 'value',
  popMinWidth = 200,
  searchable = false,
  searchPlaceholder = '搜索…',
}) {
  const [inner, setInner] = useState(value);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState(null);
  const [pos, setPos] = useState(null);
  const [search, setSearch] = useState('');
  const wrapRef = useRef(null);
  const popRef = useRef(null);
  const searchRef = useRef(null);

  const cur = value !== undefined ? value : inner;
  const selected = options.find((o) => o[valueKey] === cur);

  const q = search.trim().toLowerCase();
  const filteredOptions = searchable && q
    ? options.filter((o) => {
        const label = String(o[labelKey] ?? '').toLowerCase();
        const val = String(o[valueKey] ?? '').toLowerCase();
        return label.includes(q) || val.includes(q);
      })
    : options;

  const emit = (v) => {
    if (onChange) onChange(v);
    else setInner(v);
  };

  const openPanel = () => {
    const rect = wrapRef.current.getBoundingClientRect();
    setAnchor(rect);
    setPos(null);
    setSearch('');
    setOpen(true);
  };

  const close = () => setOpen(false);

  // 计算弹层位置（优先下方，越界则翻转到上方 / 收进视口）
  useLayoutEffect(() => {
    if (!open || !anchor) return;
    const el = popRef.current;
    if (!el) return;
    const pw = Math.max(anchor.width, popMinWidth);
    const ph = el.offsetHeight;
    const gap = 6;
    const M = 8;

    let top = anchor.bottom + gap;
    if (top + ph > window.innerHeight - M) {
      top = anchor.top - ph - gap;
    }
    if (top < M) top = M;

    let left = anchor.left;
    left = Math.min(left, window.innerWidth - pw - M);
    left = Math.max(M, left);

    setPos({ top, left, width: pw });
  }, [open, anchor]);

  // 点击外部 / ESC 关闭
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current?.contains(e.target)) return;
      if (popRef.current?.contains(e.target)) return;
      close();
    };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // 打开后自动聚焦搜索框
  useEffect(() => {
    if (open && searchable) {
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open, searchable]);

  const selectOption = (o) => {
    emit(o[valueKey]);
    close();
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={openPanel}
        className="hb-select"
        style={{ display: 'flex', alignItems: 'center', textAlign: 'left', width: '100%' }}
      >
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected[labelKey] : (
            <span style={{ color: '#94a3b8' }}>{placeholder}</span>
          )}
        </span>
      </button>

      {open && createPortal(
        <div
          ref={popRef}
          className="hb-select-pop"
          style={{
            position: 'fixed',
            top: pos?.top ?? (anchor ? anchor.bottom + 6 : 0),
            left: pos?.left ?? (anchor ? anchor.left : 0),
            width: pos?.width ?? (anchor ? anchor.width : 'auto'),
            visibility: pos ? 'visible' : 'hidden',
          }}
        >
          {searchable && (
            <div className="hb-select-search">
              <Icon name="search" size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
          )}
          {filteredOptions.length === 0 && (
            <div style={{ padding: '14px', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
              {q ? '无匹配结果' : '暂无选项'}
            </div>
          )}
          {filteredOptions.map((o) => {
            const isSel = o[valueKey] === cur;
            const cls = 'hb-select-opt' + (isSel ? ' selected' : '');
            return (
              <div key={o[valueKey]} className={cls} onClick={() => selectOption(o)}>
                {o[iconKey] && (
                  <span className="hb-select-opt-glyph"><Icon name={o[iconKey]} size={14} /></span>
                )}
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {o[labelKey]}
                </span>
                {isSel && <Icon name="check" size={14} style={{ color: '#5d9cec', flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
}
