// カレンダー日付詳細モーダル - 選択した日の記録を表示
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

const AREA_NAMES: Record<string, string> = {
  comfort: 'コンフォート',
  pet: 'ペットキャビン',
  eco: 'エコキャビン',
  sauna: 'キャビンサウナ',
  workstation: 'ワークステーション',
  auto: 'オートサイト',
  free: 'フリーサイト',
  sanitary_comfort: 'サニタリー（コンフォート）',
  sanitary_auto: 'サニタリー（オート）',
  lodge: 'ロッジ客室',
  lodge_sink: 'ロッジB1外の流し',
  lakeside: '湖畔サイト',
  bath: 'お風呂',
}

const AREA_ORDER = [
  'comfort', 'pet', 'eco', 'sauna', 'workstation',
  'auto', 'free', 'sanitary_comfort', 'sanitary_auto',
  'lodge', 'lodge_sink', 'lakeside', 'bath',
]

const WORK_MODE_LABELS: Record<string, string> = {
  set: 'セット',
  check: 'チェック',
  clean: 'クリーン',
}

interface RoomSummary {
  roomId: string
  doneCount: number
  totalCount: number
  assignedStaff?: string | null
  workMode?: string | null
  checkInTime?: string | null
  checkInAdults?: number | null
  checkInChildren?: number | null
  cleanStatus?: string | null
  note?: string | null
}

interface AreaSummary {
  areaId: string
  areaName: string
  rooms: RoomSummary[]
}

interface Props {
  date: string
  onClose: () => void
}

export default function CalendarDayModal({ date, onClose }: Props) {
  const [areaSummaries, setAreaSummaries] = useState<AreaSummary[]>([])
  const [loading, setLoading] = useState(true)

  const displayDate = (() => {
    try {
      return format(new Date(date + 'T00:00:00'), 'yyyy年M月d日（E）', { locale: ja })
    } catch {
      return date
    }
  })()

  useEffect(() => {
    fetchDayData()
  }, [date]) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchDayData() {
    setLoading(true)
    try {
      const { supabase } = await import('../lib/supabase')

      const [{ data: taskData, error: taskError }, { data: roomData, error: roomError }] =
        await Promise.all([
          supabase.from('task_states').select('*').eq('session_date', date),
          supabase.from('room_states').select('*').eq('session_date', date),
        ])

      if (taskError) console.warn('[CalendarDayModal] task_states取得失敗:', taskError.message)
      if (roomError) console.warn('[CalendarDayModal] room_states取得失敗:', roomError.message)

      // タスク集計: area_id × room_id ごとに done/total を計算
      const taskMap = new Map<string, Map<string, { done: number; total: number }>>()
      for (const row of taskData ?? []) {
        const aId = row.area_id as string
        const rId = row.room_id as string
        if (!taskMap.has(aId)) taskMap.set(aId, new Map())
        const rm = taskMap.get(aId)!
        if (!rm.has(rId)) rm.set(rId, { done: 0, total: 0 })
        const counts = rm.get(rId)!
        counts.total++
        const st = row.status as string
        if (st === 'done' || st === 'key_open' || st === 'key_closed') counts.done++
      }

      // ルーム状態マップ
      const roomStateMap = new Map<string, typeof roomData extends (infer T)[] | null ? T : never>()
      for (const row of roomData ?? []) {
        roomStateMap.set(`${row.area_id}:${row.room_id}`, row)
      }

      // AreaSummary 構築
      const summaries: AreaSummary[] = []
      for (const [areaId, roomMap] of taskMap) {
        const rooms: RoomSummary[] = []
        for (const [roomId, counts] of roomMap) {
          const rs = roomStateMap.get(`${areaId}:${roomId}`)
          rooms.push({
            roomId,
            doneCount: counts.done,
            totalCount: counts.total,
            assignedStaff: rs?.assigned_staff ?? null,
            workMode: rs?.work_mode ?? null,
            checkInTime: rs?.check_in_time ?? null,
            checkInAdults: rs?.check_in_adults ?? null,
            checkInChildren: rs?.check_in_children ?? null,
            cleanStatus: rs?.clean_status ?? null,
            note: rs?.note ?? null,
          })
        }
        rooms.sort((a, b) => a.roomId.localeCompare(b.roomId, 'ja'))
        summaries.push({
          areaId,
          areaName: AREA_NAMES[areaId] ?? areaId,
          rooms,
        })
      }

      summaries.sort((a, b) => {
        const ai = AREA_ORDER.indexOf(a.areaId)
        const bi = AREA_ORDER.indexOf(b.areaId)
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
      })

      setAreaSummaries(summaries)
    } finally {
      setLoading(false)
    }
  }

  // 全体サマリー計算
  const totalDone = areaSummaries.reduce((s, a) => s + a.rooms.reduce((rs, r) => rs + r.doneCount, 0), 0)
  const totalTasks = areaSummaries.reduce((s, a) => s + a.rooms.reduce((rs, r) => rs + r.totalCount, 0), 0)
  const overallPct = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0

  return (
    <>
      {/* オーバーレイ */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          zIndex: 100,
          backdropFilter: 'blur(3px)',
        }}
      />

      {/* モーダル本体 */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${displayDate}の記録`}
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 101,
          width: 'min(92vw, 480px)',
          maxHeight: '82vh',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* ─── モーダルヘッダー ─────────────────────────────────────── */}
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
            background: 'var(--bg-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.15em',
                color: 'var(--accent-teal)',
                margin: 0,
                marginBottom: '3px',
              }}>
                DAILY RECORD
              </p>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 900,
                color: 'var(--text-primary)',
                margin: 0,
              }}>
                {displayDate}
              </h3>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text-secondary)',
                padding: '4px 10px',
                fontSize: '16px',
                cursor: 'pointer',
                lineHeight: 1.2,
                flexShrink: 0,
              }}
              aria-label="閉じる"
            >
              ✕
            </button>
          </div>

          {/* 全体進捗バー */}
          {!loading && totalTasks > 0 && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>全体進捗</span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: overallPct === 100 ? 'var(--accent-green)' : 'var(--accent-teal)',
                }}>
                  {totalDone}/{totalTasks}（{overallPct}%）
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '5px',
                background: 'var(--bg-tertiary)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${overallPct}%`,
                  height: '100%',
                  background: overallPct === 100 ? 'var(--accent-green)' : 'var(--accent-teal)',
                  borderRadius: '3px',
                  transition: 'width 0.4s ease',
                }} />
              </div>
            </div>
          )}
        </div>

        {/* ─── モーダルコンテンツ ────────────────────────────────────── */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '12px 14px' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', padding: '24px 0' }}>
              読み込み中…
            </p>
          ) : areaSummaries.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', padding: '24px 0' }}>
              この日の記録はありません
            </p>
          ) : (
            areaSummaries.map(area => {
              const areaDone = area.rooms.reduce((s, r) => s + r.doneCount, 0)
              const areaTotal = area.rooms.reduce((s, r) => s + r.totalCount, 0)
              const pct = areaTotal > 0 ? Math.round((areaDone / areaTotal) * 100) : 0

              return (
                <div
                  key={area.areaId}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    marginBottom: '10px',
                  }}
                >
                  {/* エリアヘッダー */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--accent-teal)',
                    }}>
                      {area.areaName}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: pct === 100 ? 'var(--accent-green)' : 'var(--text-secondary)',
                    }}>
                      {areaDone}/{areaTotal}（{pct}%）
                    </span>
                  </div>

                  {/* ルーム一覧 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {area.rooms.map(room => {
                      const roomPct = room.totalCount > 0
                        ? Math.round((room.doneCount / room.totalCount) * 100)
                        : 0
                      const isDone = roomPct === 100

                      return (
                        <div
                          key={room.roomId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '6px',
                            padding: '5px 8px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '6px',
                            fontSize: '12px',
                            borderLeft: `3px solid ${isDone ? 'var(--accent-green)' : 'var(--border)'}`,
                          }}
                        >
                          {/* ルームID */}
                          <span style={{
                            color: 'var(--text-primary)',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            minWidth: '32px',
                          }}>
                            {room.roomId}
                          </span>

                          {/* ワークモード */}
                          {room.workMode && (
                            <span style={{
                              background: 'rgba(243,156,18,0.15)',
                              color: 'var(--accent-yellow)',
                              borderRadius: '4px',
                              padding: '1px 5px',
                              fontSize: '11px',
                              fontWeight: 700,
                            }}>
                              {WORK_MODE_LABELS[room.workMode] ?? room.workMode}
                            </span>
                          )}

                          {/* 担当スタッフ */}
                          {room.assignedStaff && (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                              👤 {room.assignedStaff}
                            </span>
                          )}

                          {/* チェックイン情報 */}
                          {room.checkInTime && (
                            <span style={{ color: 'var(--accent-blue)', fontSize: '11px' }}>
                              CI {room.checkInTime}
                              {(room.checkInAdults != null || room.checkInChildren != null) && (
                                <span style={{ marginLeft: '3px', color: 'var(--text-secondary)' }}>
                                  ({room.checkInAdults ?? 0}+{room.checkInChildren ?? 0})
                                </span>
                              )}
                            </span>
                          )}

                          {/* メモ */}
                          {room.note && (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                              📝 {room.note}
                            </span>
                          )}

                          {/* タスク進捗 */}
                          <span style={{
                            marginLeft: 'auto',
                            fontWeight: 700,
                            fontSize: '12px',
                            color: isDone ? 'var(--accent-green)' : 'var(--text-secondary)',
                          }}>
                            {room.doneCount}/{room.totalCount}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
