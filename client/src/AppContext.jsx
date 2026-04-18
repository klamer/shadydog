import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { getSettings, saveSettings } from './services/api'
import { fetchWeather } from './services/weather'
import { fetchAlerts } from './services/alerts'
import { fetchPrecip } from './services/precip'

const REFRESH_RADAR   =  5 * 60 * 1000       // 5 minutes  — RainViewer radar
const REFRESH_CURRENT = 15 * 60 * 1000       // 15 minutes — current conditions
const REFRESH_HOURLY  = 60 * 60 * 1000       // 1 hour     — 24hr graph
const REFRESH_ALERTS  = 15 * 60 * 1000       // 15 minutes — NWS alerts
const REFRESH_DAILY   =  6 * 60 * 60 * 1000  // 6 hours    — 5-day forecast

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [settings, setSettings]   = useState(null)
  const [weather, setWeather]     = useState(null)
  const [alerts, setAlerts]       = useState([])
  const [precip, setPrecip] = useState(null)
  const [loadingWeather, setLoadingWeather] = useState(false)
  const [error, setError]         = useState(null)

  const currentRef = useRef(null)
  const hourlyRef  = useRef(null)
  const dailyRef   = useRef(null)
  const alertsRef  = useRef(null)
  const rvRef      = useRef(null)

  // Active location derived from settings
  const activeLocation = settings?.locations?.find(l => l.id === settings.activeLocationId)
    || settings?.locations?.[0]
    || null

  // Load settings once
  useEffect(() => {
    getSettings().then(s => setSettings(s)).catch(() => setSettings({}))
  }, [])

  const loadWeather = useCallback(async (location, currentWeather) => {
    if (!location) return
    setLoadingWeather(true)
    setError(null)
    try {
      const data = await fetchWeather(location.lat, location.lon, settings?.units)
      setWeather(prev => ({
        ...prev,
        current:   data.current,
        hourly:    data.hourly,
        daily:     currentWeather?.daily || data.daily,
        dailyFull: data.daily
      }))
    } catch (e) {
      setError('Weather fetch failed')
    } finally {
      setLoadingWeather(false)
    }
  }, [settings?.units])

  const loadCurrent = useCallback(async (location) => {
    if (!location) return
    try {
      const data = await fetchWeather(location.lat, location.lon, settings?.units, { currentOnly: true })
      setWeather(prev => ({ ...prev, current: data.current }))
    } catch { /* silent */ }
  }, [settings?.units])

  const loadDaily = useCallback(async (location) => {
    if (!location) return
    try {
      const data = await fetchWeather(location.lat, location.lon, settings?.units)
      setWeather(prev => ({ ...prev, daily: data.daily }))
    } catch { /* silent */ }
  }, [settings?.units])

  const loadAlerts = useCallback(async (location) => {
    if (!location) return
    const data = await fetchAlerts(location.lat, location.lon)
    setAlerts(data)
  }, [])

  const loadPrecip = useCallback(async (location) => {
    if (!location) return
    const data = await fetchPrecip(location.lat, location.lon)
    setPrecip(data ?? [])  // null on failure → empty array → components fall back to hourly
  }, [])

  // Kick off fetches when active location is known
  useEffect(() => {
    if (!activeLocation) return

    loadWeather(activeLocation, null)
    loadAlerts(activeLocation)
    loadDaily(activeLocation)
    loadPrecip(activeLocation)

    // Clear old timers
    clearInterval(currentRef.current)
    clearInterval(hourlyRef.current)
    clearInterval(dailyRef.current)
    clearInterval(alertsRef.current)
    clearInterval(rvRef.current)

    currentRef.current = setInterval(() => loadCurrent(activeLocation), REFRESH_CURRENT)
    hourlyRef.current  = setInterval(() => loadWeather(activeLocation, weather), REFRESH_HOURLY)
    alertsRef.current  = setInterval(() => loadAlerts(activeLocation), REFRESH_ALERTS)
    dailyRef.current   = setInterval(() => loadDaily(activeLocation), REFRESH_DAILY)
    rvRef.current      = setInterval(() => loadPrecip(activeLocation), REFRESH_RADAR)

    return () => {
      clearInterval(currentRef.current)
      clearInterval(hourlyRef.current)
      clearInterval(dailyRef.current)
      clearInterval(alertsRef.current)
      clearInterval(rvRef.current)
    }
  }, [activeLocation?.id, settings?.units]) // eslint-disable-line

  async function updateSettings(patch) {
    const updated = await saveSettings({ ...settings, ...patch })
    setSettings(updated)
    return updated
  }

  return (
    <AppContext.Provider value={{
      settings,
      activeLocation,
      weather,
      alerts,
      precip,
      loadingWeather,
      error,
      updateSettings
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
