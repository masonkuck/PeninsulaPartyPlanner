import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AppState, HomeBase, Trip, TripStop } from '../types'
import { loadState, saveState } from './storage'
import { CHECKPOINTS_BY_ID } from '../data/checkpoints'

interface AppStateContextValue {
  state: AppState
  activeTrip: Trip | null
  totalScore: number
  tripScore: (tripId: string) => number
  addTrip: (name?: string) => string
  renameTrip: (tripId: string, name: string) => void
  deleteTrip: (tripId: string) => void
  setActiveTrip: (tripId: string) => void
  toggleCheckpoint: (checkpointId: string) => void
  reorderActiveTrip: (orderedIds: string[]) => void
  setHomeBase: (home: HomeBase) => void
  isCheckpointInActiveTrip: (checkpointId: string) => boolean
}

const AppStateContext = createContext<AppStateContextValue | null>(null)

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function scoreForTrip(trip: Trip): number {
  let sum = 0
  for (const s of trip.stops) {
    const cp = CHECKPOINTS_BY_ID.get(s.checkpointId)
    if (cp) sum += cp.points
  }
  return sum
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

    return {
      state,
      activeTrip,
      totalScore: state.trips.reduce((sum, t) => sum + scoreForTrip(t), 0),
      tripScore: (tripId) => {
        const t = state.trips.find((x) => x.id === tripId)
        return t ? scoreForTrip(t) : 0
      },
      addTrip: (name) => {
        const id = uid('trip')
        const newTrip: Trip = { id, name: name ?? `Trip ${state.trips.length + 1}`, stops: [] }
        setState((s) => ({ ...s, trips: [...s.trips, newTrip], activeTripId: id }))
        return id
      },
      renameTrip: (tripId, name) => {
        setState((s) => ({
          ...s,
          trips: s.trips.map((t) => (t.id === tripId ? { ...t, name } : t)),
        }))
      },
      deleteTrip: (tripId) => {
        setState((s) => {
          const remaining = s.trips.filter((t) => t.id !== tripId)
          const trips = remaining.length > 0 ? remaining : [{ id: uid('trip'), name: 'Trip 1', stops: [] }]
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
