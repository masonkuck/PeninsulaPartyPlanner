import { useEffect, useRef } from 'react'
import { useAppState } from '../state/AppStateContext'
import { readSharedTripFromUrl, clearShareFromUrl } from '../lib/share'

export function ShareImporter() {
  const { addTrip, toggleCheckpoint, setActiveTrip } = useAppState()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true
    const shared = readSharedTripFromUrl()
    if (!shared) return
    const proceed = confirm(
      `Import shared trip "${shared.name}" with ${shared.checkpointIds.length} stop(s) as a new trip?`,
    )
    clearShareFromUrl()
    if (!proceed) return
    const id = addTrip(shared.name)
    setActiveTrip(id)
    for (const cpId of shared.checkpointIds) {
      toggleCheckpoint(cpId)
    }
  }, [addTrip, toggleCheckpoint, setActiveTrip])

  return null
}
