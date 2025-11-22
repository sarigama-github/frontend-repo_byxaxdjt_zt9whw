import { useEffect, useState } from 'react'

export default function Controls({ stations, onCompute, ui, onUiChange }) {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [options, setOptions] = useState({
    transfer_penalty: 0, // sin penalización
    mobility: 'normal',
    time_of_day: 'offpeak',
    prefer_fewer_transfers: false,
  })

  useEffect(() => {
    if (stations.length && !origin && !destination) {
      setOrigin(stations[0].id)
      setDestination(stations[1]?.id || stations[0].id)
    }
  }, [stations])

  const submit = (e) => {
    e.preventDefault()
    if (!origin || !destination) return
    onCompute({ origin_id: origin, destination_id: destination, options })
  }

  const grouped = stations.reduce((acc, s) => {
    acc[s.line] = acc[s.line] || []
    acc[s.line].push(s)
    return acc
  }, {})

  return (
    <form onSubmit={submit} className="bg-slate-800/60 border border-blue-500/20 rounded-xl p-4 md:p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-blue-200 mb-1">Origen</label>
          <select value={origin} onChange={(e)=>setOrigin(e.target.value)} className="w-full bg-slate-900 text-white rounded px-3 py-2 border border-slate-600">
            {Object.keys(grouped).sort().map((line)=> (
              <optgroup key={line} label={`Línea ${line}`}>
                {grouped[line].map(s=> (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-blue-200 mb-1">Destino</label>
          <select value={destination} onChange={(e)=>setDestination(e.target.value)} className="w-full bg-slate-900 text-white rounded px-3 py-2 border border-slate-600">
            {Object.keys(grouped).sort().map((line)=> (
              <optgroup key={line} label={`Línea ${line}`}>
                {grouped[line].map(s=> (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div>
          <label className="block text-sm text-blue-200 mb-1">Movilidad</label>
          <select value={options.mobility} onChange={(e)=>setOptions(o=>({...o, mobility: e.target.value}))}
            className="w-full bg-slate-900 text-white rounded px-3 py-2 border border-slate-600">
            <option value="normal">Normal</option>
            <option value="reduced">Reducida</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-blue-200 mb-1">Hora del día</label>
          <select value={options.time_of_day} onChange={(e)=>setOptions(o=>({...o, time_of_day: e.target.value}))}
            className="w-full bg-slate-900 text-white rounded px-3 py-2 border border-slate-600">
            <option value="offpeak">Valle</option>
            <option value="peak">Punta</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input id="few" type="checkbox" checked={options.prefer_fewer_transfers}
            onChange={(e)=>setOptions(o=>({...o, prefer_fewer_transfers: e.target.checked}))}
            className="h-4 w-4"/>
          <label htmlFor="few" className="text-sm text-blue-200">Prefiero menos transbordos</label>
        </div>
      </div>

      {/* Accesibilidad visual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div className="flex items-center gap-2">
          <input id="hc" type="checkbox" checked={ui.highContrast} onChange={(e)=>onUiChange(u=>({...u, highContrast: e.target.checked}))} className="h-4 w-4"/>
          <label htmlFor="hc" className="text-sm text-blue-200">Alto contraste</label>
        </div>
        <div className="flex items-center gap-2">
          <input id="ll" type="checkbox" checked={ui.largeLabels} onChange={(e)=>onUiChange(u=>({...u, largeLabels: e.target.checked}))} className="h-4 w-4"/>
          <label htmlFor="ll" className="text-sm text-blue-200">Etiquetas grandes</label>
        </div>
        <div>
          <label className="block text-sm text-blue-200 mb-1">Escala</label>
          <input type="range" min="0.8" max="1.4" step="0.05" value={ui.scale}
            onChange={(e)=>onUiChange(u=>({...u, scale: parseFloat(e.target.value)}))}
            className="w-full"/>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded">
          Calcular ruta
        </button>
        <button type="button" onClick={()=>{setOrigin('');setDestination('')}} className="bg-slate-600 hover:bg-slate-700 text-white font-semibold px-4 py-2 rounded">
          Limpiar
        </button>
      </div>
    </form>
  )
}
