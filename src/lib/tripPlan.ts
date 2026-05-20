import type { Checkpoint, HomeBase, Trip } from '../types'
import { CHECKPOINTS_BY_ID, MAINLAND_FOR_SITE } from '../data/checkpoints'
import type { RoutePoint } from './routing'

export type Anchor =
  | { kind: 'home-start' }
  | { kind: 'stop'; stopIndex: number; cp: Checkpoint }
  | { kind: 'home-end' }

export interface TripSegment {
  routingPoints: RoutePoint[]
}

export interface TripPlan {
  segments: TripSegment[]
  anchors: Anchor[]
  /** For each anchor: where it lives in the segment graph, or null if it doesn't contribute a routing point (Water stops). */
  anchorLocation: ({ segment: number; index: number } | null)[]
}

const COORD_EPSILON = 1e-6

function sameCoord(a: RoutePoint, b: RoutePoint): boolean {
  return Math.abs(a.lat - b.lat) < COORD_EPSILON && Math.abs(a.lng - b.lng) < COORD_EPSILON
}

function isMainlandOfSite(cp: Checkpoint, siteId: string): boolean {
  return cp.siteId === siteId && cp.region !== 'Water' && cp.region !== 'Island'
}

function coordOf(cp: Checkpoint): RoutePoint {
  return {
    lat: cp.routingLat ?? cp.lat,
    lng: cp.routingLng ?? cp.lng,
  }
}

function routingCoordFor(cp: Checkpoint): RoutePoint | null {
  if (cp.region === 'Water') return null
  // Islands and ferry-required out-of-state stops (e.g. Walpole Island, Canada) — route to the mainland dock.
  if (cp.region === 'Island' || (cp.region === 'X' && cp.points === 21)) {
    const ml = MAINLAND_FOR_SITE.get(cp.siteId)
    if (ml) return coordOf(ml)
  }
  return coordOf(cp)
}

export function buildTripPlan(trip: Trip, homeBase: HomeBase): TripPlan {
  const home: RoutePoint = { lat: homeBase.lat, lng: homeBase.lng }

  // First build the flat anchor list
  const anchors: Anchor[] = []
  if (trip.startFromHome) anchors.push({ kind: 'home-start' })
  for (let i = 0; i < trip.stops.length; i++) {
    const cp = CHECKPOINTS_BY_ID.get(trip.stops[i].checkpointId)
    if (!cp) continue
    anchors.push({ kind: 'stop', stopIndex: i, cp })
  }
  if (trip.returnHome) anchors.push({ kind: 'home-end' })

  const segments: TripSegment[] = [{ routingPoints: [] }]
  const anchorLocation: ({ segment: number; index: number } | null)[] = []
  let currentSegIdx = 0

  const pushToSegment = (coord: RoutePoint) => {
    const seg = segments[currentSegIdx]
    const last = seg.routingPoints[seg.routingPoints.length - 1]
    if (last && sameCoord(last, coord)) {
      anchorLocation.push({ segment: currentSegIdx, index: seg.routingPoints.length - 1 })
      return
    }
    seg.routingPoints.push(coord)
    anchorLocation.push({ segment: currentSegIdx, index: seg.routingPoints.length - 1 })
  }

  for (let i = 0; i < anchors.length; i++) {
    const anchor = anchors[i]
    if (anchor.kind === 'home-start' || anchor.kind === 'home-end') {
      pushToSegment(home)
      continue
    }
    const cp = anchor.cp
    if (cp.region === 'Water') {
      // Ferry split only if surrounded by two different mainland docks of the same site
      const prev = anchors[i - 1]
      const next = anchors[i + 1]
      const prevIsMainland = prev?.kind === 'stop' && isMainlandOfSite(prev.cp, cp.siteId)
      const nextIsMainland = next?.kind === 'stop' && isMainlandOfSite(next.cp, cp.siteId)
      const isFerryCrossing =
        prevIsMainland && nextIsMainland && prev.cp.id !== next.cp.id
      if (isFerryCrossing) {
        segments.push({ routingPoints: [] })
        currentSegIdx = segments.length - 1
      }
      anchorLocation.push(null)
      continue
    }
    const coord = routingCoordFor(cp)
    if (coord) pushToSegment(coord)
    else anchorLocation.push(null)
  }

  // Drop any trailing empty segments
  while (segments.length > 0 && segments[segments.length - 1].routingPoints.length === 0) {
    segments.pop()
  }

  return { segments, anchors, anchorLocation }
}

export type LegBetween =
  | { kind: 'land'; segment: number; indexInSegment: number; globalLegIndex: number }
  | { kind: 'ferry'; fromSegment: number; toSegment: number; globalLegIndex: number }
  | null

/** Count of land legs and ferry legs preceding global leg index calculation. */
function legCountBefore(plan: TripPlan, segment: number, indexInSegment: number): number {
  // Sum land legs in earlier segments + ferries before this segment + indexInSegment
  let count = 0
  for (let s = 0; s < segment; s++) {
    count += Math.max(0, plan.segments[s].routingPoints.length - 1)
  }
  count += segment // one ferry per segment boundary before this segment
  count += indexInSegment
  return count
}

export function legBetweenAnchors(plan: TripPlan, anchorPos: number): LegBetween {
  const a = plan.anchorLocation[anchorPos]
  const b = plan.anchorLocation[anchorPos + 1]

  // If a is null (Water anchor): the leg lies between the previous non-null location and `b`
  if (a == null && b != null) {
    let prevLoc: { segment: number; index: number } | null = null
    for (let i = anchorPos - 1; i >= 0; i--) {
      const loc = plan.anchorLocation[i]
      if (loc) {
        prevLoc = loc
        break
      }
    }
    if (prevLoc && prevLoc.segment !== b.segment) {
      // Ferry crossing — global index = end of fromSegment's land legs
      let globalIdx = 0
      for (let s = 0; s < prevLoc.segment; s++) {
        globalIdx += Math.max(0, plan.segments[s].routingPoints.length - 1)
      }
      globalIdx += prevLoc.segment // prior ferries
      globalIdx += Math.max(0, plan.segments[prevLoc.segment].routingPoints.length - 1)
      return {
        kind: 'ferry',
        fromSegment: prevLoc.segment,
        toSegment: b.segment,
        globalLegIndex: globalIdx,
      }
    }
    return null
  }

  if (a == null || b == null) return null

  if (a.segment === b.segment) {
    if (b.index > a.index) {
      return {
        kind: 'land',
        segment: a.segment,
        indexInSegment: a.index,
        globalLegIndex: legCountBefore(plan, a.segment, a.index),
      }
    }
    return null
  }

  // Shouldn't happen given pushToSegment dedup, but be safe
  return null
}
