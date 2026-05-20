export type Region = 'LP' | 'UP' | 'Island' | 'Water' | 'X'

export interface Checkpoint {
  id: string
  siteId: string
  siteName: string
  label: string
  lat: number
  lng: number
  points: number
  region: Region
  ferryCostRoundTrip?: string
  outOfState?: boolean
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
  orsApiKey: string
}
