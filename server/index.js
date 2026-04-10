const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const path = require('path')
const settingsCtrl = require('./settingsCtrl')
const geocodeCtrl = require('./geocodeCtrl')

const app = express()
const PORT = process.env.PORT || settingsCtrl.getPort()

app.use(cors())
app.use(bodyParser.json())

// Settings endpoints
app.get('/api/settings', (req, res) => {
  res.json(settingsCtrl.load())
})

app.put('/api/settings', (req, res) => {
  const updated = settingsCtrl.save(req.body)
  res.json(updated)
})

// Reverse geocoding proxy (Nominatim requires server-side to set User-Agent)
app.get('/api/geocode/reverse', geocodeCtrl.reverse)

// Serve built client in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')))
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'))
  })
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Shadydog running on http://localhost:${PORT}`)
})
