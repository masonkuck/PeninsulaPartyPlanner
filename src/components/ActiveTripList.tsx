import { Fragment, useMemo } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAppState } from '../state/AppStateContext'
import { CHECKPOINTS_BY_ID, MAINLAND_FOR_SITE } from '../data/checkpoints'
import { colorForLeg } from '../lib/routing'
import { buildTripPlan, legIndexBetweenAnchors } from '../lib/tripPlan'

function SortableStop({
  id,
  index,
  routedAt,
}: {
  id: string
  index: number
  routedAt: string | null
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const { state, activeTrip, toggleCheckpoint, claimingTripId } = useAppState()
  const cp = CHECKPOINTS_BY_ID.get(id)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  if (!cp) return null

  const claimer = claimingTripId(id)
  const claimedByOther = claimer && claimer !== activeTrip?.id
  const claimerName = claimedByOther
    ? state.trips.find((t) => t.id === claimer)?.name ?? 'another trip'
    : null

  return (
    <li ref={setNodeRef} style={style} className={`stop${claimedByOther ? ' stop--duplicate' : ''}`}>
      <button
        type="button"
        className="stop__handle"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>
      <span className="stop__index">{index + 1}</span>
      <div className="stop__body">
        <div className="stop__title">
          <strong>{cp.siteName}</strong>
          <span className="stop__label"> — {cp.label}</span>
        </div>
        <div className="stop__meta">
          <span className={`points${claimedByOther ? ' points--struck' : ''}`}>{cp.points} pts</span>
          {cp.ferryCostRoundTrip && <span className="ferry-cost">{cp.ferryCostRoundTrip}</span>}
        </div>
        {(claimedByOther || routedAt) && (
          <div className="stop__notes">
            {claimedByOther && <span className="dup-note">already scored in {claimerName}</span>}
            {routedAt && <span className="routed-at" title={routedAt}>routed via mainland</span>}
          </div>
        )}
      </div>
      <button
        type="button"
        className="stop__remove"
        title="Remove from trip"
        onClick={() => toggleCheckpoint(id)}
      >
        ×
      </button>
    </li>
  )
}

function HomeCard({
  position,
  enabled,
  homeLabel,
  onToggle,
}: {
  position: 'start' | 'end'
  enabled: boolean
  homeLabel: string
  onToggle: (value: boolean) => void
}) {
  return (
    <li className={`stop stop--home${enabled ? '' : ' stop--home-disabled'}`}>
      <span className="stop__home-icon" aria-hidden="true">🏠</span>
      <div className="stop__body">
        <div className="stop__title">
          <strong>Home</strong>
          <span className="stop__label"> ({position === 'start' ? 'start' : 'return'})</span>
        </div>
        <div className="stop__meta stop__meta--home">{enabled ? homeLabel : 'Skipped'}</div>
      </div>
      <label className="stop__toggle">
        <input type="checkbox" checked={enabled} onChange={(e) => onToggle(e.target.checked)} />
        <span className="stop__toggle-slider" aria-hidden="true" />
      </label>
    </li>
  )
}

function LegBar({ color, index }: { color: string; index: number }) {
  return (
    <li className="leg-bar" aria-hidden="true">
      <span className="leg-bar__line" style={{ background: color }} />
      <span className="leg-bar__num" style={{ background: color }}>
        {index + 1}
      </span>
      <span className="leg-bar__line" style={{ background: color }} />
    </li>
  )
}

function SkippedStop({ id, index }: { id: string; index: number }) {
  const cp = CHECKPOINTS_BY_ID.get(id)
  const { toggleCheckpoint } = useAppState()
  if (!cp) return null
  return (
    <li className="stop stop--skipped">
      <span className="stop__handle stop__handle--disabled" aria-hidden="true">⋮⋮</span>
      <span className="stop__index stop__index--skipped">{index + 1}</span>
      <div className="stop__body">
        <div className="stop__title">
          <strong>{cp.siteName}</strong>
          <span className="stop__label"> — {cp.label}</span>
        </div>
        <div className="stop__meta">
          <span className="points">{cp.points} pts</span>
        </div>
        <div className="stop__notes">
          <span className="routed-at">on-water · no road route</span>
        </div>
      </div>
      <button
        type="button"
        className="stop__remove"
        title="Remove from trip"
        onClick={() => toggleCheckpoint(id)}
      >
        ×
      </button>
    </li>
  )
}

export function ActiveTripList() {
  const {
    state,
    activeTrip,
    reorderActiveTrip,
    setTripStartFromHome,
    setTripReturnHome,
  } = useAppState()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const plan = useMemo(
    () => (activeTrip ? buildTripPlan(activeTrip, state.homeBase) : null),
    [activeTrip, state.homeBase],
  )

  if (!activeTrip || !plan) {
    return <p className="empty">No active trip.</p>
  }

  const stopIds = activeTrip.stops.map((s) => s.checkpointId)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = stopIds.indexOf(String(active.id))
    const newIndex = stopIds.indexOf(String(over.id))
    if (oldIndex < 0 || newIndex < 0) return
    reorderActiveTrip(arrayMove(stopIds, oldIndex, newIndex))
  }

  // Build a render list interleaving home cards, stops, and leg bars driven by the plan's anchors.
  const renderItems: React.ReactNode[] = []
  for (let p = 0; p < plan.anchors.length; p++) {
    const anchor = plan.anchors[p]

    if (anchor.kind === 'home-start') {
      renderItems.push(
        <HomeCard
          key="home-start"
          position="start"
          enabled
          homeLabel={state.homeBase.label}
          onToggle={(v) => setTripStartFromHome(activeTrip.id, v)}
        />,
      )
    } else if (anchor.kind === 'home-end') {
      renderItems.push(
        <HomeCard
          key="home-end"
          position="end"
          enabled
          homeLabel={state.homeBase.label}
          onToggle={(v) => setTripReturnHome(activeTrip.id, v)}
        />,
      )
    } else {
      const id = anchor.cp.id
      const routingIdx = plan.anchorRoutingIndex[p]
      let routedAt: string | null = null
      if (anchor.cp.region === 'Island') {
        const ml = MAINLAND_FOR_SITE.get(anchor.cp.siteId)
        if (ml) routedAt = ml.label
      }
      if (routingIdx === null && anchor.cp.region === 'Water') {
        renderItems.push(<SkippedStop key={id} id={id} index={anchor.stopIndex} />)
      } else {
        renderItems.push(
          <SortableStop key={id} id={id} index={anchor.stopIndex} routedAt={routedAt} />,
        )
      }
    }

    // Leg bar between this anchor and the next one (if a real leg exists)
    if (p < plan.anchors.length - 1) {
      const legIdx = legIndexBetweenAnchors(plan, p)
      if (legIdx !== null) {
        renderItems.push(
          <LegBar key={`leg-${p}`} color={colorForLeg(legIdx)} index={legIdx} />,
        )
      }
    }
  }

  // If startFromHome is off, add a disabled home-start card so the toggle is reachable
  if (!activeTrip.startFromHome) {
    renderItems.unshift(
      <HomeCard
        key="home-start-off"
        position="start"
        enabled={false}
        homeLabel={state.homeBase.label}
        onToggle={(v) => setTripStartFromHome(activeTrip.id, v)}
      />,
    )
  }
  if (!activeTrip.returnHome) {
    renderItems.push(
      <HomeCard
        key="home-end-off"
        position="end"
        enabled={false}
        homeLabel={state.homeBase.label}
        onToggle={(v) => setTripReturnHome(activeTrip.id, v)}
      />,
    )
  }

  if (stopIds.length === 0) {
    // Show an empty-state hint between the (possibly disabled) home cards
    const emptyIdx = activeTrip.startFromHome ? 1 : 1
    renderItems.splice(
      emptyIdx,
      0,
      <li key="empty" className="empty">
        No stops yet. Pick checkpoints below to build a route.
      </li>,
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={stopIds} strategy={verticalListSortingStrategy}>
        <ul className="trip-list">
          {renderItems.map((node, i) => (
            <Fragment key={i}>{node}</Fragment>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
