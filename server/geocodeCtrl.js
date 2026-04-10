async function reverse(req, res) {
  const { lat, lon } = req.query
  if (!lat || !lon) return res.status(400).json({ error: 'lat and lon required' })

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Shadydog/1.0 (pi-weather-station)' }
    })
    if (!response.ok) throw new Error(`Nominatim returned ${response.status}`)
    const data = await response.json()
    const { address, display_name } = data
    const label =
      address.city ||
      address.town ||
      address.village ||
      address.county ||
      display_name ||
      `${lat}, ${lon}`
    const region = address.state || address.country || ''
    res.json({ label, region, display_name })
  } catch (err) {
    res.status(500).json({ error: 'Geocode failed', detail: err.message })
  }
}

module.exports = { reverse }
