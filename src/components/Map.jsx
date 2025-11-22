import React from 'react'

export default function Map({ stations, route }) {
  // Normalize to SVG 800x500
  const width = 800, height = 500
  const scaleX = (x) => (x/100) * width
  const scaleY = (y) => height - (y/100) * height

  const stationById = Object.fromEntries(stations.map(s=>[s.id, s]))

  const lineColors = {}
  stations.forEach(s=> { lineColors[s.line] = s.color })

  return (
    <div className="bg-slate-800/60 border border-blue-500/20 rounded-xl p-3 overflow-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[360px] md:h-[480px]">
        {/* draw lines by connecting stations of same line in order based on proximity (rough) */}
        {Object.keys(lineColors).sort().map(line => (
          <g key={line}>
            {stations.filter(s=>s.line===line).sort((a,b)=> (a.x===b.x? a.y-b.y : a.x-b.x)).map((s,i,arr)=> (
              i>0 ? (
                <line key={s.id}
                  x1={scaleX(arr[i-1].x)} y1={scaleY(arr[i-1].y)}
                  x2={scaleX(s.x)} y2={scaleY(s.y)}
                  stroke={lineColors[line]} strokeWidth={4} opacity={0.35}/>
              ) : null
            ))}
          </g>
        ))}

        {/* highlight route segments */}
        {route?.segments?.map((seg, idx) => {
          const a = stationById[seg.from_id]
          const b = stationById[seg.to_id]
          if (!a || !b) return null
          const color = seg.type === 'transfer' ? '#38BDF8' : lineColors[seg.line] || '#fff'
          const dash = seg.type === 'transfer' ? '6,6' : '0'
          return (
            <g key={idx}>
              <line x1={scaleX(a.x)} y1={scaleY(a.y)} x2={scaleX(b.x)} y2={scaleY(b.y)} stroke={color} strokeWidth={6} strokeDasharray={dash} />
            </g>
          )
        })}

        {/* draw stations */}
        {stations.map(s => (
          <g key={s.id}>
            <circle cx={scaleX(s.x)} cy={scaleY(s.y)} r={6} fill={s.color} />
            <text x={scaleX(s.x)+8} y={scaleY(s.y)-8} fontSize={10} fill="#cbd5e1">{s.name}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}
