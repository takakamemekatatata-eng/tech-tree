#!/usr/bin/env bash
set -euo pipefail

PGHOST=${PGHOST:-localhost}
PGPORT=${PGPORT:-5432}
PG_SUPERUSER=${PG_SUPERUSER:-postgres}
PG_SUPERUSER_PASSWORD=${PG_SUPERUSER_PASSWORD:-}
DB_NAME=${DB_NAME:-techtree}
DB_USER=${DB_USER:-techtree_user}
DB_PASSWORD=${DB_PASSWORD:-password}

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

run_psql_super() {
  if [ -n "${PG_SUPERUSER_PASSWORD}" ]; then
    PGPASSWORD="${PG_SUPERUSER_PASSWORD}" psql -v ON_ERROR_STOP=1 -U "${PG_SUPERUSER}" -h "${PGHOST}" -p "${PGPORT}" "$@"
  else
    psql -v ON_ERROR_STOP=1 -U "${PG_SUPERUSER}" -h "${PGHOST}" -p "${PGPORT}" "$@"
  fi
}

echo "Ensuring role '${DB_USER}' exists..."
ROLE_EXISTS=$(run_psql_super -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}';" || true)
if [ "${ROLE_EXISTS}" != "1" ]; then
  run_psql_super -d postgres -c "CREATE ROLE \"${DB_USER}\" WITH LOGIN PASSWORD '${DB_PASSWORD}';"
fi

echo "Ensuring database '${DB_NAME}' exists..."
DB_EXISTS=$(run_psql_super -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}';" || true)
if [ "${DB_EXISTS}" != "1" ]; then
  run_psql_super -d postgres -c "CREATE DATABASE \"${DB_NAME}\" OWNER \"${DB_USER}\";"
fi

echo "Applying card selection table updates..."
export PGPASSWORD="${DB_PASSWORD}"
psql -v ON_ERROR_STOP=1 -U "${DB_USER}" -h "${PGHOST}" -p "${PGPORT}" -d "${DB_NAME}" -f "${DIR}/update_card_selection_table.sql"

echo "✅ Card selection table update complete."
