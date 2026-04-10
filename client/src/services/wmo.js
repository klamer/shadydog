export const WMO = {
  0:  { desc: 'Clear Sky',               icon: '☀️' },
  1:  { desc: 'Mainly Clear',            icon: '🌤️' },
  2:  { desc: 'Partly Cloudy',           icon: '⛅' },
  3:  { desc: 'Overcast',               icon: '☁️' },
  45: { desc: 'Foggy',                  icon: '🌫️' },
  48: { desc: 'Icy Fog',                icon: '🌫️' },
  51: { desc: 'Light Drizzle',          icon: '🌦️' },
  53: { desc: 'Drizzle',               icon: '🌦️' },
  55: { desc: 'Heavy Drizzle',          icon: '🌧️' },
  61: { desc: 'Light Rain',             icon: '🌧️' },
  63: { desc: 'Rain',                  icon: '🌧️' },
  65: { desc: 'Heavy Rain',             icon: '🌧️' },
  71: { desc: 'Light Snow',             icon: '🌨️' },
  73: { desc: 'Snow',                  icon: '❄️' },
  75: { desc: 'Heavy Snow',             icon: '❄️' },
  77: { desc: 'Snow Grains',            icon: '🌨️' },
  80: { desc: 'Light Showers',          icon: '🌦️' },
  81: { desc: 'Showers',               icon: '🌧️' },
  82: { desc: 'Heavy Showers',          icon: '⛈️' },
  85: { desc: 'Snow Showers',           icon: '🌨️' },
  86: { desc: 'Heavy Snow Showers',     icon: '❄️' },
  95: { desc: 'Thunderstorm',           icon: '⛈️' },
  96: { desc: 'Thunderstorm w/ Hail',   icon: '⛈️' },
  99: { desc: 'Severe Thunderstorm',    icon: '⛈️' },
}

export function getWmo(code) {
  return WMO[code] || { desc: 'Unknown', icon: '🌡️' }
}

const WIND_DIRS = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']

export function windDirection(degrees) {
  const idx = Math.round(degrees / 22.5) % 16
  return WIND_DIRS[idx]
}
