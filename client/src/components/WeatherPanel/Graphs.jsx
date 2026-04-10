import React from 'react'
import {
  ResponsiveContainer, ComposedChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, Cell
} from 'recharts'
import { useApp } from '../../AppContext'

function fmt12(isoString) {
  const d = new Date(isoString)
  const h = d.getHours()
  return h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`
}

function fmt15(isoString) {
  const d = new Date(isoString)
  const h = d.getHours()
  const m = d.getMinutes()
  const label = h === 0 ? '12' : h <= 12 ? `${h}` : `${h - 12}`
  const suffix = h < 12 ? 'a' : 'p'
  return m === 0 ? `${label}${suffix}` : `${label}:${String(m).padStart(2,'0')}`
}

function fmtDay(isoDate) {
  const d = new Date(isoDate + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

const TOOLTIP_STYLE = {
  contentStyle: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    fontSize: 12
  }
}

export default function Graphs() {
  const { weather, settings } = useApp()
  const tempLabel   = settings?.units === 'imperial' ? 'F' : 'C'
  const precipLabel = settings?.units === 'imperial' ? 'in' : 'mm'
  const gridColor   = 'var(--border)'
  const textColor   = 'var(--text-muted)'
  const trace       = settings?.units === 'imperial' ? 0.005 : 0.1

  const hourlyData = React.useMemo(() => {
    const h = weather?.hourly
    if (!h) return []
    return h.time.map((t, i) => ({
      time:   fmt12(t),
      temp:   Math.round(h.temperature_2m[i]),
      precip: h.precipitation_probability[i]
    }))
  }, [weather?.hourly])

  const twoHourData = React.useMemo(() => {
    const m = weather?.minutely_15
    if (!m) return []
    const now = Date.now()
    return m.time
      .map((t, i) => ({ time: fmt15(t), precip: m.precipitation[i], ts: new Date(t).getTime() }))
      .filter(d => d.ts >= now - 15 * 60 * 1000)  // from current interval
      .slice(0, 9)                                  // 2 hrs + current = 9 bars
  }, [weather?.minutely_15])

  const dailyData = React.useMemo(() => {
    const d = weather?.daily
    if (!d) return []
    return d.time.map((t, i) => ({
      day:    fmtDay(t),
      high:   Math.round(d.temperature_2m_max[i]),
      low:    Math.round(d.temperature_2m_min[i]),
      precip: d.precipitation_probability_max[i]
    }))
  }, [weather?.daily])

  if (!hourlyData.length && !dailyData.length) {
    return <div className="graphs-placeholder">Loading charts...</div>
  }

  const axisProps = {
    tick: { fill: textColor, fontSize: 11 },
    tickLine: false,
    axisLine: { stroke: gridColor }
  }

  return (
    <div className="graphs">
      {/* 2-hour minutely precip */}
      {twoHourData.length > 0 && (
        <div className="graph-section">
          <div className="graph-title">Next 2 Hours — Precipitation</div>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={twoHourData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="time" tick={{ fill: textColor, fontSize: 11 }} />
              <YAxis tick={{ fill: textColor, fontSize: 11 }} unit={precipLabel} />
              <Tooltip active={false} />
              <Bar dataKey="precip" radius={[3, 3, 0, 0]}>
                {twoHourData.map((d, i) => (
                  <Cell key={i} fill={d.precip > trace ? 'var(--rain)' : 'var(--border)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 24hr */}
      <div className="graph-section">
        <div className="graph-title">24 Hour Temp / Precipitation</div>
        <ResponsiveContainer width="100%" height={160}>
          <ComposedChart data={hourlyData} margin={{ top: 4, right: 40, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="time" {...axisProps} interval={3} />
            <YAxis yAxisId="temp" {...axisProps} unit={tempLabel} />
            <YAxis yAxisId="precip" orientation="right" {...axisProps} unit="%" domain={[0, 100]} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ color: textColor, fontSize: 11 }} />
            <Line
              yAxisId="temp" type="monotone" dataKey="temp"
              name={`Temp (°${tempLabel})`} stroke="var(--text)"
              strokeWidth={2} dot={false}
            />
            <Line
              yAxisId="precip" type="monotone" dataKey="precip"
              name="Precip %" stroke="var(--rain)"
              strokeWidth={2} dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 5-day */}
      <div className="graph-section">
        <div className="graph-title">5 Day Temp / Precipitation</div>
        <ResponsiveContainer width="100%" height={160}>
          <ComposedChart data={dailyData.slice(0, 5)} margin={{ top: 4, right: 40, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="day" {...axisProps} />
            <YAxis yAxisId="temp" {...axisProps} unit={tempLabel} />
            <YAxis yAxisId="precip" orientation="right" {...axisProps} unit="%" domain={[0, 100]} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ color: textColor, fontSize: 11 }} />
            <Line
              yAxisId="temp" type="monotone" dataKey="high"
              name={`High (°${tempLabel})`} stroke="var(--text)"
              strokeWidth={2} dot={true}
            />
            <Line
              yAxisId="temp" type="monotone" dataKey="low"
              name={`Low (°${tempLabel})`} stroke="var(--text-muted)"
              strokeWidth={2} dot={true} strokeDasharray="4 2"
            />
            <Line
              yAxisId="precip" type="monotone" dataKey="precip"
              name="Precip %" stroke="var(--rain)"
              strokeWidth={2} dot={true}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
