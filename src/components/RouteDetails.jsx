export default function RouteDetails({ result, stations }) {
  if (!result) return null
  const byId = Object.fromEntries(stations.map(s=>[s.id, s]))
  const fmt = (n)=> (Math.round(n*10)/10)

  return (
    <div className="bg-slate-800/60 border border-blue-500/20 rounded-xl p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-4">
        <div className="text-white font-semibold">Distancia aproximada: <span className="text-blue-300">{fmt(result.total_distance)} u</span></div>
        <div className="text-white font-semibold">Costo total: <span className="text-blue-300">{fmt(result.total_cost)}</span></div>
        <div className="text-white font-semibold">Transbordos: <span className="text-blue-300">{result.transfers}</span></div>
        <div className="text-white font-semibold">Líneas: <span className="text-blue-300">{result.lines_used.join(', ')}</span></div>
      </div>

      <ol className="list-decimal list-inside space-y-1 text-blue-100">
        {result.segments.map((seg, idx) => {
          const a = byId[seg.from_id]; const b = byId[seg.to_id]
          return (
            <li key={idx}>
              {seg.type === 'transfer' ? (
                <span>Transbordo en {a?.name} → {b?.name} (penalización incluida)</span>
              ) : (
                <span>Línea {seg.line}: {a?.name} → {b?.name}</span>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
