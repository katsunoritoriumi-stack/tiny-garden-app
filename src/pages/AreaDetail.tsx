// エリア詳細画面（画面②③）
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import RoomCard from '../components/RoomCard'
import SanitaryAreaCard from '../components/SanitaryAreaCard'
import LakesiteAreaCard from '../components/LakesiteAreaCard'
import BathAreaCard from '../components/BathAreaCard'
import LodgeAreaCard from '../components/LodgeAreaCard'
import LodgeSinkAreaCard from '../components/LodgeSinkAreaCard'
import ProgressBar from '../components/ProgressBar'
import FireworksFullScreen from '../components/FireworksFullScreen'
import { getVisibleTasks, isDone, isSanitaryRoomDone, isLakesiteRoomDone, isBathRoomDone, isLodgeSinkDone } from '../utils/visibleTasks'

export default function AreaDetail() {
  const { areaId } = useParams<{ areaId: string }>()
  const navigate = useNavigate()
  const {
    days,
    activeDateKey,
    staffList,
    toggleTask,
    setKeyState,
    setNote,
    completeAllTasks,
    resetRoomTasks,
    setWorkMode,
    setCheckInInfo,
    setAssignedStaff,
    setCleanStatus,
    setKeyStatus,
  } = useAppStore()

  const [showFullFireworks, setShowFullFireworks] = useState(false)
  const prevPercentRef = useRef<number | null>(null)
  const hasMountedRef = useRef(false)

  const activeDay = days[activeDateKey]
  const area = activeDay.areas.find(a => a.id === areaId)

  // 進捗計算
  const areaType = area?.areaType
  let doneCount = 0
  let totalTasks = 0
  if (area) {
    if (areaType === 'sanitary') {
      doneCount = area.rooms.filter(r => isSanitaryRoomDone(r)).length
      totalTasks = area.rooms.length
    } else if (areaType === 'lakeside') {
      doneCount = area.rooms.filter(r => isLakesiteRoomDone(r)).length
      totalTasks = area.rooms.length
    } else if (areaType === 'bath') {
      doneCount = area.rooms.filter(r => isBathRoomDone(r)).length
      totalTasks = area.rooms.length
    } else if (areaType === 'lodge_sink') {
      doneCount = area.rooms.filter(r => isLodgeSinkDone(r)).length
      totalTasks = area.rooms.length
    } else if (areaType === 'lodge') {
      const selectedRooms = area.rooms.filter(r => r.workMode != null)
      const allT = selectedRooms.flatMap(r => r.tasks)
      doneCount = allT.filter(t => isDone(t.status)).length
      totalTasks = allT.length
    } else {
      const selectedRooms = area.rooms.filter(r => r.workMode != null)
      const allT = selectedRooms.flatMap(r => getVisibleTasks(r))
      doneCount = allT.filter(t => isDone(t.status)).length
      totalTasks = allT.length
    }
  }
  const percent = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      prevPercentRef.current = percent
      return
    }
    if ((prevPercentRef.current ?? 0) < 100 && percent === 100 && totalTasks > 0) {
      setShowFullFireworks(true)
      const timer = setTimeout(() => setShowFullFireworks(false), 3000)
      return () => clearTimeout(timer)
    }
    prevPercentRef.current = percent
  }, [percent, totalTasks])

  if (!area) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p>エリアが見つかりません</p>
        <button
          onClick={() => navigate('/')}
          style={{ marginTop: '16px', color: 'var(--accent-teal)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
        >
          ← ダッシュボードへ
        </button>
      </div>
    )
  }

  return (
    <>
      <FireworksFullScreen
        visible={showFullFireworks}
        onClose={() => setShowFullFireworks(false)}
      />

      <div style={{ padding: '16px', paddingBottom: '32px' }}>
        {/* 戻るボタン + エリア名 */}
        <div style={{ marginBottom: '16px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none', border: 'none', color: 'var(--accent-teal)',
              fontSize: '13px', cursor: 'pointer', padding: '0', marginBottom: '8px',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}
          >
            ← ダッシュボード
          </button>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            {area.name}
          </h2>

          {totalTasks > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <ProgressBar value={percent} height={6} />
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                {doneCount}/{totalTasks}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-teal)' }}>
                {percent}%
              </span>
            </div>
          )}
        </div>

        {/* コンテンツ */}
        {areaType === 'sanitary' ? (
          <SanitaryAreaCard
            area={area}
            onSetCleanStatus={(roomId, status) => setCleanStatus(activeDateKey, area.id, roomId, status)}
            onSetKeyStatus={(roomId, status) => setKeyStatus(activeDateKey, area.id, roomId, status)}
          />
        ) : areaType === 'lakeside' ? (
          <LakesiteAreaCard
            area={area}
            onToggleTask={(roomId, taskId) => toggleTask(activeDateKey, area.id, roomId, taskId)}
            onSetCheckInInfo={(roomId, info) => setCheckInInfo(activeDateKey, area.id, roomId, info)}
            onSetKeyStatus={(roomId, status) => setKeyStatus(activeDateKey, area.id, roomId, status)}
            onSetCleanStatus={(roomId, status) => setCleanStatus(activeDateKey, area.id, roomId, status)}
            onSetNote={(roomId, note) => setNote(activeDateKey, area.id, roomId, note)}
          />
        ) : areaType === 'bath' ? (
          <BathAreaCard
            area={area}
            onToggleTask={(roomId, taskId) => toggleTask(activeDateKey, area.id, roomId, taskId)}
            onCompleteAll={(roomId) => completeAllTasks(activeDateKey, area.id, roomId)}
            onSetCleanStatus={(roomId, status) => setCleanStatus(activeDateKey, area.id, roomId, status)}
            onResetClean={(roomId) => {
              setCleanStatus(activeDateKey, area.id, roomId, 'unset')
              resetRoomTasks(activeDateKey, area.id, roomId)
            }}
          />
        ) : areaType === 'lodge_sink' ? (
          <LodgeSinkAreaCard
            area={area}
            onToggleTask={(roomId, taskId) => toggleTask(activeDateKey, area.id, roomId, taskId)}
            onCompleteAll={(roomId) => completeAllTasks(activeDateKey, area.id, roomId)}
            onSetCleanStatus={(roomId, status) => setCleanStatus(activeDateKey, area.id, roomId, status)}
            onResetClean={(roomId) => {
              setCleanStatus(activeDateKey, area.id, roomId, 'unset')
              resetRoomTasks(activeDateKey, area.id, roomId)
            }}
          />
        ) : areaType === 'lodge' ? (
          <LodgeAreaCard
            area={area}
            staffList={staffList}
            onToggleTask={(roomId, taskId) => toggleTask(activeDateKey, area.id, roomId, taskId)}
            onCompleteAll={(roomId) => completeAllTasks(activeDateKey, area.id, roomId)}
            onSetCheckInInfo={(roomId, info) => setCheckInInfo(activeDateKey, area.id, roomId, info)}
            onSetAssignedStaff={(roomId, staff) => setAssignedStaff(activeDateKey, area.id, roomId, staff)}
            onSetNote={(roomId, note) => setNote(activeDateKey, area.id, roomId, note)}
            onSetWorkMode={(roomId, mode) => setWorkMode(activeDateKey, area.id, roomId, mode)}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {area.rooms.map(room => (
              <RoomCard
                key={room.id}
                room={room}
                areaId={area.id}
                dateKey={activeDateKey}
                staffList={staffList}
                onToggleTask={(taskId) => toggleTask(activeDateKey, area.id, room.id, taskId)}
                onSetKeyState={(taskId, state) => setKeyState(activeDateKey, area.id, room.id, taskId, state)}
                onSetNote={(note) => setNote(activeDateKey, area.id, room.id, note)}
                onCompleteAll={() => completeAllTasks(activeDateKey, area.id, room.id)}
                onSetWorkMode={(mode) => setWorkMode(activeDateKey, area.id, room.id, mode)}
                onSetCheckInInfo={(info) => setCheckInInfo(activeDateKey, area.id, room.id, info)}
                onSetAssignedStaff={(staff) => setAssignedStaff(activeDateKey, area.id, room.id, staff)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
