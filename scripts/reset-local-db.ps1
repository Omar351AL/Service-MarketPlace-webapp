& (Join-Path $PSScriptRoot "stop-local-db.ps1")

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$postgresRoot = Join-Path $root ".local-postgres"

if (Test-Path $postgresRoot) {
  Remove-Item -Recurse -Force $postgresRoot
}

Write-Host "Local PostgreSQL data directory reset."
