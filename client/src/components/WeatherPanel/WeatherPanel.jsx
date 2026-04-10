import React from 'react'
import CurrentConditions from './CurrentConditions'
import AlertsBanner from './AlertsBanner'
import HyperLocal from './HyperLocal'
import Graphs from './Graphs'

export default function WeatherPanel({ hideCharts }) {
  return (
    <div className="weather-panel">
      <AlertsBanner />
      <CurrentConditions />
      <HyperLocal />
      {!hideCharts && <Graphs />}
    </div>
  )
}
