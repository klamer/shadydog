export async function fetchAlerts(lat, lon) {
  // NWS alerts are US-only. Return empty for non-US coordinates.
  // Rough US bounding box check
  if (lat < 18 || lat > 72 || lon < -180 || lon > -65) {
    return []
  }
  try {
    const res = await fetch(
      `https://api.weather.gov/alerts/active?point=${lat},${lon}`,
      { headers: { 'User-Agent': 'Shadydog/1.0', Accept: 'application/geo+json' } }
    )
    const data = await res.json()
    return (data.features || []).map(f => ({
      id: f.id,
      event: f.properties.event,
      headline: f.properties.headline,
      description: f.properties.description,
      severity: f.properties.severity,   // Extreme, Severe, Moderate, Minor
      urgency: f.properties.urgency,
      onset: f.properties.onset,
      expires: f.properties.expires
    }))
  } catch {
    return []
  }
}

export function alertColor(severity) {
  switch (severity) {
    case 'Extreme':  return 'var(--alert-extreme)'
    case 'Severe':   return 'var(--alert-severe)'
    case 'Moderate': return 'var(--alert-moderate)'
    default:         return 'var(--alert-minor)'
  }
}
