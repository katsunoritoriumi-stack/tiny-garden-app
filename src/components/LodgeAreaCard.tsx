// ロッジ客室カード（L01〜L06）アコーディオン式
import { useState } from 'react'
import TaskItem from './TaskItem'
import ProgressBar from './ProgressBar'
import type { Area, CheckInInfo, WorkMode } from '../types'
import { isDone } from '../utils/visibleTasks'

const LODGE_MODE_BTNS = [
  { mode: 'set' as const,   label: 'セット', color: '#3498db', bg: 'rgba(52,152,219,0.15)' },
  { mode: 'clean' as const, label: '清掃',   color: '#2ecc71', bg: 'rgba(46,204,113,0.15)' },
]

interface Props {
  area: Area
  staffList: string[]
  onToggleTask: (roomId: string, taskId: string) => void
  onCompleteAll: (roomId: string) => void
  onSetCheckInInfo: (roomId: string, info: Partial<CheckInInfo>) => void
  onSetAssignedStaff: (roomId: string, staff: string) => void
  onSetNote: (roomId: string, note: string) => void
  onSetWorkMode: (roomId: string, mode: WorkMode) => void
}

export default function LodgeAreaCard({
  area, staffList, onToggleTask, onCompleteAll,
  onSetCheckInInfo, onSetAssignedStaff, onSetNote, onSetWorkMode,
}: Props) {
  const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({})

  const selectedRooms = area.rooms.filter(r => r.workMode != null)
  const allTasks = selectedRooms.flatMap(r => r.tasks)
  const doneCount = allTasks.filter(t => isDone(t.status)).length
  const totalCount = allTasks.length
  const percent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0
  const allDone = totalCount > 0 && doneCount === totalCount

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: `1px solid ${allDone ? 'var(--accent-green)' : 'var(--border)'}`,
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'border-color 0.3s',
      }}
    >
      {area.rooms.map(room => {
        const expanded = expandedRooms[room.id] ?? false
        const isSelected = room.workMode != null
        const roomDoneCount = room.tasks.filter(t => isDone(t.status)).length
        const roomTotal = room.tasks.length
        const roomPercent = roomTotal > 0 ? Math.round((roomDoneCount / roomTotal) * 100) : 0
        const roomAllDone = isSelected && roomDoneCount === roomTotal && roomTotal > 0

        return (
          <div
            key={room.id}
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            {/* ── ヘッダー行（タップで展開） ── */}
            <button
              onClick={() => setExpandedRooms(prev => ({ ...prev, [room.id]: !expanded }))}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '12px 14px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: '56px',
                opacity: isSelected ? 1 : 0.4,
                transition: 'opacity 0.2s',
              }}
            >
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 900,
                  fontFamily: 'var(--font-mono)',
                  color: roomAllDone ? 'var(--accent-green)' : 'var(--text-primary)',
                  minWidth: '52px',
                  transition: 'color 0.2s',
                }}
              >
                {room.id}
              </span>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  {roomAllDone && (
                    <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 700 }}>✓ 完了</span>
                  )}
                  {isSelected && room.assignedStaff && (
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{room.assignedStaff}</span>
                  )}
                </div>
                {isSelected && (
                  <div style={{ marginTop: '6px' }}>
                    <ProgressBar value={roomPercent} height={4} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {isSelected && (
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {roomDoneCount}/{roomTotal}
                  </span>
                )}
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    transition: 'transform 0.2s',
                    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                >
                  ▼
                </span>
              </div>
            </button>

            {/* ── アコーディオン展開部分 ── */}
            {expanded && (
              <div style={{ borderTop: '1px solid var(--border)', padding: '10px 10px 14px' }}>

                {/* 作業モード選択（セット/清掃） */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  {LODGE_MODE_BTNS.map(({ mode, label, color, bg }) => {
                    const active = room.workMode === mode
                    return (
                      <button
                        key={mode}
                        onClick={() => onSetWorkMode(room.id, mode)}
                        style={{
                          flex: 1,
                          padding: '8px 0',
                          minHeight: '52px',
                          border: `2px solid ${active ? color : 'var(--border)'}`,
                          borderRadius: '8px',
                          background: active ? bg : 'transparent',
                          color: active ? color : 'var(--text-secondary)',
                          fontSize: '14px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>

                {/* CI情報入力欄 */}
                <div style={{ marginBottom: '10px', padding: '0 4px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '14px', color: 'var(--text-secondary)', minWidth: '52px' }}>CI時刻</label>
                    <input
                      type="text"
                      value={room.checkInInfo?.time ?? ''}
                      onChange={e => onSetCheckInInfo(room.id, { time: e.target.value })}
                      placeholder="15:00"
                      style={{
                        background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px',
                        color: 'var(--text-primary)', padding: '6px 8px', fontSize: '16px',
                        fontFamily: 'var(--font-mono)', outline: 'none', width: '80px',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '14px', color: 'var(--text-secondary)', minWidth: '52px' }}>大人</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={room.checkInInfo?.adults !== undefined ? String(room.checkInInfo.adults) : ''}
                      onChange={e => {
                        const val = e.target.value
                        onSetCheckInInfo(room.id, { adults: val === '' ? undefined : Number(val) })
                      }}
                      placeholder="0"
                      style={{
                        background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px',
                        color: 'var(--text-primary)', padding: '6px 8px', fontSize: '16px',
                        outline: 'none', width: '60px', textAlign: 'center',
                      }}
                    />
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>名</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '14px', color: 'var(--text-secondary)', minWidth: '52px' }}>子供</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={room.checkInInfo?.children !== undefined ? String(room.checkInInfo.children) : ''}
                      onChange={e => {
                        const val = e.target.value
                        onSetCheckInInfo(room.id, { children: val === '' ? undefined : Number(val) })
                      }}
                      placeholder="0"
                      style={{
                        background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px',
                        color: 'var(--text-primary)', padding: '6px 8px', fontSize: '16px',
                        outline: 'none', width: '60px', textAlign: 'center',
                      }}
                    />
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>名</span>
                  </div>
                </div>

                {/* 担当者選択 */}
                {staffList.length > 0 && (
                  <div style={{ marginBottom: '10px', padding: '0 4px' }}>
                    <select
                      value={room.assignedStaff ?? ''}
                      onChange={e => onSetAssignedStaff(room.id, e.target.value)}
                      style={{
                        width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                        borderRadius: '8px', color: 'var(--text-primary)', padding: '8px 12px',
                        fontSize: '16px', outline: 'none', minHeight: '52px', cursor: 'pointer',
                      }}
                    >
                      <option value="">未割当</option>
                      {staffList.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}

                {/* タスクリスト（作業モード選択済みの場合のみ） */}
                {isSelected && (
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

                    {/* 備考入力 */}
                    <textarea
                      value={room.note ?? ''}
                      onChange={e => onSetNote(room.id, e.target.value)}
                      placeholder="備考を入力…"
                      rows={2}
                      style={{
                        width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                        borderRadius: '8px', color: 'var(--text-primary)', padding: '8px 10px',
                        fontSize: '16px', resize: 'vertical', outline: 'none',
                        marginBottom: '10px', boxSizing: 'border-box',
                      }}
                    />

                    {/* 一括完了ボタン */}
                    {!roomAllDone && (
                      <button
                        onClick={() => onCompleteAll(room.id)}
                        style={{
                          width: '100%', background: 'var(--accent-teal)', color: '#0f1923',
                          border: 'none', borderRadius: '8px', padding: '10px',
                          fontSize: '14px', fontWeight: 700, cursor: 'pointer', minHeight: '52px',
                        }}
                      >
                        ✓ 完了にする（一括）
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* 全体進捗 */}
      <div style={{ padding: '10px 14px' }}>
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
