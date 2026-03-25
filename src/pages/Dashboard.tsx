// ダッシュボード画面（画面①）
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import AreaCard from '../components/AreaCard'
import StaffModal from '../components/StaffModal'
import RoomBottomSheet from '../components/RoomBottomSheet'

export default function Dashboard() {
  const { days, activeDateKey, staffList, addStaff, removeStaff, setDayNote, setNextDayNote } = useAppStore()
  const navigate = useNavigate()
  const [showStaffModal, setShowStaffModal] = useState(false)
  const [openedRoom, setOpenedRoom] = useState<{ areaId: string; roomId: string } | null>(null)

  const activeDay = days[activeDateKey]

  // CI合計サマリー（全エリア横断、サニタリー除く）
  const allCiRooms = activeDay.areas
    .filter(a => a.areaType !== 'sanitary')
    .flatMap(a => a.rooms)
    .filter(r => r.checkInInfo?.time || r.checkInInfo?.adults !== undefined || r.checkInInfo?.children !== undefined)
  const ciTotalAdults = allCiRooms.reduce((s, r) => s + (r.checkInInfo?.adults ?? 0), 0)
  const ciTotalChildren = allCiRooms.reduce((s, r) => s + (r.checkInInfo?.children ?? 0), 0)

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    padding: '8px 10px',
    fontSize: '14px',
    resize: 'vertical',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ padding: '16px', paddingBottom: '32px' }}>
      {/* CI合計サマリー */}
      {allCiRooms.length > 0 && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '12px',
            fontSize: '13px',
            color: 'var(--accent-teal)',
            fontWeight: 700,
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          <span>本日のCI</span>
          <span>合計 {allCiRooms.length}件</span>
          <span>👤 {ciTotalAdults}名</span>
          <span>👶 {ciTotalChildren}名</span>
        </div>
      )}

      {/* 担当者管理ボタン */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button
          onClick={() => setShowStaffModal(true)}
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text-secondary)',
            padding: '8px 14px',
            fontSize: '14px',
            cursor: 'pointer',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          👤 担当者を管理
        </button>
      </div>

      {/* エリアカードグリッド */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(1, 1fr)',
          gap: '12px',
        }}
        className="area-grid"
      >
        {activeDay.areas.map(area => (
          <AreaCard
            key={area.id}
            area={area}
            onClick={() => navigate(`/area/${area.id}`)}
            onRoomBadgeClick={(areaId, roomId) => setOpenedRoom({ areaId, roomId })}
          />
        ))}
      </div>

      {/* 備考セクション */}
      <div style={{ marginTop: '24px' }}>
        <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
          📝 備考
        </p>
        <textarea
          value={activeDay.note ?? ''}
          onChange={e => setDayNote(activeDateKey, e.target.value)}
          placeholder="本日の備考を入力…"
          rows={3}
          style={textareaStyle}
        />
      </div>

      {/* 翌日への申し送りセクション */}
      <div style={{ marginTop: '16px' }}>
        <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
          📋 翌日への申し送り（清掃後に記入）
        </p>
        <textarea
          value={activeDay.nextDayNote ?? ''}
          onChange={e => setNextDayNote(activeDateKey, e.target.value)}
          placeholder="翌日スタッフへの申し送り事項を入力…"
          rows={4}
          style={textareaStyle}
        />
      </div>

      {/* スタッフモーダル */}
      {showStaffModal && (
        <StaffModal
          staffList={staffList}
          onAdd={addStaff}
          onRemove={removeStaff}
          onClose={() => setShowStaffModal(false)}
        />
      )}

      {/* ルームボトムシート */}
      {openedRoom && (
        <RoomBottomSheet
          areaId={openedRoom.areaId}
          roomId={openedRoom.roomId}
          dateKey={activeDateKey}
          onClose={() => setOpenedRoom(null)}
        />
      )}
    </div>
  )
}
