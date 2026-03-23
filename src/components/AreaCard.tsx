// エリアカードコンポーネント（ダッシュボード用）
import { useEffect, useRef, useState } from 'react'
import ProgressBar from './ProgressBar'
import { getVisibleTasks, isDone, isSanitaryRoomDone, isLakesiteRoomDone, isBathRoomDone } from '../utils/visibleTasks'
import type { Area, WorkMode } from '../types'

interface AreaCardProps {
  area: Area
  onClick: () => void
  onRoomBadgeClick?: (areaId: string, roomId: string) => void
}

// エリア種別ごとのアイコン
const AREA_ICON: Record<string, string> = {
  comfort:     '🏠',
  pet:         '🐾',
  eco:         '🌿',
  sauna:       '🔥',
  workstation: '💼',
  auto:        '🚗',
  free:        '⛺',
  sanitary:    '🚻',
  lodge:       '🏨',
  lakeside:    '🌊',
  bath:        '🛁',
}

// 作業モードのバッジ定義
const MODE_BADGE: Record<NonNullable<WorkMode>, { label: string; color: string; bg: string }> = {
  set:   { label: 'セット', color: '#3498db', bg: 'rgba(52,152,219,0.2)' },
  check: { label: '確認',   color: '#f39c12', bg: 'rgba(243,156,18,0.2)' },
  clean: { label: '清掃',   color: '#2ecc71', bg: 'rgba(46,204,113,0.2)' },
}

export default function AreaCard({ area, onClick, onRoomBadgeClick }: AreaCardProps) {
  const isSanitary = area.areaType === 'sanitary'
  const isLakeside = area.areaType === 'lakeside'
  const isBath = area.areaType === 'bath'
  const isRoomBased = !isSanitary && !isLakeside && !isBath

  // ── 進捗計算 ─────────────────────────────────────────────────────────────
  let effectiveDone: number
  let effectiveTotal: number

  if (isSanitary) {
    effectiveDone = area.rooms.filter(r => isSanitaryRoomDone(r)).length
    effectiveTotal = area.rooms.length
  } else if (isLakeside) {
    effectiveDone = area.rooms.filter(r => isLakesiteRoomDone(r)).length
    effectiveTotal = area.rooms.length
  } else if (isBath) {
    const allTasks = area.rooms.flatMap(r => r.tasks)
    effectiveDone = allTasks.filter(t => isDone(t.status)).length
    effectiveTotal = allTasks.length
  } else {
    const selectedRooms = area.rooms.filter(r => r.workMode != null)
    const allTasks = selectedRooms.flatMap(r => getVisibleTasks(r))
    effectiveDone = allTasks.filter(t => isDone(t.status)).length
    effectiveTotal = allTasks.length
  }

  const selectedRooms = isRoomBased ? area.rooms.filter(r => r.workMode != null) : []
  const pendingCount = effectiveTotal - effectiveDone
  const percent = effectiveTotal > 0 ? Math.round((effectiveDone / effectiveTotal) * 100) : 0

  const allDone = effectiveTotal > 0 && effectiveDone === effectiveTotal
  const isStarted = isSanitary
    ? area.rooms.some(r => (r.cleanStatus ?? 'unset') !== 'unset' || (r.keyStatus ?? 'unset') !== 'unset')
    : isLakeside
    ? area.rooms.some(r => r.tasks.some(t => t.status !== 'pending') || (r.keyStatus ?? 'unset') !== 'unset')
    : isBath
    ? area.rooms.some(r => r.tasks.some(t => t.status !== 'pending'))
    : selectedRooms.length > 0

  // ── アイコン色 ────────────────────────────────────────────────────────────
  const iconColor = allDone
    ? '#95a5a6'
    : effectiveDone > 0
    ? 'var(--accent-blue)'
    : isStarted
    ? '#e67e22'
    : 'var(--text-secondary)'

  // ── 完了アニメーション ────────────────────────────────────────────────────
  const prevAllDoneRef = useRef(false)
  const [iconAnimating, setIconAnimating] = useState(false)
  useEffect(() => {
    if (allDone && !prevAllDoneRef.current) {
      setIconAnimating(true)
      const t = setTimeout(() => setIconAnimating(false), 600)
      return () => clearTimeout(t)
    }
    prevAllDoneRef.current = allDone
  }, [allDone])

  // ── CI情報 棟別一覧 ────────────────────────────────────────────────────────
  const ciRooms = isSanitary ? [] : area.rooms.filter(
    r => r.checkInInfo?.time || r.checkInInfo?.adults !== undefined || r.checkInInfo?.children !== undefined
  ).sort((a, b) => {
    const ta = a.checkInInfo?.time ?? ''
    const tb = b.checkInInfo?.time ?? ''
    if (!ta && !tb) return 0
    if (!ta) return 1
    if (!tb) return -1
    return ta.localeCompare(tb)
  })

  const statusColor = allDone ? 'var(--accent-green)' : 'var(--text-secondary)'

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        background: 'var(--bg-secondary)',
        border: `1px solid ${allDone ? 'var(--accent-green)' : 'var(--border)'}`,
        borderRadius: '12px',
        padding: '14px',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'transform 0.1s, box-shadow 0.1s',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        position: 'relative',
      }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'
      }}
    >
      {/* 未完了バッジ */}
      {pendingCount > 0 && (isSanitary || selectedRooms.length > 0) && (
        <span
          style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            background: 'var(--accent-red)',
            color: '#fff',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 700,
            minWidth: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 5px',
          }}
        >
          {pendingCount}
        </span>
      )}

      {/* タイトル行 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            fontSize: '22px',
            display: 'inline-block',
            color: iconColor,
            transition: 'color 0.5s ease',
            animation: iconAnimating ? 'iconPop 0.5s ease-out' : 'none',
          }}
        >
          {AREA_ICON[area.areaType] ?? '📋'}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
            {area.name}
          </p>
          <p style={{ fontSize: '12px', color: statusColor, marginTop: '2px' }}>
            {area.rooms.length}{(isSanitary || isLakeside) ? '箇所' : isBath ? '室' : '部屋'}
            {(isSanitary || isLakeside) ? ` / ${effectiveDone}/${effectiveTotal} 完了`
              : isBath ? ` / ${effectiveDone}/${effectiveTotal} タスク`
              : selectedRooms.length > 0 ? ` / ${effectiveDone}/${effectiveTotal} タスク` : ''}
          </p>
        </div>
      </div>

      {/* CI情報 棟別一覧 */}
      {ciRooms.length > 0 && (
        <div
          style={{
            background: 'var(--bg-tertiary)',
            borderRadius: '8px',
            padding: '8px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {ciRooms.map(room => (
            <div
              key={room.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: 'var(--text-primary)',
              }}
            >
              <span style={{ fontWeight: 700, minWidth: '36px', fontFamily: 'var(--font-mono)' }}>
                {room.id}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', minWidth: '44px', color: 'var(--text-secondary)' }}>
                {room.checkInInfo?.time || '―'}
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                👤{room.checkInInfo?.adults ?? 0}名
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                👶{room.checkInInfo?.children ?? 0}名
              </span>
            </div>
          ))}
          <div
            style={{
              borderTop: '1px solid var(--border)',
              marginTop: '2px',
              paddingTop: '4px',
              fontSize: '11px',
              color: 'var(--accent-teal)',
              fontWeight: 700,
            }}
          >
            計 {ciRooms.length}件
            大人 {ciRooms.reduce((s, r) => s + (r.checkInInfo?.adults ?? 0), 0)}名
            子 {ciRooms.reduce((s, r) => s + (r.checkInInfo?.children ?? 0), 0)}名
          </div>
        </div>
      )}

      {/* 各部屋のモードバッジ（通常エリア・タップでボトムシート） */}
      {isRoomBased && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {area.rooms.map(room => {
            const badge = room.workMode ? MODE_BADGE[room.workMode] : null
            const roomTasks = getVisibleTasks(room)
            const roomAllDone = room.workMode != null && roomTasks.length > 0 && roomTasks.every(t => isDone(t.status))
            return (
              <button
                key={room.id}
                onClick={e => {
                  e.stopPropagation()
                  onRoomBadgeClick?.(area.id, room.id)
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '4px 7px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 700,
                  background: roomAllDone ? 'rgba(149,165,166,0.2)' : badge ? badge.bg : 'rgba(45,64,85,0.4)',
                  color: roomAllDone ? '#95a5a6' : badge ? badge.color : 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)',
                  border: 'none',
                  cursor: onRoomBadgeClick ? 'pointer' : 'default',
                  minHeight: '28px',
                }}
              >
                <span>{room.id}</span>
                <span style={{ opacity: 0.8 }}>
                  {roomAllDone ? '✓' : badge ? badge.label : '－'}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* サニタリー/湖畔/お風呂の部屋バッジ */}
      {(isSanitary || isLakeside || isBath) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {area.rooms.map(room => {
            const done = isSanitary
              ? isSanitaryRoomDone(room)
              : isLakeside
              ? isLakesiteRoomDone(room)
              : isBathRoomDone(room)
            return (
              <span
                key={room.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  background: done ? 'rgba(46,204,113,0.2)' : 'rgba(45,64,85,0.4)',
                  color: done ? 'var(--accent-green)' : 'var(--text-secondary)',
                }}
              >
                {room.name ?? room.id}
                {done && ' ✓'}
              </span>
            )
          })}
        </div>
      )}

      {/* 進捗バー */}
      {effectiveTotal > 0 && <ProgressBar value={percent} />}

      {/* ステータス行 */}
      {effectiveTotal > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {effectiveDone > 0 && (
              <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 600 }}>
                ✓ 完了 {effectiveDone}
              </span>
            )}
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: statusColor }}>
            {percent}%
          </span>
        </div>
      )}
    </div>
  )
}
