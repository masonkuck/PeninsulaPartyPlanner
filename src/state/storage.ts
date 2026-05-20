import type { AppState } from '../types'
import { DEFAULT_HOME_BASE } from '../data/checkpoints'

const STORAGE_KEY = 'ppp-state-v1'

export const DEFAULT_STATE: AppState = {
  trips: [
    { id: 'trip-default', name: 'Trip 1', stops: [] },
  ],
  activeTripId: 'trip-default',
  homeBase: DEFAULT_HOME_BASE,
  orsApiKey: '',
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    const parsed = JSON.parse(raw) as Partial<AppState>
    return {
      trips: parsed.trips ?? DEFAULT_STATE.trips,
      activeTripId: parsed.activeTripId ?? DEFAULT_STATE.activeTripId,
      homeBase: parsed.homeBase ?? DEFAULT_STATE.homeBase,
      orsApiKey: parsed.orsApiKey ?? '',
    }
  } catch {
    return DEFAULT_STATE
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore quota / private mode errors
  }
}
