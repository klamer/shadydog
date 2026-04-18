import React, { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useApp } from '../../AppContext'
import { reverseGeocode } from '../../services/api'

const LAYOUTS = [
  { value: 'map-left',      label: 'Map Left / Weather Right' },
  { value: 'weather-left',  label: 'Weather Left / Map Right' },
  { value: 'map-top',       label: 'Map Top / Weather Bottom' },
  { value: 'map-overlay',   label: 'Full Map + Weather Overlay' },
]

export default function SettingsModal({ onClose }) {
  const { settings, updateSettings } = useApp()

  const [theme,      setTheme]      = useState(settings?.theme      || 'dark')
  const [layout,     setLayout]     = useState(settings?.layout     || 'map-left')
  const [units,      setUnits]      = useState(settings?.units      || 'imperial')
  const [tabletMode, setTabletMode] = useState(localStorage.getItem('tabletMode') === 'true')
  const [port,       setPort]       = useState(settings?.port       || 8080)
  const [mapboxKey,  setMapboxKey]  = useState(settings?.mapboxKey  || '')
  const [locations, setLocations] = useState(settings?.locations || [])

  const [newLat,    setNewLat]    = useState('')
  const [newLon,    setNewLon]    = useState('')
  const [newName,   setNewName]   = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const [saving,    setSaving]    = useState(false)

  async function handleAddLocation() {
    const lat = parseFloat(newLat)
    const lon = parseFloat(newLon)
    if (isNaN(lat) || isNaN(lon)) return

    setGeocoding(true)
    let label = newName || `${lat.toFixed(4)}, ${lon.toFixed(4)}`
    try {
      const geo = await reverseGeocode(lat, lon)
      label = newName || [geo.label, geo.region].filter(Boolean).join(', ')
    } catch { /* use coordinate fallback */ }
    setGeocoding(false)

    setLocations(prev => [...prev, { id: uuidv4(), lat, lon, label, name: newName || label }])
    setNewLat(''); setNewLon(''); setNewName('')
  }

  function removeLocation(id) {
    setLocations(prev => prev.filter(l => l.id !== id))
  }

  async function handleSave() {
    setSaving(true)
    const currentActiveId = settings?.activeLocationId
    const activeStillExists = locations.some(l => l.id === currentActiveId)
    localStorage.setItem('tabletMode', tabletMode)
    const patch = {
      theme,
      layout,
      units,
      port: parseInt(port, 10) || 8080,
      mapboxKey: mapboxKey.trim(),
      locations,
      activeLocationId: activeStillExists ? currentActiveId : (locations[0]?.id || null)
    }
    await updateSettings(patch)
    setSaving(false)
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Appearance */}
          <section className="settings-section">
            <h3>Appearance</h3>
            <label>
              Theme
              <select value={theme} onChange={e => setTheme(e.target.value)}>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </label>
            <label>
              Layout
              <select value={layout} onChange={e => setLayout(e.target.value)}>
                {LAYOUTS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </label>
            <label>
              Units
              <select value={units} onChange={e => setUnits(e.target.value)}>
                <option value="imperial">Imperial (°F, mph)</option>
                <option value="metric">Metric (°C, km/h)</option>
              </select>
            </label>
            <label>
              Tablet mode
              <input
                type="checkbox"
                checked={tabletMode}
                onChange={e => setTabletMode(e.target.checked)}
                style={{ width: 'auto', minWidth: 'unset' }}
              />
            </label>
            <p className="settings-note">Splits conditions and charts into two narrow panels. Best for landscape tablets.</p>
          </section>

          {/* API Keys */}
          <section className="settings-section">
            <h3>API Keys</h3>
            <label>
              Mapbox
              <input
                type="password"
                placeholder="pk.eyJ1... (optional)"
                value={mapboxKey}
                onChange={e => setMapboxKey(e.target.value)}
              />
            </label>
            <p className="settings-note">Optional. Enables Mapbox Dark map style. Get a free key at mapbox.com.</p>
          </section>

          {/* Server */}
          <section className="settings-section">
            <h3>Server</h3>
            <label>
              Port
              <input
                type="number" min={1} max={65535}
                value={port} onChange={e => setPort(e.target.value)}
              />
            </label>
            <p className="settings-note">Port change takes effect on server restart.</p>
          </section>

          {/* Locations */}
          <section className="settings-section">
            <h3>Saved Locations</h3>
            <div className="location-list">
              {locations.map(loc => (
                <div key={loc.id} className="location-row">
                  <span className="loc-label">{loc.name || loc.label}</span>
                  <span className="loc-coords">{Number(loc.lat).toFixed(4)}, {Number(loc.lon).toFixed(4)}</span>
                  <button className="loc-remove" onClick={() => removeLocation(loc.id)}>✕</button>
                </div>
              ))}
              {!locations.length && <p className="settings-note">No locations saved.</p>}
            </div>

            <div className="add-location">
              <h4>Add Location</h4>
              <div className="add-location-inputs">
                <input
                  type="number" placeholder="Latitude" step="any"
                  value={newLat} onChange={e => setNewLat(e.target.value)}
                />
                <input
                  type="number" placeholder="Longitude" step="any"
                  value={newLon} onChange={e => setNewLon(e.target.value)}
                />
                <input
                  className="input-name"
                  type="text" placeholder="Name (optional)"
                  value={newName} onChange={e => setNewName(e.target.value)}
                />
                <button
                  className="btn-add"
                  onClick={handleAddLocation}
                  disabled={geocoding || !newLat || !newLon}
                >
                  {geocoding ? 'Looking up location...' : 'Add Location'}
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
