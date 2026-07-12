#!/usr/bin/env bash
set -euo pipefail

# Backup quotidien d'une base Postgres (pg_dump compressé) avec rotation
# des 7 dernières archives. Un backup par environnement, stockage local
# uniquement (aucune copie externe).
#
# Usage : bash scripts/backup-db.sh <prod|staging|sandbox>
# Cron  : appelé une fois par jour, un créneau différent par environnement.

ENV="${1:-}"
KEEP=7
BACKUP_ROOT="/home/ubuntu/pa4/backups"

case "$ENV" in
  prod)
    CONTAINER="pa4-postgres-1"
    DB="comicster"
    ;;
  staging)
    CONTAINER="pa4-staging-postgres-staging-1"
    DB="comicster_staging"
    ;;
  sandbox)
    CONTAINER="pa4-postgres-sandbox-1"
    DB="comicster_sandbox"
    ;;
  *)
    echo "Usage: $0 <prod|staging|sandbox>" >&2
    exit 1
    ;;
esac

OUT_DIR="$BACKUP_ROOT/$ENV"
LOG_FILE="$BACKUP_ROOT/backup.log"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
DUMP_FILE="$OUT_DIR/comicster_${ENV}_${TIMESTAMP}.sql.gz"

mkdir -p "$OUT_DIR"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$ENV] $1" >> "$LOG_FILE"
}

if ! docker exec "$CONTAINER" pg_dump -U comicster -d "$DB" --no-owner --no-acl 2>>"$LOG_FILE" | gzip > "$DUMP_FILE"; then
  log "ÉCHEC du dump"
  rm -f "$DUMP_FILE"
  exit 1
fi

if ! gzip -t "$DUMP_FILE" 2>>"$LOG_FILE"; then
  log "ÉCHEC : archive corrompue ($DUMP_FILE)"
  rm -f "$DUMP_FILE"
  exit 1
fi

SIZE="$(du -sh "$DUMP_FILE" | cut -f1)"
log "OK - $DUMP_FILE ($SIZE)"

# Rotation : ne garde que les $KEEP dumps les plus récents
ls -1t "$OUT_DIR"/comicster_${ENV}_*.sql.gz 2>/dev/null | tail -n +$((KEEP + 1)) | while read -r old; do
  rm -f "$old"
  log "Rotation : suppression de $old"
done
