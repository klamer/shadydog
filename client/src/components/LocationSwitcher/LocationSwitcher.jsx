import React from 'react'
import { useApp } from '../../AppContext'

export default function LocationSwitcher() {
  const { settings, updateSettings } = useApp()
  const locations = settings?.locations || []

  if (locations.length <= 1) return null

  return (
    <div className="location-switcher">
      {locations.map(loc => (
        <button
          key={loc.id}
          className={`loc-btn ${loc.id === settings.activeLocationId ? 'active' : ''}`}
          onClick={() => updateSettings({ activeLocationId: loc.id })}
          title={loc.label}
        >
          {loc.name || loc.label}
        </button>
      ))}
    </div>
  )
}
