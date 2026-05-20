import { CHECKPOINTS_BY_ID } from '../data/checkpoints'

const PARAM = 'share'

export interface SharedTrip {
  name: string
  checkpointIds: string[]
}

export function encodeTripToUrl(name: string, checkpointIds: string[]): string {
  const valid = checkpointIds.filter((id) => CHECKPOINTS_BY_ID.has(id))
  const params = new URLSearchParams()
  params.set('n', name)
  params.set('s', valid.join(','))
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = ''
  url.searchParams.set(PARAM, btoa(params.toString()))
  return url.toString()
}

export function readSharedTripFromUrl(): SharedTrip | null {
  const raw = new URL(window.location.href).searchParams.get(PARAM)
  if (!raw) return null
  try {
    const decoded = atob(raw)
    const params = new URLSearchParams(decoded)
    const name = params.get('n') || 'Shared Trip'
    const ids = (params.get('s') || '')
      .split(',')
      .map((s) => s.trim())
      .filter((id) => CHECKPOINTS_BY_ID.has(id))
    if (ids.length === 0) return null
    return { name, checkpointIds: ids }
  } catch {
    return null
  }
}

export function clearShareFromUrl(): void {
  const url = new URL(window.location.href)
  url.searchParams.delete(PARAM)
  window.history.replaceState({}, '', url.toString())
}
