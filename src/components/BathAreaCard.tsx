// お風呂エリアカード（女湯・男湯）
import { useEffect, useRef, useState } from 'react'
import TaskItem from './TaskItem'
import ProgressBar from './ProgressBar'
import type { Area, CleanStatus } from '../types'
import { isDone, isBathRoomDone } from '../utils/visibleTasks'
import FireworksBurst from './FireworksBurst'

interface Props {
  area: Area
  onToggleTask: (roomId: string, taskId: string) => void
  onCompleteAll: (roomId: string) => void
  onSetCleanStatus: (roomId: string, status: CleanStatus) => void
  onResetClean: (roomId: string) => void
}

export default function BathAreaCard({ area, onToggleTask, onCompleteAll, onSetCleanStatus, onResetClean }: Props) {
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

  const doneRoomCount = area.rooms.filter(r => isBathRoomDone(r)).length
  const totalRoomCount = area.rooms.length
  const percent = totalRoomCount > 0 ? Math.round((doneRoomCount / totalRoomCount) * 100) : 0
  const allDone = doneRoomCount === totalRoomCount && totalRoomCount > 0

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
          position: 'fixed', top: '50%', left: '50%', zIndex: 9999,
          pointerEvents: 'none', animation: 'yatter-fade 1.5s ease forwards',
          background: 'rgba(15,25,35,0.88)', borderRadius: '16px', padding: '20px 32px',
          fontSize: '22px', fontWeight: 800, color: 'var(--accent-teal)', whiteSpace: 'nowrap',
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
          const cleanStatus = room.cleanStatus ?? 'unset'
          const isNeeded = cleanStatus === 'needed'
          const roomDone = isBathRoomDone(room)
          const roomDoneCount = room.tasks.filter(t => isDone(t.status)).length
          const roomTotal = room.tasks.length
          const roomPercent = roomTotal > 0 ? Math.round((roomDoneCount / roomTotal) * 100) : 0

          return (
            <div key={room.id}>
              <FireworksBurst visible={burstRoomId === room.id} />
              {idx > 0 && <div style={{ borderTop: '1px solid var(--border)', margin: '14px 0' }} />}

              {/* 部屋名 + 進捗バー（掃除中のみ） */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{
                  fontSize: '15px', fontWeight: 700,
                  color: roomDone ? 'var(--accent-green)' : 'var(--text-primary)',
                  transition: 'color 0.2s',
                }}>
                  {room.name ?? room.id}
                </span>
                {roomDone && (
                  <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 700 }}>✓ 完了</span>
                )}
                {isNeeded && !roomDone && (
                  <>
                    <div style={{ flex: 1 }}>
                      <ProgressBar value={roomPercent} height={4} />
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                      {roomDoneCount}/{roomTotal}
                    </span>
                  </>
                )}
              </div>

              {/* 🧹 掃除 ボタン */}
              <button
                onClick={() => onSetCleanStatus(room.id, isNeeded ? 'unset' : 'needed')}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  minHeight: '48px',
                  border: `2px solid ${isNeeded ? '#e67e22' : 'var(--border)'}`,
                  borderRadius: '8px',
                  background: isNeeded ? 'rgba(230,126,34,0.15)' : 'transparent',
                  color: isNeeded ? '#e67e22' : 'var(--text-secondary)',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  marginBottom: isNeeded ? '10px' : '0',
                  textAlign: 'center',
                }}
              >
                🧹 掃除{isNeeded ? ' ✓' : ''}
              </button>

              {/* 展開時：タスクリスト + 完了/完了済みボタン */}
              {isNeeded && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '10px' }}>
                    {room.tasks.map(task => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggle={() => onToggleTask(room.id, task.id)}
                      />
                    ))}
                  </div>

                  {roomDone ? (
                    <button
                      onClick={() => onResetClean(room.id)}
                      style={{
                        width: '100%', padding: '10px', minHeight: '48px',
                        border: '2px solid var(--accent-green)', borderRadius: '8px',
                        background: 'rgba(46,204,113,0.15)', color: 'var(--accent-green)',
                        fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      ✓ 完了済み
                    </button>
                  ) : (
                    <button
                      onClick={() => onCompleteAll(room.id)}
                      style={{
                        width: '100%', padding: '10px', minHeight: '48px',
                        border: 'none', borderRadius: '8px',
                        background: 'var(--accent-teal)', color: '#0f1923',
                        fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      ✓ 完了
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
              完了：{doneRoomCount} / {totalRoomCount}
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
