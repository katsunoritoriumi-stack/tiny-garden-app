// 大花火：全タスク完了時のフルスクリーン花火（Canvas）
import { useEffect, useRef } from 'react'

interface Props {
  visible: boolean
  onClose: () => void
}

const PALETTE: string[][] = [
  ['#ff4444', '#ff8888', '#ffbbbb'],
  ['#ffd700', '#ffec6e', '#ffffff'],
  ['#2ecc71', '#88ffbb', '#4ecdc4'],
  ['#4488ff', '#88ccff', '#4ecdc4'],
  ['#aa44ff', '#dd88ff', '#9b59b6'],
  ['#ff9944', '#ffcc88', '#ffffff'],
]
const TOTAL_DURATION = 3000
const BURST_DURATION = 1600

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  radius: number
}

interface FireworkBurst {
  particles: Particle[]
  startMs: number
}

function makeBurst(W: number, H: number, startMs: number): FireworkBurst {
  const x = 60 + Math.random() * (W - 120)
  const y = 60 + Math.random() * (H * 0.55)
  const palette = PALETTE[Math.floor(Math.random() * PALETTE.length)]
  const count = 20 + Math.floor(Math.random() * 11) // 20〜30個

  const particles: Particle[] = Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2
    const speed = 2 + Math.random() * 4.5
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1, // 少し上向きのバイアス
      color: palette[Math.floor(Math.random() * palette.length)],
      radius: 2.5 + Math.random() * 2.5,
    }
  })

  return { particles, startMs }
}

export default function FireworksFullScreen({ visible, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!visible) {
      cancelAnimationFrame(rafRef.current)
      return
    }
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = window.innerWidth
    const H = window.innerHeight
    canvas.width = W
    canvas.height = H

    // 3〜5発の花火を時間差で配置
    const burstCount = 3 + Math.floor(Math.random() * 3)
    const bursts: FireworkBurst[] = Array.from({ length: burstCount }, (_, i) => {
      const delay = (i / burstCount) * (TOTAL_DURATION - BURST_DURATION) * (0.8 + Math.random() * 0.4)
      return makeBurst(W, H, Math.min(delay, TOTAL_DURATION - BURST_DURATION))
    })

    const start = performance.now()

    const animate = (now: number) => {
      const elapsed = now - start

      if (elapsed >= TOTAL_DURATION) {
        ctx.clearRect(0, 0, W, H)
        return
      }

      ctx.clearRect(0, 0, W, H)

      bursts.forEach(burst => {
        const localElapsed = elapsed - burst.startMs
        if (localElapsed <= 0) return
        const progress = Math.min(localElapsed / BURST_DURATION, 1)

        burst.particles.forEach(p => {
          if (progress >= 1) return // バースト終了後は描画しない

          // 物理演算
          p.x += p.vx
          p.y += p.vy
          p.vy += 0.055 // 重力

          const alpha = Math.max(0, 1 - progress)
          const r = Math.max(0.5, p.radius * (1 - progress * 0.35))

          ctx.globalAlpha = alpha
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
          ctx.fill()
        })
      })

      ctx.globalAlpha = 1
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafRef.current)
    }
  }, [visible])

  if (!visible) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.7)',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
