import { useEffect, useState } from 'react'
import { useAppState } from '../state/AppStateContext'

function validateLat(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return 'Required'
  const n = Number(trimmed)
  if (!Number.isFinite(n)) return 'Must be a number'
  if (n < -90 || n > 90) return 'Must be between -90 and 90'
  return null
}

function validateLng(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return 'Required'
  const n = Number(trimmed)
  if (!Number.isFinite(n)) return 'Must be a number'
  if (n < -180 || n > 180) return 'Must be between -180 and 180'
  return null
}

export function Settings() {
  const { state, setHomeBase } = useAppState()
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState(state.homeBase.label)
  const [lat, setLat] = useState(String(state.homeBase.lat))
  const [lng, setLng] = useState(String(state.homeBase.lng))

  useEffect(() => {
    if (open) {
      setLabel(state.homeBase.label)
      setLat(String(state.homeBase.lat))
      setLng(String(state.homeBase.lng))
    }
  }, [open, state.homeBase])

  const latError = validateLat(lat)
  const lngError = validateLng(lng)
  const canSave = !latError && !lngError

  const save = () => {
    if (!canSave) return
    setHomeBase({
      lat: Number(lat),
      lng: Number(lng),
      label: label.trim() || 'Home Base',
    })
    setOpen(false)
  }

  return (
    <>
      <button type="button" className="settings-btn" onClick={() => setOpen(true)}>
        ⚙ Settings
      </button>
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Settings</h2>

            <label className="field">
              <span>Home Base Label</span>
              <input value={label} onChange={(e) => setLabel(e.target.value)} />
            </label>
            <div className="field-row">
              <label className="field">
                <span>Latitude</span>
                <input
                  inputMode="decimal"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className={latError ? 'field__input--invalid' : ''}
                  aria-invalid={!!latError}
                />
                {latError && <span className="field__error">{latError}</span>}
              </label>
              <label className="field">
                <span>Longitude</span>
                <input
                  inputMode="decimal"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  className={lngError ? 'field__input--invalid' : ''}
                  aria-invalid={!!lngError}
                />
                {lngError && <span className="field__error">{lngError}</span>}
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" onClick={() => setOpen(false)}>Cancel</button>
              <button
                type="button"
                className="primary"
                onClick={save}
                disabled={!canSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
