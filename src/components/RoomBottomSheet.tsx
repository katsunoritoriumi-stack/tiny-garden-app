// ルームボトムシートコンポーネント（ダッシュボード棟バッジタップ時）
import { useEffect, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import TaskItem from './TaskItem'
import type { DateKey, WorkMode } from '../types'
import { getVisibleTasks, isDone } from '../utils/visibleTasks'

interface ModeBtn { mode: WorkMode; label: string; color: string; bg: string }
const COMFORT_BTNS: ModeBtn[] = [
  { mode: 'set',   label: 'セット', color: '#3498db', bg: 'rgba(52,152,219,0.15)' },
  { mode: 'clean', label: '清掃',   color: '#2ecc71', bg: 'rgba(46,204,113,0.15)' },
]
const DEFAULT_BTNS: ModeBtn[] = [
  { mode: 'check', label: '確認', color: '#f39c12', bg: 'rgba(243,156,18,0.15)' },
  { mode: 'clean', label: '清掃', color: '#2ecc71', bg: 'rgba(46,204,113,0.15)' },
]

interface Props {
  areaId: string
  roomId: string
  dateKey: DateKey
  onClose: () => void
}

export default function RoomBottomSheet({ areaId, roomId, dateKey, onClose }: Props) {
  const {
    days, staffList,
    toggleTask, setKeyState, setWorkMode, setAssignedStaff, completeAllTasks,
  } = useAppStore()

  const [visible, setVisible] = useState(false)
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 280)
  }

  const area = days[dateKey].areas.find(a => a.id === areaId)
  const room = area?.rooms.find(r => r.id === roomId)
  if (!area || !room) return null

  const isSetCleanMode = room.areaType === 'comfort' || room.areaType === 'lodge'
  const modeBtns = isSetCleanMode ? COMFORT_BTNS : DEFAULT_BTNS
  const workMode = room.workMode
  const isSelected = workMode !== null

  const visibleTasks = getVisibleTasks(room)
  const doneCount = visibleTasks.filter(t => isDone(t.status)).length
  const allDone = isSelected && doneCount === visibleTasks.length && visibleTasks.length > 0

  const currentBadge = workMode ? modeBtns.find(b => b.mode === workMode) : null

  return (
    <>
      {/* オーバーレイ */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 100,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.28s ease',
        }}
      />

      {/* シート本体 */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '75vh',
          background: 'var(--bg-secondary)',
          borderRadius: '16px 16px 0 0',
          zIndex: 101,
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.28s ease-out',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ヘッダー */}
        <div style={{
          padding: '14px 16px 12px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: '20px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            {room.id}
          </span>
          {currentBadge && (
            <span style={{ fontSize: '13px', fontWeight: 700, color: currentBadge.color }}>
              {currentBadge.label}
            </span>
          )}
          {allDone && (
            <span style={{ fontSize: '12px', color: 'var(--accent-green)', fontWeight: 700 }}>✓ 完了</span>
          )}
          <button
            onClick={handleClose}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* スクロール可能コンテンツ */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {/* 作業モードボタン */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            {modeBtns.map(({ mode, label, color, bg }) => {
              const active = workMode === mode
              return (
                <button
                  key={mode}
                  onClick={() => setWorkMode(dateKey, areaId, roomId, mode)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    minHeight: '44px',
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

          {/* 担当者 */}
          <select
            value={room.assignedStaff ?? ''}
            onChange={e => setAssignedStaff(dateKey, areaId, roomId, e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              padding: '8px 12px',
              fontSize: '16px',
              outline: 'none',
              minHeight: '44px',
              marginBottom: '12px',
              cursor: 'pointer',
            }}
          >
            <option value="">未割当</option>
            {staffList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* CI情報（表示のみ） */}
          {(room.checkInInfo?.time || room.checkInInfo?.adults !== undefined) && (
            <div style={{
              fontSize: '13px',
              color: 'var(--accent-teal)',
              marginBottom: '12px',
              padding: '6px 10px',
              background: 'var(--bg-tertiary)',
              borderRadius: '6px',
            }}>
              CI {room.checkInInfo?.time ?? '—'}
              　大人 {room.checkInInfo?.adults ?? 0}名
              　子 {room.checkInInfo?.children ?? 0}名
            </div>
          )}

          {/* タスクリスト */}
          {isSelected ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {visibleTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={() => toggleTask(dateKey, areaId, roomId, task.id)}
                  onSetKeyState={task.label === '鍵確認' ? (state) => setKeyState(dateKey, areaId, roomId, task.id, state) : undefined}
                />
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '16px 0' }}>
              作業モードを選択してください
            </p>
          )}
        </div>

        {/* フッター */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          flexShrink: 0,
        }}>
          {isSelected && !allDone && (
            <button
              onClick={() => completeAllTasks(dateKey, areaId, roomId)}
              style={{
                width: '100%',
                background: 'var(--accent-teal)',
                color: '#0f1923',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                minHeight: '48px',
              }}
            >
              ✓ 全て完了にする
            </button>
          )}
          <button
            onClick={handleClose}
            style={{
              width: '100%',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              padding: '12px',
              fontSize: '14px',
              cursor: 'pointer',
              minHeight: '48px',
            }}
          >
            閉じる
          </button>
        </div>
      </div>
    </>
  )
}
