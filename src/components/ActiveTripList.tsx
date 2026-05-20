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
import { CHECKPOINTS_BY_ID } from '../data/checkpoints'

function SortableStop({ id, index }: { id: string; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const { toggleCheckpoint } = useAppState()
  const cp = CHECKPOINTS_BY_ID.get(id)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  if (!cp) return null

  return (
    <li ref={setNodeRef} style={style} className="stop">
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
          <span className="points">{cp.points} pts</span>
          {cp.ferryCostRoundTrip && <span className="ferry-cost">Ferry {cp.ferryCostRoundTrip}</span>}
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
  const { activeTrip, reorderActiveTrip } = useAppState()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  if (!activeTrip || activeTrip.stops.length === 0) {
    return <p className="empty">No stops yet. Pick checkpoints below to build a route.</p>
  }

  const ids = activeTrip.stops.map((s) => s.checkpointId)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex < 0 || newIndex < 0) return
    reorderActiveTrip(arrayMove(ids, oldIndex, newIndex))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ol className="stops">
          {ids.map((id, i) => (
            <SortableStop key={id} id={id} index={i} />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  )
}
