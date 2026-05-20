import { useRef, useState } from 'react'
import { useAppState } from '../state/AppStateContext'

const LONG_PRESS_MS = 500
const LONG_PRESS_TOLERANCE_PX = 10

function useLongPress(onLongPress: () => void) {
  const timer = useRef<number | null>(null)
  const startPos = useRef<{ x: number; y: number } | null>(null)
  const fired = useRef(false)

  const clear = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
  }

  return {
    consumedLongPress: () => {
      const f = fired.current
      fired.current = false
      return f
    },
    handlers: {
      onTouchStart: (e: React.TouchEvent) => {
        const t = e.touches[0]
        startPos.current = { x: t.clientX, y: t.clientY }
        fired.current = false
        clear()
        timer.current = window.setTimeout(() => {
          fired.current = true
          onLongPress()
        }, LONG_PRESS_MS)
      },
      onTouchMove: (e: React.TouchEvent) => {
        if (!startPos.current) return
        const t = e.touches[0]
        const dx = t.clientX - startPos.current.x
        const dy = t.clientY - startPos.current.y
        if (Math.hypot(dx, dy) > LONG_PRESS_TOLERANCE_PX) clear()
      },
      onTouchEnd: () => {
        clear()
        startPos.current = null
      },
      onTouchCancel: () => {
        clear()
        startPos.current = null
        fired.current = false
      },
      onContextMenu: (e: React.MouseEvent) => {
        // Suppress iOS Safari's native long-press context menu / callout
        e.preventDefault()
      },
    },
  }
}

function TripTabItem({
  trip,
  isActive,
  isRenaming,
  draftName,
  setDraftName,
  onActivate,
  onStartRename,
  onCommitRename,
  onCancelRename,
  onDelete,
  score,
}: {
  trip: { id: string; name: string }
  isActive: boolean
  isRenaming: boolean
  draftName: string
  setDraftName: (s: string) => void
  onActivate: () => void
  onStartRename: () => void
  onCommitRename: () => void
  onCancelRename: () => void
  onDelete: () => void
  score: number
}) {
  const { handlers, consumedLongPress } = useLongPress(onStartRename)

  return (
    <div
      className={`trip-tab${isActive ? ' trip-tab--active' : ''}`}
      onClick={() => {
        if (isRenaming) return
        if (consumedLongPress()) return // suppress synthetic click after long-press
        onActivate()
      }}
      {...(isRenaming ? {} : handlers)}
    >
      {isRenaming ? (
        <input
          className="trip-tab__input"
          autoFocus
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={onCommitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onCommitRename()
            if (e.key === 'Escape') onCancelRename()
          }}
        />
      ) : (
        <>
          <span
            className="trip-tab__name"
            onDoubleClick={(e) => {
              e.stopPropagation()
              onStartRename()
            }}
            title="Double-click (or long-press) to rename"
          >
            {trip.name}
          </span>
          <span className="trip-tab__score">{score}</span>
          <button
            type="button"
            className="trip-tab__delete"
            title="Delete trip"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            ×
          </button>
        </>
      )}
    </div>
  )
}

export function TripTabs() {
  const { state, tripScore, addTrip, renameTrip, deleteTrip, setActiveTrip } = useAppState()
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')

  const startRename = (id: string, current: string) => {
    setRenamingId(id)
    setDraftName(current)
  }

  const commitRename = () => {
    if (renamingId && draftName.trim()) {
      renameTrip(renamingId, draftName.trim())
    }
    setRenamingId(null)
  }

  return (
    <div className="trip-tabs">
      {state.trips.map((trip) => (
        <TripTabItem
          key={trip.id}
          trip={trip}
          isActive={trip.id === state.activeTripId}
          isRenaming={renamingId === trip.id}
          draftName={draftName}
          setDraftName={setDraftName}
          score={tripScore(trip.id)}
          onActivate={() => setActiveTrip(trip.id)}
          onStartRename={() => startRename(trip.id, trip.name)}
          onCommitRename={commitRename}
          onCancelRename={() => setRenamingId(null)}
          onDelete={() => {
            if (confirm(`Delete "${trip.name}"?`)) deleteTrip(trip.id)
          }}
        />
      ))}
      <button type="button" className="trip-tab trip-tab--add" onClick={() => addTrip()}>
        + Trip
      </button>
      <span className="trip-tabs__hint" aria-hidden="true">
        Double-click a trip to rename
      </span>
    </div>
  )
}
