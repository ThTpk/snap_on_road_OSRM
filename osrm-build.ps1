# Build OSRM routing data (MLD pipeline) from osrm-data\thailand-latest.osm.pbf
# Usage: .\osrm-build.ps1                 (car profile)
#        .\osrm-build.ps1 -Profile foot   (car | bicycle | foot)
#        .\osrm-build.ps1 -Download       (re-download the latest extract first)
param(
  [ValidateSet('car', 'bicycle', 'foot')] [string]$Profile = 'car',
  [switch]$Download,
  # extract memory grows with thread count; keep it low for Docker's default 8 GB
  [int]$Threads = 2
)
$ErrorActionPreference = 'Stop'
$image = 'ghcr.io/project-osrm/osrm-backend:latest'
$data = Join-Path $PSScriptRoot 'osrm-data'
$pbf = 'thailand-latest.osm.pbf'

New-Item -ItemType Directory -Force $data | Out-Null
if ($Download -or -not (Test-Path (Join-Path $data $pbf))) {
  Write-Host "Downloading $pbf from Geofabrik..."
  curl.exe -sSLf -o (Join-Path $data $pbf) "https://download.geofabrik.de/asia/$pbf"
}

function Run([string]$img, [string[]]$cmd) {
  # PS 5.1 turns native stderr into terminating errors under 'Stop'; rely on the exit code instead
  $ErrorActionPreference = 'Continue'
  docker run --rm -v "${data}:/data" $img @cmd
  if ($LASTEXITCODE) { throw "failed (exit $LASTEXITCODE, 137 = out of memory): $($cmd -join ' ')" }
}

# Keep only roads + turn restrictions so osrm-extract fits in memory
Write-Host 'Filtering roads with osmium...'
$filter = "apt-get update -qq >/dev/null && apt-get install -y -qq osmium-tool >/dev/null && " +
  "osmium tags-filter /data/$pbf w/highway r/type=restriction -o /data/thailand.osm.pbf --overwrite"
Run 'debian:bookworm-slim' @('bash', '-c', $filter)

Remove-Item (Join-Path $data 'thailand.osrm*') -ErrorAction SilentlyContinue
Run $image @('osrm-extract', '-t', $Threads, '-p', "/opt/$Profile.lua", '/data/thailand.osm.pbf')
Run $image @('osrm-partition', '-t', $Threads, '/data/thailand.osrm')
Run $image @('osrm-customize', '-t', $Threads, '/data/thailand.osrm')
Write-Host 'Done. Start the server with: docker compose up -d'
