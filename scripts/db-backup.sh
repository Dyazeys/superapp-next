#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="${CONTAINER_NAME:-superapp-postgres}"
DATABASE_NAME="${DATABASE_NAME:-superapp}"
DATABASE_USER="${DATABASE_USER:-superapp}"
DATABASE_PASSWORD="${DATABASE_PASSWORD:-superapp}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKUP_DIR="${REPO_ROOT}/backups"
mkdir -p "${BACKUP_DIR}"

OUTPUT_FILE="${1:-}"
if [ -z "${OUTPUT_FILE}" ]; then
  TIMESTAMP="$(date +"%Y%m%d-%H%M%S")"
  OUTPUT_FILE="${BACKUP_DIR}/superapp-${TIMESTAMP}.sql"
elif [[ "${OUTPUT_FILE}" != /* ]]; then
  OUTPUT_FILE="${REPO_ROOT}/${OUTPUT_FILE}"
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

docker exec -e PGPASSWORD="${DATABASE_PASSWORD}" "${CONTAINER_NAME}" pg_dump \
  --username="${DATABASE_USER}" \
  --dbname="${DATABASE_NAME}" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges > "${OUTPUT_FILE}"

echo "Backup created at ${OUTPUT_FILE}"
