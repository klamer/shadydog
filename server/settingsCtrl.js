const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')

const SETTINGS_PATH = process.env.SETTINGS_PATH || path.join(__dirname, '../settings.json')

const DEFAULTS = {
  port: 8080,
  theme: 'dark',
  layout: 'map-left',
  units: 'imperial',
  locations: [],
  activeLocationId: null
}

function load() {
  if (!fs.existsSync(SETTINGS_PATH)) {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(DEFAULTS, null, 2))
    return { ...DEFAULTS }
  }
  try {
    const raw = fs.readFileSync(SETTINGS_PATH, 'utf8')
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULTS }
  }
}

function save(data) {
  const current = load()
  const merged = { ...current, ...data }
  // Ensure all locations have IDs
  if (merged.locations) {
    merged.locations = merged.locations.map(loc => ({
      ...loc,
      id: loc.id || uuidv4()
    }))
  }
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(merged, null, 2))
  return merged
}

function getPort() {
  const s = load()
  return s.port || 8080
}

module.exports = { load, save, getPort }
