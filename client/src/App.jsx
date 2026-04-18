import React, { useState, useEffect } from 'react'
import WeatherPanel from './components/WeatherPanel/WeatherPanel'
import ChartsPanel from './components/WeatherPanel/ChartsPanel'
import MapPanel from './components/MapPanel/MapPanel'
import SettingsModal from './components/Settings/SettingsModal'
import LocationSwitcher from './components/LocationSwitcher/LocationSwitcher'
import { useApp } from './AppContext'
import './styles/global.css'
import './styles/themes.css'
import './styles/layouts.css'

export default function App() {
  const { settings, updateSettings } = useApp()
  const [showSettings, setShowSettings] = useState(false)

  const theme      = settings?.theme  || 'dark'
  const layout     = settings?.layout || 'map-left'
  const tabletMode = localStorage.getItem('tabletMode') === 'true'

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  function toggleTheme() {
    updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' })
  }

  if (!settings) {
    return <div className="app-loading">Loading...</div>
  }

  // No location configured yet — prompt user
  if (!settings.locations?.length) {
    return (
      <div data-theme={theme} className="app app-setup">
        <div className="setup-prompt">
          <div className="setup-icon">🌤️</div>
          <h1>Welcome to Shadydog</h1>
          <p>Open settings to add your first location.</p>
          <button className="btn-save" onClick={() => setShowSettings(true)}>Open Settings</button>
        </div>
        {showSettings && (
          <SettingsModal onClose={() => { setShowSettings(false) }} />
        )}
      </div>
    )
  }

  return (
    <div data-theme={theme} className={`app layout-${layout}${tabletMode ? ' tablet-mode' : ''}`}>
      {/* Floating controls — zero layout footprint */}
      <div className="app-controls">
        <LocationSwitcher />
        <div className="header-actions">
          <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="icon-btn" onClick={() => setShowSettings(true)} title="Settings">
            ⚙️
          </button>
        </div>
      </div>

      {/* Main content — layout controlled via CSS class */}
      <main className="app-main">
        <div className="map-slot">
          <MapPanel />
        </div>
        <div className="weather-slot">
          <WeatherPanel hideCharts={tabletMode} />
        </div>
        {tabletMode && (
          <div className="charts-slot">
            <ChartsPanel />
          </div>
        )}
      </main>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}
