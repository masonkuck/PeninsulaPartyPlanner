import { useState } from 'react'
import { useAppState } from '../state/AppStateContext'

export function Settings() {
  const { state, setHomeBase } = useAppState()
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState(state.homeBase.label)
  const [lat, setLat] = useState(String(state.homeBase.lat))
  const [lng, setLng] = useState(String(state.homeBase.lng))

  const save = () => {
    const parsedLat = parseFloat(lat)
    const parsedLng = parseFloat(lng)
    if (Number.isFinite(parsedLat) && Number.isFinite(parsedLng)) {
      setHomeBase({ lat: parsedLat, lng: parsedLng, label: label.trim() || 'Home Base' })
    }
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
                <input value={lat} onChange={(e) => setLat(e.target.value)} />
              </label>
              <label className="field">
                <span>Longitude</span>
                <input value={lng} onChange={(e) => setLng(e.target.value)} />
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" onClick={() => setOpen(false)}>Cancel</button>
              <button type="button" className="primary" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
