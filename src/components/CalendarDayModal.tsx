// カレンダー日付詳細モーダル
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

// ─── エリア表示名マッピング ───────────────────────────────────────────────────
const AREA_NAMES: Record<string, string> = {
  comfort:         'コンフォート',
  pet:             'ペットキャビン',
  eco:             'エコキャビン',
  sauna:           'キャビンサウナ',
  workstation:     'ワークステーション',
  auto:            'オートサイト',
  free:            'フリーサイト',
  sanitary_comfort:'サニタリー（コンフォート）',
  sanitary_auto:   'サニタリー（オート）',
  lodge:           'ロッジ客室',
  lodge_sink:      'ロッジB1外の流し',
  lakeside:        '湖畔サイト',
  bath:            'お風呂',
}

const AREA_ORDER = [
  'comfort', 'pet', 'eco', 'sauna', 'workstation',
  'auto', 'free', 'sanitary_comfort', 'sanitary_auto',
  'lodge', 'lodge_sink', 'lakeside', 'bath',
]

const WORK_MODE_LABELS: Record<string, string> = {
  set: 'セット', check: 'チェック', clean: '清掃',
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  used:        { label: '利用済', color: 'var(--accent-green)' },
  unused:      { label: '未使用', color: 'var(--text-secondary)' },
  maintenance: { label: 'メンテ中', color: 'var(--accent-yellow)' },
}

// ─── 型定義 ───────────────────────────────────────────────────────────────────
interface RoomSummary {
  roomId: string
  doneCount: number
  totalCount: number
  assignedStaff?: string | null
  workMode?: string | null
  checkInTime?: string | null
  checkInAdults?: number | null
  checkInChildren?: number | null
  note?: string | null
}

interface AreaSummary {
  areaId: string
  areaName: string
  rooms: RoomSummary[]
}

interface Booking {
  id: string
  room_id: string
  area_id: string
  room_name?: string | null
  check_in_at?: string | null
  check_out_at?: string | null
  num_adults: number
  num_children: number
  notes?: string | null
}

interface FacilityLog {
  id: string
  facility_name: string
  area_id?: string | null
  status: string
  used_at?: string | null
  notes?: string | null
}

interface Props {
  date: string
  onClose: () => void
}

// ─── メインコンポーネント ─────────────────────────────────────────────────────
export default function CalendarDayModal({ date, onClose }: Props) {
  const [areaSummaries, setAreaSummaries] = useState<AreaSummary[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [facilityLogs, setFacilityLogs] = useState<FacilityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'tasks' | 'bookings' | 'facility'>('tasks')

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

      const [taskRes, roomRes, bookingRes, facilityRes] = await Promise.all([
        supabase.from('task_states').select('*').eq('session_date', date),
        supabase.from('room_states').select('*').eq('session_date', date),
        supabase.from('bookings').select('*').eq('session_date', date),
        supabase.from('facility_logs').select('*').eq('session_date', date),
      ])

      if (taskRes.error) console.warn('[Modal] task_states:', taskRes.error.message)
      if (roomRes.error) console.warn('[Modal] room_states:', roomRes.error.message)
      // bookings/facility_logs テーブルは未作成の場合もあるため warn のみ
      if (bookingRes.error) console.warn('[Modal] bookings:', bookingRes.error.message)
      if (facilityRes.error) console.warn('[Modal] facility_logs:', facilityRes.error.message)

      // ── タスク集計 ──
      const taskMap = new Map<string, Map<string, { done: number; total: number }>>()
      for (const row of taskRes.data ?? []) {
        if (!taskMap.has(row.area_id)) taskMap.set(row.area_id, new Map())
        const rm = taskMap.get(row.area_id)!
        if (!rm.has(row.room_id)) rm.set(row.room_id, { done: 0, total: 0 })
        const c = rm.get(row.room_id)!
        c.total++
        if (['done', 'key_open', 'key_closed'].includes(row.status)) c.done++
      }

      // ── ルーム状態マップ ──
      const roomStateMap = new Map<string, Record<string, unknown>>()
      for (const row of roomRes.data ?? []) {
        roomStateMap.set(`${row.area_id}:${row.room_id}`, row)
      }

      // ── AreaSummary 構築 ──
      const summaries: AreaSummary[] = []
      for (const [areaId, roomMap] of taskMap) {
        const rooms: RoomSummary[] = []
        for (const [roomId, counts] of roomMap) {
          const rs = roomStateMap.get(`${areaId}:${roomId}`)
          rooms.push({
            roomId,
            doneCount: counts.done,
            totalCount: counts.total,
            assignedStaff: rs?.assigned_staff as string | null,
            workMode: rs?.work_mode as string | null,
            checkInTime: rs?.check_in_time as string | null,
            checkInAdults: rs?.check_in_adults as number | null,
            checkInChildren: rs?.check_in_children as number | null,
            note: rs?.note as string | null,
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
      setBookings((bookingRes.data ?? []) as Booking[])
      setFacilityLogs((facilityRes.data ?? []) as FacilityLog[])
    } finally {
      setLoading(false)
    }
  }

  // 全体サマリー
  const totalDone = areaSummaries.reduce((s, a) => s + a.rooms.reduce((rs, r) => rs + r.doneCount, 0), 0)
  const totalTasks = areaSummaries.reduce((s, a) => s + a.rooms.reduce((rs, r) => rs + r.totalCount, 0), 0)
  const overallPct = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0

  const TABS = [
    { key: 'tasks' as const, label: '作業記録', badge: areaSummaries.length },
    { key: 'bookings' as const, label: '宿泊記録', badge: bookings.length },
    { key: 'facility' as const, label: '設備利用', badge: facilityLogs.length },
  ]

  return (
    <>
      {/* ─── オーバーレイ ─── */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.65)',
          zIndex: 100,
          backdropFilter: 'blur(3px)',
        }}
      />

      {/* ─── モーダル本体 ─── */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 101,
          width: 'min(92vw, 480px)',
          maxHeight: '85vh',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
        }}
      >
        {/* ── ヘッダー ── */}
        <div style={{
          padding: '14px 16px 10px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          background: 'var(--bg-secondary)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div>
              <p style={{
                fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em',
                color: 'var(--accent-teal)', margin: 0, marginBottom: '3px',
              }}>
                DAILY RECORD
              </p>
              <h3 style={{
                fontSize: '16px', fontWeight: 900,
                color: 'var(--text-primary)', margin: 0,
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
              }}
            >
              ✕
            </button>
          </div>

          {/* 全体進捗バー（タスクがある場合のみ） */}
          {!loading && totalTasks > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>作業進捗</span>
                <span style={{
                  fontSize: '11px', fontWeight: 700,
                  color: overallPct === 100 ? 'var(--accent-green)' : 'var(--accent-teal)',
                }}>
                  {totalDone}/{totalTasks}（{overallPct}%）
                </span>
              </div>
              <div style={{
                width: '100%', height: '5px',
                background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden',
              }}>
                <div style={{
                  width: `${overallPct}%`, height: '100%',
                  background: overallPct === 100 ? 'var(--accent-green)' : 'var(--accent-teal)',
                  borderRadius: '3px', transition: 'width 0.4s ease',
                }} />
              </div>
            </div>
          )}

          {/* タブ */}
          {!loading && (
            <div style={{ display: 'flex', gap: '4px', marginTop: '10px' }}>
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    flex: 1,
                    padding: '6px 4px',
                    border: `1px solid ${activeTab === tab.key ? 'var(--accent-teal)' : 'var(--border)'}`,
                    borderRadius: '6px',
                    background: activeTab === tab.key ? 'rgba(78,205,196,0.12)' : 'transparent',
                    color: activeTab === tab.key ? 'var(--accent-teal)' : 'var(--text-secondary)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    minHeight: '32px',
                  }}
                >
                  {tab.label}
                  {tab.badge > 0 && (
                    <span style={{
                      background: activeTab === tab.key ? 'var(--accent-teal)' : 'var(--border)',
                      color: activeTab === tab.key ? '#0f1923' : 'var(--text-secondary)',
                      borderRadius: '999px',
                      fontSize: '10px',
                      fontWeight: 700,
                      minWidth: '16px',
                      height: '16px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 4px',
                    }}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── コンテンツエリア ── */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '12px 14px' }}>

          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', padding: '24px 0' }}>
              読み込み中…
            </p>
          ) : (
            <>
              {/* ── 作業記録タブ ── */}
              {activeTab === 'tasks' && (
                <>
                  {areaSummaries.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', padding: '20px 0' }}>
                      この日の作業記録はありません
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
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-teal)' }}>
                              {area.areaName}
                            </span>
                            <span style={{
                              fontSize: '12px', fontWeight: 700,
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
                                    gap: '5px',
                                    padding: '5px 8px',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    borderLeft: `3px solid ${isDone ? 'var(--accent-green)' : 'var(--border)'}`,
                                  }}
                                >
                                  <span style={{
                                    color: 'var(--text-primary)',
                                    fontFamily: 'var(--font-mono)',
                                    fontWeight: 700,
                                    minWidth: '32px',
                                  }}>
                                    {room.roomId}
                                  </span>

                                  {room.workMode && (
                                    <span style={{
                                      background: 'rgba(243,156,18,0.15)',
                                      color: 'var(--accent-yellow)',
                                      borderRadius: '4px',
                                      padding: '1px 5px',
                                      fontSize: '10px',
                                      fontWeight: 700,
                                    }}>
                                      {WORK_MODE_LABELS[room.workMode] ?? room.workMode}
                                    </span>
                                  )}

                                  {room.assignedStaff && (
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                                      👤 {room.assignedStaff}
                                    </span>
                                  )}

                                  {room.checkInTime && (
                                    <span style={{ color: 'var(--accent-blue)', fontSize: '11px' }}>
                                      CI {room.checkInTime}
                                      {(room.checkInAdults != null || room.checkInChildren != null) && (
                                        <span style={{ color: 'var(--text-secondary)' }}>
                                          {' '}({room.checkInAdults ?? 0}大+{room.checkInChildren ?? 0}子)
                                        </span>
                                      )}
                                    </span>
                                  )}

                                  {room.note && (
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
                                      📝 {room.note}
                                    </span>
                                  )}

                                  <span style={{
                                    marginLeft: 'auto',
                                    fontWeight: 700,
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
                </>
              )}

              {/* ── 宿泊記録タブ ── */}
              {activeTab === 'bookings' && (
                <>
                  {bookings.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>
                        この日の宿泊記録はありません
                      </p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '11px', lineHeight: 1.6 }}>
                        Supabase の <code style={{ background: 'var(--bg-tertiary)', padding: '1px 4px', borderRadius: '3px' }}>bookings</code> テーブルに<br />
                        データを追加すると表示されます
                      </p>
                    </div>
                  ) : (
                    bookings.map(b => (
                      <div
                        key={b.id}
                        style={{
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border)',
                          borderRadius: '10px',
                          padding: '10px 12px',
                          marginBottom: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{
                            fontSize: '14px', fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--accent-teal)',
                          }}>
                            {b.room_name ?? b.room_id}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {AREA_NAMES[b.area_id] ?? b.area_id}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px' }}>
                          {b.check_in_at && (
                            <span style={{ color: 'var(--accent-blue)' }}>
                              CI {formatDatetime(b.check_in_at)}
                            </span>
                          )}
                          {b.check_out_at && (
                            <span style={{ color: 'var(--text-secondary)' }}>
                              CO {formatDatetime(b.check_out_at)}
                            </span>
                          )}
                          <span style={{ color: 'var(--text-secondary)' }}>
                            👤 {b.num_adults}名 👶 {b.num_children}名
                          </span>
                        </div>
                        {b.notes && (
                          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px', margin: '6px 0 0' }}>
                            📝 {b.notes}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </>
              )}

              {/* ── 設備利用タブ ── */}
              {activeTab === 'facility' && (
                <>
                  {facilityLogs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>
                        この日の設備利用記録はありません
                      </p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '11px', lineHeight: 1.6 }}>
                        Supabase の <code style={{ background: 'var(--bg-tertiary)', padding: '1px 4px', borderRadius: '3px' }}>facility_logs</code> テーブルに<br />
                        データを追加すると表示されます
                      </p>
                    </div>
                  ) : (
                    facilityLogs.map(fl => {
                      const statusInfo = STATUS_LABELS[fl.status] ?? { label: fl.status, color: 'var(--text-secondary)' }
                      return (
                        <div
                          key={fl.id}
                          style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: '10px',
                            padding: '10px 12px',
                            marginBottom: '10px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {fl.facility_name}
                              </span>
                              {fl.area_id && (
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                  {AREA_NAMES[fl.area_id] ?? fl.area_id}
                                </span>
                              )}
                            </div>
                            {fl.used_at && (
                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                {formatDatetime(fl.used_at)}
                              </span>
                            )}
                            {fl.notes && (
                              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', margin: '4px 0 0' }}>
                                📝 {fl.notes}
                              </p>
                            )}
                          </div>
                          <span style={{
                            fontSize: '11px', fontWeight: 700,
                            color: statusInfo.color,
                            background: 'var(--bg-tertiary)',
                            borderRadius: '6px',
                            padding: '3px 8px',
                            flexShrink: 0,
                          }}>
                            {statusInfo.label}
                          </span>
                        </div>
                      )
                    })
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

// ─── ヘルパー ─────────────────────────────────────────────────────────────────
function formatDatetime(iso: string): string {
  try {
    return format(new Date(iso), 'M/d HH:mm', { locale: ja })
  } catch {
    return iso
  }
}
