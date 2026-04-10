import React, { useState, useEffect, useRef, useMemo } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useApp } from '../../AppContext'

const RAINVIEWER_API = 'https://api.rainviewer.com/public/weather-maps.json'
const NWS_RADAR_URL  = 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png'
const CARTO          = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>'
const MAPBOX_ATTR    = '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

const BASE_STYLES = {
  osm:            { label: 'Standard', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',                    subdomains: 'abc',  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' },
  'carto-dark':   { label: 'Dark',     url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',            subdomains: 'abcd', attribution: CARTO },
  'carto-light':  { label: 'Light',    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',           subdomains: 'abcd', attribution: CARTO },
  'carto-voyager':{ label: 'Voyager',  url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', subdomains: 'abcd', attribution: CARTO },
}

function mapboxStyle(key) {
  return {
    label: 'Mapbox Dark',
    url: `https://api.mapbox.com/styles/v1/mapbox/dark-v10/tiles/256/{z}/{x}/{y}?access_token=${key}`,
    subdomains: 'abc',
    attribution: MAPBOX_ATTR
  }
}

export default function MapPanel() {
  const { activeLocation, settings } = useApp()
  const mapboxKey = settings?.mapboxKey?.trim() || ''

  const containerRef  = useRef(null)
  const mapRef        = useRef(null)
  const baseTileRef   = useRef(null)
  const radarTileRef  = useRef(null)
  const markerRef     = useRef(null)
  const radarTimer    = useRef(null)

  const [radarSource, setRadarSource] = useState('rainviewer')
  const [radarPath,   setRadarPath]   = useState(null)
  const [mapStyle,    setMapStyle]    = useState(() => localStorage.getItem('mapStyle') || 'carto-voyager')

  // Build available styles — Mapbox only shown when key is present
  const styles = useMemo(() => ({
    ...BASE_STYLES,
    ...(mapboxKey ? { 'mapbox-dark': mapboxStyle(mapboxKey) } : {})
  }), [mapboxKey])

  // Resolve current style — fall back to carto-voyager if stored key no longer valid
  const currentStyle = styles[mapStyle] ? mapStyle : 'carto-voyager'

  // Init map once
  useEffect(() => {
    const lat = activeLocation?.lat ?? 39.5
    const lon = activeLocation?.lon ?? -98.35
    const style = styles[currentStyle]

    const map = L.map(containerRef.current, {
      center: [lat, lon],
      zoom: 8,
      minZoom: 3,
      maxZoom: 15,
      zoomControl: true
    })
    mapRef.current = map

    baseTileRef.current = L.tileLayer(style.url, {
      attribution: style.attribution,
      subdomains:  style.subdomains,
      maxZoom: 19
    }).addTo(map)

    // Fix mobile tile seams — debounced invalidateSize on container resize
    let resizeTimer = null
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => map.invalidateSize(), 150)
    })
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      map.remove()
      mapRef.current       = null
      baseTileRef.current  = null
      radarTileRef.current = null
      markerRef.current    = null
    }
  }, []) // eslint-disable-line

  // Recenter and update marker when location changes
  useEffect(() => {
    if (!mapRef.current || !activeLocation) return
    const { lat, lon, label } = activeLocation
    mapRef.current.setView([lat, lon], mapRef.current.getZoom())

    if (markerRef.current) markerRef.current.remove()

    const icon = L.divIcon({
      html: '<span style="font-size:18px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.6))">🤍</span>',
      className: '',
      iconAnchor: [12, 12]
    })
    markerRef.current = L.marker([lat, lon], { icon })
      .bindTooltip(label || 'Home', { permanent: false, direction: 'top' })
      .addTo(mapRef.current)
  }, [activeLocation?.lat, activeLocation?.lon, activeLocation?.label])

  // Swap base tile style
  useEffect(() => {
    if (!baseTileRef.current) return
    const style = styles[currentStyle]
    baseTileRef.current.setUrl(style.url)
    baseTileRef.current.options.subdomains = style.subdomains
  }, [currentStyle, mapboxKey])

  // Manage radar layer
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (radarTileRef.current) {
      map.removeLayer(radarTileRef.current)
      radarTileRef.current = null
    }

    if (radarSource === 'nws') {
      radarTileRef.current = L.tileLayer(NWS_RADAR_URL, {
        opacity: 0.6, zIndex: 10, attribution: '© Iowa State Mesonet / NEXRAD'
      }).addTo(map)
    } else if (radarSource === 'rainviewer' && radarPath) {
      radarTileRef.current = L.tileLayer(
        `https://tilecache.rainviewer.com${radarPath}/512/{z}/{x}/{y}/6/1_1.png`,
        { opacity: 0.5, zIndex: 10, maxNativeZoom: 7, maxZoom: 15, attribution: '© RainViewer' }
      ).addTo(map)
    }
  }, [radarSource, radarPath])

  // Fetch RainViewer path + auto-refresh every 5 minutes
  useEffect(() => {
    if (radarSource !== 'rainviewer') {
      clearInterval(radarTimer.current)
      return
    }

    function fetchRadar() {
      fetch(RAINVIEWER_API)
        .then(r => r.json())
        .then(data => {
          const frames = data?.radar?.past
          if (frames?.length) setRadarPath(frames[frames.length - 1].path)
        })
        .catch(() => {})
    }

    fetchRadar()
    radarTimer.current = setInterval(fetchRadar, 5 * 60 * 1000)

    return () => clearInterval(radarTimer.current)
  }, [radarSource])

  function handleStyleChange(style) {
    setMapStyle(style)
    localStorage.setItem('mapStyle', style)
  }

  return (
    <div className="map-panel">
      <div className="radar-controls">
        <span className="radar-label">Radar:</span>
        {['off', 'rainviewer', 'nws'].map(src => (
          <button
            key={src}
            className={`radar-btn ${radarSource === src ? 'active' : ''}`}
            onClick={() => setRadarSource(src)}
          >
            {src === 'off' ? 'Off' : src === 'rainviewer' ? 'RainViewer' : 'NWS'}
          </button>
        ))}

        <span className="radar-label" style={{ marginLeft: 12 }}>Map:</span>
        {Object.entries(styles).map(([key, s]) => (
          <button
            key={key}
            className={`radar-btn ${currentStyle === key ? 'active' : ''}`}
            onClick={() => handleStyleChange(key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="map-container-wrapper">
        <div ref={containerRef} style={{ height: '100%', width: '100%', background: '#1a1a1a' }} />
      </div>
    </div>
  )
}
