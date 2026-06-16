// frontend/src/components/Mountain3D.tsx
// Interactive 3D Wireframe Mountain Elevation Profile Canvas

'use client'
import { useEffect, useRef, useState } from 'react'

interface Waypoint { lat: number; lng: number; altitude_m?: number }

interface Trek {
  id: string
  title: string
  distance_km: number
  elevation_gain_m: number
  max_altitude_m: number
  waypoints?: Waypoint[]
}

interface Mountain3DProps {
  activeTrek?: Trek | null
  height?: string
}

const GRID_SIZE = 24
const RANK_COLORS = {
  blue: 'rgba(6, 182, 212, 0.85)',
  neonBlue: '#22d3ee',
  green: 'rgba(16, 185, 129, 0.85)',
  neonGreen: '#34d399',
  textColor: '#9ca3af'
}

export default function Mountain3D({ activeTrek, height = '320px' }: Mountain3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Rotation Angles
  const [yaw, setYaw] = useState(0.8)
  const [pitch, setPitch] = useState(0.4)
  const isDragging = useRef(false)
  const previousMouse = useRef({ x: 0, y: 0 })
  const animationFrameId = useRef<number | null>(null)

  // Procedural Terrain Generation
  const terrain = useRef<number[][]>([])
  if (terrain.current.length === 0) {
    const peaks = [
      { cx: 5,  cy: 7,  h: 11, r: 5 },
      { cx: 12, cy: 5,  h: 14, r: 6 },
      { cx: 18, cy: 9,  h: 10, r: 5 },
      { cx: 9,  cy: 15, h: 6,  r: 4 },
      { cx: 15, cy: 17, h: 8,  r: 5 },
    ]
    for (let r = 0; r < GRID_SIZE; r++) {
      const row: number[] = []
      for (let c = 0; c < GRID_SIZE; c++) {
        let z = 0
        peaks.forEach(p => {
          const dx = c - p.cx
          const dy = r - p.cy
          const distSq = dx * dx + dy * dy
          z += p.h * Math.exp(-distSq / (2 * p.r * p.r))
        })
        // Add rugged noise
        z += Math.sin(c * 1.5) * Math.cos(r * 1.5) * 0.4
        z += Math.sin(c * 3.5 + r * 2.0) * 0.15
        row.push(z)
      }
      terrain.current.push(row)
    }
  }

  // Mouse drag handler to rotate 3D mountain
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    previousMouse.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return
    const deltaX = e.clientX - previousMouse.current.x
    const deltaY = e.clientY - previousMouse.current.y
    
    setYaw(y => y + deltaX * 0.007)
    setPitch(p => Math.max(0.1, Math.min(Math.PI / 2 - 0.1, p + deltaY * 0.007)))
    
    previousMouse.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseUp = () => {
    isDragging.current = false
  }

  // Draw loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set pixel ratio for high DPI screens
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const width = rect.width
    const height = rect.height

    let localYaw = yaw

    const render = () => {
      // Auto-rotation when not dragging
      if (!isDragging.current) {
        localYaw += 0.0015
      }

      ctx.clearRect(0, 0, width, height)

      // Project grid points
      const spacing = 14
      const halfSize = (GRID_SIZE - 1) * spacing / 2
      const scale = 1.1

      const projectedPoints: { sx: number; sy: number; sz: number }[][] = []

      for (let r = 0; r < GRID_SIZE; r++) {
        const rowPoints: { sx: number; sy: number; sz: number }[] = []
        for (let c = 0; c < GRID_SIZE; c++) {
          const px = (c * spacing) - halfSize
          const pz = (r * spacing) - halfSize
          const py = terrain.current[r][c] * 11 // scale height

          // 3D rotation
          // Yaw
          const x1 = px * Math.cos(localYaw) - pz * Math.sin(localYaw)
          const z1 = px * Math.sin(localYaw) + pz * Math.cos(localYaw)
          // Pitch
          const y2 = py * Math.cos(pitch) - z1 * Math.sin(pitch)
          const z2 = py * Math.sin(pitch) + z1 * Math.cos(pitch)

          // Projection (Orthographic)
          const sx = width / 2 + x1 * scale
          const sy = height / 2 - y2 * scale + 30 // adjust offset down

          rowPoints.push({ sx, sy, sz: z2 })
        }
        projectedPoints.push(rowPoints)
      }

      // Collect all wireframe segments to sort them for depth blending
      interface Segment {
        x1: number; y1: number
        x2: number; y2: number
        z: number
        color: string
        lineWidth: number
      }
      const segments: Segment[] = []

      // Add terrain grid segments
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const pt = projectedPoints[r][c]

          // Connection to next column
          if (c < GRID_SIZE - 1) {
            const nextPt = projectedPoints[r][c + 1]
            segments.push({
              x1: pt.sx, y1: pt.sy,
              x2: nextPt.sx, y2: nextPt.sy,
              z: (pt.sz + nextPt.sz) / 2,
              color: 'rgba(16, 185, 129, 0.12)', // emerald/green wireframe
              lineWidth: 1
            })
          }
          // Connection to next row
          if (r < GRID_SIZE - 1) {
            const nextPt = projectedPoints[r + 1][c]
            segments.push({
              x1: pt.sx, y1: pt.sy,
              x2: nextPt.sx, y2: nextPt.sy,
              z: (pt.sz + nextPt.sz) / 2,
              color: 'rgba(16, 185, 129, 0.12)',
              lineWidth: 1
            })
          }
        }
      }

      // Determine the active trek path to draw
      const pathPoints: { x: number; y: number; z: number }[] = []
      const wps = activeTrek?.waypoints || []

      if (wps.length >= 2) {
        // Map actual trek waypoints onto the 3D space
        const lats = wps.map(w => w.lat)
        const lngs = wps.map(w => w.lng)
        const alts = wps.map(w => w.altitude_m || 0)

        const minLat = Math.min(...lats), maxLat = Math.max(...lats)
        const minLng = Math.min(...lngs), maxLng = Math.max(...lngs)
        const minAlt = Math.min(...alts), maxAlt = Math.max(...alts)

        const latDelta = maxLat - minLat || 0.0001
        const lngDelta = maxLng - minLng || 0.0001
        const altDelta = maxAlt - minAlt || 100

        wps.forEach(wp => {
          const normX = (wp.lng - minLng) / lngDelta
          const normZ = (wp.lat - minLat) / latDelta
          const normY = ((wp.altitude_m || 0) - minAlt) / altDelta

          const px = (normX - 0.5) * halfSize * 1.6
          const pz = (normZ - 0.5) * halfSize * 1.6
          const py = normY * 70 + 20 // float height

          // Rotate
          const x1 = px * Math.cos(localYaw) - pz * Math.sin(localYaw)
          const z1 = px * Math.sin(localYaw) + pz * Math.cos(localYaw)
          const y2 = py * Math.cos(pitch) - z1 * Math.sin(pitch)
          const z2 = py * Math.sin(pitch) + z1 * Math.cos(pitch)

          const sx = width / 2 + x1 * scale
          const sy = height / 2 - y2 * scale + 30

          pathPoints.push({ x: sx, y: sy, z: z2 })
        })
      } else {
        // Generate pre-seeded procedural loop that conforms to peaks
        const steps = 60
        for (let i = 0; i <= steps; i++) {
          const angle = (i / steps) * Math.PI * 2
          const px = Math.cos(angle) * halfSize * 0.7 + Math.sin(angle * 3) * 10
          const pz = Math.sin(angle) * halfSize * 0.7 + Math.cos(angle * 2) * 8

          // Map XZ space to grid coordinates to fetch height
          const gridC = Math.max(0, Math.min(GRID_SIZE - 1, Math.round((px + halfSize) / spacing)))
          const gridR = Math.max(0, Math.min(GRID_SIZE - 1, Math.round((pz + halfSize) / spacing)))
          const py = terrain.current[gridR][gridC] * 11 + 10 // elevate slightly

          const x1 = px * Math.cos(localYaw) - pz * Math.sin(localYaw)
          const z1 = px * Math.sin(localYaw) + pz * Math.cos(localYaw)
          const y2 = py * Math.cos(pitch) - z1 * Math.sin(pitch)
          const z2 = py * Math.sin(pitch) + pz * Math.cos(pitch)

          const sx = width / 2 + x1 * scale
          const sy = height / 2 - y2 * scale + 30

          pathPoints.push({ x: sx, y: sy, z: z2 })
        }
      }

      // Add path segments to draw list for correct depth blending
      for (let i = 0; i < pathPoints.length - 1; i++) {
        const pt = pathPoints[i]
        const nextPt = pathPoints[i + 1]
        segments.push({
          x1: pt.x, y1: pt.y,
          x2: nextPt.x, y2: nextPt.y,
          z: (pt.z + nextPt.z) / 2 + 10, // give route slight depth priority
          color: 'rgba(34, 211, 238, 0.85)', // glowing neon cyan path
          lineWidth: 2.5
        })
      }

      // Sort all line segments by depth (Z coord) - back to front
      segments.sort((a, b) => b.z - a.z)

      // Get min/max depth for depth cueing opacity mapping
      let minZ = Infinity, maxZ = -Infinity
      segments.forEach(s => {
        if (s.z < minZ) minZ = s.z
        if (s.z > maxZ) maxZ = s.z
      })
      const zRange = maxZ - minZ || 1

      // Draw all segments
      segments.forEach(seg => {
        ctx.beginPath()
        ctx.moveTo(seg.x1, seg.y1)
        ctx.lineTo(seg.x2, seg.y2)

        // Depth cueing: fade out segments in the distance
        const normZ = (seg.z - minZ) / zRange // 0 (back) to 1 (front)
        
        ctx.lineWidth = seg.lineWidth
        if (seg.color.startsWith('rgba')) {
          // Replace alpha channel for depth cueing
          const baseColor = seg.color.substring(0, seg.color.lastIndexOf(','))
          const alpha = 0.03 + normZ * 0.22
          ctx.strokeStyle = `${baseColor}, ${alpha})`
        } else {
          // If pure hex (route line), add glow shadow
          ctx.strokeStyle = seg.color
          ctx.shadowColor = '#06b6d4'
          ctx.shadowBlur = 8
        }

        ctx.stroke()
        ctx.shadowBlur = 0 // reset shadow
      })

      // Add summit / location markers (drawn on top)
      interface MarkerItem {
        label: string
        cx: number; cy: number; h: number
        color: string
        isSummit: boolean
      }
      const markers: MarkerItem[] = []

      if (wps.length >= 2 && activeTrek) {
        // First, Last, and Summit markers for actual trek
        const startWp = wps[0]
        const endWp = wps[wps.length - 1]
        
        // Find highest alt waypoint
        let summitIndex = 0
        let maxAlt = -Infinity
        wps.forEach((w, idx) => {
          if ((w.altitude_m || 0) > maxAlt) {
            maxAlt = w.altitude_m || 0
            summitIndex = idx
          }
        })

        // Add start
        markers.push({ label: 'Start', cx: 0, cy: 0, h: 0, color: RANK_COLORS.neonGreen, isSummit: false })
        // Add end
        markers.push({ label: 'End', cx: wps.length - 1, cy: 0, h: 0, color: '#ef4444', isSummit: false })
        // Add summit
        markers.push({ label: `▲ ${maxAlt}m`, cx: summitIndex, cy: 0, h: 0, color: '#f59e0b', isSummit: true })
      } else {
        // Pre-seeded Peaks
        markers.push({ label: '▲ 1340M', cx: 5,  cy: 7,  h: 11, color: '#34d399', isSummit: true })
        markers.push({ label: '▲ 1850M', cx: 12, cy: 5,  h: 14, color: '#f59e0b', isSummit: true })
        markers.push({ label: '▲ 1700M', cx: 18, cy: 9,  h: 10, color: '#34d399', isSummit: true })
        markers.push({ label: 'Waypoint', cx: 15, cy: 15, h: 4,  color: '#22d3ee', isSummit: false })
      }

      // Render markers
      markers.forEach(m => {
        let sx = 0, sy = 0, sz = 0

        if (wps.length >= 2 && activeTrek) {
          // Fetch coordinate from pathPoints list
          const pt = pathPoints[m.cx]
          if (pt) {
            sx = pt.x
            sy = pt.y
            sz = pt.z
          }
        } else {
          // Fetch coordinate from grid calculation
          const px = (m.cx * spacing) - halfSize
          const pz = (m.cy * spacing) - halfSize
          const py = m.h * 11

          const x1 = px * Math.cos(localYaw) - pz * Math.sin(localYaw)
          const z1 = px * Math.sin(localYaw) + pz * Math.cos(localYaw)
          const y2 = py * Math.cos(pitch) - z1 * Math.sin(pitch)
          const z2 = py * Math.sin(pitch) + pz * Math.cos(pitch)

          sx = width / 2 + x1 * scale
          sy = height / 2 - y2 * scale + 30
          sz = z2
        }

        // Draw marker dot
        ctx.beginPath()
        ctx.arc(sx, sy, m.isSummit ? 5 : 4, 0, Math.PI * 2)
        ctx.fillStyle = m.color
        ctx.shadowColor = m.color
        ctx.shadowBlur = 10
        ctx.fill()
        ctx.shadowBlur = 0

        ctx.strokeStyle = '#030712'
        ctx.lineWidth = 1.5
        ctx.stroke()

        // Draw text label box
        ctx.font = 'bold 10px Courier New, monospace'
        const textWidth = ctx.measureText(m.label).width
        const boxW = textWidth + 10
        const boxH = 16
        const bx = sx - boxW / 2
        const by = sy - 20

        // Label box background
        ctx.fillStyle = 'rgba(3, 7, 18, 0.8)'
        ctx.beginPath()
        ctx.roundRect(bx, by, boxW, boxH, 4)
        ctx.fill()
        ctx.strokeStyle = m.color
        ctx.lineWidth = 0.8
        ctx.stroke()

        // Label text
        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'center'
        ctx.fillText(m.label, sx, by + 11)
      })

      animationFrameId.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [activeTrek, yaw, pitch])

  return (
    <div 
      style={{ 
        position: 'relative', 
        width: '100%', 
        height, 
        cursor: isDragging.current ? 'grabbing' : 'grab',
        background: '#030712',
        borderRadius: 12,
        overflow: 'hidden'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <canvas 
        ref={canvasRef} 
        style={{ width: '100%', height: '100%', display: 'block' }} 
      />
      {/* Visual helper badge */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        background: 'rgba(17, 24, 39, 0.7)',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        color: '#6b7280',
        padding: '3px 8px',
        borderRadius: '4px',
        fontSize: '9px',
        fontFamily: 'monospace',
        pointerEvents: 'none'
      }}>
        DRAG TO ROTATE
      </div>
    </div>
  )
}
