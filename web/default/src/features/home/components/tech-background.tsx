import { useEffect, useRef } from 'react'

interface CircuitLine {
  x: number
  y: number
  segments: { dx: number; dy: number; width: number }[]
  opacity: number
  speed: number
  progress: number
  color: string
}

interface DataParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  life: number
  maxLife: number
  color: string
}

interface GlowNode {
  x: number
  y: number
  radius: number
  opacity: number
  pulsePhase: number
  pulseSpeed: number
  color: string
}

export function TechBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let time = 0

    const circuits: CircuitLine[] = []
    const particles: DataParticle[] = []
    const glowNodes: GlowNode[] = []
    const center = { x: 0, y: 0 }

    const colors = {
      primary: '59, 130, 246',    // Blue
      secondary: '139, 92, 246',   // Violet
      accent: '6, 182, 212',       // Cyan
      glow: '96, 165, 250',        // Light blue
    }

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      center.x = canvas.width * 0.5
      center.y = canvas.height * 0.55

      initCircuits()
      initGlowNodes()
    }

    function initCircuits() {
      circuits.length = 0
      const circuitCount = Math.floor(canvas.width / 80)

      for (let i = 0; i < circuitCount; i++) {
        const startX = Math.random() * canvas.width
        const startY = canvas.height * 0.65 + Math.random() * canvas.height * 0.35
        const segments = []
        let cx = startX
        let cy = startY
        const segCount = 3 + Math.floor(Math.random() * 5)

        for (let j = 0; j < segCount; j++) {
          const dx = (Math.random() - 0.5) * 150
          const dy = -Math.random() * 100 - 20
          const width = Math.random() * 1.5 + 0.5
          segments.push({ dx, dy, width })
          cx += dx
          cy += dy
        }

        const colorKeys = Object.keys(colors) as (keyof typeof colors)[]
        const colorKey = colorKeys[Math.floor(Math.random() * colorKeys.length)]

        circuits.push({
          x: startX,
          y: startY,
          segments,
          opacity: Math.random() * 0.4 + 0.2,
          speed: Math.random() * 0.003 + 0.001,
          progress: Math.random(),
          color: colors[colorKey],
        })
      }
    }

    function initGlowNodes() {
      glowNodes.length = 0
      const nodeCount = 15

      for (let i = 0; i < nodeCount; i++) {
        const colorKeys = Object.keys(colors) as (keyof typeof colors)[]
        const colorKey = colorKeys[Math.floor(Math.random() * colorKeys.length)]

        glowNodes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height * 0.6,
          radius: Math.random() * 3 + 1,
          opacity: Math.random() * 0.5 + 0.2,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.02 + 0.01,
          color: colors[colorKey],
        })
      }
    }

    function createParticle(x: number, y: number, color: string) {
      if (particles.length > 80) return
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 1,
        vy: -Math.random() * 2 - 0.5,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.6 + 0.3,
        life: 0,
        maxLife: Math.random() * 120 + 60,
        color,
      })
    }

    function drawBackground() {
      // Deep dark blue background
      ctx!.fillStyle = 'rgb(2, 6, 23)'
      ctx!.fillRect(0, 0, canvas.width, canvas.height)

      // Subtle radial glow from center bottom
      const bgGradient = ctx!.createRadialGradient(
        center.x, center.y, 0,
        center.x, center.y, Math.max(canvas.width, canvas.height) * 0.8
      )
      bgGradient.addColorStop(0, 'rgba(30, 58, 138, 0.15)')
      bgGradient.addColorStop(0.3, 'rgba(15, 23, 42, 0.4)')
      bgGradient.addColorStop(1, 'rgba(2, 6, 23, 0)')
      ctx!.fillStyle = bgGradient
      ctx!.fillRect(0, 0, canvas.width, canvas.height)

      // Upper area darker
      const topGradient = ctx!.createLinearGradient(0, 0, 0, canvas.height * 0.5)
      topGradient.addColorStop(0, 'rgba(2, 6, 23, 0.6)')
      topGradient.addColorStop(1, 'rgba(2, 6, 23, 0)')
      ctx!.fillStyle = topGradient
      ctx!.fillRect(0, 0, canvas.width, canvas.height * 0.5)
    }

    function drawCitySilhouette() {
      const baseY = canvas.height * 0.62
      const buildingCount = Math.floor(canvas.width / 40)

      ctx!.fillStyle = 'rgba(15, 23, 42, 0.9)'
      ctx!.beginPath()
      ctx!.moveTo(0, canvas.height)
      ctx!.lineTo(0, baseY)

      for (let i = 0; i <= buildingCount; i++) {
        const x = (i / buildingCount) * canvas.width
        const prevHeight = i > 0 ? (Math.sin(i * 0.5) * 30 + Math.cos(i * 1.3) * 20 + 60) : 0
        const height = Math.sin(i * 0.5) * 30 + Math.cos(i * 1.3) * 20 + 60
        const nextHeight = i < buildingCount ? (Math.sin((i + 1) * 0.5) * 30 + Math.cos((i + 1) * 1.3) * 20 + 60) : 0

        // Building block
        const buildingWidth = canvas.width / buildingCount
        ctx!.lineTo(x - buildingWidth * 0.1, baseY - prevHeight)
        ctx!.lineTo(x + buildingWidth * 0.4, baseY - height)
        ctx!.lineTo(x + buildingWidth * 0.9, baseY - nextHeight)

        // Add some taller buildings
        if (i % 5 === 0) {
          const towerHeight = height + 80 + Math.random() * 40
          ctx!.lineTo(x + buildingWidth * 0.3, baseY - towerHeight)
          ctx!.lineTo(x + buildingWidth * 0.7, baseY - towerHeight + 20)
          ctx!.lineTo(x + buildingWidth * 0.9, baseY - nextHeight)
        }
      }

      ctx!.lineTo(canvas.width, baseY)
      ctx!.lineTo(canvas.width, canvas.height)
      ctx!.closePath()
      ctx!.fill()

      // Building edge glow
      ctx!.strokeStyle = 'rgba(59, 130, 246, 0.15)'
      ctx!.lineWidth = 1
      ctx!.stroke()

      // Windows lights
      for (let i = 0; i < buildingCount; i++) {
        if (i % 2 === 0) continue
        const x = (i / buildingCount) * canvas.width + 10
        const height = Math.sin(i * 0.5) * 30 + Math.cos(i * 1.3) * 20 + 60
        const windowCount = Math.floor(height / 15)

        for (let w = 0; w < windowCount; w++) {
          if (Math.random() > 0.6) {
            const wx = x + Math.random() * 20
            const wy = baseY - 10 - w * 15
            ctx!.fillStyle = `rgba(147, 197, 253, ${Math.random() * 0.3 + 0.1})`
            ctx!.fillRect(wx, wy, 3, 2)
          }
        }
      }
    }

    function drawCentralPlatform() {
      const platformY = center.y
      const platformWidth = Math.min(canvas.width * 0.25, 300)
      const platformHeight = platformWidth * 0.3

      // Platform glow underneath
      const platformGlow = ctx!.createRadialGradient(
        center.x, platformY, 0,
        center.x, platformY, platformWidth
      )
      platformGlow.addColorStop(0, 'rgba(59, 130, 246, 0.3)')
      platformGlow.addColorStop(0.5, 'rgba(139, 92, 246, 0.15)')
      platformGlow.addColorStop(1, 'rgba(59, 130, 246, 0)')
      ctx!.fillStyle = platformGlow
      ctx!.fillRect(center.x - platformWidth, platformY - platformWidth, platformWidth * 2, platformWidth * 2)

      // Diamond/platform shape
      ctx!.beginPath()
      ctx!.moveTo(center.x, platformY - platformHeight * 0.8)
      ctx!.lineTo(center.x + platformWidth * 0.5, platformY)
      ctx!.lineTo(center.x, platformY + platformHeight * 0.5)
      ctx!.lineTo(center.x - platformWidth * 0.5, platformY)
      ctx!.closePath()

      // Platform fill
      const platformGradient = ctx!.createLinearGradient(
        center.x, platformY - platformHeight * 0.8,
        center.x, platformY + platformHeight * 0.5
      )
      platformGradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)')
      platformGradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.1)')
      platformGradient.addColorStop(1, 'rgba(6, 182, 212, 0.15)')
      ctx!.fillStyle = platformGradient
      ctx!.fill()

      // Platform border
      ctx!.strokeStyle = `rgba(96, 165, 250, ${0.5 + Math.sin(time * 0.002) * 0.2})`
      ctx!.lineWidth = 2
      ctx!.stroke()

      // Inner platform lines
      ctx!.beginPath()
      ctx!.moveTo(center.x, platformY - platformHeight * 0.6)
      ctx!.lineTo(center.x + platformWidth * 0.35, platformY - platformHeight * 0.1)
      ctx!.lineTo(center.x, platformY + platformHeight * 0.3)
      ctx!.lineTo(center.x - platformWidth * 0.35, platformY - platformHeight * 0.1)
      ctx!.closePath()
      ctx!.strokeStyle = 'rgba(59, 130, 246, 0.3)'
      ctx!.lineWidth = 1
      ctx!.stroke()

      // Central beam shooting up
      const beamWidth = 3 + Math.sin(time * 0.003) * 1
      const beamGradient = ctx!.createLinearGradient(
        center.x, platformY - platformHeight * 0.8,
        center.x, 0
      )
      beamGradient.addColorStop(0, 'rgba(96, 165, 250, 0.8)')
      beamGradient.addColorStop(0.3, 'rgba(139, 92, 246, 0.4)')
      beamGradient.addColorStop(1, 'rgba(96, 165, 250, 0)')

      ctx!.beginPath()
      ctx!.moveTo(center.x - beamWidth, platformY - platformHeight * 0.8)
      ctx!.lineTo(center.x - beamWidth * 0.3, 0)
      ctx!.lineTo(center.x + beamWidth * 0.3, 0)
      ctx!.lineTo(center.x + beamWidth, platformY - platformHeight * 0.8)
      ctx!.closePath()
      ctx!.fillStyle = beamGradient
      ctx!.fill()

      // Beam core
      ctx!.beginPath()
      ctx!.moveTo(center.x - 0.5, platformY - platformHeight * 0.8)
      ctx!.lineTo(center.x - 0.2, 0)
      ctx!.lineTo(center.x + 0.2, 0)
      ctx!.lineTo(center.x + 0.5, platformY - platformHeight * 0.8)
      ctx!.closePath()
      ctx!.fillStyle = 'rgba(147, 197, 253, 0.6)'
      ctx!.fill()

      // Platform bottom circuit lines spreading out
      const spreadCount = 12
      for (let i = 0; i < spreadCount; i++) {
        const angle = (i / spreadCount) * Math.PI * 2
        const spreadLength = 100 + Math.sin(time * 0.001 + i) * 30
        const sx = center.x + Math.cos(angle) * (platformWidth * 0.5)
        const sy = platformY + Math.sin(angle) * (platformHeight * 0.2)
        const ex = center.x + Math.cos(angle) * spreadLength
        const ey = platformY + Math.sin(angle) * spreadLength * 0.3 + 50

        ctx!.beginPath()
        ctx!.moveTo(sx, sy)
        ctx!.lineTo(ex, ey)
        ctx!.strokeStyle = `rgba(59, 130, 246, ${0.15 + Math.sin(time * 0.002 + i) * 0.1})`
        ctx!.lineWidth = 1
        ctx!.stroke()

        // Energy pulse on lines
        const pulsePos = (time * 0.001 + i * 0.1) % 1
        const px = sx + (ex - sx) * pulsePos
        const py = sy + (ey - sy) * pulsePos
        ctx!.beginPath()
        ctx!.arc(px, py, 2, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(147, 197, 253, ${0.6 * (1 - pulsePos)})`
        ctx!.fill()
      }
    }

    function drawCircuits() {
      circuits.forEach((circuit) => {
        circuit.progress += circuit.speed
        if (circuit.progress > 1) circuit.progress = 0

        let cx = circuit.x
        let cy = circuit.y
        const points = [{ x: cx, y: cy }]

        circuit.segments.forEach((seg) => {
          cx += seg.dx
          cy += seg.dy
          points.push({ x: cx, y: cy })
        })

        // Draw circuit path
        ctx!.beginPath()
        ctx!.moveTo(points[0].x, points[0].y)
        for (let i = 1; i < points.length; i++) {
          ctx!.lineTo(points[i].x, points[i].y)
        }
        ctx!.strokeStyle = `rgba(${circuit.color}, ${circuit.opacity * 0.3})`
        ctx!.lineWidth = 1
        ctx!.stroke()

        // Draw active energy flowing
        const totalSegments = points.length - 1
        const segmentProgress = circuit.progress * totalSegments
        const currentSeg = Math.floor(segmentProgress)
        const segT = segmentProgress - currentSeg

        if (currentSeg < totalSegments) {
          const p1 = points[currentSeg]
          const p2 = points[currentSeg + 1]
          const ex = p1.x + (p2.x - p1.x) * segT
          const ey = p1.y + (p2.y - p1.y) * segT

          // Energy dot
          ctx!.beginPath()
          ctx!.arc(ex, ey, 3, 0, Math.PI * 2)
          ctx!.fillStyle = `rgba(${circuit.color}, 0.8)`
          ctx!.fill()

          // Glow
          ctx!.beginPath()
          ctx!.arc(ex, ey, 8, 0, Math.PI * 2)
          ctx!.fillStyle = `rgba(${circuit.color}, 0.2)`
          ctx!.fill()

          // Create particles occasionally
          if (Math.random() > 0.95) {
            createParticle(ex, ey, circuit.color)
          }
        }

        // Circuit nodes
        points.forEach((p, i) => {
          if (i === 0) return
          ctx!.beginPath()
          ctx!.arc(p.x, p.y, 2, 0, Math.PI * 2)
          ctx!.fillStyle = `rgba(${circuit.color}, ${circuit.opacity * 0.5})`
          ctx!.fill()
        })
      })
    }

    function drawParticles() {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.life++

        const lifeRatio = 1 - p.life / p.maxLife
        if (lifeRatio <= 0) {
          particles.splice(i, 1)
          continue
        }

        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.size * lifeRatio, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(${p.color}, ${p.opacity * lifeRatio})`
        ctx!.fill()

        // Trail
        ctx!.beginPath()
        ctx!.arc(p.x, p.y - p.vy * 3, p.size * 0.5 * lifeRatio, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(${p.color}, ${p.opacity * 0.3 * lifeRatio})`
        ctx!.fill()
      }
    }

    function drawGlowNodes() {
      glowNodes.forEach((node) => {
        node.pulsePhase += node.pulseSpeed
        const pulse = Math.sin(node.pulsePhase) * 0.4 + 0.6

        // Outer glow
        const glowGradient = ctx!.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, node.radius * 8
        )
        glowGradient.addColorStop(0, `rgba(${node.color}, ${node.opacity * 0.3 * pulse})`)
        glowGradient.addColorStop(1, `rgba(${node.color}, 0)`)
        ctx!.fillStyle = glowGradient
        ctx!.beginPath()
        ctx!.arc(node.x, node.y, node.radius * 8, 0, Math.PI * 2)
        ctx!.fill()

        // Core
        ctx!.beginPath()
        ctx!.arc(node.x, node.y, node.radius * pulse, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(${node.color}, ${node.opacity * pulse})`
        ctx!.fill()
      })
    }

    function drawGridFloor() {
      const gridSize = 40
      const perspectiveY = canvas.height * 0.65
      const horizonY = canvas.height * 0.3

      // Horizontal lines with perspective
      for (let i = 0; i < 20; i++) {
        const t = i / 20
        const y = perspectiveY + (canvas.height - perspectiveY) * t * t
        const opacity = (1 - t) * 0.08

        ctx!.beginPath()
        ctx!.moveTo(0, y)
        ctx!.lineTo(canvas.width, y)
        ctx!.strokeStyle = `rgba(59, 130, 246, ${opacity})`
        ctx!.lineWidth = 0.5
        ctx!.stroke()
      }

      // Vertical perspective lines
      const vanishingPointX = center.x
      for (let i = -10; i <= 10; i++) {
        const x = vanishingPointX + i * gridSize * 3
        ctx!.beginPath()
        ctx!.moveTo(x, perspectiveY)
        ctx!.lineTo(vanishingPointX + i * 80, canvas.height)
        ctx!.strokeStyle = `rgba(59, 130, 246, 0.05)`
        ctx!.lineWidth = 0.5
        ctx!.stroke()
      }
    }

    function drawBinaryRain() {
      const colCount = Math.floor(canvas.width / 30)
      for (let i = 0; i < colCount; i++) {
        if (Math.random() > 0.02) continue
        const x = i * 30 + 15
        const y = Math.random() * canvas.height * 0.4
        const char = Math.random() > 0.5 ? '1' : '0'

        ctx!.fillStyle = `rgba(59, 130, 246, ${Math.random() * 0.15 + 0.05})`
        ctx!.font = '10px monospace'
        ctx!.fillText(char, x, y)
      }
    }

    function drawTopLightRays() {
      const rayCount = 5
      for (let i = 0; i < rayCount; i++) {
        const angle = -Math.PI / 2 + (i - rayCount / 2) * 0.15
        const length = canvas.height * 0.4
        const x2 = center.x + Math.cos(angle) * length
        const y2 = center.y + Math.sin(angle) * length

        const gradient = ctx!.createLinearGradient(center.x, 0, x2, y2)
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.15)')
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)')

        ctx!.beginPath()
        ctx!.moveTo(center.x, 0)
        ctx!.lineTo(x2, y2)
        ctx!.strokeStyle = gradient
        ctx!.lineWidth = 2
        ctx!.stroke()
      }
    }

    function draw() {
      time += 16

      drawBackground()
      drawTopLightRays()
      drawGridFloor()
      drawCitySilhouette()
      drawCentralPlatform()
      drawCircuits()
      drawParticles()
      drawGlowNodes()
      drawBinaryRain()

      animationId = requestAnimationFrame(draw)
    }

    resize()
    draw()

    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{ opacity: 0.95 }}
    />
  )
}
