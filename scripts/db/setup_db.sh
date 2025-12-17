#!/usr/bin/env bash
set -euo pipefail

PGHOST=${PGHOST:-localhost}
PGPORT=${PGPORT:-5432}
PG_SUPERUSER=${PG_SUPERUSER:-postgres}
PG_SUPERUSER_PASSWORD=${PG_SUPERUSER_PASSWORD:-}
DB_NAME=${DB_NAME:-techtree}
DB_USER=${DB_USER:-techtree_user}
DB_PASSWORD=${DB_PASSWORD:-password}
SEED=${SEED:-1}

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

run_psql_super() {
  if [ -n "${PG_SUPERUSER_PASSWORD}" ]; then
    PGPASSWORD="${PG_SUPERUSER_PASSWORD}" psql -v ON_ERROR_STOP=1 -U "${PG_SUPERUSER}" -h "${PGHOST}" -p "${PGPORT}" "$@"
  else
    psql -v ON_ERROR_STOP=1 -U "${PG_SUPERUSER}" -h "${PGHOST}" -p "${PGPORT}" "$@"
  fi
}

echo "⚠️ Dropping database if exists: ${DB_NAME}"
run_psql_super -d postgres -c "DROP DATABASE IF EXISTS \"${DB_NAME}\";"

echo "Ensuring role '${DB_USER}' exists..."
ROLE_EXISTS=$(run_psql_super -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}';" || true)
if [ "${ROLE_EXISTS}" != "1" ]; then
  run_psql_super -d postgres -c "CREATE ROLE \"${DB_USER}\" WITH LOGIN PASSWORD '${DB_PASSWORD}';"
fi

echo "Creating database '${DB_NAME}'..."
run_psql_super -d postgres -c "CREATE DATABASE \"${DB_NAME}\" OWNER \"${DB_USER}\";"

echo "Applying schema and tables..."
export PGPASSWORD="${DB_PASSWORD}"
psql -U "${DB_USER}" -h "${PGHOST}" -p "${PGPORT}" -d "${DB_NAME}" -f "${DIR}/create_schema_and_tables.sql"

if [ "${SEED}" -ne 0 ]; then
  echo "Applying seed data..."
  psql -U "${DB_USER}" -h "${PGHOST}" -p "${PGPORT}" -d "${DB_NAME}" -f "${DIR}/seed_test_data.sql"
fi

echo "✅ Database fully reset and initialized."

