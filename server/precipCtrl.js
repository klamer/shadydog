const settingsCtrl = require('./settingsCtrl')

function intensityLevel(mmPerHr) {
  if (mmPerHr < 0.1) return 0   // trace / no rain
  if (mmPerHr < 2.5) return 1   // light
  if (mmPerHr < 7.6) return 2   // moderate
  return 3                       // heavy
}

async function fetchPirateWeather(key, lat, lon) {
  const url = `https://api.pirateweather.net/forecast/${key}/${lat},${lon}` +
    `?exclude=currently,hourly,daily,alerts&units=si`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`PirateWeather ${response.status}`)
  const data = await response.json()
  return (data?.minutely?.data || []).map(m => ({
    time:      m.time * 1000,
    intensity: intensityLevel(m.precipIntensity ?? 0)
  }))
}

async function fetchTomorrowio(key, lat, lon) {
  const url = `https://api.tomorrow.io/v4/weather/forecast` +
    `?location=${lat},${lon}&timesteps=1m&fields=precipitationIntensity&units=metric&apikey=${key}`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Tomorrow.io ${response.status}`)
  const data = await response.json()
  return (data?.timelines?.minutely || []).map(m => ({
    time:      new Date(m.time).getTime(),
    intensity: intensityLevel(m.values?.precipitationIntensity ?? 0)
  }))
}

async function precip(req, res) {
  const { lat, lon } = req.query
  if (!lat || !lon) return res.status(400).json({ error: 'lat and lon required' })

  const settings = settingsCtrl.load()
  const pirateKey    = settings.pirateWeatherKey
  const tomorrowKey  = settings.tomorrowioKey

  if (!pirateKey && !tomorrowKey)
    return res.status(503).json({ error: 'No precipitation API key configured' })

  try {
    const frames = pirateKey
      ? await fetchPirateWeather(pirateKey, lat, lon)
      : await fetchTomorrowio(tomorrowKey, lat, lon)
    res.json(frames)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

module.exports = { precip }
