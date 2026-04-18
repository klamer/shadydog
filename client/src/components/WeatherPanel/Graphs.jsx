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

const PRECIP_LABELS = ['Clear', 'Light', 'Moderate', 'Heavy']
const PRECIP_COLORS = ['var(--border)', '#60a5fa', '#3b82f6', '#1d4ed8']

function fmtMs(ms) {
  const d = new Date(ms)
  const h = d.getHours()
  const m = d.getMinutes()
  const label  = h === 0 ? '12' : h <= 12 ? `${h}` : `${h - 12}`
  const suffix = h < 12 ? 'a' : 'p'
  return m === 0 ? `${label}${suffix}` : `${label}:${String(m).padStart(2, '0')}`
}

export default function Graphs({ fillHeight = false }) {
  const { weather, settings, precip } = useApp()
  const chartH   = fillHeight ? '100%' : 160
  const smallH   = fillHeight ? '100%' : 100
  const axisW    = fillHeight ? 32 : 45
  const marginR  = fillHeight ? 4 : 40
  const tempLabel = settings?.units === 'imperial' ? 'F' : 'C'
  const gridColor = 'var(--border)'
  const textColor = 'var(--text-muted)'

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
    const now = Date.now()

    // Primary: Tomorrow.io minutely data
    if (precip?.length) {
      return [...precip]
        .sort((a, b) => a.time - b.time)
        .filter(f => f.time >= now - 10 * 60 * 1000)  // include current frame
        .map(f => ({
          time:  fmtMs(f.time),
          level: f.intensity,
          label: PRECIP_LABELS[f.intensity],
          color: PRECIP_COLORS[f.intensity],
          ts:    f.time
        }))
    }

    // Fallback: hourly precipitation_probability
    const h = weather?.hourly
    if (!h) return []

    function probToLevel(p) {
      if (p >= 75) return 3
      if (p >= 55) return 2
      if (p >= 30) return 1
      return 0
    }

    return h.time
      .map((t, i) => ({ ts: new Date(t).getTime(), prob: h.precipitation_probability[i] }))
      .filter(d => d.ts >= now && d.ts <= now + 3 * 60 * 60 * 1000)
      .slice(0, 4)
      .map(d => {
        const level = probToLevel(d.prob)
        return { time: fmt12(new Date(d.ts).toISOString()), level, label: PRECIP_LABELS[level], color: PRECIP_COLORS[level], ts: d.ts }
      })
  }, [precip, weather?.hourly])

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
          <div className="chart-fill">
            <ResponsiveContainer width="100%" height={smallH}>
              <BarChart data={twoHourData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="time" tick={{ fill: textColor, fontSize: 11 }} />
                <YAxis
                  domain={[0, 3]}
                  ticks={[0, 1, 2, 3]}
                  tickFormatter={v => ['', 'Light', 'Mod', 'Heavy'][v] || ''}
                  tick={{ fill: textColor, fontSize: 9 }}
                  width={38}
                />
                <Tooltip
                  formatter={(_, __, props) => [props.payload.label, 'Intensity']}
                  contentStyle={TOOLTIP_STYLE.contentStyle}
                />
                <Bar dataKey="level" radius={[3, 3, 0, 0]} maxBarSize={24}>
                  {twoHourData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 24hr */}
      <div className="graph-section">
        <div className="graph-title">24 Hour Temp / Precipitation</div>
        <div className="chart-fill">
          <ResponsiveContainer width="100%" height={chartH}>
            <ComposedChart data={hourlyData} margin={{ top: 4, right: marginR, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="time" {...axisProps} interval={3} />
              <YAxis yAxisId="temp" {...axisProps} unit={tempLabel} width={axisW} />
              <YAxis yAxisId="precip" orientation="right" {...axisProps} unit="%" domain={[0, 100]} width={axisW} />
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
      </div>

      {/* 5-day */}
      <div className="graph-section">
        <div className="graph-title">5 Day Temp / Precipitation</div>
        <div className="chart-fill">
          <ResponsiveContainer width="100%" height={chartH}>
            <ComposedChart data={dailyData.slice(0, 5)} margin={{ top: 4, right: marginR, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="day" {...axisProps} />
              <YAxis yAxisId="temp" {...axisProps} unit={tempLabel} width={axisW} />
              <YAxis yAxisId="precip" orientation="right" {...axisProps} unit="%" domain={[0, 100]} width={axisW} />
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
    </div>
  )
}
