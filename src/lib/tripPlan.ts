import type { Checkpoint, HomeBase, Trip } from '../types'
import { CHECKPOINTS_BY_ID, MAINLAND_FOR_SITE } from '../data/checkpoints'
import type { RoutePoint } from './routing'

export type Anchor =
  | { kind: 'home-start' }
  | { kind: 'stop'; stopIndex: number; cp: Checkpoint }
  | { kind: 'home-end' }

export interface TripPlan {
  /** Coordinates to send to the routing engine. */
  routingPoints: RoutePoint[]
  /** Anchors in display order. */
  anchors: Anchor[]
  /** For each anchor, the index it maps to in routingPoints, or null if it doesn't contribute one (e.g. Water stop, or merged duplicate). */
  anchorRoutingIndex: (number | null)[]
}

const COORD_EPSILON = 1e-6

function sameCoord(a: RoutePoint, b: RoutePoint): boolean {
  return Math.abs(a.lat - b.lat) < COORD_EPSILON && Math.abs(a.lng - b.lng) < COORD_EPSILON
}

function routingCoordFor(cp: Checkpoint): RoutePoint | null {
  if (cp.region === 'Water') return null
  if (cp.region === 'Island') {
    const ml = MAINLAND_FOR_SITE.get(cp.siteId)
    if (ml) return { lat: ml.lat, lng: ml.lng }
  }
  return { lat: cp.lat, lng: cp.lng }
}

export function buildTripPlan(trip: Trip, homeBase: HomeBase): TripPlan {
  const home: RoutePoint = { lat: homeBase.lat, lng: homeBase.lng }
  const routingPoints: RoutePoint[] = []
  const anchors: Anchor[] = []
  const anchorRoutingIndex: (number | null)[] = []

  const push = (anchor: Anchor, coord: RoutePoint | null) => {
    anchors.push(anchor)
    if (!coord) {
      anchorRoutingIndex.push(null)
      return
    }
    const last = routingPoints[routingPoints.length - 1]
    if (last && sameCoord(last, coord)) {
      anchorRoutingIndex.push(routingPoints.length - 1)
      return
    }
    routingPoints.push(coord)
    anchorRoutingIndex.push(routingPoints.length - 1)
  }

  if (trip.startFromHome) push({ kind: 'home-start' }, home)
  for (let i = 0; i < trip.stops.length; i++) {
    const cp = CHECKPOINTS_BY_ID.get(trip.stops[i].checkpointId)
    if (!cp) continue
    push({ kind: 'stop', stopIndex: i, cp }, routingCoordFor(cp))
  }
  if (trip.returnHome) push({ kind: 'home-end' }, home)

  return { routingPoints, anchors, anchorRoutingIndex }
}

/**
 * Given the plan and a pair of consecutive anchor positions, return the leg index
 * (into the route's legs[]) that connects them, or null if no leg.
 */
export function legIndexBetweenAnchors(plan: TripPlan, anchorPos: number): number | null {
  const a = plan.anchorRoutingIndex[anchorPos]
  const b = plan.anchorRoutingIndex[anchorPos + 1]
  if (a == null || b == null) return null
  if (b > a) return a // leg `a` connects routingPoints[a] → routingPoints[a+1]; for b=a+1 this is exact
  return null
}
