<img width="1427" height="1111" alt="SDweather" src="https://github.com/user-attachments/assets/94464677-efda-48dd-9850-48ed4dd51d4a" />
# Shadydog Weather Station

A Raspberry Pi (and general-purpose) weather display app. React + Vite frontend, Express backend. No paid APIs — all data is free and keyless.

## Requirements

- **Node.js 18 or higher**

Using [nvm](https://github.com/nvm-sh/nvm):
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc   # or restart your shell
nvm install 18
nvm use 18
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

## Data Sources

| Source | Used for | Key required |
|---|---|---|
| [Open-Meteo](https://open-meteo.com) | Weather data | No |
| [OpenStreetMap](https://www.openstreetmap.org) | Base map tiles | No |
| [RainViewer](https://www.rainviewer.com/api.html) | Radar overlay | No |
| [Iowa State Mesonet](https://mesonet.agron.iastate.edu) | NWS NEXRAD radar | No |
| [NWS Alerts API](https://www.weather.gov/documentation/services-web-api) | Severe weather alerts (US only) | No |
| [Nominatim](https://nominatim.openstreetmap.org) | Reverse geocoding | No |

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
| Current conditions | 5 minutes |
| 24-hour forecast | 5 minutes |
| 5-day forecast | 6 hours |
| Severe weather alerts | 5 minutes |
