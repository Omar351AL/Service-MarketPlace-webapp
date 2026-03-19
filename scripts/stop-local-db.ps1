param(
  [string]$SuperUser = "postgres"
)

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$dataDir = Join-Path (Join-Path $root ".local-postgres") "data"
$binDir = if ($env:POSTGRES_BIN) { $env:POSTGRES_BIN } else { "C:\Program Files\PostgreSQL\17\bin" }
$pgCtl = Join-Path $binDir "pg_ctl.exe"

if (-not (Test-Path $pgCtl)) {
  throw "Missing PostgreSQL tool: $pgCtl. Set POSTGRES_BIN to the PostgreSQL bin directory if needed."
}

if (-not (Test-Path (Join-Path $dataDir "PG_VERSION"))) {
  Write-Host "Local PostgreSQL data directory not found. Nothing to stop."
  exit 0
}

& $pgCtl "--pgdata=$dataDir" "stop" "-m" "fast" | Out-Host
