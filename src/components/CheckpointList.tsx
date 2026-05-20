import { useMemo } from 'react'
import { SITES, CHECKPOINTS_BY_ID } from '../data/checkpoints'
import { useAppState } from '../state/AppStateContext'
import { ActiveTripList } from './ActiveTripList'
import { ShareButton } from './ShareButton'
import type { Checkpoint } from '../types'

function regionBadge(cp: Checkpoint): { label: string; cls: string } | null {
  if (cp.outOfState) return { label: cp.label.includes('Canada') ? 'Canada' : 'Out of State', cls: 'badge--oos' }
  if (cp.region === 'Island') return { label: 'Island', cls: 'badge--island' }
  if (cp.region === 'Water') return { label: 'On Water', cls: 'badge--water' }
  if (cp.region === 'UP') return { label: 'UP', cls: 'badge--up' }
  if (cp.region === 'LP') return { label: 'LP', cls: 'badge--lp' }
  return null
}

export function CheckpointList() {
  const { isCheckpointInActiveTrip, toggleCheckpoint, activeTrip } = useAppState()

  const includedSet = useMemo(() => {
    return new Set(activeTrip?.stops.map((s) => s.checkpointId) ?? [])
  }, [activeTrip])

  return (
    <div className="checkpoint-list">
      <section className="panel">
        <div className="panel__head">
          <h2 className="panel__title">Active Trip Route</h2>
          <ShareButton />
        </div>
        <p className="panel__hint">Drag to reorder — your ride goes Home → stops in order → Home.</p>
        <ActiveTripList />
      </section>

      <section className="panel">
        <h2 className="panel__title">All Checkpoints</h2>
        <p className="panel__hint">Click to add or remove from the active trip.</p>
        <div className="sites">
          {SITES.map((site) => {
            const siteIncluded = site.checkpoints.filter((c) => includedSet.has(c.id)).length
            return (
              <div key={site.id} className="site">
                <div className="site__header">
                  <h3 className="site__name">{site.name}</h3>
                  {siteIncluded > 0 && (
                    <span className="site__count">{siteIncluded} in trip</span>
                  )}
                </div>
                <ul className="checkpoints">
                  {site.checkpoints.map((cp) => {
                    const inTrip = isCheckpointInActiveTrip(cp.id)
                    const badge = regionBadge(cp)
                    return (
                      <li
                        key={cp.id}
                        className={`checkpoint${inTrip ? ' checkpoint--in-trip' : ''}`}
                        onClick={() => toggleCheckpoint(cp.id)}
                      >
                        <input
                          type="checkbox"
                          className="checkpoint__check"
                          checked={inTrip}
                          readOnly
                          tabIndex={-1}
                        />
                        <div className="checkpoint__body">
                          <div className="checkpoint__title">
                            <span>{cp.label}</span>
                            {badge && <span className={`badge ${badge.cls}`}>{badge.label}</span>}
                            {cp.warning && <span className="badge badge--warning">⚠ Closed</span>}
                          </div>
                          <div className="checkpoint__meta">
                            <span className="points">{cp.points} pts</span>
                            {cp.ferryCostRoundTrip && (
                              <span className="ferry-cost">Ferry {cp.ferryCostRoundTrip}</span>
                            )}
                          </div>
                          {cp.warning && (
                            <div className="checkpoint__warning" onClick={(e) => e.stopPropagation()}>
                              {cp.warning}{' '}
                              {cp.warningLink && (
                                <a href={cp.warningLink} target="_blank" rel="noreferrer">
                                  more info
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export function checkpointById(id: string) {
  return CHECKPOINTS_BY_ID.get(id)
}
