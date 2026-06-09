// ===== A1 Range Parsing & Formatting =====

const RANGE_PATTERN = /^\$?([A-Za-z]{1,3})\$?(\d+)(?::\$?([A-Za-z]{1,3})\$?(\d+))?$/;
const CELL_PATTERN = /^\$?([A-Za-z]{1,3})\$?(\d+)$/;

/** Parse a column letter to a 1-based index */
export function columnIndex(label: string): number {
  let total = 0;
  for (const char of label.toUpperCase()) {
    total = total * 26 + (char.charCodeAt(0) - 64);
  }
  return total;
}

/** Convert a 1-based column index to a letter */
export function columnLabel(index: number): string {
  let result = '';
  let n = index;
  while (n > 0) {
    n--;
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
}

export interface RangeBounds {
  minRow: number;
  minCol: number;
  maxRow: number;
  maxCol: number;
}

/** Parse an A1-style range string (e.g. "A1:Z100" or "C7") into bounds */
export function parseRange(value: string): RangeBounds {
  const match = RANGE_PATTERN.exec((value || '').trim());
  if (!match) {
    throw new Error(`Invalid A1 range: ${value}`);
  }

  const startCol = columnIndex(match[1]);
  const startRow = parseInt(match[2], 10);
  const endCol = columnIndex(match[3] || match[1]);
  const endRow = parseInt(match[4] || match[2], 10);

  return {
    minRow: Math.min(startRow, endRow),
    minCol: Math.min(startCol, endCol),
    maxRow: Math.max(startRow, endRow),
    maxCol: Math.max(startCol, endCol),
  };
}

/** Parse a single cell reference (e.g. "A1") into row and column */
export function parseCell(value: string): { row: number; col: number } | null {
  const match = CELL_PATTERN.exec((value || '').trim());
  if (!match) return null;
  return {
    col: columnIndex(match[1]),
    row: parseInt(match[2], 10),
  };
}

/** Format bounds into an A1-style range string */
export function formatRange(bounds: RangeBounds): string {
  return `${columnLabel(bounds.minCol)}${bounds.minRow}:${columnLabel(bounds.maxCol)}${bounds.maxRow}`;
}

/** Format a single cell ref */
export function formatCell(row: number, col: number): string {
  return `${columnLabel(col)}${row}`;
}

/** Check if a range string looks valid */
export function isValidRange(value: string): boolean {
  return RANGE_PATTERN.test((value || '').trim());
}

/** Check if point (row,col) is within bounds */
export function isWithinBounds(row: number, col: number, bounds: RangeBounds): boolean {
  return (
    row >= bounds.minRow &&
    row <= bounds.maxRow &&
    col >= bounds.minCol &&
    col <= bounds.maxCol
  );
}
