// 湖畔サイトカード（A1/A2/A3）
import TaskItem from './TaskItem'
import ProgressBar from './ProgressBar'
import type { Area, CheckInInfo, KeyStatus } from '../types'
import { isLakesiteRoomDone, isDone } from '../utils/visibleTasks'

interface Props {
  area: Area
  onToggleTask: (roomId: string, taskId: string) => void
  onSetCheckInInfo: (roomId: string, info: Partial<CheckInInfo>) => void
  onSetKeyStatus: (roomId: string, status: KeyStatus) => void
  onSetNote: (roomId: string, note: string) => void
}

export default function LakesiteAreaCard({ area, onToggleTask, onSetCheckInInfo, onSetKeyStatus, onSetNote }: Props) {
  const doneCount = area.rooms.filter(r => isLakesiteRoomDone(r)).length
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
        const keyStatus = room.keyStatus ?? 'unset'
        const done = isLakesiteRoomDone(room)

        return (
          <div key={room.id}>
            {idx > 0 && <div style={{ borderTop: '1px solid var(--border)', margin: '14px 0' }} />}

            <div style={{ opacity: done ? 0.5 : 1, transition: 'opacity 0.3s' }}>
              {/* サイト名 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '16px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: done ? 'var(--accent-green)' : 'var(--text-primary)' }}>
                  {room.id}
                </span>
                {done && <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 700 }}>✓ 完了</span>}
              </div>

              {/* CI時刻 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', minWidth: '52px' }}>CI時刻</label>
                <input
                  type="text"
                  value={room.checkInInfo?.time ?? ''}
                  onChange={e => onSetCheckInInfo(room.id, { time: e.target.value })}
                  placeholder="15:00"
                  style={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    padding: '6px 8px',
                    fontSize: '16px',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none',
                    width: '80px',
                  }}
                />
              </div>

              {/* ゴミ拾いタスク */}
              <div style={{ marginBottom: '10px' }}>
                {room.tasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={() => onToggleTask(room.id, task.id)}
                  />
                ))}
              </div>

              {/* 電源 開/閉 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', minWidth: '44px' }}>電源</span>
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

              {/* 備考 */}
              <textarea
                value={room.note ?? ''}
                onChange={e => onSetNote(room.id, e.target.value)}
                placeholder="備考…"
                rows={2}
                style={{
                  width: '100%',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  padding: '8px 10px',
                  fontSize: '14px',
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
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
          <span style={{ fontSize: '13px', fontWeight: 700, color: allDone ? 'var(--accent-green)' : 'var(--accent-teal)', flexShrink: 0 }}>
            {percent}%
          </span>
        </div>
      </div>
    </div>
  )
}
