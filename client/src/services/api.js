async function apiFetch(path, options = {}) {
  const res = await fetch(`/api${path}`, options)
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json()
}

export const getSettings = () => apiFetch('/settings')

export const saveSettings = (data) => apiFetch('/settings', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})

export const reverseGeocode = (lat, lon) =>
  apiFetch(`/geocode/reverse?lat=${lat}&lon=${lon}`)
