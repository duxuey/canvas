/**
 * Compute row/cell grid from flat elements array.
 * Form: elements in grid, `columns` per row, colSpan = 12/columns.
 * Table: bands of 3 per row.
 */
export function computeLayout(elements, canvasType, columns) {
  if (canvasType === 'table') {
    const bands = [];
    for (let i = 0; i < elements.length; i += 3) {
      bands.push(elements.slice(i, i + 3));
    }
    return { type: 'table', bands };
  }

  // Form layout
  const cols = columns || 2;
  const colSpan = Math.floor(12 / cols);
  const visible = elements.filter((e) => e.visible_flag !== '0');
  const rows = [];
  let rowIdx = 0;
  let count = 0;

  for (const el of elements) {
    const r = rowIdx;
    if (!rows[r]) rows[r] = [];
    rows[r].push({ ...el, column_width: colSpan });
    if (el.visible_flag !== '0') count++;
    if (count >= cols) { count = 0; rowIdx++; }
  }

  return { type: 'form', rows, colSpan, cols };
}

export function findNextPosition(elements, canvasType, columns) {
  if (canvasType === 'table') {
    const bandSize = elements.length;
    const band = Math.floor(bandSize / 3);
    const pos = bandSize % 3;
    return { rowIdx: band, colIdx: pos };
  }
  const cols = columns || 2;
  const visible = elements.filter((e) => e.visible_flag !== '0');
  const rowIdx = Math.floor(visible.length / cols);
  const colIdx = visible.length % cols;
  return { rowIdx, colIdx };
}
