// お風呂エリアカード（女湯・男湯）
import { useState, useEffect, useRef } from 'react'
import TaskItem from './TaskItem'
import ProgressBar from './ProgressBar'
import type { Area } from '../types'
import { isDone, isBathRoomDone } from '../utils/visibleTasks'
import FireworksBurst from './FireworksBurst'

interface Props {
  area: Area
  onToggleTask: (roomId: string, taskId: string) => void
  onCompleteAll: (roomId: string) => void
}

export default function BathAreaCard({ area, onToggleTask, onCompleteAll }: Props) {
  const [cleanExpanded, setCleanExpanded] = useState<Record<string, boolean>>({})
  const [celebratingRoom, setCelebratingRoom] = useState<string | null>(null)
  const [burstRoomId, setBurstRoomId] = useState<string | null>(null)
  const prevDoneRef = useRef<Record<string, boolean>>({})

  useEffect(() => {
    area.rooms.forEach(room => {
      const prev = prevDoneRef.current[room.id]
      const curr = isBathRoomDone(room)
      if (prev !== undefined && !prev && curr) {
        setCelebratingRoom(room.id)
        setTimeout(() => setCelebratingRoom(null), 1500)
        setBurstRoomId(room.id)
        setTimeout(() => setBurstRoomId(null), 800)
      }
      prevDoneRef.current[room.id] = curr
    })
  }, [area.rooms])

  const allTasks = area.rooms.flatMap(r => r.tasks)
  const doneCount = allTasks.filter(t => isDone(t.status)).length
  const totalCount = allTasks.length
  const percent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0
  const allDone = doneCount === totalCount && totalCount > 0

  return (
    <>
      <style>{`
        @keyframes yatter-fade {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
          20%  { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
          80%  { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
        }
      `}</style>

      {celebratingRoom !== null && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          zIndex: 9999,
          pointerEvents: 'none',
          animation: 'yatter-fade 1.5s ease forwards',
          background: 'rgba(15,25,35,0.88)',
          borderRadius: '16px',
          padding: '20px 32px',
          fontSize: '22px',
          fontWeight: 800,
          color: 'var(--accent-teal)',
          whiteSpace: 'nowrap',
        }}>
          🎉 ヤッター！
        </div>
      )}

      <div
        style={{
          background: 'var(--bg-secondary)',
          border: `1px solid ${allDone ? 'var(--accent-green)' : 'var(--border)'}`,
          borderRadius: '12px',
          padding: '16px',
          transition: 'border-color 0.3s',
        }}
      >
        {area.rooms.map((room, idx) => {
          const roomDone = isBathRoomDone(room)
          const roomDoneCount = room.tasks.filter(t => isDone(t.status)).length
          const roomTotal = room.tasks.length
          const roomPercent = roomTotal > 0 ? Math.round((roomDoneCount / roomTotal) * 100) : 0
          const expanded = cleanExpanded[room.id] ?? false

          return (
            <div key={room.id}>
              <FireworksBurst visible={burstRoomId === room.id} />
              {idx > 0 && <div style={{ borderTop: '1px solid var(--border)', margin: '14px 0' }} />}

              {/* 部屋名 + 進捗 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: roomDone ? 'var(--accent-green)' : 'var(--text-primary)',
                  transition: 'color 0.2s',
                }}>
                  {room.name ?? room.id}
                </span>
                {roomDone && <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 700 }}>✓ 完了</span>}
                <div style={{ flex: 1 }}>
                  <ProgressBar value={roomPercent} height={4} />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                  {roomDoneCount}/{roomTotal}
                </span>
              </div>

              {/* 掃除トグルボタン */}
              <button
                onClick={() => setCleanExpanded(prev => ({ ...prev, [room.id]: !expanded }))}
                style={{
                  width: '100%',
                  padding: '8px 14px',
                  minHeight: '40px',
                  border: `2px solid ${expanded ? 'var(--accent-teal)' : 'var(--border)'}`,
                  borderRadius: '8px',
                  background: expanded ? 'rgba(78,205,196,0.2)' : 'transparent',
                  color: expanded ? 'var(--accent-teal)' : 'var(--text-secondary)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  marginBottom: expanded ? '10px' : '0',
                  textAlign: 'left',
                }}
              >
                🧹 掃除{expanded ? ' ▲' : ' ▼'}
              </button>

              {/* 展開時：タスクリスト + 一括完了 */}
              {expanded && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '8px' }}>
                    {room.tasks.map(task => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggle={() => onToggleTask(room.id, task.id)}
                      />
                    ))}
                  </div>

                  {!roomDone && (
                    <button
                      onClick={() => onCompleteAll(room.id)}
                      style={{
                        width: '100%',
                        background: 'var(--accent-teal)',
                        color: '#0f1923',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        minHeight: '44px',
                      }}
                    >
                      ✓ 完了にする（一括）
                    </button>
                  )}
                </>
              )}
            </div>
          )
        })}

        {/* 全体進捗 */}
        <div style={{ borderTop: '1px solid var(--border)', marginTop: '14px', paddingTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', flexShrink: 0 }}>
              完了：{doneCount} / {totalCount}
            </span>
            <div style={{ flex: 1 }}>
              <ProgressBar value={percent} height={6} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: allDone ? 'var(--accent-green)' : 'var(--accent-teal)', flexShrink: 0 }}>
              {percent}%
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
