import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format, addDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import { makeInitialAreas } from '../data/initialData'
import { defaultStaffList } from '../data/staffList'
import type { Area, CheckInInfo, CleanStatus, DateKey, DayData, KeyStatus, LinenOrder, TaskStatus, WorkMode } from '../types'

// ─── ヘルパー ─────────────────────────────────────────────────────────────────
function isDone(status: TaskStatus): boolean {
  return status === 'done' || status === 'key_open' || status === 'key_closed'
}

function makeDayLabel(date: Date, key: DateKey): string {
  const monthDay = format(date, 'M/d', { locale: ja })
  const labels: Record<DateKey, string> = { today: '今日', tomorrow: '明日', day_after: '明後日' }
  return `${monthDay}（${labels[key]}）`
}

function makeInitialDays(): Record<DateKey, DayData> {
  const today = new Date()
  return {
    today: {
      date: format(today, 'yyyy-MM-dd'),
      label: makeDayLabel(today, 'today'),
      areas: makeInitialAreas(),
    },
    tomorrow: {
      date: format(addDays(today, 1), 'yyyy-MM-dd'),
      label: makeDayLabel(addDays(today, 1), 'tomorrow'),
      areas: makeInitialAreas(),
    },
    day_after: {
      date: format(addDays(today, 2), 'yyyy-MM-dd'),
      label: makeDayLabel(addDays(today, 2), 'day_after'),
      areas: makeInitialAreas(),
    },
  }
}

// ─── ルーム更新ヘルパー ───────────────────────────────────────────────────────
function updateRoom(
  areas: Area[],
  areaId: string,
  roomId: string,
  updater: (room: import('../types').Room) => import('../types').Room
): Area[] {
  return areas.map(area =>
    area.id !== areaId ? area : {
      ...area,
      rooms: area.rooms.map(room =>
        room.id !== roomId ? room : updater(room)
      ),
    }
  )
}

function updateDayAreas(
  days: Record<DateKey, DayData>,
  dateKey: DateKey,
  areaId: string,
  roomId: string,
  updater: (room: import('../types').Room) => import('../types').Room
): Record<DateKey, DayData> {
  return {
    ...days,
    [dateKey]: {
      ...days[dateKey],
      areas: updateRoom(days[dateKey].areas, areaId, roomId, updater),
    },
  }
}

// ─── ストア型定義 ─────────────────────────────────────────────────────────────
interface AppStore {
  days: Record<DateKey, DayData>
  activeDateKey: DateKey
  staffList: string[]

  setActiveDateKey: (key: DateKey) => void
  toggleTask: (dateKey: DateKey, areaId: string, roomId: string, taskId: string) => void
  setKeyState: (dateKey: DateKey, areaId: string, roomId: string, taskId: string, state: 'key_open' | 'key_closed' | 'pending') => void
  setWorkMode: (dateKey: DateKey, areaId: string, roomId: string, mode: WorkMode) => void
  setCheckInInfo: (dateKey: DateKey, areaId: string, roomId: string, info: Partial<CheckInInfo>) => void
  setAssignedStaff: (dateKey: DateKey, areaId: string, roomId: string, staff: string) => void
  setNote: (dateKey: DateKey, areaId: string, roomId: string, note: string) => void
  completeAllTasks: (dateKey: DateKey, areaId: string, roomId: string) => void
  setCleanStatus: (dateKey: DateKey, areaId: string, roomId: string, status: CleanStatus) => void
  setKeyStatus: (dateKey: DateKey, areaId: string, roomId: string, status: KeyStatus) => void
  addStaff: (name: string) => void
  removeStaff: (name: string) => void
  rotateDay: () => void
  applyRemoteUpdate: (dateKey: DateKey, areaId: string, roomId: string, taskId: string, status: TaskStatus, updatedBy: string, updatedAt: string) => void
  applyRemoteRoomUpdate: (dateKey: DateKey, areaId: string, roomId: string, patch: {
    workMode?: WorkMode | null
    assignedStaff?: string | null
    checkInInfo?: Partial<CheckInInfo>
    cleanStatus?: CleanStatus
    keyStatus?: KeyStatus
    note?: string | null
  }) => void
  setLinenOrder: (dateKey: DateKey, order: Partial<LinenOrder>) => void
  setNextDayNote: (dateKey: DateKey, note: string) => void
}

// ─── Zustand ストア ───────────────────────────────────────────────────────────
export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      days: makeInitialDays(),
      activeDateKey: 'today',
      staffList: defaultStaffList,

      setActiveDateKey: (key) => set({ activeDateKey: key }),

      /** タスクを pending → done → pending の順に循環 */
      toggleTask: (dateKey, areaId, roomId, taskId) => {
        set(state => ({
          days: updateDayAreas(state.days, dateKey, areaId, roomId, room => ({
            ...room,
            tasks: room.tasks.map(task => {
              if (task.id !== taskId) return task
              // key_open/key_closed タスクは toggleTask では変更しない
              if (task.status === 'key_open' || task.status === 'key_closed') return task
              const next: TaskStatus = task.status === 'done' ? 'pending' : 'done'
              return { ...task, status: next, updatedAt: new Date().toISOString() }
            }),
          })),
        }))
      },

      /** 鍵状態を設定 */
      setKeyState: (dateKey, areaId, roomId, taskId, state) => {
        set(storeState => ({
          days: updateDayAreas(storeState.days, dateKey, areaId, roomId, room => ({
            ...room,
            tasks: room.tasks.map(task =>
              task.id !== taskId ? task : {
                ...task,
                status: state,
                updatedAt: new Date().toISOString(),
              }
            ),
          })),
        }))
      },

      /** 作業モードを設定（同じモードを再選択すると null に戻す） */
      setWorkMode: (dateKey, areaId, roomId, mode) => {
        set(state => ({
          days: updateDayAreas(state.days, dateKey, areaId, roomId, room => ({
            ...room,
            workMode: room.workMode === mode ? null : mode,
          })),
        }))
      },

      /** チェックイン情報を設定 */
      setCheckInInfo: (dateKey, areaId, roomId, info) => {
        set(state => ({
          days: updateDayAreas(state.days, dateKey, areaId, roomId, room => ({
            ...room,
            checkInInfo: { ...room.checkInInfo, ...info },
          })),
        }))
      },

      /** 担当者を設定 */
      setAssignedStaff: (dateKey, areaId, roomId, staff) => {
        set(state => ({
          days: updateDayAreas(state.days, dateKey, areaId, roomId, room => ({
            ...room,
            assignedStaff: staff,
          })),
        }))
      },

      /** 備考を設定 */
      setNote: (dateKey, areaId, roomId, note) => {
        set(state => ({
          days: updateDayAreas(state.days, dateKey, areaId, roomId, room => ({
            ...room,
            note,
          })),
        }))
      },

      /** 全タスクを一括完了 */
      completeAllTasks: (dateKey, areaId, roomId) => {
        set(state => ({
          days: updateDayAreas(state.days, dateKey, areaId, roomId, room => ({
            ...room,
            tasks: room.tasks.map(task => {
              if (isDone(task.status)) return task
              // 鍵確認タスクは key_closed に
              const newStatus: TaskStatus = task.label === '鍵確認' ? 'key_closed' : 'done'
              return { ...task, status: newStatus, updatedAt: new Date().toISOString() }
            }),
          })),
        }))
      },

      /** サニタリー掃除ステータスを設定 */
      setCleanStatus: (dateKey, areaId, roomId, status) => {
        set(state => ({
          days: updateDayAreas(state.days, dateKey, areaId, roomId, room => ({
            ...room,
            cleanStatus: status,
          })),
        }))
      },

      /** サニタリー鍵ステータスを設定 */
      setKeyStatus: (dateKey, areaId, roomId, status) => {
        set(state => ({
          days: updateDayAreas(state.days, dateKey, areaId, roomId, room => ({
            ...room,
            keyStatus: status,
          })),
        }))
      },

      /** スタッフ追加 */
      addStaff: (name) => {
        set(state => ({
          staffList: state.staffList.includes(name) ? state.staffList : [...state.staffList, name],
        }))
      },

      /** スタッフ削除 */
      removeStaff: (name) => {
        set(state => ({
          staffList: state.staffList.filter(s => s !== name),
        }))
      },

      /** 日付をローテート */
      rotateDay: () => {
        set(state => {
          const today = new Date()
          const newTomorrow = addDays(today, 1)
          const newDayAfter = addDays(today, 2)
          const newDays: Record<DateKey, DayData> = {
            today: {
              ...state.days.tomorrow,
              date: format(today, 'yyyy-MM-dd'),
              label: makeDayLabel(today, 'today'),
            },
            tomorrow: {
              ...state.days.day_after,
              date: format(newTomorrow, 'yyyy-MM-dd'),
              label: makeDayLabel(newTomorrow, 'tomorrow'),
            },
            day_after: {
              date: format(newDayAfter, 'yyyy-MM-dd'),
              label: makeDayLabel(newDayAfter, 'day_after'),
              areas: makeInitialAreas(),
            },
          }
          return {
            days: newDays,
            activeDateKey: 'today',
          }
        })
      },

      /** リモート（Supabase）からのタスク更新を反映 */
      applyRemoteUpdate: (dateKey, areaId, roomId, taskId, status, updatedBy, updatedAt) => {
        set(state => ({
          days: updateDayAreas(state.days, dateKey, areaId, roomId, room => ({
            ...room,
            tasks: room.tasks.map(task => {
              if (task.id !== taskId) return task
              // 既存のタイムスタンプより古いデータは無視する
              if (task.updatedAt && updatedAt && updatedAt < task.updatedAt) return task
              return {
                ...task,
                status,
                updatedAt,
                updatedBy,
              }
            }),
          })),
        }))
      },

      /** リネン発注数量を設定 */
      setLinenOrder: (dateKey, order) => {
        set(state => ({
          days: {
            ...state.days,
            [dateKey]: {
              ...state.days[dateKey],
              linenOrder: { cabin: null, lodge: null, ...state.days[dateKey].linenOrder, ...order },
            },
          },
        }))
      },

      /** 翌日への申し送りを設定 */
      setNextDayNote: (dateKey, note) => {
        set(state => ({
          days: {
            ...state.days,
            [dateKey]: { ...state.days[dateKey], nextDayNote: note },
          },
        }))
      },

      /** リモート（Supabase）からの部屋状態更新を反映 */
      applyRemoteRoomUpdate: (dateKey, areaId, roomId, patch) => {
        set(state => ({
          days: updateDayAreas(state.days, dateKey, areaId, roomId, room => {
            return {
              ...room,
              ...(patch.workMode !== undefined && { workMode: patch.workMode }),
              ...(patch.assignedStaff !== undefined && { assignedStaff: patch.assignedStaff ?? undefined }),
              ...(patch.checkInInfo !== undefined && { checkInInfo: { ...room.checkInInfo, ...patch.checkInInfo } }),
              ...(patch.cleanStatus !== undefined && { cleanStatus: patch.cleanStatus }),
              ...(patch.keyStatus !== undefined && { keyStatus: patch.keyStatus }),
              ...(patch.note !== undefined && { note: patch.note ?? undefined }),
            }
          }),
        }))
      },
    }),
    {
      name: 'tinygarden-staff-v5',
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const today = format(new Date(), 'yyyy-MM-dd')
        // 保存済みの today の日付が現在の日付と異なればローテート
        if (state.days.today.date !== today) {
          state.rotateDay()
        }
      },
    }
  )
)
