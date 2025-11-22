import { useEffect, useState } from 'react'
import Header from './components/Header'
import Controls from './components/Controls'
import Map from './components/Map'
import RouteDetails from './components/RouteDetails'

function App() {
  const [stations, setStations] = useState([])
  const [route, setRoute] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Preferencias de UI (no afectan el backend)
  const [ui, setUi] = useState({
    highContrast: false,
    largeLabels: false,
    scale: 1.0,
  })

  const backend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  useEffect(()=>{ fetchStations() }, [])

  const fetchStations = async () => {
    try {
      const res = await fetch(`${backend}/api/stations`)
      if (!res.ok) throw new Error('No se pudieron cargar estaciones')
      const data = await res.json()
      setStations(data)
    } catch (e) {
      setError(e.message)
    }
  }

  const compute = async (payload) => {
    try {
      setError(''); setLoading(true)
      const res = await fetch(`${backend}/api/route`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error('No se pudo calcular la ruta')
      const data = await res.json()
      setRoute(data)
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.08),transparent_50%)]" />
      <div className="relative max-w-6xl mx-auto px-4 py-8 space-y-6">
        <Header />
        {error && (
          <div className="bg-red-500/20 border border-red-400/40 text-red-200 px-4 py-3 rounded">{error}</div>
        )}
        <Controls stations={stations} onCompute={compute} ui={ui} onUiChange={setUi} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Map stations={stations} route={route} ui={ui} />
          </div>
          <div>
            {loading ? (
              <div className="text-blue-200">Calculando...</div>
            ) : (
              <RouteDetails result={route} stations={stations} />
            )}
          </div>
        </div>
        <div className="text-center text-blue-300/60 text-sm">El mapa es esquemático y las distancias son aproximadas para fines académicos.</div>
      </div>
    </div>
  )
}

export default App
