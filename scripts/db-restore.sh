#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="${CONTAINER_NAME:-superapp-postgres}"
DATABASE_NAME="${DATABASE_NAME:-superapp}"
DATABASE_USER="${DATABASE_USER:-superapp}"
DATABASE_PASSWORD="${DATABASE_PASSWORD:-superapp}"

if [ "${#}" -lt 1 ]; then
  echo "Usage: bash scripts/db-restore.sh backups/<file>.sql" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
INPUT_FILE="${1}"

if [[ "${INPUT_FILE}" != /* ]]; then
  INPUT_FILE="${REPO_ROOT}/${INPUT_FILE}"
fi

if [ ! -f "${INPUT_FILE}" ]; then
  echo "Backup file '${INPUT_FILE}' does not exist." >&2
  exit 1
fi

CONTAINER_STATUS="$(docker inspect -f '{{.State.Status}}' "${CONTAINER_NAME}" 2>/dev/null || true)"
if [ -z "${CONTAINER_STATUS}" ]; then
  echo "Docker container '${CONTAINER_NAME}' was not found. Start it with 'docker compose up -d postgres'." >&2
  exit 1
fi

if [ "${CONTAINER_STATUS}" != "running" ]; then
  echo "Docker container '${CONTAINER_NAME}' is not running. Start it with 'docker compose up -d postgres'." >&2
  exit 1
fi

docker exec -i -e PGPASSWORD="${DATABASE_PASSWORD}" "${CONTAINER_NAME}" psql \
  --username="${DATABASE_USER}" \
  --dbname="${DATABASE_NAME}" \
  --set=ON_ERROR_STOP=1 < "${INPUT_FILE}"

echo "Restore completed from ${INPUT_FILE}"
