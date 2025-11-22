import React, { useMemo } from 'react'

export default function Map({ stations, route }) {
  const width = 1000, height = 700
  const scaleX = (x) => (x/100) * width
  const scaleY = (y) => height - (y/100) * height

  // Group stations by line and by name (to detect transfers)
  const { byLine, byName, stationById, lineColors, routeIds } = useMemo(() => {
    const stationById = Object.fromEntries(stations.map(s=>[s.id, s]))
    const byLine = {}
    const byName = {}
    const lineColors = {}
    stations.forEach(s => {
      const line = s.line
      lineColors[line] = s.color
      if (!byLine[line]) byLine[line] = []
      byLine[line].push(s)
      const key = s.name.trim().toLowerCase()
      if (!byName[key]) byName[key] = []
      byName[key].push(s)
    })
    // sort each line by provided order if present, else fallback to x then y
    Object.keys(byLine).forEach(line => {
      byLine[line].sort((a,b) => (a.order ?? 0) - (b.order ?? 0) || a.x - b.x || a.y - b.y)
    })
    const routeIds = new Set(
      (route?.path || []).map(id => id)
    )
    return { byLine, byName, stationById, lineColors, routeIds }
  }, [stations, route])

  const isTransferName = (name) => (byName[name?.trim()?.toLowerCase()]?.length || 0) > 1
  const onRoute = (id) => routeIds.has(id)

  return (
    <div className="bg-slate-800/60 border border-blue-500/20 rounded-xl p-3 overflow-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[420px] md:h-[560px]">
        {/* Background subtle grid */}
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#475569" strokeWidth="0.5" opacity="0.15"/>
          </pattern>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <rect x="0" y="0" width={width} height={height} fill="url(#grid)" />

        {/* Draw lines as polylines (de-emphasized) */}
        {Object.keys(byLine).sort().map(line => (
          <polyline key={line}
            points={byLine[line].map(s=>`${scaleX(s.x)},${scaleY(s.y)}`).join(' ')}
            fill="none"
            stroke={lineColors[line]}
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.22}
          />
        ))}

        {/* Highlight route segments with halo */}
        {route?.segments?.map((seg, idx) => {
          const a = stationById[seg.from_id]
          const b = stationById[seg.to_id]
          if (!a || !b) return null
          const color = seg.type === 'transfer' ? '#ffffff' : lineColors[seg.line] || '#fff'
          const dash = seg.type === 'transfer' ? '8,10' : '0'
          return (
            <g key={idx}>
              {/* outer glow */}
              <line
                x1={scaleX(a.x)} y1={scaleY(a.y)}
                x2={scaleX(b.x)} y2={scaleY(b.y)}
                stroke={seg.type === 'transfer' ? '#ffffff' : color}
                strokeWidth={12}
                strokeOpacity={0.35}
                strokeDasharray={dash}
                strokeLinecap="round"
                filter="url(#glow)"
              />
              {/* main stroke */}
              <line
                x1={scaleX(a.x)} y1={scaleY(a.y)}
                x2={scaleX(b.x)} y2={scaleY(b.y)}
                stroke={color}
                strokeWidth={8}
                strokeDasharray={dash}
                strokeLinecap="round"
              />
            </g>
          )
        })}

        {/* Draw stations: bigger on route and transfers */}
        {stations.map((s) => {
          const cx = scaleX(s.x), cy = scaleY(s.y)
          const transfer = isTransferName(s.name)
          const active = onRoute(s.id)
          const r = transfer ? (active ? 8 : 7) : (active ? 6 : 4)
          const fill = transfer ? '#fff' : s.color
          const stroke = transfer ? (active ? '#0ea5e9' : s.color) : (active ? '#0ea5e9' : 'none')
          const strokeWidth = transfer ? (active ? 3.5 : 3) : (active ? 2.5 : 0)
          return (
            <g key={s.id}>
              {active && (
                <circle cx={cx} cy={cy} r={r+4} fill="#0ea5e9" opacity="0.18" />
              )}
              <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
            </g>
          )
        })}

        {/* Station labels: always show transfers and route nodes; sparsify the rest */}
        {stations.map((s, i) => {
          const show = onRoute(s.id) || isTransferName(s.name) || (i % 3 === 0)
          if (!show) return null
          const x = scaleX(s.x) + 8
          const y = scaleY(s.y) - 8
          const bg = onRoute(s.id) || isTransferName(s.name)
          return (
            <g key={`label-${s.id}`}> 
              {bg && (
                <rect x={x-4} y={y-10} rx={3} width={s.name.length*6.2} height={14} fill="#0b1220" opacity="0.6" />
              )}
              <text x={x} y={y} fontSize={10} fill="#e2e8f0">{s.name}</text>
            </g>
          )
        })}

        {/* Line badges (legend) */}
        <g>
          <rect x="8" y="8" width="130" height={Object.keys(byLine).length*18 + 16} rx="8" fill="#0b1220" opacity="0.6" />
          {Object.keys(byLine).sort().map((ln, idx) => (
            <g key={`legend-${ln}`} transform={`translate(16, ${20 + idx*18})`}>
              <rect width="14" height="14" rx="2" fill={lineColors[ln]} />
              <text x="20" y="11" fontSize="12" fill="#e2e8f0" fontWeight="600">{ln}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}
