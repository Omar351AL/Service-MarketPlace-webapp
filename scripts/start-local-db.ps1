param(
  [int]$Port = 5433,
  [string]$DbName = "service_marketplace",
  [string]$SuperUser = "postgres"
)

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$postgresRoot = Join-Path $root ".local-postgres"
$dataDir = Join-Path $postgresRoot "data"
$logFile = Join-Path $postgresRoot "postgres.log"
$binDir = if ($env:POSTGRES_BIN) { $env:POSTGRES_BIN } else { "C:\Program Files\PostgreSQL\17\bin" }

$initdb = Join-Path $binDir "initdb.exe"
$pgCtl = Join-Path $binDir "pg_ctl.exe"
$psql = Join-Path $binDir "psql.exe"
$createdb = Join-Path $binDir "createdb.exe"

$requiredTools = @($initdb, $pgCtl, $psql, $createdb)
foreach ($tool in $requiredTools) {
  if (-not (Test-Path $tool)) {
    throw "Missing PostgreSQL tool: $tool. Set POSTGRES_BIN to the PostgreSQL bin directory if needed."
  }
}

New-Item -ItemType Directory -Force -Path $postgresRoot | Out-Null

if (-not (Test-Path (Join-Path $dataDir "PG_VERSION"))) {
  New-Item -ItemType Directory -Force -Path $dataDir | Out-Null
  & $initdb "--username=$SuperUser" "--auth=trust" "--pgdata=$dataDir" | Out-Host

  if ($LASTEXITCODE -ne 0) {
    throw "initdb failed. See output above for details."
  }
}

& $pgCtl "--pgdata=$dataDir" status 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  & $pgCtl "--pgdata=$dataDir" "--log=$logFile" "-w" "start" "-o" "-p $Port" | Out-Host

  if ($LASTEXITCODE -ne 0) {
    throw "pg_ctl start failed. See $logFile for details."
  }
}

$dbExistsRaw = & $psql "-h" "localhost" "-p" "$Port" "-U" "$SuperUser" "-d" "postgres" "-tAc" "SELECT 1 FROM pg_database WHERE datname = '$DbName';"
$dbExists = (($dbExistsRaw | Out-String).Trim())

if ($dbExists -ne "1") {
  & $createdb "-h" "localhost" "-p" "$Port" "-U" "$SuperUser" "$DbName" | Out-Host

  if ($LASTEXITCODE -ne 0) {
    throw "createdb failed for database '$DbName'."
  }
}

Write-Host "Local PostgreSQL is ready on port $Port with database '$DbName'."
