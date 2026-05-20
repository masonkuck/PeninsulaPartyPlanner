import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AppState, HomeBase, Trip, TripStop } from '../types'
import { loadState, saveState } from './storage'
import { CHECKPOINTS_BY_ID } from '../data/checkpoints'

interface AppStateContextValue {
  state: AppState
  activeTrip: Trip | null
  totalScore: number
  tripScore: (tripId: string) => number
  /** Returns the trip ID that "claims" (scores) a given checkpoint, or null if not in any trip. */
  claimingTripId: (checkpointId: string) => string | null
  addTrip: (name?: string) => string
  renameTrip: (tripId: string, name: string) => void
  deleteTrip: (tripId: string) => void
  setActiveTrip: (tripId: string) => void
  toggleCheckpoint: (checkpointId: string) => void
  reorderActiveTrip: (orderedIds: string[]) => void
  setTripStartFromHome: (tripId: string, value: boolean) => void
  setTripReturnHome: (tripId: string, value: boolean) => void
  setTripStops: (tripId: string, checkpointIds: string[]) => void
  setHomeBase: (home: HomeBase) => void
  isCheckpointInActiveTrip: (checkpointId: string) => boolean
}

const AppStateContext = createContext<AppStateContextValue | null>(null)

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function scoreUniqueAcrossTrips(trips: Trip[]): {
  total: number
  perTrip: Map<string, number>
  claimedBy: Map<string, string>
} {
  const claimedBy = new Map<string, string>()
  const perTrip = new Map<string, number>()
  let total = 0
  for (const trip of trips) {
    let tripPoints = 0
    for (const stop of trip.stops) {
      if (claimedBy.has(stop.checkpointId)) continue
      const cp = CHECKPOINTS_BY_ID.get(stop.checkpointId)
      if (!cp) continue
      claimedBy.set(stop.checkpointId, trip.id)
      tripPoints += cp.points
      total += cp.points
    }
    perTrip.set(trip.id, tripPoints)
  }
  return { total, perTrip, claimedBy }
}

function makeTrip(id: string, name: string): Trip {
  return { id, name, stops: [], startFromHome: true, returnHome: true }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState())

  useEffect(() => {
    saveState(state)
  }, [state])

  const value = useMemo<AppStateContextValue>(() => {
    const activeTrip = state.trips.find((t) => t.id === state.activeTripId) ?? null

    const updateActiveTrip = (mut: (t: Trip) => Trip) => {
      setState((s) => ({
        ...s,
        trips: s.trips.map((t) => (t.id === s.activeTripId ? mut(t) : t)),
      }))
    }

    const updateTrip = (tripId: string, mut: (t: Trip) => Trip) => {
      setState((s) => ({
        ...s,
        trips: s.trips.map((t) => (t.id === tripId ? mut(t) : t)),
      }))
    }

    const scoring = scoreUniqueAcrossTrips(state.trips)

    return {
      state,
      activeTrip,
      totalScore: scoring.total,
      tripScore: (tripId) => scoring.perTrip.get(tripId) ?? 0,
      claimingTripId: (checkpointId) => scoring.claimedBy.get(checkpointId) ?? null,
      addTrip: (name) => {
        const id = uid('trip')
        const newTrip = makeTrip(id, name ?? `Trip ${state.trips.length + 1}`)
        setState((s) => ({ ...s, trips: [...s.trips, newTrip], activeTripId: id }))
        return id
      },
      renameTrip: (tripId, name) => {
        updateTrip(tripId, (t) => ({ ...t, name }))
      },
      deleteTrip: (tripId) => {
        setState((s) => {
          const remaining = s.trips.filter((t) => t.id !== tripId)
          const trips = remaining.length > 0 ? remaining : [makeTrip(uid('trip'), 'Trip 1')]
          const activeTripId = s.activeTripId === tripId ? trips[0].id : s.activeTripId
          return { ...s, trips, activeTripId }
        })
      },
      setActiveTrip: (tripId) => setState((s) => ({ ...s, activeTripId: tripId })),
      toggleCheckpoint: (checkpointId) => {
        updateActiveTrip((t) => {
          const exists = t.stops.some((s) => s.checkpointId === checkpointId)
          if (exists) {
            return { ...t, stops: t.stops.filter((s) => s.checkpointId !== checkpointId) }
          }
          const next: TripStop = { checkpointId }
          return { ...t, stops: [...t.stops, next] }
        })
      },
      reorderActiveTrip: (orderedIds) => {
        updateActiveTrip((t) => ({
          ...t,
          stops: orderedIds.map((id) => ({ checkpointId: id })),
        }))
      },
      setTripStartFromHome: (tripId, value) => {
        updateTrip(tripId, (t) => ({ ...t, startFromHome: value }))
      },
      setTripReturnHome: (tripId, value) => {
        updateTrip(tripId, (t) => ({ ...t, returnHome: value }))
      },
      setTripStops: (tripId, checkpointIds) => {
        updateTrip(tripId, (t) => ({
          ...t,
          stops: checkpointIds.map((id) => ({ checkpointId: id })),
        }))
      },
      setHomeBase: (home) => setState((s) => ({ ...s, homeBase: home })),
      isCheckpointInActiveTrip: (checkpointId) => {
        const t = state.trips.find((x) => x.id === state.activeTripId)
        return t ? t.stops.some((s) => s.checkpointId === checkpointId) : false
      },
    }
  }, [state])

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider')
  return ctx
}
