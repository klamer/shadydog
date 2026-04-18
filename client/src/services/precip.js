// Fetches minutely precipitation frames from the server-side Tomorrow.io proxy.
// Returns [{time (ms), intensity 0-3}, ...] or null on failure.
export async function fetchPrecip(lat, lon) {
  try {
    const res = await fetch(`/api/precip?lat=${lat}&lon=${lon}`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}
