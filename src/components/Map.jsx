import React, { useMemo } from 'react'

export default function Map({ stations, route }) {
  const width = 1000, height = 700
  const scaleX = (x) => (x/100) * width
  const scaleY = (y) => height - (y/100) * height

  // Group stations by line and by name (to detect transfers)
  const { byLine, byName, stationById, lineColors } = useMemo(() => {
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
    return { byLine, byName, stationById, lineColors }
  }, [stations])

  const isTransferName = (name) => (byName[name?.trim()?.toLowerCase()]?.length || 0) > 1

  return (
    <div className="bg-slate-800/60 border border-blue-500/20 rounded-xl p-3 overflow-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[420px] md:h-[560px]">
        {/* Draw lines as polylines */}
        {Object.keys(byLine).sort().map(line => (
          <polyline key={line}
            points={byLine[line].map(s=>`${scaleX(s.x)},${scaleY(s.y)}`).join(' ')}
            fill="none"
            stroke={lineColors[line]}
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.5}
          />
        ))}

        {/* Highlight route segments */}
        {route?.segments?.map((seg, idx) => {
          const a = stationById[seg.from_id]
          const b = stationById[seg.to_id]
          if (!a || !b) return null
          const color = seg.type === 'transfer' ? '#ffffff' : lineColors[seg.line] || '#fff'
          const dash = seg.type === 'transfer' ? '6,8' : '0'
          return (
            <line key={idx}
              x1={scaleX(a.x)} y1={scaleY(a.y)}
              x2={scaleX(b.x)} y2={scaleY(b.y)}
              stroke={color} strokeWidth={8}
              strokeDasharray={dash}
              strokeLinecap="round"
            />
          )
        })}

        {/* Draw stations: transfer nodes as white circles, others as small colored nodes */}
        {stations.map((s) => {
          const cx = scaleX(s.x), cy = scaleY(s.y)
          const transfer = isTransferName(s.name)
          return (
            <g key={s.id}>
              {transfer ? (
                <circle cx={cx} cy={cy} r={7} fill="#fff" stroke={s.color} strokeWidth={3} />
              ) : (
                <circle cx={cx} cy={cy} r={4} fill={s.color} />
              )}
            </g>
          )
        })}

        {/* Station labels (avoid clutter by showing only some) */}
        {stations.map((s, i) => {
          const show = i % 2 === 0 || isTransferName(s.name) // show half + transfers
          if (!show) return null
          return (
            <text key={`label-${s.id}`} x={scaleX(s.x)+8} y={scaleY(s.y)-8} fontSize={10} fill="#cbd5e1">{s.name}</text>
          )
        })}

        {/* Line badges (optional small legend top-left) */}
        <g>
          {Object.keys(byLine).sort().map((ln, idx) => (
            <g key={`legend-${ln}`} transform={`translate(12, ${16 + idx*18})`}>
              <rect width="14" height="14" rx="2" fill={lineColors[ln]} />
              <text x="20" y="11" fontSize="12" fill="#e2e8f0" fontWeight="600">{ln}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}
