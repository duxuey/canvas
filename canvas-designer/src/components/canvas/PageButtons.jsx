import { useCanvasStore } from '../../store/canvasStore';

/**
 * 页面级按钮条 —— 渲染画布顶部的页面级操作按钮（暂存/计算/提核等）。
 * 按钮数据存于 canvasStore.buttons，可增删改。
 * 参考产品工厂：按钮居中，胶囊样式，主按钮渐变。
 */
export default function PageButtons() {
  const store = useCanvasStore();
  const buttons = store.buttons || [];
  if (buttons.length === 0) return null;

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      padding: '6px 12px', marginBottom: 8,
      background: '#fff',
      boxShadow: '0 1px 4px rgba(15,23,42,.06)',
      borderRadius: 8,
      flexWrap: 'wrap',
    }}>
      {buttons.map((b, i) => (
        <button
          key={b._id || i}
          tabIndex={-1}
          style={{
            padding: '5px 20px',
            background: i === buttons.length - 1
              ? 'linear-gradient(135deg, #5d9cec 0%, #4a8ad4 100%)'
              : '#fff',
            color: i === buttons.length - 1 ? '#fff' : '#5d9cec',
            border: i === buttons.length - 1 ? 'none' : '1px solid #b3d4f7',
            borderRadius: 999,
            cursor: 'pointer',
            fontSize: 12.5,
            fontWeight: 500,
            fontFamily: 'inherit',
            lineHeight: 1.4,
            whiteSpace: 'nowrap',
            boxShadow: i === buttons.length - 1 ? '0 2px 6px rgba(93,156,236,.28)' : 'none',
          }}
        >
          {b.btn_name || b.name || '按钮'}
        </button>
      ))}
    </div>
  );
}
