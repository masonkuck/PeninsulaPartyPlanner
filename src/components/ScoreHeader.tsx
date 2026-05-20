import { useAppState } from '../state/AppStateContext'

interface Props {
  onMenuClick?: () => void
}

export function ScoreHeader({ onMenuClick }: Props) {
  const { state, totalScore, tripScore, activeTrip } = useAppState()
  return (
    <header className="score-header">
      <div className="score-header__left">
        {onMenuClick && (
          <button
            type="button"
            className="score-header__menu"
            onClick={onMenuClick}
            aria-label="Open trip drawer"
          >
            ☰
          </button>
        )}
        <div className="score-header__brand">
          <h1>Peninsula Party 2026 Planner</h1>
          <p className="score-header__subtitle">{state.homeBase.label}</p>
        </div>
      </div>
      <div className="score-header__scores">
        <div className="score-pill score-pill--total">
          <span className="score-pill__label">Total</span>
          <span className="score-pill__value">{totalScore}</span>
        </div>
        {activeTrip && (
          <div className="score-pill">
            <span className="score-pill__label">{activeTrip.name}</span>
            <span className="score-pill__value">{tripScore(activeTrip.id)}</span>
          </div>
        )}
      </div>
    </header>
  )
}
