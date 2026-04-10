import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { getSettings, saveSettings } from './services/api'
import { fetchWeather } from './services/weather'
import { fetchAlerts } from './services/alerts'

const REFRESH_SHORT = 5 * 60 * 1000   // 5 minutes — current + 24hr
const REFRESH_LONG  = 6 * 60 * 60 * 1000  // 6 hours — 5-day

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [settings, setSettings]   = useState(null)
  const [weather, setWeather]     = useState(null)
  const [alerts, setAlerts]       = useState([])
  const [loadingWeather, setLoadingWeather] = useState(false)
  const [error, setError]         = useState(null)

  const dailyRef   = useRef(null)
  const shortRef   = useRef(null)
  const alertsRef  = useRef(null)

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
        current:     data.current,
        hourly:      data.hourly,
        minutely_15: data.minutely_15,
        // Only replace daily if we don't have it yet or on long refresh
        daily:       currentWeather?.daily || data.daily,
        dailyFull:   data.daily
      }))
    } catch (e) {
      setError('Weather fetch failed')
    } finally {
      setLoadingWeather(false)
    }
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

  // Kick off fetches when active location is known
  useEffect(() => {
    if (!activeLocation) return

    loadWeather(activeLocation, null)
    loadAlerts(activeLocation)
    loadDaily(activeLocation)

    // Clear old timers
    clearInterval(shortRef.current)
    clearInterval(dailyRef.current)
    clearInterval(alertsRef.current)

    shortRef.current  = setInterval(() => loadWeather(activeLocation, weather), REFRESH_SHORT)
    alertsRef.current = setInterval(() => loadAlerts(activeLocation), REFRESH_SHORT)
    dailyRef.current  = setInterval(() => loadDaily(activeLocation), REFRESH_LONG)

    return () => {
      clearInterval(shortRef.current)
      clearInterval(dailyRef.current)
      clearInterval(alertsRef.current)
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
      loadingWeather,
      error,
      updateSettings
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
