import type { ReactNode } from 'react'
import { clsx } from 'clsx'

export interface Column<T> {
  key: string
  header: string
  width?: string
  align?: 'left' | 'right' | 'center'
  render?: (row: T) => ReactNode
}

interface Props<T extends Record<string, unknown>> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (row: T) => void
  emptyMessage?: string
  loading?: boolean
}

export function DataTable<T extends Record<string, unknown>>({ columns, data, onRowClick, emptyMessage = 'No records found', loading }: Props<T>) {
  return (
    <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map(col => (
                <th key={col.key} style={col.width ? { width: col.width } : {}}
                  className={clsx('px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap', col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left')}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={columns.length} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse w-full" /></td></tr>
              ))
            ) : data.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-slate-400">{emptyMessage}</td></tr>
            ) : (
              data.map((row, i) => (
                <tr key={i} onClick={() => onRowClick?.(row)}
                  className={clsx('transition-colors', onRowClick ? 'cursor-pointer hover:bg-gray-50' : '')}>
                  {columns.map(col => (
                    <td key={col.key} className={clsx('px-4 py-3 text-[13px] text-slate-800 whitespace-nowrap', col.align === 'right' ? 'text-right tabular-nums' : col.align === 'center' ? 'text-center' : '')}>
                      {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
