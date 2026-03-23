import type { Area, Room, Task, TaskStatus } from '../types'

// コンフォートエリアで「清掃」モード時に非表示にするタスクラベル
const COMFORT_CLEAN_HIDDEN = new Set(['シーツセット', '電源ON'])

export function getVisibleTasks(room: Room): Task[] {
  if (room.areaType === 'comfort' && room.workMode === 'clean') {
    return room.tasks.filter(t => !COMFORT_CLEAN_HIDDEN.has(t.label))
  }
  return room.tasks
}

// 進捗カウント用（通常タスク）
export function isDone(status: TaskStatus): boolean {
  return status === 'done' || status === 'key_open' || status === 'key_closed'
}

// サニタリー部屋の完了判定
export function isSanitaryRoomDone(room: Room): boolean {
  return room.cleanStatus === 'done' || room.cleanStatus === 'skip'
}

// 湖畔サイトの完了判定（全タスク完了 + 電源設定済み）
export function isLakesiteRoomDone(room: Room): boolean {
  const allTasksDone = room.tasks.length > 0 && room.tasks.every(t => isDone(t.status))
  const powerSet = (room.keyStatus ?? 'unset') !== 'unset'
  return allTasksDone && powerSet
}

// お風呂部屋の完了判定（全タスク完了）
export function isBathRoomDone(room: Room): boolean {
  return room.tasks.length > 0 && room.tasks.every(t => isDone(t.status))
}

// エリアの未完了カウント（Header・AreaCard用）
export function getAreaPendingCount(area: Area): number {
  if (area.areaType === 'sanitary') {
    return area.rooms.filter(r => !isSanitaryRoomDone(r)).length
  }
  if (area.areaType === 'lakeside') {
    return area.rooms.filter(r => !isLakesiteRoomDone(r)).length
  }
  if (area.areaType === 'bath') {
    return area.rooms.flatMap(r => r.tasks).filter(t => !isDone(t.status)).length
  }
  // lodge, comfort, pet, eco, sauna, workstation, auto, free
  const selectedRooms = area.rooms.filter(r => r.workMode != null)
  const tasks = selectedRooms.flatMap(r => getVisibleTasks(r))
  return tasks.filter(t => !isDone(t.status)).length
}
