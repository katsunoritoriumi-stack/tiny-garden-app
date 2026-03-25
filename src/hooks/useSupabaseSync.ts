/**
 * Supabase 同期フック（競合状態修正版）
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

const POLL_INTERVAL = 5000

export function useSupabaseSync() {
  const { days, applyRemoteUpdate, applyRemoteRoomUpdate } = useAppStore()
  const today = format(new Date(), 'yyyy-MM-dd')
  const todayAreas = days['today'].areas

  const isUpsertingRef = useRef(false)
  const lastUpsertTimeRef = useRef<number>(0)

  async function fetchAndApply() {
    if (isUpsertingRef.current) return
    if (Date.now() - lastUpsertTimeRef.current < 1000) return

    const { supabase } = await import('../lib/supabase')

    const { data: taskData, error: taskError } = await supabase
      .from('task_states')
      .select('*')
      .eq('session_date', today)

    if (taskError) {
      console.warn('[Supabase] task_states取得失敗:', taskError.message)
      return
    }

    if (taskData) {
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

    const { data: roomData, error: roomError } = await supabase
      .from('room_states')
      .select('*')
      .eq('session_date', today)

    if (roomError) {
      console.warn('[Supabase] room_states取得失敗:', roomError.message)
      return
    }

    if (roomData) {
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
  }

  useEffect(() => {
    if (!isSupabaseConfigured) return
    fetchAndApply()
    const intervalId = setInterval(fetchAndApply, POLL_INTERVAL)
    return () => clearInterval(intervalId)
  }, [today]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isSupabaseConfigured) return

    const timeout = setTimeout(async () => {
      isUpsertingRef.current = true

      try {
        const { supabase } = await import('../lib/supabase')

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

      } finally {
        isUpsertingRef.current = false
        lastUpsertTimeRef.current = Date.now()
      }
    }, 500)

    return () => clearTimeout(timeout)
  }, [todayAreas, today]) // eslint-disable-line react-hooks/exhaustive-deps
}
