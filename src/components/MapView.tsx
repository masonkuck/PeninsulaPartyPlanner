import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { SITES } from '../data/checkpoints'
import { useAppState } from '../state/AppStateContext'
import { fetchRoute, colorForLeg, type RouteLeg } from '../lib/routing'
import { buildTripPlan } from '../lib/tripPlan'
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

  const plan = useMemo(() => {
    if (!activeTrip) return null
    return buildTripPlan(activeTrip, state.homeBase)
  }, [activeTrip, state.homeBase])

  const stopPoints = plan && plan.routingPoints.length >= 2 ? plan.routingPoints : []

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
        {legs && legs.length > 0 && !loading && plan && (
          <div className="leg-legend">
            {legs.map((leg, legIdx) => {
              // Find the pair of anchors flanking this leg (the anchors that map to routingPoints[legIdx] and routingPoints[legIdx+1])
              const fromAnchorIdx = plan.anchorRoutingIndex.lastIndexOf(legIdx)
              const toAnchorIdx = plan.anchorRoutingIndex.indexOf(legIdx + 1)
              const labelFor = (anchorIdx: number): string => {
                if (anchorIdx < 0) return '?'
                const a = plan.anchors[anchorIdx]
                if (a.kind === 'home-start' || a.kind === 'home-end') return 'Home'
                return a.cp.siteName
              }
              return (
                <div key={legIdx} className="leg-legend__row">
                  <span className="leg-legend__swatch" style={{ background: colorForLeg(legIdx) }} />
                  <span className="leg-legend__label">
                    {labelFor(fromAnchorIdx)} → {labelFor(toAnchorIdx)}
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
