// タスク行コンポーネント（チェックボックス）
import type { Task } from '../types'

interface TaskItemProps {
  task: Task
  onToggle: () => void
  onSetKeyState?: (state: 'key_open' | 'key_closed' | 'pending') => void
}

export default function TaskItem({ task, onToggle, onSetKeyState }: TaskItemProps) {
  const isDone = task.status === 'done'
  const isKeyOpen = task.status === 'key_open'
  const isKeyClosed = task.status === 'key_closed'
  const isKeyDone = isKeyOpen || isKeyClosed

  // 鍵確認タスクの特別UI
  if (task.label === '鍵確認') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          width: '100%',
          padding: '10px 12px',
          background: isKeyDone ? 'rgba(46,204,113,0.08)' : 'transparent',
          borderRadius: '8px',
          minHeight: '52px',
        }}
      >
        {/* 完了チェックマーク */}
        <span
          style={{
            width: '22px',
            height: '22px',
            borderRadius: '6px',
            border: isKeyDone ? '2px solid var(--accent-green)' : '2px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            background: isKeyDone ? 'var(--accent-green)' : 'transparent',
            transition: 'all 0.15s',
          }}
        >
          {isKeyDone && (
            <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
              <path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>

        <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', flex: 1 }}>
          鍵確認
        </span>

        {/* 開ボタン */}
        <button
          onClick={() => onSetKeyState?.(isKeyOpen ? 'pending' : 'key_open')}
          style={{
            padding: '6px 14px',
            minHeight: '36px',
            borderRadius: '6px',
            border: `2px solid ${isKeyOpen ? '#f39c12' : 'var(--border)'}`,
            background: isKeyOpen ? 'rgba(243,156,18,0.2)' : 'transparent',
            color: isKeyOpen ? '#f39c12' : 'var(--text-secondary)',
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
          onClick={() => onSetKeyState?.(isKeyClosed ? 'pending' : 'key_closed')}
          style={{
            padding: '6px 14px',
            minHeight: '36px',
            borderRadius: '6px',
            border: `2px solid ${isKeyClosed ? 'var(--accent-teal)' : 'var(--border)'}`,
            background: isKeyClosed ? 'rgba(100,200,180,0.2)' : 'transparent',
            color: isKeyClosed ? 'var(--accent-teal)' : 'var(--text-secondary)',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          閉
        </button>
      </div>
    )
  }

  // 通常タスク
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        padding: '10px 12px',
        background: isDone ? 'rgba(46,204,113,0.08)' : 'transparent',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        textAlign: 'left',
        minHeight: '52px',
        transition: 'background 0.15s',
      }}
    >
      {/* チェックアイコン */}
      <span
        style={{
          width: '22px',
          height: '22px',
          borderRadius: '6px',
          border: isDone ? '2px solid var(--accent-green)' : '2px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: isDone ? 'var(--accent-green)' : 'transparent',
          transition: 'all 0.15s',
        }}
      >
        {isDone && (
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
            <path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>

      {/* タスク名 */}
      <span
        style={{
          fontSize: '14px',
          fontWeight: 500,
          color: isDone ? 'var(--text-secondary)' : 'var(--text-primary)',
          textDecoration: isDone ? 'line-through' : 'none',
          flex: 1,
        }}
      >
        {task.label}
      </span>

      {/* 更新者 */}
      {task.updatedBy && isDone && (
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', flexShrink: 0 }}>
          {task.updatedBy}
        </span>
      )}
    </button>
  )
}
