import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { SITES } from '../data/checkpoints'
import { useAppState } from '../state/AppStateContext'
import { CHECKPOINTS_BY_ID } from '../data/checkpoints'
import { fetchRoute, type RoutePoint } from '../lib/routing'
import type { Checkpoint } from '../types'

// Fix default marker icon path issue with bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

function makeIcon(color: string, inTrip: boolean): L.DivIcon {
  const size = inTrip ? 28 : 20
  const ring = inTrip ? '3px solid #fff' : '2px solid #fff'
  return L.divIcon({
    className: 'cp-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:${ring};box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
  })
}

function colorFor(cp: Checkpoint): string {
  if (cp.points === 21) return '#d97706' // amber
  if (cp.outOfState) return '#6b7280' // gray
  if (cp.region === 'UP') return '#0ea5e9' // sky
  return '#16a34a' // green LP
}

export function MapView() {
  const { state, activeTrip } = useAppState()
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [routeSummary, setRouteSummary] = useState<{ distanceMi: number; durationHr: number } | null>(null)
  const [loading, setLoading] = useState(false)

  const stopPoints = useMemo<RoutePoint[]>(() => {
    if (!activeTrip) return []
    const home: RoutePoint = { lat: state.homeBase.lat, lng: state.homeBase.lng }
    const stops: RoutePoint[] = []
    for (const s of activeTrip.stops) {
      const cp = CHECKPOINTS_BY_ID.get(s.checkpointId)
      if (!cp) continue
      if (cp.region === 'Water') continue // skip routing through open water
      stops.push({ lat: cp.lat, lng: cp.lng })
    }
    if (stops.length === 0) return []
    return [home, ...stops, home]
  }, [activeTrip, state.homeBase])

  useEffect(() => {
    setRouteError(null)
    if (stopPoints.length < 2 || !state.orsApiKey) {
      setRouteCoords(null)
      setRouteSummary(null)
      return
    }
    let cancelled = false
    setLoading(true)
    fetchRoute(state.orsApiKey, stopPoints)
      .then((r) => {
        if (cancelled || !r) return
        setRouteCoords(r.coordinates)
        setRouteSummary({
          distanceMi: r.distanceMeters / 1609.34,
          durationHr: r.durationSeconds / 3600,
        })
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setRouteError(e.message)
          setRouteCoords(null)
          setRouteSummary(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [stopPoints, state.orsApiKey])

  const includedIds = new Set(activeTrip?.stops.map((s) => s.checkpointId) ?? [])

  return (
    <div className="map-wrap">
      <MapContainer center={[44.8, -85.5]} zoom={6} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker
          center={[state.homeBase.lat, state.homeBase.lng]}
          radius={9}
          pathOptions={{ color: '#111', fillColor: '#ef4444', fillOpacity: 1, weight: 3 }}
        >
          <Popup>
            <strong>Home Base</strong>
            <br />
            {state.homeBase.label}
          </Popup>
        </CircleMarker>

        {SITES.flatMap((site) =>
          site.checkpoints.map((cp) => (
            <Marker
              key={cp.id}
              position={[cp.lat, cp.lng]}
              icon={makeIcon(colorFor(cp), includedIds.has(cp.id))}
            >
              <Popup>
                <strong>{cp.siteName}</strong>
                <br />
                {cp.label}
                <br />
                <span style={{ color: '#d97706', fontWeight: 600 }}>{cp.points} pts</span>
                {cp.ferryCostRoundTrip && (
                  <>
                    <br />
                    Ferry: {cp.ferryCostRoundTrip}
                  </>
                )}
              </Popup>
            </Marker>
          )),
        )}

        {routeCoords && (
          <Polyline positions={routeCoords} pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.85 }} />
        )}
      </MapContainer>

      <div className="map-overlay">
        {!state.orsApiKey && (
          <div className="map-banner map-banner--info">
            Add an OpenRouteService API key in Settings to see driving routes.
          </div>
        )}
        {loading && <div className="map-banner">Calculating route…</div>}
        {routeError && (
          <div className="map-banner map-banner--error">
            Route error: {routeError}
          </div>
        )}
        {routeSummary && !loading && (
          <div className="map-banner map-banner--ok">
            {routeSummary.distanceMi.toFixed(0)} mi · {routeSummary.durationHr.toFixed(1)} hr drive
          </div>
        )}
      </div>
    </div>
  )
}
