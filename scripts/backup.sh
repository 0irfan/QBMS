#!/bin/sh
# Backup PostgreSQL to volume. Run from host or a cron container.
# Usage: ./scripts/backup.sh [output_dir]
# Requires: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB (or defaults qbms/qbms/qbms)

set -e
OUT_DIR="${1:-./backups}"
mkdir -p "$OUT_DIR"
FILE="$OUT_DIR/qbms_$(date +%Y%m%d_%H%M%S).sql"
export PGPASSWORD="${POSTGRES_PASSWORD:-qbms}"
pg_dump -h "${POSTGRES_HOST:-localhost}" -U "${POSTGRES_USER:-qbms}" -d "${POSTGRES_DB:-qbms}" -F p -f "$FILE"
echo "Backup written to $FILE"
