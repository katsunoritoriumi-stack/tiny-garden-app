// ロッジ客室カード（L01〜L06）
import TaskItem from './TaskItem'
import ProgressBar from './ProgressBar'
import type { Area, CheckInInfo } from '../types'
import { isDone } from '../utils/visibleTasks'

interface Props {
  area: Area
  staffList: string[]
  onToggleTask: (roomId: string, taskId: string) => void
  onCompleteAll: (roomId: string) => void
  onSetCheckInInfo: (roomId: string, info: Partial<CheckInInfo>) => void
  onSetAssignedStaff: (roomId: string, staff: string) => void
  onSetNote: (roomId: string, note: string) => void
}

export default function LodgeAreaCard({
  area,
  staffList,
  onToggleTask,
  onCompleteAll,
  onSetCheckInInfo,
  onSetAssignedStaff,
  onSetNote,
}: Props) {
  const allTasks = area.rooms.flatMap(r => r.tasks)
  const doneCount = allTasks.filter(t => isDone(t.status)).length
  const totalCount = allTasks.length
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
        const roomDoneCount = room.tasks.filter(t => isDone(t.status)).length
        const roomTotal = room.tasks.length
        const roomPercent = roomTotal > 0 ? Math.round((roomDoneCount / roomTotal) * 100) : 0
        const roomDone = roomDoneCount === roomTotal && roomTotal > 0

        return (
          <div key={room.id}>
            {idx > 0 && <div style={{ borderTop: '1px solid var(--border)', margin: '14px 0' }} />}

            <div style={{ opacity: roomDone ? 0.5 : 1, transition: 'opacity 0.3s' }}>
              {/* 部屋名 + 進捗 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{
                  fontSize: '16px',
                  fontWeight: 900,
                  fontFamily: 'var(--font-mono)',
                  color: roomDone ? 'var(--accent-green)' : 'var(--text-primary)',
                  transition: 'color 0.2s',
                }}>
                  {room.id}
                </span>
                {roomDone && <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 700 }}>✓ 完了</span>}
                <div style={{ flex: 1 }}>
                  <ProgressBar value={roomPercent} height={4} />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                  {roomDoneCount}/{roomTotal}
                </span>
              </div>

              {/* CI情報 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
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
                    width: '76px',
                  }}
                />
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>大人</label>
                <input
                  type="number"
                  min={0}
                  value={room.checkInInfo?.adults ?? ''}
                  onChange={e => onSetCheckInInfo(room.id, { adults: e.target.value === '' ? undefined : Number(e.target.value) })}
                  placeholder="0"
                  style={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    padding: '6px 8px',
                    fontSize: '16px',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none',
                    width: '56px',
                  }}
                />
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>子供</label>
                <input
                  type="number"
                  min={0}
                  value={room.checkInInfo?.children ?? ''}
                  onChange={e => onSetCheckInInfo(room.id, { children: e.target.value === '' ? undefined : Number(e.target.value) })}
                  placeholder="0"
                  style={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    padding: '6px 8px',
                    fontSize: '16px',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none',
                    width: '56px',
                  }}
                />
              </div>

              {/* 担当者 */}
              {staffList.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', minWidth: '52px' }}>担当者</span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {staffList.map(s => (
                      <button
                        key={s}
                        onClick={() => onSetAssignedStaff(room.id, room.assignedStaff === s ? '' : s)}
                        style={{
                          padding: '5px 10px',
                          minHeight: '34px',
                          border: `1px solid ${room.assignedStaff === s ? 'var(--accent-teal)' : 'var(--border)'}`,
                          borderRadius: '16px',
                          background: room.assignedStaff === s ? 'rgba(78,205,196,0.2)' : 'transparent',
                          color: room.assignedStaff === s ? 'var(--accent-teal)' : 'var(--text-secondary)',
                          fontSize: '13px',
                          fontWeight: room.assignedStaff === s ? 700 : 400,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* タスクリスト */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '8px' }}>
                {room.tasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={() => onToggleTask(room.id, task.id)}
                  />
                ))}
              </div>

              {/* 一括完了ボタン */}
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
                    marginBottom: '8px',
                  }}
                >
                  ✓ 完了にする（一括）
                </button>
              )}

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
