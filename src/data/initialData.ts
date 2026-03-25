import type { Area, Task, Room } from '../types'

// ─── タスク生成ヘルパー ───────────────────────────────────────────────────────
function makeTasks(labels: string[]): Task[] {
  return labels.map((label, i) => ({
    id: `t${i + 1}`,
    label,
    status: 'pending',
    updatedAt: new Date().toISOString(),
  }))
}

// ─── キャビン（コンフォート）タスク ──────────────────────────────────────────
const COMFORT_TASKS = [
  'シーツセット', 'コロコロ', '掃除機', '入口床ドア', '窓サッシ',
  'ストーブフィルタ', '備品チェック', '電源ON', 'ベランダ', '施錠', 'Wチェック',
]

// ─── キャビン（ペット）タスク ─────────────────────────────────────────────────
const PET_TASKS = [
  'シーツセット', '床コロコロ', '入口床ドア', '窓', 'ベランダ', '備品チェック', 'Wチェック',
]

// ─── キャビン（エコ）タスク ───────────────────────────────────────────────────
const ECO_TASKS = [
  '掃除機', '入口床ドア', '窓', 'ベランダ', '施錠', '周辺ゴミ拾い', 'Wチェック',
]

// ─── キャビンサウナ タスク ────────────────────────────────────────────────────
const SAUNA_TASKS = [
  '掃除', '灰捨て', '薪補充', '水風呂', 'ベランダ', '水拭き', '入口床', '電気', '施錠', '備品確認',
]

// ─── ワークステーション タスク ────────────────────────────────────────────────
const WORKSTATION_TASKS = [
  '反省', '床', 'コンロ', 'シンク', '拭き掃除', '整理整頓', 'エアコン', '電気', '施錠', '備品確認',
]

// ─── オートサイト タスク ──────────────────────────────────────────────────────
const AUTO_TASKS = ['ゴミ拾い', '草刈り', '落ち葉ブロア']

// ─── フリーサイト タスク ──────────────────────────────────────────────────────
const FREE_TASKS = ['ゴミ拾い', '芝チェック', '落ち葉ブロア']

// ─── ロッジ客室 タスク ────────────────────────────────────────────────────────
const LODGE_TASKS = [
  'ベッドメイク', 'トイレ', '水回り・鏡', 'アメニティ', '床掃除',
  '棚・冷蔵庫・金庫', 'カーテン・窓', 'ゴミ箱', '電気・空調',
  'ドア拭き・施錠', '廊下・階段', 'Wチェック',
]

// ─── 湖畔サイト タスク ────────────────────────────────────────────────────────
const LAKESIDE_TASKS = ['ゴミ拾い']

// ─── お風呂 タスク ────────────────────────────────────────────────────────────
const BATH_TASKS = ['脱衣所', '洗面台', '洗い場', 'トイレ', '棚・床', '廊下', 'Wチェック']

// ─── ロッジB1外の流し タスク ──────────────────────────────────────────────────
const LODGE_SINK_TASKS = ['ゴミ', '流し', '消毒', '忘れ物チェック']

// ─── サニタリー部屋生成ヘルパー ─────────────────────────────────────────────
function makeSanitaryRoom(id: string, name: string, areaType: 'sanitary'): Room {
  return { id, name, areaType, workMode: null, tasks: [], cleanStatus: 'unset', keyStatus: 'unset' }
}

// ─── 初期エリアデータ生成関数 ─────────────────────────────────────────────────
export function makeInitialAreas(): Area[] {
  return [
    // ① キャビン（コンフォート）
    {
      id: 'comfort',
      name: 'キャビン（コンフォート）',
      areaType: 'comfort',
      rooms: ['E08', 'E09', 'E10', 'E11', 'E12', 'E13', 'E15', 'C2'].map(id => ({
        id,
        areaType: 'comfort',
        workMode: null,
        tasks: makeTasks(COMFORT_TASKS),
      })),
    },

    // ② キャビン（ペット）
    {
      id: 'pet',
      name: 'キャビン（ペット）',
      areaType: 'pet',
      rooms: ['E03', 'E04', 'E05', 'E06'].map(id => ({
        id,
        areaType: 'pet',
        workMode: null,
        tasks: makeTasks(PET_TASKS),
      })),
    },

    // ③ キャビン（エコ）
    {
      id: 'eco',
      name: 'キャビン（エコ）',
      areaType: 'eco',
      rooms: ['E16', 'E17', 'E18', 'G01', 'G02', 'G03', 'G04', 'G05'].map(id => ({
        id,
        areaType: 'eco',
        workMode: null,
        tasks: makeTasks(ECO_TASKS),
      })),
    },

    // ④ キャビンサウナ
    {
      id: 'sauna',
      name: 'キャビンサウナ',
      areaType: 'sauna',
      rooms: [
        {
          id: 'C01',
          areaType: 'sauna',
          workMode: null,
          tasks: makeTasks(SAUNA_TASKS),
        },
      ],
    },

    // ⑤ ワークステーション
    {
      id: 'workstation',
      name: 'ワークステーション',
      areaType: 'workstation',
      rooms: [
        {
          id: 'B1',
          areaType: 'workstation',
          workMode: null,
          tasks: makeTasks(WORKSTATION_TASKS),
        },
      ],
    },

    // ⑥ オートサイト
    {
      id: 'auto',
      name: 'オートサイト',
      areaType: 'auto',
      rooms: ['B1', 'B2', 'B3', 'B4', 'B5', 'B6'].map(id => ({
        id,
        areaType: 'auto',
        workMode: null,
        tasks: makeTasks(AUTO_TASKS),
      })),
    },

    // ⑦ フリーサイト
    {
      id: 'free',
      name: 'フリーサイト',
      areaType: 'free',
      rooms: ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10'].map(id => ({
        id,
        areaType: 'free',
        workMode: null,
        tasks: makeTasks(FREE_TASKS),
      })),
    },

    // ⑧ キャビンサニタリー（コンフォート棟側）
    {
      id: 'sanitary_comfort',
      name: 'キャビンサニタリー（コンフォート棟側）',
      areaType: 'sanitary',
      rooms: [
        makeSanitaryRoom('sanitary_comfort_male',    '男トイレ',   'sanitary'),
        makeSanitaryRoom('sanitary_comfort_female',  '女トイレ',   'sanitary'),
        makeSanitaryRoom('sanitary_comfort_kitchen', 'キッチン棟', 'sanitary'),
      ],
    },

    // ⑨ キャビンサニタリー（オートサイト側）
    {
      id: 'sanitary_auto',
      name: 'キャビンサニタリー（オートサイト側）',
      areaType: 'sanitary',
      rooms: [
        makeSanitaryRoom('sanitary_auto_male',    '男トイレ',   'sanitary'),
        makeSanitaryRoom('sanitary_auto_female',  '女トイレ',   'sanitary'),
        makeSanitaryRoom('sanitary_auto_kitchen', 'キッチン棟', 'sanitary'),
      ],
    },

    // ⑩ ロッジ客室（201〜207）
    {
      id: 'lodge',
      name: 'ロッジ客室',
      areaType: 'lodge',
      rooms: ['201', '202', '203', '204', '205', '206', '207'].map(id => ({
        id,
        areaType: 'lodge' as const,
        workMode: null,
        tasks: makeTasks(LODGE_TASKS),
      })),
    },

    // ⑪ ロッジB1外の流し
    {
      id: 'lodge_sink',
      name: 'ロッジB1外の流し',
      areaType: 'lodge_sink',
      rooms: [
        {
          id: 'lodge_sink_main',
          name: 'B1外の流し',
          areaType: 'lodge_sink' as const,
          workMode: null,
          tasks: makeTasks(LODGE_SINK_TASKS),
          cleanStatus: 'unset' as const,
        },
      ],
    },

    // ⑫ 湖畔サイト
    {
      id: 'lakeside',
      name: '湖畔サイト',
      areaType: 'lakeside',
      rooms: ['A1', 'A2', 'A3'].map(id => ({
        id,
        areaType: 'lakeside' as const,
        workMode: null,
        tasks: makeTasks(LAKESIDE_TASKS),
        keyStatus: 'unset' as const,
        cleanStatus: 'unset' as const,
      })),
    },

    // ⑬ お風呂
    {
      id: 'bath',
      name: 'お風呂',
      areaType: 'bath',
      rooms: [
        { id: 'bath_female', name: '女湯', areaType: 'bath' as const, workMode: null, tasks: makeTasks(BATH_TASKS), cleanStatus: 'unset' as const },
        { id: 'bath_male',   name: '男湯', areaType: 'bath' as const, workMode: null, tasks: makeTasks(BATH_TASKS), cleanStatus: 'unset' as const },
      ],
    },
  ]
}

export const initialAreas: Area[] = makeInitialAreas()
