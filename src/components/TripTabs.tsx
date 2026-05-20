import { useState } from 'react'
import { useAppState } from '../state/AppStateContext'

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
      {state.trips.map((trip) => {
        const isActive = trip.id === state.activeTripId
        const isRenaming = renamingId === trip.id
        return (
          <div
            key={trip.id}
            className={`trip-tab${isActive ? ' trip-tab--active' : ''}`}
            onClick={() => !isRenaming && setActiveTrip(trip.id)}
          >
            {isRenaming ? (
              <input
                className="trip-tab__input"
                autoFocus
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename()
                  if (e.key === 'Escape') setRenamingId(null)
                }}
              />
            ) : (
              <>
                <span
                  className="trip-tab__name"
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    startRename(trip.id, trip.name)
                  }}
                  title="Double-click to rename"
                >
                  {trip.name}
                </span>
                <span className="trip-tab__score">{tripScore(trip.id)}</span>
                <button
                  type="button"
                  className="trip-tab__delete"
                  title="Delete trip"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`Delete "${trip.name}"?`)) deleteTrip(trip.id)
                  }}
                >
                  ×
                </button>
              </>
            )}
          </div>
        )
      })}
      <button type="button" className="trip-tab trip-tab--add" onClick={() => addTrip()}>
        + Trip
      </button>
    </div>
  )
}
