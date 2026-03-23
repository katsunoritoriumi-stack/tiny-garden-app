// 部屋カードコンポーネント（エリア詳細画面用）
import { useState } from 'react'
import TaskItem from './TaskItem'
import ProgressBar from './ProgressBar'
import type { CheckInInfo, DateKey, Room, WorkMode } from '../types'
import { getVisibleTasks, isDone } from '../utils/visibleTasks'

// 作業モードのボタン定義（通常エリア用）
interface ModeBtn { mode: WorkMode; label: string; color: string; bg: string }

const COMFORT_BTNS: ModeBtn[] = [
  { mode: 'set',   label: 'セット', color: '#3498db', bg: 'rgba(52,152,219,0.15)' },
  { mode: 'clean', label: '清掃',   color: '#2ecc71', bg: 'rgba(46,204,113,0.15)' },
]
const DEFAULT_BTNS: ModeBtn[] = [
  { mode: 'check', label: '確認', color: '#f39c12', bg: 'rgba(243,156,18,0.15)' },
  { mode: 'clean', label: '清掃', color: '#2ecc71', bg: 'rgba(46,204,113,0.15)' },
]

interface RoomCardProps {
  room: Room
  areaId: string
  dateKey: DateKey
  staffList: string[]
  onToggleTask: (taskId: string) => void
  onSetKeyState: (taskId: string, state: 'key_open' | 'key_closed' | 'pending') => void
  onSetWorkMode: (mode: WorkMode) => void
  onSetCheckInInfo: (info: Partial<CheckInInfo>) => void
  onSetAssignedStaff: (staff: string) => void
  onSetNote: (note: string) => void
  onCompleteAll: () => void
}

export default function RoomCard({
  room,
  staffList,
  onToggleTask,
  onSetKeyState,
  onSetNote,
  onCompleteAll,
  onSetWorkMode,
  onSetCheckInInfo,
  onSetAssignedStaff,
}: RoomCardProps) {
  const [expanded, setExpanded] = useState(false)

  const isSetCleanMode = room.areaType === 'comfort' || room.areaType === 'lodge'
  const modeBtns = isSetCleanMode ? COMFORT_BTNS : DEFAULT_BTNS
  const workMode = room.workMode
  const isSelected = workMode !== null

  const visibleTasks = getVisibleTasks(room)
  const doneCount = visibleTasks.filter(t => isDone(t.status)).length
  const totalTasks = visibleTasks.length
  const percent = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0
  const allDone = isSelected && doneCount === totalTasks && totalTasks > 0

  // 通常エリア
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: `1px solid ${allDone ? 'var(--accent-green)' : 'var(--border)'}`,
        borderRadius: '12px',
        overflow: 'hidden',
        opacity: isSelected ? 1 : 0.4,
        transition: 'opacity 0.2s, border-color 0.2s',
      }}
    >
      {/* ── カードヘッダー（タップで展開） ── */}
      <button
        onClick={() => setExpanded(v => !v)}
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
        }}
      >
        {/* 部屋番号 */}
        <span
          style={{
            fontSize: '16px',
            fontWeight: 900,
            color: allDone ? 'var(--accent-green)' : 'var(--text-primary)',
            minWidth: '52px',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {room.id}
        </span>

        {/* 進捗 */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {allDone && (
              <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 700 }}>✓ 完了</span>
            )}
            {isSelected && room.assignedStaff && (
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {room.assignedStaff}
              </span>
            )}
          </div>
          {isSelected && (
            <div style={{ marginTop: '6px' }}>
              <ProgressBar value={percent} height={4} />
            </div>
          )}
        </div>

        {/* タスク数 + 矢印 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {isSelected && (
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {doneCount}/{totalTasks}
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

          {/* 作業モード選択ボタン（2択） */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            {modeBtns.map(({ mode, label, color, bg }) => {
              const active = workMode === mode
              return (
                <button
                  key={mode}
                  onClick={(e) => { e.stopPropagation(); onSetWorkMode(mode) }}
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

          {/* CI情報入力欄（常に表示） */}
          <div style={{ marginBottom: '10px', padding: '0 4px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '14px', color: 'var(--text-secondary)', minWidth: '52px' }}>CI時刻</label>
              <input
                type="text"
                value={room.checkInInfo?.time ?? ''}
                onChange={e => onSetCheckInInfo({ time: e.target.value })}
                onClick={e => e.stopPropagation()}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '14px', color: 'var(--text-secondary)', minWidth: '52px' }}>大人</label>
              <input
                type="text"
                inputMode="numeric"
                value={room.checkInInfo?.adults !== undefined ? String(room.checkInInfo.adults) : ''}
                onChange={e => {
                  const val = e.target.value
                  onSetCheckInInfo({ adults: val === '' ? undefined : Number(val) })
                }}
                onClick={e => e.stopPropagation()}
                placeholder="0"
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  padding: '6px 8px',
                  fontSize: '16px',
                  outline: 'none',
                  width: '60px',
                  textAlign: 'center',
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
                  onSetCheckInInfo({ children: val === '' ? undefined : Number(val) })
                }}
                onClick={e => e.stopPropagation()}
                placeholder="0"
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  padding: '6px 8px',
                  fontSize: '16px',
                  outline: 'none',
                  width: '60px',
                  textAlign: 'center',
                }}
              />
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>名</span>
            </div>
          </div>

          {/* 担当者プルダウン（作業モード選択済みの場合のみ） */}
          {isSelected && (
            <div style={{ marginBottom: '10px', padding: '0 4px' }}>
              <select
                value={room.assignedStaff ?? ''}
                onChange={e => onSetAssignedStaff(e.target.value)}
                onClick={e => e.stopPropagation()}
                style={{
                  width: '100%',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  padding: '8px 12px',
                  fontSize: '16px',
                  outline: 'none',
                  minHeight: '52px',
                  cursor: 'pointer',
                }}
              >
                <option value="">未割当</option>
                {staffList.map(staff => (
                  <option key={staff} value={staff}>{staff}</option>
                ))}
              </select>
            </div>
          )}

          {/* タスクリスト（作業モード選択済みの場合のみ） */}
          {isSelected && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '10px' }}>
                {visibleTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={() => onToggleTask(task.id)}
                    onSetKeyState={task.label === '鍵確認' ? (state) => onSetKeyState(task.id, state) : undefined}
                  />
                ))}
              </div>

              {/* 備考入力 */}
              <textarea
                value={room.note ?? ''}
                onChange={e => onSetNote(e.target.value)}
                placeholder="備考を入力…"
                rows={2}
                style={{
                  width: '100%',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  padding: '8px 10px',
                  fontSize: '16px',
                  resize: 'vertical',
                  outline: 'none',
                  marginBottom: '10px',
                  boxSizing: 'border-box',
                }}
              />

              {/* 一括完了ボタン */}
              {!allDone && (
                <button
                  onClick={onCompleteAll}
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
                    minHeight: '52px',
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.85')}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
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
}
