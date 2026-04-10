import React, { useState, useEffect } from 'react'
import { getWmo, windDirection } from '../../services/wmo'
import { useApp } from '../../AppContext'

function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return now
}

function fmtTime(date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function fmtDate(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()
}

function fmtSunTime(isoString) {
  if (!isoString) return '—'
  const d = new Date(isoString)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export default function CurrentConditions() {
  const { weather, activeLocation, settings } = useApp()
  const now = useClock()
  const cur = weather?.current

  const unit  = settings?.units === 'imperial' ? '°F' : '°C'
  const wUnit = settings?.units === 'imperial' ? 'mph' : 'km/h'

  const todaySunrise = weather?.daily?.sunrise?.[0]
  const todaySunset  = weather?.daily?.sunset?.[0]

  // Find current hour's precip probability from hourly data
  const precipProb = (() => {
    const h = weather?.hourly
    if (!h) return null
    const now = Date.now()
    const idx = h.time.findLastIndex(t => new Date(t).getTime() <= now)
    return idx >= 0 ? h.precipitation_probability[idx] : null
  })()

  if (!cur) return (
    <div className="current-conditions">
      <div className="clock-date">{fmtDate(now)}</div>
      <div className="clock-time">{fmtTime(now)}</div>
      <div className="conditions-placeholder">Loading...</div>
    </div>
  )

  const wmo = getWmo(cur.weather_code)

  return (
    <div className="current-conditions">
      <div className="clock-date">{fmtDate(now)}</div>
      <div className="clock-time">{fmtTime(now)}</div>

      {(todaySunrise || todaySunset) && (
        <div className="sun-row">
          <span>☀️ {fmtSunTime(todaySunrise)}</span>
          <span>🌙 {fmtSunTime(todaySunset)}</span>
        </div>
      )}

      <div className="location-name">{activeLocation?.label || 'Unknown Location'}</div>

      <div className="main-temp">
        <span className="weather-icon">{wmo.icon}</span>
        <span className="temp-value">{Math.round(cur.temperature_2m)}{unit}</span>
      </div>

      <div className="condition-desc">{wmo.desc}</div>

      <div className="condition-grid-2">
        <div className="cond-row" title="Current precipitation">
          <span className="cond-icon">🌧️</span>
          <span className="cond-text">{cur.precipitation ?? 0} {settings?.units === 'imperial' ? 'in' : 'mm'}</span>
        </div>
        <div className="cond-row" title="Cloud cover">
          <span className="cond-icon">☁️</span>
          <span className="cond-text">{cur.cloud_cover ?? '—'}%</span>
        </div>
        <div className="cond-row" title="Wind speed and direction">
          <span className="cond-icon">💨</span>
          <span className="cond-text">{Math.round(cur.wind_speed_10m)} {wUnit} {windDirection(cur.wind_direction_10m)}</span>
        </div>
        <div className="cond-row" title="Relative humidity">
          <span className="cond-icon">💧</span>
          <span className="cond-text">{cur.relative_humidity_2m}%</span>
        </div>
        <div className="cond-row" title="Feels like temperature">
          <span className="cond-icon">🌡️</span>
          <span className="cond-text">Feels {Math.round(cur.apparent_temperature)}{unit}</span>
        </div>
        <div className="cond-row" title="Current chance of rain">
          <span className="cond-icon">🌂</span>
          <span className="cond-text">{precipProb !== null ? `${precipProb}%` : '—'} rain</span>
        </div>
      </div>
    </div>
  )
}
