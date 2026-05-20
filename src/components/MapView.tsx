import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { SITES } from '../data/checkpoints'
import { useAppState } from '../state/AppStateContext'
import { CHECKPOINTS_BY_ID } from '../data/checkpoints'
import { fetchRoute, colorForLeg, type RoutePoint, type RouteLeg } from '../lib/routing'
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
  const [legs, setLegs] = useState<RouteLeg[] | null>(null)
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

  const effectiveKey = (import.meta.env.VITE_ORS_KEY as string | undefined) || ''

  useEffect(() => {
    setRouteError(null)
    if (stopPoints.length < 2 || !effectiveKey) {
      setLegs(null)
      setRouteSummary(null)
      return
    }
    let cancelled = false
    setLoading(true)
    fetchRoute(effectiveKey, stopPoints)
      .then((r) => {
        if (cancelled || !r) return
        setLegs(r.legs)
        setRouteSummary({
          distanceMi: r.totalDistanceMeters / 1609.34,
          durationHr: r.totalDurationSeconds / 3600,
        })
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setRouteError(e.message)
          setLegs(null)
          setRouteSummary(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [stopPoints, effectiveKey])

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

        {legs?.map((leg, i) => (
          <Polyline
            key={i}
            positions={leg.coordinates}
            pathOptions={{ color: colorForLeg(i), weight: 5, opacity: 0.85 }}
          />
        ))}
      </MapContainer>

      <div className="map-overlay">
        {!effectiveKey && (
          <div className="map-banner map-banner--info">
            Routing is unavailable — no API key configured in this build.
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
            {legs && legs.length > 1 && ` · ${legs.length} legs`}
          </div>
        )}
        {legs && legs.length > 1 && !loading && (
          <div className="leg-legend">
            {legs.map((leg, i) => {
              const fromName = i === 0 ? 'Home' : activeTrip?.stops[i - 1] ? (CHECKPOINTS_BY_ID.get(activeTrip.stops[i - 1].checkpointId)?.siteName ?? `Stop ${i}`) : `Stop ${i}`
              const toName = i === legs.length - 1 ? 'Home' : activeTrip?.stops[i] ? (CHECKPOINTS_BY_ID.get(activeTrip.stops[i].checkpointId)?.siteName ?? `Stop ${i + 1}`) : `Stop ${i + 1}`
              return (
                <div key={i} className="leg-legend__row">
                  <span className="leg-legend__swatch" style={{ background: colorForLeg(i) }} />
                  <span className="leg-legend__label">
                    {fromName} → {toName}
                  </span>
                  <span className="leg-legend__meta">
                    {(leg.distanceMeters / 1609.34).toFixed(0)}mi · {(leg.durationSeconds / 3600).toFixed(1)}h
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
