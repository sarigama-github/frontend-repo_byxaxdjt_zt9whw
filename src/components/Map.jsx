import React, { useMemo, useRef } from 'react'

export default function Map({ stations, route, ui = { highContrast:false, largeLabels:false, scale:1.0 } }) {
  // Scalable canvas to support zoom for accessibility
  const baseW = 1400, baseH = 1000
  const width = Math.round(baseW * (ui.scale || 1))
  const height = Math.round(baseH * (ui.scale || 1))
  const scaleX = (x) => (x/100) * width
  const scaleY = (y) => height - (y/100) * height

  // Group stations by line and by name (to detect transfers)
  const { byLine, byName, stationById, lineColors, routeIds, lineOrder } = useMemo(() => {
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
    const routeIds = new Set((route?.path || []).map(id => id))
    // Stable visual ordering of lines to compute offsets
    const numericFirst = Object.keys(byLine)
      .sort((a,b)=>{
        const na = isNaN(Number(a)) ? 999 : Number(a)
        const nb = isNaN(Number(b)) ? 999 : Number(b)
        if (na !== nb) return na - nb
        return a.localeCompare(b)
      })
    // Put A and B after numbers but keep order
    const lineOrder = numericFirst
    return { byLine, byName, stationById, lineColors, routeIds, lineOrder }
  }, [stations, route])

  const isTransferName = (name) => (byName[name?.trim()?.toLowerCase()]?.length || 0) > 1
  const onRoute = (id) => routeIds.has(id)

  // Simple collision avoidance for labels
  const placed = useRef([]) // store placed rects: {x,y,w,h}
  placed.current = []
  const rectsOverlap = (a,b) => !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y)
  const tryPlace = (x, y, w, h) => {
    const candidates = [
      { dx: 12, dy: -12 },
      { dx: -12, dy: -12 },
      { dx: 12, dy: 16 },
      { dx: -12, dy: 16 },
      { dx: 0, dy: -22 },
      { dx: 0, dy: 24 },
      { dx: 24, dy: 0 },
      { dx: -26, dy: 0 },
    ]
    for (const c of candidates) {
      const rect = { x: x + c.dx - 6, y: y + c.dy - 14, w: w + 12, h: h + 12 }
      let ok = true
      for (const p of placed.current) {
        if (rectsOverlap(rect, p)) { ok = false; break }
      }
      if (ok) { placed.current.push(rect); return { x: x + c.dx, y: y + c.dy } }
    }
    // if none works, skip label (avoid overlap)
    return null
  }

  const baseOpacity = ui.highContrast ? 0.35 : 0.28
  const bgGridOpacity = ui.highContrast ? 0.28 : 0.18
  const routeGlowOpacity = ui.highContrast ? 0.5 : 0.4
  const labelFontSize = ui.largeLabels ? 14 : 12
  const labelBgOpacity = ui.highContrast ? 0.85 : 0.72

  // Helper: line offset for schematic separation
  const getLineOffset = (line) => {
    const idx = lineOrder.indexOf(line)
    if (idx === -1) return 0
    // create symmetric offsets around 0: e.g., -4,-3,-2,-1,0,1,2,3,4 scaled to pixels
    const n = lineOrder.length
    const centered = idx - (n - 1)/2
    const base = 5.0 // base separation in px
    // slightly increase separation in the central area of the canvas
    return centered * base
  }

  // Helper: compute offset point for a segment AB by d pixels perpendicular
  const offsetPoint = (ax, ay, bx, by, d) => {
    const dx = bx - ax
    const dy = by - ay
    const len = Math.hypot(dx, dy) || 1
    const nx = -(dy / len)
    const ny = dx / len
    return [ax + nx * d, ay + ny * d, bx + nx * d, by + ny * d]
  }

  return (
    <div className="bg-slate-800/60 border border-blue-500/20 rounded-xl p-3 overflow-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[720px] md:h-[900px]">
        {/* Background subtle grid */}
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#475569" strokeWidth="0.8" opacity={bgGridOpacity}/>
          </pattern>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <rect x="0" y="0" width={width} height={height} fill="url(#grid)" />

        {/* Draw lines with schematic separation by per-line offset and slightly thinner strokes */}
        {Object.keys(byLine).sort().map(line => {
          const pts = byLine[line]
          const color = lineColors[line]
          const dpx = getLineOffset(line)
          const strokeW = 8 // slightly smaller than before
          const segments = []
          for (let i=0;i<pts.length-1;i++) {
            const a = pts[i], b = pts[i+1]
            const ax = scaleX(a.x), ay = scaleY(a.y)
            const bx = scaleX(b.x), by = scaleY(b.y)
            const [x1,y1,x2,y2] = offsetPoint(ax,ay,bx,by,dpx)
            segments.push(<line key={`${line}-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round" opacity={baseOpacity} />)
          }
          return <g key={line}>{segments}</g>
        })}

        {/* Highlight route segments with stronger halo (no offset so it stays centered) */}
        {route?.segments?.map((seg, idx) => {
          const a = stationById[seg.from_id]
          const b = stationById[seg.to_id]
          if (!a || !b) return null
          const color = seg.type === 'transfer' ? '#ffffff' : lineColors[seg.line] || '#fff'
          const dash = seg.type === 'transfer' ? '10,12' : '0'
          return (
            <g key={idx}>
              {/* outer glow */}
              <line
                x1={scaleX(a.x)} y1={scaleY(a.y)}
                x2={scaleX(b.x)} y2={scaleY(b.y)}
                stroke={seg.type === 'transfer' ? '#ffffff' : color}
                strokeWidth={22}
                strokeOpacity={routeGlowOpacity}
                strokeDasharray={dash}
                strokeLinecap="round"
                filter="url(#glow)"
              />
              {/* main stroke */}
              <line
                x1={scaleX(a.x)} y1={scaleY(a.y)}
                x2={scaleX(b.x)} y2={scaleY(b.y)}
                stroke={color}
                strokeWidth={12}
                strokeDasharray={dash}
                strokeLinecap="round"
              />
            </g>
          )
        })}

        {/* Draw stations: all same size; active/transfer styling via stroke/halo */}
        {stations.map((s) => {
          const cx = scaleX(s.x), cy = scaleY(s.y)
          const transfer = isTransferName(s.name)
          const active = onRoute(s.id)
          const r = 7 // same size for all nodes
          const fill = transfer ? '#ffffff' : s.color
          const stroke = active ? '#0ea5e9' : (transfer ? s.color : '#0b1220')
          const strokeWidth = active ? 3.5 : (transfer ? 3 : 1.5)
          return (
            <g key={s.id}>
              {active && (
                <circle cx={cx} cy={cy} r={r+6} fill="#0ea5e9" opacity={0.20} />
              )}
              <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
            </g>
          )
        })}

        {/* Station labels: collision-avoiding; always attempt route+transfers first */}
        {stations
          .slice()
          .sort((a,b)=>{
            // Priority: route nodes first, then transfers, then others
            const pa = (onRoute(a.id)?2:0) + (isTransferName(a.name)?1:0)
            const pb = (onRoute(b.id)?2:0) + (isTransferName(b.name)?1:0)
            return pb - pa
          })
          .map((s) => {
            const mustShow = onRoute(s.id) || isTransferName(s.name)
            const cx = scaleX(s.x), cy = scaleY(s.y)
            const name = s.name
            const w = name.length * (ui.largeLabels ? 9.2 : 7.8)
            const h = ui.largeLabels ? 18 : 16
            const placement = tryPlace(cx, cy, w, h)
            if (!placement && !mustShow) return null
            const pos = placement || { x: cx + 12, y: cy - (ui.largeLabels ? 18 : 14) }
            const bg = mustShow
            return (
              <g key={`label-${s.id}`}> 
                {bg && (
                  <rect x={pos.x-6} y={pos.y-(ui.largeLabels?14:12)} rx={4} width={w+12} height={(ui.largeLabels? h+10 : h+8)} fill="#0b1220" opacity={labelBgOpacity} />
                )}
                <text x={pos.x} y={pos.y} fontSize={labelFontSize} fill="#e2e8f0" fontWeight={bg?600:500}>{name}</text>
              </g>
            )
          })}

        {/* Line badges (legend) */}
        <g>
          <rect x="12" y="12" width="172" height={Object.keys(byLine).length*24 + 24} rx="10" fill="#0b1220" opacity="0.65" />
          {Object.keys(byLine).sort().map((ln, idx) => (
            <g key={`legend-${ln}`} transform={`translate(20, ${28 + idx*24})`}>
              <rect width="18" height="18" rx="3" fill={lineColors[ln]} />
              <text x="26" y="14" fontSize="15" fill="#e2e8f0" fontWeight="700">{ln}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}
