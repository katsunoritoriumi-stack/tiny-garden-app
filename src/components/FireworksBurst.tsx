// 小花火：1箇所完了時のバースト（Canvas）
import { useEffect, useRef } from 'react'

interface Props {
  visible: boolean
}

const COLORS = ['#4ecdc4', '#f39c12', '#e74c3c', '#9b59b6', '#2ecc71', '#ffffff']
const DURATION = 800

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  radius: number
}

export default function FireworksBurst({ visible }: Props) {
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

    const W = canvas.width
    const H = canvas.height
    const cx = W / 2
    const cy = H / 2

    const count = 10 + Math.floor(Math.random() * 7) // 10〜16個
    const particles: Particle[] = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2
      const speed = 2.5 + Math.random() * 5
      return {
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        radius: 3 + Math.random() * 3.5,
      }
    })

    ctx.clearRect(0, 0, W, H)
    const start = performance.now()

    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / DURATION, 1)

      ctx.clearRect(0, 0, W, H)
      const alpha = 1 - progress

      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.08 // 重力

        ctx.globalAlpha = Math.max(0, alpha)
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, Math.max(0.5, p.radius * (1 - progress * 0.4)), 0, Math.PI * 2)
        ctx.fill()
      })

      ctx.globalAlpha = 1

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafRef.current)
    }
  }, [visible])

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={400}
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 9999,
        // visible=false のとき透明にして DOM に残す（useEffect から canvas にアクセスするため）
        opacity: visible ? 1 : 0,
      }}
    />
  )
}
