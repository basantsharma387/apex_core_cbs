interface Metric { label: string; value: string; delta?: string; deltaUp?: boolean; sub?: string }
interface Props { metrics: Metric[] }

export default function MetricRow({ metrics }: Props) {
  return (
    <div className="flex divide-x divide-gray-200 border border-gray-200 rounded-md bg-white mb-5">
      {metrics.map((m, i) => (
        <div key={i} className="flex-1 px-5 py-4 min-w-0">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 truncate">{m.label}</p>
          <p className="text-[22px] font-semibold text-slate-900 tabular-nums leading-none">{m.value}</p>
          {m.delta && (
            <p className={`text-xs mt-1.5 font-medium ${m.deltaUp ? 'text-green-700' : 'text-red-700'}`}>
              {m.delta}
            </p>
          )}
          {m.sub && <p className="text-[11px] text-slate-400 mt-0.5">{m.sub}</p>}
        </div>
      ))}
    </div>
  )
}
