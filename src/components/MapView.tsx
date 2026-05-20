import { useEffect, useMemo, useState } from 'react'

const LEGS_COLLAPSED_KEY = 'ppp-legs-collapsed-v1'
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { SITES } from '../data/checkpoints'
import { useAppState } from '../state/AppStateContext'
import { fetchRoute, colorForLeg, type RouteLeg, type RouteResult } from '../lib/routing'
import { buildTripPlan } from '../lib/tripPlan'
import type { Checkpoint } from '../types'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const FERRY_COLOR = '#0ea5e9'

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
  if (cp.points === 21) return '#d97706'
  if (cp.outOfState) return '#6b7280'
  if (cp.region === 'UP') return '#0ea5e9'
  return '#16a34a'
}

type CombinedLeg =
  | { kind: 'land'; coords: [number, number][]; distanceMeters: number; durationSeconds: number; globalIndex: number; fromLabel: string; toLabel: string }
  | { kind: 'ferry'; coords: [number, number][]; distanceMeters: number; globalIndex: number; fromLabel: string; toLabel: string }

export function MapView() {
  const { state, activeTrip } = useAppState()
  const [segmentRoutes, setSegmentRoutes] = useState<(RouteResult | null)[] | null>(null)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [legsCollapsed, setLegsCollapsed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(LEGS_COLLAPSED_KEY)
      if (stored !== null) return stored === 'true'
    } catch {
      // ignore
    }
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 800px)').matches
  })

  useEffect(() => {
    try {
      localStorage.setItem(LEGS_COLLAPSED_KEY, String(legsCollapsed))
    } catch {
      // ignore
    }
  }, [legsCollapsed])

  const plan = useMemo(
    () => (activeTrip ? buildTripPlan(activeTrip, state.homeBase) : null),
    [activeTrip, state.homeBase],
  )

  const effectiveKey = (import.meta.env.VITE_ORS_KEY as string | undefined) || ''

  useEffect(() => {
    if (!plan || !effectiveKey) {
      setSegmentRoutes(null)
      setRouteError(null)
      return
    }
    const routableSegments = plan.segments.filter((s) => s.routingPoints.length >= 2)
    if (routableSegments.length === 0) {
      setSegmentRoutes(null)
      setRouteError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setRouteError(null)
    Promise.all(
      plan.segments.map((seg) =>
        seg.routingPoints.length >= 2 ? fetchRoute(effectiveKey, seg.routingPoints) : Promise.resolve(null),
      ),
    )
      .then((results) => {
        if (!cancelled) setSegmentRoutes(results)
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setRouteError(e.message)
          setSegmentRoutes(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [plan, effectiveKey])

  // Compose ordered legs (land + ferry) with global indices and labels
  const combinedLegs = useMemo<CombinedLeg[]>(() => {
    if (!plan || !segmentRoutes) return []
    const out: CombinedLeg[] = []
    let globalIdx = 0

    const labelForSegmentBoundary = (
      segmentEndingIdx: number,
      side: 'end' | 'start',
    ): string => {
      // Find the anchor whose location matches this segment's last/first point.
      const targetIdx = side === 'end' ? plan.segments[segmentEndingIdx].routingPoints.length - 1 : 0
      for (let i = 0; i < plan.anchors.length; i++) {
        const loc = plan.anchorLocation[i]
        if (loc && loc.segment === segmentEndingIdx && loc.index === targetIdx) {
          const a = plan.anchors[i]
          if (a.kind === 'home-start' || a.kind === 'home-end') return 'Home'
          return a.cp.siteName
        }
      }
      return '?'
    }

    plan.segments.forEach((seg, segIdx) => {
      const res = segmentRoutes[segIdx]
      if (res) {
        res.legs.forEach((leg: RouteLeg, i) => {
          // Find from/to labels by matching routingPoints[i] / [i+1] back to anchors
          const fromLabel = labelForSegmentPointIdx(plan, segIdx, i)
          const toLabel = labelForSegmentPointIdx(plan, segIdx, i + 1)
          out.push({
            kind: 'land',
            coords: leg.coordinates,
            distanceMeters: leg.distanceMeters,
            durationSeconds: leg.durationSeconds,
            globalIndex: globalIdx,
            fromLabel,
            toLabel,
          })
          globalIdx++
        })
      }
      // Ferry leg between this segment and the next (if any)
      if (segIdx < plan.segments.length - 1) {
        const last = seg.routingPoints[seg.routingPoints.length - 1]
        const first = plan.segments[segIdx + 1].routingPoints[0]
        if (last && first) {
          out.push({
            kind: 'ferry',
            coords: [
              [last.lat, last.lng],
              [first.lat, first.lng],
            ],
            distanceMeters: haversineMi([last.lat, last.lng], [first.lat, first.lng]) * 1609.34,
            globalIndex: globalIdx,
            fromLabel: labelForSegmentBoundary(segIdx, 'end'),
            toLabel: labelForSegmentBoundary(segIdx + 1, 'start'),
          })
          globalIdx++
        }
      }
    })
    return out
  }, [plan, segmentRoutes])

  const totals = useMemo(() => {
    if (combinedLegs.length === 0) return null
    let dist = 0
    let dur = 0
    for (const l of combinedLegs) {
      dist += l.distanceMeters
      if (l.kind === 'land') dur += l.durationSeconds
    }
    return { distanceMi: dist / 1609.34, durationHr: dur / 3600 }
  }, [combinedLegs])

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
                {cp.warning && (
                  <div className="popup-warning">
                    ⚠ {cp.warning}
                    {cp.warningLink && (
                      <>
                        {' '}
                        <a href={cp.warningLink} target="_blank" rel="noreferrer">
                          more info
                        </a>
                      </>
                    )}
                  </div>
                )}
              </Popup>
            </Marker>
          )),
        )}

        {combinedLegs.map((leg) =>
          leg.kind === 'land' ? (
            <Polyline
              key={`land-${leg.globalIndex}`}
              positions={leg.coords}
              pathOptions={{ color: colorForLeg(leg.globalIndex), weight: 5, opacity: 0.85 }}
            />
          ) : (
            <Polyline
              key={`ferry-${leg.globalIndex}`}
              positions={leg.coords}
              pathOptions={{
                color: FERRY_COLOR,
                weight: 3,
                opacity: 0.75,
                dashArray: '10 8',
              }}
            />
          ),
        )}
      </MapContainer>

      <div className="map-overlay">
        {!effectiveKey && (
          <div className="map-banner map-banner--info">
            Routing is unavailable — no API key configured in this build.
          </div>
        )}
        {loading && <div className="map-banner">Calculating route…</div>}
        {routeError && (
          <div className="map-banner map-banner--error">Route error: {routeError}</div>
        )}
        {totals && !loading && (
          <button
            type="button"
            className="map-banner map-banner--ok map-banner--toggle"
            onClick={() => setLegsCollapsed((c) => !c)}
            aria-expanded={!legsCollapsed}
            aria-label={legsCollapsed ? 'Show per-leg details' : 'Hide per-leg details'}
          >
            <span>
              {totals.distanceMi.toFixed(0)} mi · {totals.durationHr.toFixed(1)} hr drive
              {combinedLegs.length > 1 && ` · ${combinedLegs.length} legs`}
            </span>
            <span className="map-banner__chevron" aria-hidden="true">
              {legsCollapsed ? '▾' : '▴'}
            </span>
          </button>
        )}
        {combinedLegs.length > 0 && !loading && !legsCollapsed && (
          <div className="leg-legend">
            {combinedLegs.map((leg) => (
              <div key={leg.globalIndex} className="leg-legend__row">
                <span
                  className={`leg-legend__swatch${leg.kind === 'ferry' ? ' leg-legend__swatch--ferry' : ''}`}
                  style={{ background: leg.kind === 'land' ? colorForLeg(leg.globalIndex) : FERRY_COLOR }}
                />
                <span className="leg-legend__label">
                  {leg.kind === 'ferry' ? '⛴ ' : ''}
                  {leg.fromLabel} → {leg.toLabel}
                </span>
                <span className="leg-legend__meta">
                  {(leg.distanceMeters / 1609.34).toFixed(0)}mi
                  {leg.kind === 'land' && ` · ${(leg.durationSeconds / 3600).toFixed(1)}h`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function labelForSegmentPointIdx(plan: ReturnType<typeof buildTripPlan>, segment: number, index: number): string {
  for (let i = 0; i < plan.anchors.length; i++) {
    const loc = plan.anchorLocation[i]
    if (loc && loc.segment === segment && loc.index === index) {
      const a = plan.anchors[i]
      if (a.kind === 'home-start' || a.kind === 'home-end') return 'Home'
      return a.cp.siteName
    }
  }
  return '?'
}

function haversineMi(a: [number, number], b: [number, number]): number {
  const R = 3958.8
  const toRad = (d: number) => (d * Math.PI) / 180
  const dPhi = toRad(b[0] - a[0])
  const dLambda = toRad(b[1] - a[1])
  const phi1 = toRad(a[0])
  const phi2 = toRad(b[0])
  const x =
    Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}
