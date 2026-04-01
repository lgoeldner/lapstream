#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TEST_DB_INSTANCE="lapstream_db_test_tmp"
TEST_DB_URL="postgres://postgres:postgres@127.0.0.1:5433/lapstream_test"

cleanup() {
  docker rm -f "$TEST_DB_INSTANCE" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "[integration] starting ephemeral postgres test container"
docker rm -f "$TEST_DB_INSTANCE" >/dev/null 2>&1 || true
docker run --name "$TEST_DB_INSTANCE" \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=postgres \
  -p 5433:5432 \
  --tmpfs /var/lib/postgresql \
  -d postgres:18-alpine >/dev/null

echo "[integration] waiting for postgres readiness"
for i in {1..30}; do
  if docker exec "$TEST_DB_INSTANCE" pg_isready -U postgres -d postgres >/dev/null 2>&1; then
    break
  fi

  if [[ "$i" -eq 30 ]]; then
    echo "[integration] postgres did not become ready in time" >&2
    exit 1
  fi

  sleep 1
done

echo "[integration] recreating lapstream_test database"
docker exec "$TEST_DB_INSTANCE" psql -U postgres -d postgres \
  -c "DROP DATABASE IF EXISTS lapstream_test;" \
  -c "CREATE DATABASE lapstream_test;"

echo "[integration] applying migrations"
if [[ -f "$ROOT_DIR/drizzle/meta/_journal.json" ]]; then
  NODE_ENV=test \
  DATABASE_URL="$TEST_DB_URL" \
  CONFIG_PATH=../serverconfig.dev.json \
  ADMIN_API_TOKEN=test-admin \
  JWT_SECRET=c3VwZXItc2VjcmV0LWtleS1mb3ItdGVzdHM= \
  REFRESH_TOKEN_PEPPER=cmVmcmVzaC10b2tlbi1wZXBwZXI= \
  npm run drizzle:migrate
else
  echo "[integration] no migration journal found, using drizzle push for bootstrap"
  NODE_ENV=test \
  DATABASE_URL="$TEST_DB_URL" \
  CONFIG_PATH=../serverconfig.dev.json \
  ADMIN_API_TOKEN=test-admin \
  JWT_SECRET=c3VwZXItc2VjcmV0LWtleS1mb3ItdGVzdHM= \
  REFRESH_TOKEN_PEPPER=cmVmcmVzaC10b2tlbi1wZXBwZXI= \
  npm run drizzle:push
fi

echo "[integration] running integration tests"
NODE_ENV=test \
DATABASE_URL="$TEST_DB_URL" \
CONFIG_PATH=../serverconfig.dev.json \
ADMIN_API_TOKEN=test-admin \
JWT_SECRET=c3VwZXItc2VjcmV0LWtleS1mb3ItdGVzdHM= \
REFRESH_TOKEN_PEPPER=cmVmcmVzaC10b2tlbi1wZXBwZXI= \
node --import tsx --test "src/integration/**/*.test.ts"

echo "[integration] done"
