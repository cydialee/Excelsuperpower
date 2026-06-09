import type { SheetInfo, CellData } from '@/api/client';

interface SheetPreviewProps {
  sheet: SheetInfo;
  maxRows?: number;
  maxCols?: number;
}

export default function SheetPreview({ sheet, maxRows = 8, maxCols = 12 }: SheetPreviewProps) {
  const grid = sheet.grid;
  if (!grid || !grid.cells.length) {
    // Fallback: use sheet.preview (2D string array)
    const preview = sheet.preview || [];
    return (
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-xs border-collapse">
          <tbody>
            {preview.slice(0, maxRows).map((row, ri) => (
              <tr key={ri} className={ri === 0 ? 'bg-primary-600 text-white' : ri % 2 === 0 ? 'bg-white' : 'bg-primary-50/30'}>
                {row.slice(0, maxCols).map((cell, ci) => (
                  <td key={ci} className="px-2 py-1.5 border border-slate-100 truncate max-w-[100px]">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {(grid?.truncated || (preview.length > maxRows || (preview[0]?.length || 0) > maxCols)) && (
          <div className="text-center py-1 text-[10px] text-slate-400 bg-slate-50">
            仅显示部分数据（共 {sheet.rows} 行 x {sheet.columns} 列）
          </div>
        )}
      </div>
    );
  }

  // Rich grid from backend
  const cells = grid.cells.slice(0, maxRows).map((row) => row.slice(0, maxCols));

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-xs border-collapse">
        <tbody>
          {cells.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell: CellData, ci: number) => {
                const isHeader = ri === 0;
                return (
                  <td
                    key={ci}
                    className={`px-2 py-1.5 border border-slate-100 truncate max-w-[100px]
                      ${isHeader ? 'bg-primary-600 text-white font-semibold' : ''}
                      ${cell.hiddenByMerge ? 'bg-slate-50/50' : ''}
                      ${cell.isMerged && !cell.hiddenByMerge ? 'bg-primary-50/60' : ''}
                      ${cell.missingCachedValue ? 'text-amber-600 italic' : ''}
                    `}
                    colSpan={cell.colSpan}
                    rowSpan={cell.rowSpan}
                  >
                    {!cell.hiddenByMerge && (
                      <span title={cell.display}>
                        {cell.display || <span className="text-slate-300">—</span>}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {grid.truncated && (
        <div className="text-center py-1 text-[10px] text-slate-400 bg-slate-50">
          仅显示部分数据（共 {sheet.rows} 行 x {sheet.columns} 列）
        </div>
      )}
    </div>
  );
}
