import React from 'react'
import { useApp } from '../../AppContext'

const RAIN_CODES = new Set([51,53,55,61,63,65,80,81,82,95,96,99])
const SNOW_CODES = new Set([71,73,75,77,85,86])
const INTENSITY  = ['', 'Light', 'Moderate', 'Heavy']

function isPrecipCode(code) { return RAIN_CODES.has(code) || SNOW_CODES.has(code) }
function precipType(code)   { return SNOW_CODES.has(code) ? 'snow' : 'rain' }

function mins(ms) {
  const m = Math.round(ms / 60000)
  return m < 60 ? `~${m} min` : `~${Math.round(m / 60)} hr`
}

// Primary: RainViewer radar point data
function summaryFromRadar(frames) {
  if (!frames?.length) return null
  const now          = Date.now()
  const sorted       = [...frames].sort((a, b) => a.time - b.time)
  const cur          = sorted.reduce((best, f) => f.time <= now + 5 * 60 * 1000 ? f : best, sorted[0])
  const future       = sorted.filter(f => f.time > now)
  const wetNow       = cur.intensity > 0

  if (wetNow) {
    const label = INTENSITY[cur.intensity] || 'Light'
    if (!future.length)                        return `${label} rain currently`
    const stopFrame = future.find(f => f.intensity === 0)
    if (stopFrame) return `${label} rain stopping in ${mins(stopFrame.time - now)}`
    return `${label} rain for the next 2 hrs`
  } else {
    if (!future.length)                        return 'Clear'
    const rainFrame = future.find(f => f.intensity > 0)
    if (rainFrame) {
      const label = INTENSITY[rainFrame.intensity] || 'Light'
      return `${label} rain starting in ${mins(rainFrame.time - now)}`
    }
    return 'Clear for the next 2 hrs'
  }
}

// Fallback: Open-Meteo hourly precipitation_probability
function summaryFromHourly(hourly) {
  if (!hourly?.time?.length) return null
  const now   = Date.now()
  const prob  = hourly.precipitation_probability
  const codes = hourly.weather_code || []
  const times = hourly.time.map(t => new Date(t).getTime())

  let idx = times.findLastIndex(t => t <= now)
  if (idx < 0) idx = 0

  const isWet = i => (prob[i] ?? 0) >= 40 || isPrecipCode(codes[i])

  if (isWet(idx)) {
    const type = precipType(codes[idx] || 0)
    for (let i = 1; i <= 3; i++) {
      if (idx + i < prob.length && !isWet(idx + i))
        return `${type === 'snow' ? 'Snow' : 'Rain'} likely, clearing in ~${i} hr`
    }
    return `${precipType(codes[idx] || 0) === 'snow' ? 'Snow' : 'Rain'} likely for the next 2 hrs`
  } else {
    for (let i = 1; i <= 3; i++) {
      if (idx + i < prob.length && isWet(idx + i)) {
        const type = precipType(codes[idx + i] || 0)
        return `${type === 'snow' ? 'Snow' : 'Rain'} possible in ~${i} hr`
      }
    }
    return 'Clear for the next 2 hrs'
  }
}

export default function HyperLocal() {
  const { weather, rainviewer } = useApp()

  // rainviewer null = still loading, [] = CORS blocked (use fallback)
  const summary = rainviewer?.length
    ? summaryFromRadar(rainviewer)
    : summaryFromHourly(weather?.hourly)

  if (!summary) return null

  const isAlert = !summary.startsWith('Clear')

  return (
    <div className={`hyperlocal ${isAlert ? 'hyperlocal-rain' : 'hyperlocal-clear'}`}>
      <span className="hyperlocal-icon">{isAlert ? '🌧️' : '✅'}</span>
      {summary}
    </div>
  )
}
