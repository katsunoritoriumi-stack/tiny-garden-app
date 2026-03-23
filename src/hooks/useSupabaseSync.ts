/**
 * Supabase リアルタイム同期フック
 *
 * 同期対象テーブル：
 *   - task_states  : タスクのステータス（done/pending/key_open/key_closed）
 *   - room_states  : 部屋レベルの状態（workMode, assignedStaff, checkInInfo, cleanStatus, keyStatus, note）
 *
 * 動作：
 *   - 起動時に今日のデータをSupabaseから取得してZustandに反映
 *   - 今日のデータが変更されると500msデバウンスでupsert
 *   - Supabase Realtimeで他端末の変更を購読し自動反映
 *   - VITE_SUPABASE_URL が未設定 or プレースホルダーの場合はオフラインモード
 */
import { useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { useAppStore } from '../store/useAppStore'
import type { CleanStatus, KeyStatus, TaskStatus, WorkMode } from '../types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_KEY &&
  SUPABASE_URL !== 'https://xxxxxxxxxx.supabase.co' &&
  SUPABASE_KEY !== 'your-anon-key-here'
)

export function useSupabaseSync() {
  const { days, applyRemoteUpdate, applyRemoteRoomUpdate } = useAppStore()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = useRef<any>(null)
  const today = format(new Date(), 'yyyy-MM-dd')

  // 今日のエリアデータ（依存配列に使用）
  const todayAreas = days['today'].areas

  // ── 起動時：今日のデータ取得 & Realtime購読 ──────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false

    async function init() {
      const { supabase } = await import('../lib/supabase')

      // ① 今日のタスク状態を取得
      const { data: taskData, error: taskError } = await supabase
        .from('task_states')
        .select('*')
        .eq('session_date', today)

      if (taskError) console.warn('[Supabase] task_states取得失敗:', taskError.message)

      if (!cancelled && taskData) {
        for (const row of taskData) {
          applyRemoteUpdate(
            'today',
            row.area_id,
            row.room_id,
            row.task_id,
            row.status as TaskStatus,
            row.updated_by ?? '',
            row.updated_at,
          )
        }
      }

      // ② 今日の部屋状態を取得
      const { data: roomData, error: roomError } = await supabase
        .from('room_states')
        .select('*')
        .eq('session_date', today)

      if (roomError) console.warn('[Supabase] room_states取得失敗:', roomError.message)

      if (!cancelled && roomData) {
        for (const row of roomData) {
          applyRemoteRoomUpdate('today', row.area_id, row.room_id, {
            workMode: (row.work_mode as WorkMode | null) ?? null,
            assignedStaff: row.assigned_staff ?? null,
            checkInInfo: {
              time: row.check_in_time ?? undefined,
              adults: row.check_in_adults ?? undefined,
              children: row.check_in_children ?? undefined,
            },
            cleanStatus: row.clean_status as CleanStatus,
            keyStatus: row.key_status as KeyStatus,
            note: row.note ?? null,
          })
        }
      }

      // ③ Realtime購読（task_states + room_states）
      const channel = supabase
        .channel('tiny_garden_sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'task_states', filter: `session_date=eq.${today}` },
          (payload) => {
            if (payload.eventType === 'DELETE') return
            const row = payload.new as Record<string, unknown>
            if (!row) return
            applyRemoteUpdate(
              'today',
              row.area_id as string,
              row.room_id as string,
              row.task_id as string,
              row.status as TaskStatus,
              (row.updated_by as string) ?? '',
              row.updated_at as string,
            )
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'room_states', filter: `session_date=eq.${today}` },
          (payload) => {
            if (payload.eventType === 'DELETE') return
            const row = payload.new as Record<string, unknown>
            if (!row) return
            applyRemoteRoomUpdate('today', row.area_id as string, row.room_id as string, {
              workMode: (row.work_mode as WorkMode | null) ?? null,
              assignedStaff: (row.assigned_staff as string | null) ?? null,
              checkInInfo: {
                time: (row.check_in_time as string) ?? undefined,
                adults: (row.check_in_adults as number) ?? undefined,
                children: (row.check_in_children as number) ?? undefined,
              },
              cleanStatus: row.clean_status as CleanStatus,
              keyStatus: row.key_status as KeyStatus,
              note: (row.note as string | null) ?? null,
            })
          }
        )
        .subscribe()

      channelRef.current = channel
    }

    init()

    return () => {
      cancelled = true
      if (channelRef.current) {
        import('../lib/supabase').then(({ supabase }) => {
          supabase.removeChannel(channelRef.current!)
        })
      }
    }
  }, [today]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── 今日のデータ変更時：Supabaseにupsert ─────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured) return

    const timeout = setTimeout(async () => {
      const { supabase } = await import('../lib/supabase')

      // task_states upsert（タスクのステータスのみ）
      const taskRows = todayAreas.flatMap(area =>
        area.rooms.flatMap(room =>
          room.tasks.map(task => ({
            session_date: today,
            area_id: area.id,
            room_id: room.id,
            task_id: task.id,
            status: task.status,
            updated_by: task.updatedBy ?? null,
            updated_at: task.updatedAt,
          }))
        )
      )

      const { error: taskError } = await supabase
        .from('task_states')
        .upsert(taskRows, { onConflict: 'session_date,area_id,room_id,task_id' })

      if (taskError) console.warn('[Supabase] task upsert失敗:', taskError.message)

      // room_states upsert（部屋レベルの状態）
      const roomRows = todayAreas.flatMap(area =>
        area.rooms.map(room => ({
          session_date: today,
          area_id: area.id,
          room_id: room.id,
          work_mode: room.workMode ?? null,
          assigned_staff: room.assignedStaff ?? null,
          check_in_time: room.checkInInfo?.time ?? null,
          check_in_adults: room.checkInInfo?.adults ?? null,
          check_in_children: room.checkInInfo?.children ?? null,
          clean_status: room.cleanStatus ?? 'unset',
          key_status: room.keyStatus ?? 'unset',
          note: room.note ?? null,
          updated_at: new Date().toISOString(),
        }))
      )

      const { error: roomError } = await supabase
        .from('room_states')
        .upsert(roomRows, { onConflict: 'session_date,area_id,room_id' })

      if (roomError) console.warn('[Supabase] room upsert失敗:', roomError.message)
    }, 500)

    return () => clearTimeout(timeout)
  }, [todayAreas, today]) // eslint-disable-line react-hooks/exhaustive-deps
}
