
# Shadydog Weather Station

A Raspberry Pi (and general-purpose) weather display app. React + Vite frontend, Express backend. Works out of the box with no API keys — optional keys unlock enhanced features.

## Requirements

- **Node.js 20 or higher**

Using [nvm](https://github.com/nvm-sh/nvm):
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc   # or restart your shell
nvm install 20
nvm use 20
```

## Quick Start

```bash
git clone <repo-url> shadydog
cd shadydog
npm install
cd client && npm install && cd ..
npm start
```

Open `http://localhost:8080` in a browser. On first launch, open Settings (⚙️) and add a location.

## Production build

```bash
npm run build   # builds client into client/dist
npm run prod    # serves everything from Express on port 8080
```

## Docker

```bash
# Copy and edit settings before first run (optional — UI can configure on first launch)
cp settings.example.json settings.json

docker compose up -d
```

The `settings.json` file is volume-mounted so your config persists across container rebuilds.

To change the port:
```bash
PORT=9090 docker compose up -d
```

## Autostart (systemd — Linux only)

```bash
# Build first
npm run build

# Copy app to /opt
sudo cp -r . /opt/shadydog

# Install and enable the service
sudo cp shadydog.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable shadydog
sudo systemctl start shadydog
```

Check status: `sudo systemctl status shadydog`

Edit `/etc/systemd/system/shadydog.service` to change the port or run as a different user.

## Optional API Keys

All features work without any API keys. The following keys unlock enhanced functionality and can be added via the ⚙️ Settings modal.

| Service | Enhances | Free tier | Where to get |
|---|---|---|---|
| [Tomorrow.io](https://tomorrow.io) | Hyperlocal minutely precipitation (HyperLocal summary + 2-hour chart) | 500 calls/day | tomorrow.io |
| [Mapbox](https://mapbox.com) | Mapbox Dark map style | 50,000 loads/month | mapbox.com |

Keys are stored in `settings.json` on the server and never exposed to the browser.

## Data Sources

| Source | Used for | Key required |
|---|---|---|
| [Open-Meteo](https://open-meteo.com) | Current conditions, hourly & 5-day forecast | No |
| [Tomorrow.io](https://tomorrow.io) | Minutely precipitation (hyperlocal) | Optional |
| [OpenStreetMap](https://www.openstreetmap.org) | Base map tiles | No |
| [RainViewer](https://www.rainviewer.com/api.html) | Radar overlay | No |
| [Iowa State Mesonet](https://mesonet.agron.iastate.edu) | NWS NEXRAD radar | No |
| [NWS Alerts API](https://www.weather.gov/documentation/services-web-api) | Severe weather alerts (US only) | No |
| [Nominatim](https://nominatim.openstreetmap.org) | Reverse geocoding | No |
| [Mapbox](https://mapbox.com) | Dark map style | Optional |

## Settings

Settings are stored in `settings.json` at the project root (or the path set via `SETTINGS_PATH` env var). Configure via the ⚙️ gear icon in the UI.

| Setting | Default | Options |
|---|---|---|
| Theme | `dark` | `dark`, `light` |
| Layout | `map-left` | `map-left`, `weather-left`, `map-top`, `map-overlay` |
| Units | `imperial` | `imperial`, `metric` |
| Port | `8080` | any valid port |

## Refresh Rates

| Data | Interval |
|---|---|
| Radar / minutely precipitation | 5 minutes |
| Current conditions | 15 minutes |
| Severe weather alerts | 15 minutes |
| 24-hour forecast | 1 hour |
| 5-day forecast | 6 hours |
