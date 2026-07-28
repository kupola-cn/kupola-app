param(
  [string]$DatabaseName = 'kupola_app',
  [string]$PostgresHost = '127.0.0.1',
  [int]$PostgresPort = 5432,
  [string]$PostgresUser = 'postgres'
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
  throw 'psql was not found. Install PostgreSQL and add its bin directory to PATH.'
}
if (-not (Get-Command createdb -ErrorAction SilentlyContinue)) {
  throw 'createdb was not found. Install PostgreSQL and add its bin directory to PATH.'
}
if (-not (Get-Command go -ErrorAction SilentlyContinue)) {
  throw 'go was not found. Install Go 1.22 or newer.'
}

$password = $env:KUPOLA_DATABASE_PASSWORD
if ([string]::IsNullOrWhiteSpace($password)) {
  $password = '123456'
}
$env:PGPASSWORD = $password
$env:KUPOLA_DATABASE_HOST = $PostgresHost
$env:KUPOLA_DATABASE_PORT = [string]$PostgresPort
$env:KUPOLA_DATABASE_USER = $PostgresUser
$env:KUPOLA_DATABASE_PASSWORD = $password
$env:KUPOLA_DATABASE_NAME = $DatabaseName

$backendRoot = Split-Path -Parent $PSScriptRoot
Push-Location $backendRoot
try {
  $exists = [string](& psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$DatabaseName';")
  if ($LASTEXITCODE -ne 0) {
    throw 'Could not connect to PostgreSQL. Check the host, port, user, and password.'
  }

  if ([string]::IsNullOrWhiteSpace($exists) -or $exists.Trim() -ne '1') {
    & createdb -h $PostgresHost -p $PostgresPort -U $PostgresUser $DatabaseName
    if ($LASTEXITCODE -ne 0) {
      throw "Could not create database '$DatabaseName'."
    }
  }

  & go run . migrate
  if ($LASTEXITCODE -ne 0) {
    throw 'Database migration failed.'
  }
  & go run . seed
  if ($LASTEXITCODE -ne 0) {
    throw 'Database seed failed.'
  }
} finally {
  Pop-Location
}

Write-Host "Database '$DatabaseName' is ready. Start the backend with: go run . server"
