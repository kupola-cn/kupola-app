#!/usr/bin/env bash

set -euo pipefail

DATABASE_NAME="${1:-kupola_app}"
POSTGRES_HOST="${KUPOLA_DATABASE_HOST:-127.0.0.1}"
POSTGRES_PORT="${KUPOLA_DATABASE_PORT:-5432}"
POSTGRES_USER="${KUPOLA_DATABASE_USER:-postgres}"
DATABASE_PASSWORD="${KUPOLA_DATABASE_PASSWORD:-123456}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "$1 was not found. Install PostgreSQL and Go 1.22+ first." >&2
    exit 1
  fi
}

require_command psql
require_command createdb
require_command go

export PGPASSWORD="$DATABASE_PASSWORD"
export KUPOLA_DATABASE_HOST="$POSTGRES_HOST"
export KUPOLA_DATABASE_PORT="$POSTGRES_PORT"
export KUPOLA_DATABASE_USER="$POSTGRES_USER"
export KUPOLA_DATABASE_PASSWORD="$DATABASE_PASSWORD"
export KUPOLA_DATABASE_NAME="$DATABASE_NAME"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$BACKEND_ROOT"

DATABASE_EXISTS="$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$DATABASE_NAME';")"
if [[ "${DATABASE_EXISTS//[[:space:]]/}" != "1" ]]; then
  createdb -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" "$DATABASE_NAME"
fi

go run . migrate
go run . seed

echo "Database '$DATABASE_NAME' is ready. Start the backend with: go run . server"
