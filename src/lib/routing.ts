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

function haversineMeters(a: [number, number], b: [number, number]): number {
  const R = 6371000
  const [lat1, lng1] = a
  const [lat2, lng2] = b
  const toRad = (d: number) => (d * Math.PI) / 180
  const dPhi = toRad(lat2 - lat1)
  const dLambda = toRad(lng2 - lng1)
  const phi1 = toRad(lat1)
  const phi2 = toRad(lat2)
  const x =
    Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function polylineMeters(coords: [number, number][]): number {
  let total = 0
  for (let i = 1; i < coords.length; i++) {
    total += haversineMeters(coords[i - 1], coords[i])
  }
  return total
}

export async function fetchRoute(apiKey: string, points: RoutePoint[]): Promise<RouteResult | null> {
  if (!apiKey) throw new Error('Missing OpenRouteService API key')
  if (points.length < 2) return null

  const body = {
    coordinates: points.map((p) => [p.lng, p.lat]),
    instructions: false,
    // OSM has the SS Badger and Lake Express crossings tagged as ferry routes; without
    // this ORS would happily "drive" across Lake Michigan instead of going around.
    options: { avoid_features: ['ferries'] },
    // -1 = no snap radius limit. Some dock coords sit right at a ferry terminal which
    // can otherwise fail to resolve to a routable road when ferries are excluded.
    radiuses: points.map(() => -1),
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
  const summary = feature.properties?.summary ?? {}
  const totalDuration = (summary.duration as number | undefined) ?? 0

  // ORS sometimes omits per-segment distance/duration when instructions=false.
  // Fall back to: distance via Haversine on the geometry slice, duration pro-rated from the total.
  const rawLegs = wayPoints.slice(0, -1).map((start, i) => {
    const end = wayPoints[i + 1]
    const coords = allCoords.slice(start, end + 1)
    const seg = segments[i]
    const distance = seg?.distance && seg.distance > 0 ? seg.distance : polylineMeters(coords)
    return { coords, distance, segDuration: seg?.duration }
  })

  const totalDistance =
    (summary.distance as number | undefined) ||
    rawLegs.reduce((s, l) => s + l.distance, 0)

  const legs: RouteLeg[] = rawLegs.map((l) => ({
    coordinates: l.coords,
    distanceMeters: l.distance,
    durationSeconds:
      l.segDuration && l.segDuration > 0
        ? l.segDuration
        : totalDuration > 0 && totalDistance > 0
          ? totalDuration * (l.distance / totalDistance)
          : 0,
  }))

  return {
    legs,
    totalDistanceMeters: totalDistance,
    totalDurationSeconds: totalDuration || legs.reduce((s, l) => s + l.durationSeconds, 0),
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
