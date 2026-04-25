import React, { useState } from 'react'
import { useApp } from '../../AppContext'
import { alertColor } from '../../services/alerts'

export default function AlertsBanner() {
  const { alerts } = useApp()
  const [expanded, setExpanded] = useState(null)

  if (!alerts.length) {
    return (
      <div className="alerts-banner alerts-clear">
        <span className="alert-icon">✅</span> No active alerts
      </div>
    )
  }

  const topAlert = alerts[0]
  const color    = alertColor(topAlert.severity)

  return (
    <div className="alerts-banner" style={{ borderColor: color }}>
      <div className="alerts-header" onClick={() => setExpanded(expanded !== null ? null : 0)}>
        <span className="alert-dot" style={{ background: color }} />
        <span className="alert-count">
          {alerts.length} Active Alert{alerts.length > 1 ? 's' : ''}
        </span>
        <span className="alert-event">{topAlert.event}</span>
        <span className="alert-toggle">{expanded !== null ? '▲' : '▼'}</span>
      </div>

      {expanded !== null && (
        <div className="alerts-list">
          {alerts.map((a, i) => (
            <div
              key={a.id || i}
              className="alert-item"
              style={{ borderLeftColor: alertColor(a.severity) }}
            >
              <div className="alert-item-header">
                <strong>{a.event}</strong>
                <span className="alert-severity">{a.severity}</span>
              </div>
              <div className="alert-headline">{a.headline}</div>
              {a.expires && (
                <div className="alert-expires">
                  Expires: {new Date(a.expires).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
