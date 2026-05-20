// OpenRouteService directions client
// Free tier: https://openrouteservice.org/dev/#/signup

export interface RoutePoint {
  lat: number
  lng: number
}

export interface RouteLeg {
  coordinates: [number, number][] // [lat, lng] pairs
  distanceMeters: number
  durationSeconds: number
}

export interface RouteResult {
  legs: RouteLeg[]
  totalDistanceMeters: number
  totalDurationSeconds: number
}

const ORS_URL = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson'

export async function fetchRoute(apiKey: string, points: RoutePoint[]): Promise<RouteResult | null> {
  if (!apiKey) throw new Error('Missing OpenRouteService API key')
  if (points.length < 2) return null

  const body = {
    coordinates: points.map((p) => [p.lng, p.lat]),
    instructions: false,
  }

  const res = await fetch(ORS_URL, {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json, application/geo+json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Routing failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  const feature = data?.features?.[0]
  if (!feature) return null

  const allCoords = (feature.geometry.coordinates as [number, number][]).map(
    ([lng, lat]) => [lat, lng] as [number, number],
  )
  const wayPoints = (feature.properties?.way_points as number[] | undefined) ?? [
    0,
    allCoords.length - 1,
  ]
  const segments = (feature.properties?.segments as Array<{ distance?: number; duration?: number }> | undefined) ?? []

  const legs: RouteLeg[] = []
  for (let i = 0; i < wayPoints.length - 1; i++) {
    const start = wayPoints[i]
    const end = wayPoints[i + 1]
    const seg = segments[i] ?? {}
    legs.push({
      coordinates: allCoords.slice(start, end + 1),
      distanceMeters: seg.distance ?? 0,
      durationSeconds: seg.duration ?? 0,
    })
  }

  const summary = feature.properties?.summary ?? {}
  return {
    legs,
    totalDistanceMeters: summary.distance ?? legs.reduce((s, l) => s + l.distanceMeters, 0),
    totalDurationSeconds: summary.duration ?? legs.reduce((s, l) => s + l.durationSeconds, 0),
  }
}

// Distinct, color-blind-friendly leg palette. Cycles for trips with many stops.
export const LEG_COLORS = [
  '#2563eb', // blue
  '#16a34a', // green
  '#d97706', // amber
  '#db2777', // pink
  '#0891b2', // teal
  '#7c3aed', // purple
  '#dc2626', // red
  '#65a30d', // lime
]

export function colorForLeg(index: number): string {
  return LEG_COLORS[index % LEG_COLORS.length]
}
