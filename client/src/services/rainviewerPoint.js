const MAPS_API  = 'https://api.rainviewer.com/public/weather-maps.json'
const TILE_SIZE = 512
const ZOOM      = 6

// Once CORS is blocked in a session, stop retrying
let corsBlocked = false

function tileAndPixel(lat, lon) {
  const n      = 1 << ZOOM
  const latRad = lat * Math.PI / 180
  const fracX  = (lon + 180) / 360 * n
  const fracY  = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n
  const tileX  = Math.floor(fracX)
  const tileY  = Math.floor(fracY)
  const px     = Math.floor((fracX - tileX) * TILE_SIZE)
  const py     = Math.floor((fracY - tileY) * TILE_SIZE)
  return { tileX, tileY, px, py }
}

function rgbaToIntensity(r, g, b, a) {
  if (a < 10)                              return 0  // transparent → no rain
  if (r > 180 && g < 120)                 return 3  // red/orange → heavy
  if (r > 180 && g > 150 && b < 80)       return 3  // yellow → heavy
  if (g > 150 && r < 150 && b < 100)      return 2  // green → moderate (not cyan)
  if (r > 100 && g > 100 && b < 80)       return 2  // yellow-green → moderate
  return 1                                           // blue/cyan/other → light
}

async function sampleFrame(path, lat, lon) {
  const { tileX, tileY, px, py } = tileAndPixel(lat, lon)
  const url = `https://tilecache.rainviewer.com${path}/${TILE_SIZE}/${ZOOM}/${tileX}/${tileY}/6/1_1.png`

  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width  = TILE_SIZE
        canvas.height = TILE_SIZE
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        const [r, g, b, a] = ctx.getImageData(px, py, 1, 1).data
        resolve(rgbaToIntensity(r, g, b, a))
      } catch (e) {
        if (e instanceof DOMException && e.name === 'SecurityError') corsBlocked = true
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

// Returns [{time (ms), intensity 0-3}, ...] or null if CORS blocked / failed
export async function fetchRainViewerPoint(lat, lon) {
  if (corsBlocked) return null
  try {
    const res  = await fetch(MAPS_API)
    const data = await res.json()

    const past    = data?.radar?.past    || []
    const nowcast = data?.radar?.nowcast || []

    const frames = [
      ...(past.length ? [past[past.length - 1]] : []),
      ...nowcast
    ]
    if (!frames.length) return null

    const results = await Promise.all(
      frames.map(async ({ path, time }) => {
        const intensity = await sampleFrame(path, lat, lon)
        if (intensity === null) return null
        return { time: time * 1000, intensity }
      })
    )

    if (results.some(r => r === null)) return null  // CORS hit mid-batch
    return results
  } catch {
    return null
  }
}
