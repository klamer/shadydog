import React from 'react'
import { useApp } from '../../AppContext'

const LOOKAHEAD = 8  // 8 × 15min = 2 hours

function intensity(precip, units) {
  const light    = units === 'imperial' ? 0.01 : 0.3
  const moderate = units === 'imperial' ? 0.04 : 1.0
  const heavy    = units === 'imperial' ? 0.08 : 2.0
  if (precip >= heavy)    return 'Heavy'
  if (precip >= moderate) return 'Moderate'
  if (precip >= light)    return 'Light'
  return null
}

function mins(intervals) {
  const m = intervals * 15
  if (m < 60) return `~${m} min`
  const h = Math.round(m / 60)
  return `~${h} hr`
}

function buildSummary(minutely15, units) {
  if (!minutely15?.time?.length) return null

  const now    = Date.now()
  const times  = minutely15.time.map(t => new Date(t).getTime())
  const precip = minutely15.precipitation
  const trace  = units === 'imperial' ? 0.005 : 0.1

  // Find the current interval
  let idx = times.findLastIndex(t => t <= now)
  if (idx < 0) idx = 0

  const rainingNow = precip[idx] > trace
  const look = Math.min(LOOKAHEAD, times.length - idx - 1)

  if (rainingNow) {
    const curLevel = intensity(precip[idx], units)

    // Find stop point
    for (let i = 1; i <= look; i++) {
      if (precip[idx + i] <= trace) {
        return `${curLevel} rain stopping in ${mins(i)}`
      }
    }

    // Check if it intensifies or lightens within the window
    const futureMax = Math.max(...precip.slice(idx + 1, idx + look + 1))
    const futureLevel = intensity(futureMax, units)
    if (futureLevel && futureLevel !== curLevel) {
      return `${curLevel} rain, becoming ${futureLevel.toLowerCase()} over the next 2 hrs`
    }
    return `${curLevel} rain for the next 2 hrs`

  } else {
    // Find start point
    for (let i = 1; i <= look; i++) {
      if (precip[idx + i] > trace) {
        const level = intensity(precip[idx + i], units)
        return `${level} rain starting in ${mins(i)}`
      }
    }
    return 'Clear for the next 2 hrs'
  }
}

export default function HyperLocal() {
  const { weather, settings } = useApp()
  const summary = buildSummary(weather?.minutely_15, settings?.units)

  if (!summary) return null

  const isAlert = summary.toLowerCase().includes('rain') && !summary.startsWith('Clear')

  return (
    <div className={`hyperlocal ${isAlert ? 'hyperlocal-rain' : 'hyperlocal-clear'}`}>
      <span className="hyperlocal-icon">{isAlert ? '🌧️' : '✅'}</span>
      {summary}
    </div>
  )
}
