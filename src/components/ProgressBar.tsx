// 進捗バーコンポーネント
interface ProgressBarProps {
  value: number  // 0〜100
  color?: string
  height?: number
  animated?: boolean
}

export default function ProgressBar({
  value,
  color = 'var(--accent-teal)',
  height = 6,
  animated = true,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value))

  return (
    <div
      style={{
        width: '100%',
        height: `${height}px`,
        background: 'var(--border)',
        borderRadius: '999px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          background: pct === 100 ? 'var(--accent-green)' : color,
          borderRadius: '999px',
          transition: animated ? 'width 0.4s ease' : 'none',
        }}
      />
    </div>
  )
}
