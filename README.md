# snap_on_road_OSRM

Web tools for turning clicked GPS points into road-following routes with [OSRM](https://project-osrm.org/).

| Page | Description |
|---|---|
| [`index.html`](index.html): **Route Builder** | Click points on the map, then route (`/route`) or map-match (`/match`) them along roads and export the resulting coordinates as CSV. Points can also be imported from a CSV file |
| [`api-test.html`](api-test.html): **OSRM API Tester** | Playground for the `route`, `match`, `nearest`, `table` and `trip` services: edit or import coordinates and query params, view the summary, map overlay and raw JSON, and copy the URL or curl command |

### CSV import format

A header row is optional. With a header, the columns are found by name (`lat`/`latitude` and `lon`/`lng`/`longitude`); without one, column 1 = lat and column 2 = lon. Comma, semicolon and tab delimiters all work, and files exported by the Route Builder can be imported again.

```csv
lat,lon
13.756300,100.501800
13.746600,100.534100
```

Both pages are static HTML (Leaflet + OpenStreetMap tiles), so they can be served directly from **GitHub Pages**.

## Run a local OSRM server (Thailand)

Requires Docker Desktop. **The default 8 GB of WSL memory is not enough for Thailand** (`osrm-extract` crashes the Docker engine). Raise it in `%USERPROFILE%\.wslconfig` first, then run `wsl --shutdown` and restart Docker Desktop:

```ini
[wsl2]
memory=12GB
swap=16GB
```

```powershell
.\osrm-build.ps1          # download thailand-latest.osm.pbf, filter roads, extract/partition/customize (car)
docker compose up -d      # start OSRM on port 5000
```

- Other profiles: `.\osrm-build.ps1 -Profile bicycle` or `-Profile foot`. One server serves one profile, and the profile name in the URL is ignored.
- Update the map data: `.\osrm-build.ps1 -Download`, then `docker compose restart`.
- The self-hosted server allows up to 1000 points per `/match` and `/route` request (public servers allow 100). Use it from the API Tester via **Server → Custom…**.

## Data & licences

- Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) (ODbL), via [Geofabrik](https://download.geofabrik.de/asia/thailand.html)
- The public demo server `router.project-osrm.org` is for light testing only ([usage policy](https://github.com/Project-OSRM/osrm-backend/wiki/Demo-server))
