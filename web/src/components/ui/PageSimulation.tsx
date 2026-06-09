import type { PreviewSheetData, PageData } from '@/api/client';

interface PageSimulationProps {
  sheet: PreviewSheetData;
}

export default function PageSimulation({ sheet }: PageSimulationProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-sm">
        <div className="w-6 h-6 rounded-md bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-600">
          {sheet.name.charAt(0)}
        </div>
        <span className="font-semibold text-slate-700">{sheet.name}</span>
        <span className="text-xs text-slate-400">{sheet.range}</span>
        <span className="ml-auto text-xs text-slate-400">
          {sheet.optimizedPageCount} 页 / 原 {sheet.originalPageCount} 页
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {sheet.pages.map((page: PageData) => (
          <PageCard key={page.number} page={page} header={sheet.header} />
        ))}
      </div>

      {sheet.rangeAdjustedByMerges.length > 0 && (
        <p className="text-[11px] text-slate-400">
          范围已自动扩展以保护合并单元格 ({sheet.rangeAdjustedByMerges.join(', ')})
        </p>
      )}
    </div>
  );
}

function PageCard({ page, header }: { page: PageData; header: string[] }) {
  return (
    <div className="flex-shrink-0 w-[180px] rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Page header */}
      <div className="px-2 py-1 bg-slate-100 text-[10px] text-slate-500 flex justify-between">
        <span>第 {page.number} 页</span>
        <span className="font-mono text-[9px]">{page.rowRange}</span>
      </div>

      {/* Sheet content mini preview */}
      <div className="p-1.5">
        <table className="w-full text-[9px] border-collapse">
          <tbody>
            {page.rows.slice(0, 12).map((row, ri) => (
              <tr key={ri}>
                {row.slice(0, 4).map((cell, ci) => (
                  <td
                    key={ci}
                    className={`px-1 py-0.5 border border-slate-50 truncate max-w-[40px]
                      ${ri === 0 && page.hasRepeatedHeader ? 'bg-amber-50' : ''}
                    `}
                  >
                    {cell || ' '}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {page.hasRepeatedHeader && (
        <div className="px-2 py-0.5 bg-amber-50 text-[9px] text-amber-600 text-center">↻ 重复表头</div>
      )}
    </div>
  );
}
