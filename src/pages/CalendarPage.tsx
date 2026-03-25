// カレンダー画面 - 過去の記録を月別に振り返る
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns'
import { ja } from 'date-fns/locale'
import CalendarDayModal from '../components/CalendarDayModal'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_KEY &&
  SUPABASE_URL !== 'https://xxxxxxxxxx.supabase.co' &&
  SUPABASE_KEY !== 'your-anon-key-here'
)

// 日付ごとの集計データ
interface DaySummary {
  date: string
  taskDone: number
  taskTotal: number
  bookingCount: number
}

const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日']

export default function CalendarPage() {
  const navigate = useNavigate()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [daySummaries, setDaySummaries] = useState<Map<string, DaySummary>>(new Map())
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const firstDayOfWeek = (getDay(monthStart) + 6) % 7 // 0=月〜6=日

  useEffect(() => {
    if (!isSupabaseConfigured) return
    fetchMonthData()
  }, [currentMonth]) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchMonthData() {
    setLoading(true)
    try {
      const { supabase } = await import('../lib/supabase')
      const startDate = format(monthStart, 'yyyy-MM-dd')
      const endDate = format(monthEnd, 'yyyy-MM-dd')

      // task_states と bookings を並行取得
      const [taskRes, bookingRes] = await Promise.all([
        supabase
          .from('task_states')
          .select('session_date, status')
          .gte('session_date', startDate)
          .lte('session_date', endDate),
        supabase
          .from('bookings')
          .select('session_date')
          .gte('session_date', startDate)
          .lte('session_date', endDate),
      ])

      if (taskRes.error) console.warn('[Calendar] task_states:', taskRes.error.message)
      if (bookingRes.error) console.warn('[Calendar] bookings:', bookingRes.error.message)

      const summaryMap = new Map<string, DaySummary>()

      // タスク集計
      for (const row of taskRes.data ?? []) {
        const dk = row.session_date as string
        if (!summaryMap.has(dk)) {
          summaryMap.set(dk, { date: dk, taskDone: 0, taskTotal: 0, bookingCount: 0 })
        }
        const s = summaryMap.get(dk)!
        s.taskTotal++
        const st = row.status as string
        if (st === 'done' || st === 'key_open' || st === 'key_closed') s.taskDone++
      }

      // 予約件数集計
      for (const row of bookingRes.data ?? []) {
        const dk = row.session_date as string
        if (!summaryMap.has(dk)) {
          summaryMap.set(dk, { date: dk, taskDone: 0, taskTotal: 0, bookingCount: 0 })
        }
        summaryMap.get(dk)!.bookingCount++
      }

      setDaySummaries(summaryMap)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '16px', paddingBottom: '40px' }}>

      {/* ─── ページタイトル ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => navigate('/')} style={backButtonStyle}>
          ← 戻る
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <p style={{
            fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em',
            color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase',
          }}>
            HISTORY
          </p>
          <h2 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
            過去の記録
          </h2>
        </div>
        <div style={{ width: '62px' }} />
      </div>

      {/* ─── Supabase 未設定メッセージ ─── */}
      {!isSupabaseConfigured && (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '16px',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '13px',
          marginBottom: '16px',
          lineHeight: 1.6,
        }}>
          Supabase が未設定です。<br />
          記録を表示するには環境変数の設定が必要です。
        </div>
      )}

      {/* ─── 月ナビゲーション ─── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <button
          onClick={() => setCurrentMonth(m => subMonths(m, 1))}
          style={monthNavStyle}
          aria-label="前月"
        >
          ◀
        </button>
        <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
          {format(currentMonth, 'yyyy年M月', { locale: ja })}
        </span>
        <button
          onClick={() => setCurrentMonth(m => addMonths(m, 1))}
          style={monthNavStyle}
          aria-label="翌月"
        >
          ▶
        </button>
      </div>

      {/* ─── カレンダー本体 ─── */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '12px',
      }}>
        {/* 曜日ヘッダー */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '6px' }}>
          {WEEKDAYS.map((d, i) => (
            <div
              key={d}
              style={{
                textAlign: 'center',
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 0',
                color: i === 5
                  ? 'var(--accent-blue)'
                  : i === 6
                    ? 'var(--accent-red)'
                    : 'var(--text-secondary)',
              }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* 日付グリッド */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
          {/* 先頭パディング */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`pad-${i}`} style={{ minHeight: '58px' }} />
          ))}

          {/* 日付セル */}
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const summary = daySummaries.get(dateStr)
            const hasTask = !!summary && summary.taskTotal > 0
            const hasBooking = !!summary && summary.bookingCount > 0
            const hasAny = hasTask || hasBooking
            const pct = hasTask
              ? Math.round((summary!.taskDone / summary!.taskTotal) * 100)
              : 0
            const todayFlag = isToday(day)
            const dow = (getDay(day) + 6) % 7
            const isSat = dow === 5
            const isSun = dow === 6

            return (
              <button
                key={dateStr}
                onClick={() => { if (hasAny) setSelectedDate(dateStr) }}
                disabled={!hasAny}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '5px 2px 4px',
                  borderRadius: '8px',
                  border: todayFlag
                    ? '2px solid var(--accent-teal)'
                    : '1px solid transparent',
                  background: hasAny
                    ? 'var(--bg-tertiary)'
                    : todayFlag
                      ? 'rgba(78,205,196,0.06)'
                      : 'transparent',
                  cursor: hasAny ? 'pointer' : 'default',
                  minHeight: '58px',
                  gap: '3px',
                  transition: 'background 0.1s',
                  position: 'relative',
                }}
              >
                {/* 日付数字 */}
                <span style={{
                  fontSize: '13px',
                  fontWeight: todayFlag ? 900 : 400,
                  lineHeight: 1,
                  color: todayFlag
                    ? 'var(--accent-teal)'
                    : isSat
                      ? 'var(--accent-blue)'
                      : isSun
                        ? 'var(--accent-red)'
                        : 'var(--text-primary)',
                }}>
                  {format(day, 'd')}
                </span>

                {/* タスク進捗バー */}
                {hasTask && (
                  <>
                    <div style={{
                      width: '90%',
                      height: '3px',
                      background: 'var(--border)',
                      borderRadius: '2px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: pct === 100 ? 'var(--accent-green)' : 'var(--accent-teal)',
                      }} />
                    </div>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      color: pct === 100 ? 'var(--accent-green)' : 'var(--accent-teal)',
                      lineHeight: 1,
                    }}>
                      {pct}%
                    </span>
                  </>
                )}

                {/* 予約バッジ */}
                {hasBooking && (
                  <span style={{
                    fontSize: '9px',
                    color: 'var(--accent-yellow)',
                    fontWeight: 700,
                    lineHeight: 1,
                  }}>
                    {summary!.bookingCount}件
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── 凡例 ─── */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginTop: '12px',
        fontSize: '11px',
        color: 'var(--text-secondary)',
        paddingLeft: '2px',
        flexWrap: 'wrap',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ display: 'inline-block', width: '20px', height: '3px', background: 'var(--accent-teal)', borderRadius: '2px' }} />
          作業中
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ display: 'inline-block', width: '20px', height: '3px', background: 'var(--accent-green)', borderRadius: '2px' }} />
          完了
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--accent-yellow)' }}>N件</span>
          予約あり
        </span>
      </div>

      {/* ─── ローディング ─── */}
      {loading && (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', marginTop: '16px' }}>
          読み込み中…
        </p>
      )}

      {/* ─── 日付詳細モーダル ─── */}
      {selectedDate && (
        <CalendarDayModal
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  )
}

// ─── スタイル定数 ─────────────────────────────────────────────────────────────

const backButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--text-secondary)',
  padding: '6px 12px',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
  minHeight: '36px',
  whiteSpace: 'nowrap',
}

const monthNavStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  padding: '8px 16px',
  fontSize: '16px',
  cursor: 'pointer',
  minWidth: '44px',
  minHeight: '44px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
