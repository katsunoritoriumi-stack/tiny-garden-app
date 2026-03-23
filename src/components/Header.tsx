// ヘッダーコンポーネント
import ProgressBar from './ProgressBar'
import { useAppStore } from '../store/useAppStore'
import { getVisibleTasks, isDone, isSanitaryRoomDone, isLakesiteRoomDone, isBathRoomDone, getAreaPendingCount } from '../utils/visibleTasks'
import type { DateKey } from '../types'

export default function Header() {
  const { days, activeDateKey, setActiveDateKey } = useAppStore()

  // アクティブな日の全体進捗
  const activeDay = days[activeDateKey]

  // エリア種別ごとに進捗を集計
  let doneCount = 0
  let totalCount = 0
  for (const area of activeDay.areas) {
    if (area.areaType === 'sanitary') {
      doneCount += area.rooms.filter(r => isSanitaryRoomDone(r)).length
      totalCount += area.rooms.length
    } else if (area.areaType === 'lakeside') {
      doneCount += area.rooms.filter(r => isLakesiteRoomDone(r)).length
      totalCount += area.rooms.length
    } else if (area.areaType === 'bath') {
      const tasks = area.rooms.flatMap(r => r.tasks)
      doneCount += tasks.filter(t => isDone(t.status)).length
      totalCount += tasks.length
    } else {
      const selected = area.rooms.filter(r => r.workMode != null)
      const tasks = selected.flatMap(r => getVisibleTasks(r))
      doneCount += tasks.filter(t => isDone(t.status)).length
      totalCount += tasks.length
    }
  }
  const percent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  // 各タブのバッジ計算（未完了数）
  function getPendingCount(dateKey: DateKey): number {
    const dayData = days[dateKey]
    return dayData.areas.reduce((sum, area) => sum + getAreaPendingCount(area), 0)
  }

  const DATE_KEYS: DateKey[] = ['today', 'tomorrow', 'day_after']

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border)',
        padding: '10px 16px',
      }}
    >
      {/* タイトル行 */}
      <div style={{ marginBottom: '8px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          Staff Management
        </p>
        <h1 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.2, marginTop: '2px' }}>
          TINY GARDEN 蓼科
        </h1>
      </div>

      {/* 日付タブ */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
        {DATE_KEYS.map(key => {
          const isActive = key === activeDateKey
          const pending = getPendingCount(key)
          const dayData = days[key]
          return (
            <button
              key={key}
              onClick={() => setActiveDateKey(key)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '6px 4px',
                minHeight: '40px',
                borderRadius: '8px',
                border: `2px solid ${isActive ? 'var(--accent-teal)' : 'var(--border)'}`,
                background: isActive ? 'rgba(100,200,180,0.12)' : 'transparent',
                color: isActive ? 'var(--accent-teal)' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s',
                position: 'relative',
              }}
            >
              <span>{dayData.label}</span>
              {pending > 0 && (
                <span
                  style={{
                    background: 'var(--accent-red)',
                    color: '#fff',
                    borderRadius: '999px',
                    fontSize: '10px',
                    fontWeight: 700,
                    minWidth: '18px',
                    height: '18px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                  }}
                >
                  {pending}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 全体進捗（アクティブな日のみ） */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ flex: 1 }}>
          <ProgressBar value={percent} height={8} />
        </div>
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', minWidth: '48px', textAlign: 'right' }}>
          {doneCount}/{totalCount}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--accent-teal)', fontWeight: 700, minWidth: '36px', textAlign: 'right' }}>
          {percent}%
        </span>
      </div>
    </header>
  )
}
