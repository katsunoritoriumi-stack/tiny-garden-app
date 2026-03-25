// ロッジB1外の流しカード
import TaskItem from './TaskItem'
import ProgressBar from './ProgressBar'
import type { Area, CleanStatus } from '../types'
import { isDone, isLodgeSinkDone } from '../utils/visibleTasks'

interface Props {
  area: Area
  onToggleTask: (roomId: string, taskId: string) => void
  onCompleteAll: (roomId: string) => void
  onSetCleanStatus: (roomId: string, status: CleanStatus) => void
  onResetClean: (roomId: string) => void
}

export default function LodgeSinkAreaCard({
  area, onToggleTask, onCompleteAll, onSetCleanStatus, onResetClean,
}: Props) {
  const doneCount = area.rooms.filter(r => isLodgeSinkDone(r)).length
  const totalCount = area.rooms.length
  const percent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0
  const allDone = doneCount === totalCount && totalCount > 0

  return (
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
        const roomDone = isLodgeSinkDone(room)
        const roomDoneCount = room.tasks.filter(t => isDone(t.status)).length
        const roomTotal = room.tasks.length
        const roomPercent = roomTotal > 0 ? Math.round((roomDoneCount / roomTotal) * 100) : 0

        return (
          <div key={room.id}>
            {idx > 0 && <div style={{ borderTop: '1px solid var(--border)', margin: '14px 0' }} />}

            {/* 部屋名 + 進捗 */}
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
  )
}
