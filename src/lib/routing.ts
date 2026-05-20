// OpenRouteService directions client
// Free tier: https://openrouteservice.org/dev/#/signup

export interface RoutePoint {
  lat: number
  lng: number
}

export interface RouteResult {
  coordinates: [number, number][] // [lat, lng] pairs
  distanceMeters: number
  durationSeconds: number
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

  const coords = (feature.geometry.coordinates as [number, number][]).map(
    ([lng, lat]) => [lat, lng] as [number, number],
  )
  const summary = feature.properties?.summary ?? {}

  return {
    coordinates: coords,
    distanceMeters: summary.distance ?? 0,
    durationSeconds: summary.duration ?? 0,
  }
}
