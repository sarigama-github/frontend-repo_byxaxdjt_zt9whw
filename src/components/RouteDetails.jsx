export default function RouteDetails({ result, stations }) {
  if (!result) return null
  const byId = Object.fromEntries(stations.map(s=>[s.id, s]))
  const fmt = (n)=> (Math.round(n*10)/10)

  // Estimación simple de tiempo: factor por distancia + caminata por transbordo
  const distance = result.total_distance || 0
  const transfers = result.transfers || 0
  const minutes = Math.round(distance * 0.45 + transfers * 4) // ~0.45 min por unidad + 4 min por transbordo

  return (
    <div className="bg-slate-800/60 border border-blue-500/20 rounded-xl p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-4">
        <div className="text-white font-semibold">Distancia: <span className="text-blue-300">{fmt(distance)} u</span></div>
        <div className="text-white font-semibold">Tiempo estimado: <span className="text-blue-300">{minutes} min</span></div>
        <div className="text-white font-semibold">Transbordos: <span className="text-blue-300">{transfers}</span></div>
        <div className="text-white font-semibold">Líneas: <span className="text-blue-300">{result.lines_used.join(', ')}</span></div>
      </div>

      <ol className="list-decimal list-inside space-y-1 text-blue-100">
        {result.segments.map((seg, idx) => {
          const a = byId[seg.from_id]; const b = byId[seg.to_id]
          return (
            <li key={idx}>
              {seg.type === 'transfer' ? (
                <span>Transbordo en {a?.name} → {b?.name}</span>
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
