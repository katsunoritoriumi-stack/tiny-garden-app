export type AreaType = 'comfort' | 'pet' | 'eco' | 'sauna' | 'workstation' | 'auto' | 'free' | 'sanitary' | 'lodge' | 'lakeside' | 'bath' | 'lodge_sink'
export type TaskStatus = 'pending' | 'done' | 'key_open' | 'key_closed'
export type WorkMode = 'set' | 'check' | 'clean' | null
export type DateKey = 'today' | 'tomorrow'
export type CleanStatus = 'unset' | 'needed' | 'done' | 'skip'
export type KeyStatus = 'unset' | 'open' | 'closed'

export interface CheckInInfo {
  time?: string      // 例："15:00"
  adults?: number    // 大人人数
  children?: number  // 子供人数
}

export interface Task {
  id: string
  label: string
  status: TaskStatus
  updatedAt: string
  updatedBy?: string
}

export interface Room {
  id: string
  name?: string           // サニタリー用（例："男トイレ"）
  areaType: AreaType
  workMode: WorkMode      // デフォルト: null
  checkInInfo?: CheckInInfo
  assignedStaff?: string
  tasks: Task[]
  note?: string
  cleanStatus?: CleanStatus
  keyStatus?: KeyStatus
}

export interface Area {
  id: string
  name: string
  areaType: AreaType
  rooms: Room[]
}

export interface LinenOrder {
  cabin: number | null
  lodge: number | null
}

export interface DayData {
  date: string   // "YYYY-MM-DD"
  label: string  // 例："3/19（今日）"
  areas: Area[]
  note?: string
  linenOrder?: LinenOrder
  nextDayNote?: string
}
