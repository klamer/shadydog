const BASE = 'https://api.open-meteo.com/v1/forecast'

export async function fetchWeather(lat, lon, units = 'imperial') {
  const tempUnit = units === 'imperial' ? 'fahrenheit' : 'celsius'
  const windUnit = units === 'imperial' ? 'mph' : 'kmh'
  const precipUnit = units === 'imperial' ? 'inch' : 'mm'

  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'wind_speed_10m',
      'wind_direction_10m',
      'weather_code',
      'uv_index',
      'precipitation',
      'cloud_cover',
      'is_day'
    ].join(','),
    hourly: [
      'temperature_2m',
      'precipitation_probability',
      'weather_code'
    ].join(','),
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'precipitation_probability_max',
      'weather_code',
      'sunrise',
      'sunset'
    ].join(','),
    temperature_unit: tempUnit,
    wind_speed_unit: windUnit,
    precipitation_unit: precipUnit,
    minutely_15: 'precipitation,weather_code',
    timezone: 'auto',
    forecast_days: 6,
    forecast_hours: 24,
    forecast_minutely_days: 1
  })

  const res = await fetch(`${BASE}?${params}`)
  if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`)
  return res.json()
}
