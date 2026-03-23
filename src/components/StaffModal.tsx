// スタッフ管理モーダル
import { useState, type KeyboardEvent } from 'react'

interface StaffModalProps {
  staffList: string[]
  onAdd: (name: string) => void
  onRemove: (name: string) => void
  onClose: () => void
}

export default function StaffModal({ staffList, onAdd, onRemove, onClose }: StaffModalProps) {
  const [inputValue, setInputValue] = useState('')

  function handleAdd() {
    const name = inputValue.trim()
    if (!name) return
    onAdd(name)
    setInputValue('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleAdd()
    }
  }

  return (
    // オーバーレイ
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      {/* モーダル本体 */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '20px',
          width: '100%',
          maxWidth: '360px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
          担当者リスト
        </h2>

        {/* スタッフ一覧 */}
        <div
          style={{
            borderTop: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            marginBottom: '16px',
          }}
        >
          {staffList.length === 0 && (
            <p style={{ padding: '12px 0', fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center' }}>
              スタッフが登録されていません
            </p>
          )}
          {staffList.map(staff => (
            <div
              key={staff}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span style={{ fontSize: '16px', color: 'var(--text-primary)', fontWeight: 500 }}>
                {staff}
              </span>
              <button
                onClick={() => onRemove(staff)}
                style={{
                  background: 'rgba(231,76,60,0.15)',
                  border: '1px solid rgba(231,76,60,0.4)',
                  borderRadius: '6px',
                  color: '#e74c3c',
                  padding: '6px 12px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  minHeight: '36px',
                }}
              >
                削除
              </button>
            </div>
          ))}
        </div>

        {/* 追加フォーム */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="名前を入力"
            style={{
              flex: 1,
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              padding: '8px 12px',
              fontSize: '16px',
              outline: 'none',
              minHeight: '52px',
            }}
          />
          <button
            onClick={handleAdd}
            style={{
              background: 'var(--accent-teal)',
              color: '#0f1923',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              minHeight: '52px',
              whiteSpace: 'nowrap',
            }}
          >
            追加
          </button>
        </div>

        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text-secondary)',
            padding: '10px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            minHeight: '52px',
          }}
        >
          閉じる
        </button>
      </div>
    </div>
  )
}
