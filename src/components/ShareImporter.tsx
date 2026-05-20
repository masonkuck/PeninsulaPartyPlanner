import { useEffect, useRef } from 'react'
import { useAppState } from '../state/AppStateContext'
import { readSharedTripFromUrl, clearShareFromUrl } from '../lib/share'

export function ShareImporter() {
  const { state, addTrip, setTripStops, renameTrip, setActiveTrip } = useAppState()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true
    const shared = readSharedTripFromUrl()
    if (!shared) return
    clearShareFromUrl()

    const uniqueName = (desired: string): string => {
      const existing = new Set(state.trips.map((t) => t.name))
      if (!existing.has(desired)) return desired
      for (let i = 2; i < 1000; i++) {
        const candidate = `${desired} (${i})`
        if (!existing.has(candidate)) return candidate
      }
      return desired
    }

    const hasExistingContent = state.trips.some((t) => t.stops.length > 0)
    if (hasExistingContent) {
      const proceed = confirm(
        `Import shared trip "${shared.name}" with ${shared.checkpointIds.length} stop(s) as a new trip?`,
      )
      if (!proceed) return
      const id = addTrip(uniqueName(shared.name))
      setTripStops(id, shared.checkpointIds)
      setActiveTrip(id)
    } else {
      // No existing content — overwrite the first (empty) trip in place
      const target = state.trips[0]
      if (!target) {
        const id = addTrip(shared.name)
        setTripStops(id, shared.checkpointIds)
        setActiveTrip(id)
      } else {
        renameTrip(target.id, shared.name)
        setTripStops(target.id, shared.checkpointIds)
        setActiveTrip(target.id)
      }
    }
  }, [addTrip, setTripStops, renameTrip, setActiveTrip, state.trips])

  return null
}
