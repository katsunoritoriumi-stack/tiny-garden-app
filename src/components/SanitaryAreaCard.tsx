// キャビンサニタリー専用フラット表示カード（2段階フロー）
import { useState, useEffect, useRef } from 'react'
import type { Area, CleanStatus, KeyStatus } from '../types'
import ProgressBar from './ProgressBar'
import FireworksBurst from './FireworksBurst'

interface Props {
  area: Area
  onSetCleanStatus: (roomId: string, status: CleanStatus) => void
  onSetKeyStatus: (roomId: string, status: KeyStatus) => void
}

export default function SanitaryAreaCard({ area, onSetCleanStatus, onSetKeyStatus }: Props) {
  const [celebratingRoom, setCelebratingRoom] = useState<string | null>(null)
  const [burstRoomId, setBurstRoomId] = useState<string | null>(null)
  const prevStatusRef = useRef<Record<string, string>>({})

  useEffect(() => {
    area.rooms.forEach(room => {
      const prev = prevStatusRef.current[room.id]
      const curr = room.cleanStatus ?? 'unset'
      if (prev !== undefined && prev !== 'done' && curr === 'done') {
        setCelebratingRoom(room.id)
        setTimeout(() => setCelebratingRoom(null), 1500)
        setBurstRoomId(room.id)
        setTimeout(() => setBurstRoomId(null), 800)
      }
      prevStatusRef.current[room.id] = curr
    })
  }, [area.rooms])

  const doneCount = area.rooms.filter(r => {
    const cs = r.cleanStatus ?? 'unset'
    return cs === 'done' || cs === 'skip'
  }).length
  const totalCount = area.rooms.length
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
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '16px',
          transition: 'border-color 0.3s',
        }}
      >
        {area.rooms.map((room, idx) => {
          const cleanStatus = room.cleanStatus ?? 'unset'
          const keyStatus = room.keyStatus ?? 'unset'

          const isNeeded = cleanStatus === 'needed'
          const isSkip = cleanStatus === 'skip'
          const isDoneStatus = cleanStatus === 'done'
          const isCompleted = isDoneStatus || isSkip

          return (
            <div key={room.id}>
              <FireworksBurst visible={burstRoomId === room.id} />
              {idx > 0 && <div style={{ borderTop: '1px solid var(--border)', margin: '12px 0' }} />}

              <div style={{ opacity: isCompleted ? 0.4 : 1, transition: 'opacity 0.3s ease' }}>
                {/* 部屋名 */}
                <div style={{ marginBottom: '8px' }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)',
                    transition: 'color 0.2s',
                  }}>
                    {room.name ?? room.id}
                  </span>
                </div>

                {/* 掃除 + 鍵 行 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: (isNeeded || isDoneStatus) ? '8px' : '0' }}>
                  {/* 掃除ボタン */}
                  <button
                    onClick={() => onSetCleanStatus(room.id, isNeeded ? 'unset' : 'needed')}
                    disabled={isDoneStatus}
                    style={{
                      padding: '8px 14px',
                      minHeight: '40px',
                      border: `2px solid ${isNeeded ? 'var(--accent-green)' : 'var(--border)'}`,
                      borderRadius: '8px',
                      background: isNeeded ? 'rgba(46,204,113,0.2)' : 'transparent',
                      color: isNeeded ? 'var(--accent-green)' : 'var(--text-secondary)',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: isDoneStatus ? 'default' : 'pointer',
                      transition: 'all 0.15s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isNeeded ? '🧹 掃除 ✓' : '🧹 掃除'}
                  </button>

                  {/* 鍵ラベル */}
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', flexShrink: 0 }}>鍵：</span>

                  {/* 開ボタン */}
                  <button
                    onClick={() => onSetKeyStatus(room.id, keyStatus === 'open' ? 'unset' : 'open')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      minHeight: '40px',
                      border: `2px solid ${keyStatus === 'open' ? '#f39c12' : 'var(--border)'}`,
                      borderRadius: '8px',
                      background: keyStatus === 'open' ? 'rgba(243,156,18,0.2)' : 'transparent',
                      color: keyStatus === 'open' ? '#f39c12' : 'var(--text-secondary)',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    開
                  </button>

                  {/* 閉ボタン */}
                  <button
                    onClick={() => onSetKeyStatus(room.id, keyStatus === 'closed' ? 'unset' : 'closed')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      minHeight: '40px',
                      border: `2px solid ${keyStatus === 'closed' ? 'var(--accent-teal)' : 'var(--border)'}`,
                      borderRadius: '8px',
                      background: keyStatus === 'closed' ? 'rgba(78,205,196,0.15)' : 'transparent',
                      color: keyStatus === 'closed' ? 'var(--accent-teal)' : 'var(--text-secondary)',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    閉
                  </button>
                </div>

                {/* STEP2: 完了ボタン（needed時のみ表示） */}
                {isNeeded && (
                  <button
                    onClick={() => onSetCleanStatus(room.id, 'done')}
                    style={{
                      width: '100%',
                      padding: '10px',
                      minHeight: '44px',
                      border: 'none',
                      borderRadius: '8px',
                      background: 'var(--accent-teal)',
                      color: '#0f1923',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      letterSpacing: '0.1em',
                    }}
                  >
                    完　了
                  </button>
                )}

                {/* 完了済みボタン（done時のみ表示、タップでリセット） */}
                {isDoneStatus && (
                  <button
                    onClick={() => onSetCleanStatus(room.id, 'unset')}
                    style={{
                      width: '100%',
                      padding: '10px',
                      minHeight: '44px',
                      border: '2px solid var(--accent-green)',
                      borderRadius: '8px',
                      background: 'rgba(46,204,113,0.15)',
                      color: 'var(--accent-green)',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    ✓ 完了済み
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {/* 進捗 */}
        <div style={{ borderTop: '1px solid var(--border)', marginTop: '14px', paddingTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', flexShrink: 0 }}>
              完了：{doneCount} / {totalCount}
            </span>
            <div style={{ flex: 1 }}>
              <ProgressBar value={percent} height={6} />
            </div>
            <span style={{
              fontSize: '13px',
              fontWeight: 700,
              color: allDone ? 'var(--accent-green)' : 'var(--accent-teal)',
              flexShrink: 0,
            }}>
              {percent}%
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
