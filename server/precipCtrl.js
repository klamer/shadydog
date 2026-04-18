const settingsCtrl = require('./settingsCtrl')

function intensityLevel(mmPerHr) {
  if (mmPerHr < 0.1) return 0   // trace / no rain
  if (mmPerHr < 2.5) return 1   // light
  if (mmPerHr < 7.6) return 2   // moderate
  return 3                       // heavy
}

async function precip(req, res) {
  const { lat, lon } = req.query
  if (!lat || !lon) return res.status(400).json({ error: 'lat and lon required' })

  const settings = settingsCtrl.load()
  const key = settings.tomorrowioKey
  if (!key) return res.status(503).json({ error: 'No Tomorrow.io key configured' })

  try {
    const url = `https://api.tomorrow.io/v4/weather/forecast` +
      `?location=${lat},${lon}&timesteps=1m&fields=precipitationIntensity&units=metric&apikey=${key}`

    const response = await fetch(url)
    if (!response.ok) {
      const text = await response.text()
      return res.status(response.status).json({ error: text })
    }

    const data = await response.json()
    const minutely = data?.timelines?.minutely || []

    const frames = minutely.map(m => ({
      time:      new Date(m.time).getTime(),
      intensity: intensityLevel(m.values?.precipitationIntensity ?? 0)
    }))

    res.json(frames)
  } catch (e) {
    res.status(500).json({ error: 'Fetch failed' })
  }
}

module.exports = { precip }
