export type Region = 'LP' | 'UP' | 'Island' | 'Water' | 'X'

export interface Checkpoint {
  id: string
  siteId: string
  siteName: string
  label: string
  lat: number
  lng: number
  /** Optional override coordinates used for routing only (display still uses lat/lng).
   * Set when the marker's dock coord snaps to a ferry-tagged road in OSM and ORS
   * can't reach it once ferries are excluded. */
  routingLat?: number
  routingLng?: number
  points: number
  region: Region
  ferryCostRoundTrip?: string
  outOfState?: boolean
  /** Optional warning shown alongside the stop (e.g., closures, ferry notes). */
  warning?: string
  /** Short badge label that summarizes the warning (defaults to "Note"). */
  warningLabel?: string
  /** Optional URL the warning links to for more info. */
  warningLink?: string
}

export interface Site {
  id: string
  name: string
  checkpoints: Checkpoint[]
}

export interface TripStop {
  checkpointId: string
}

export interface Trip {
  id: string
  name: string
  stops: TripStop[]
  startFromHome: boolean
  returnHome: boolean
}

export interface HomeBase {
  lat: number
  lng: number
  label: string
}

export interface AppState {
  trips: Trip[]
  activeTripId: string | null
  homeBase: HomeBase
}
