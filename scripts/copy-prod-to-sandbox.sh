#!/usr/bin/env bash
set -euo pipefail

# Copie la DB prod → sandbox et les uploads prod → sandbox
# Usage: bash scripts/copy-prod-to-sandbox.sh

PROD_CONTAINER="pa4-postgres-1"
SANDBOX_CONTAINER="pa4-postgres-sandbox-1"
DUMP_FILE="/tmp/comicster_prod_dump.sql"

echo "==> Dump de la DB prod..."
docker exec "$PROD_CONTAINER" pg_dump -U comicster -d comicster --no-owner --no-acl > "$DUMP_FILE"
echo "    Dump OK ($(du -sh $DUMP_FILE | cut -f1))"

echo "==> Restore dans la DB sandbox..."
# Vide la DB sandbox et réimporte
docker exec -i "$SANDBOX_CONTAINER" psql -U comicster -d comicster_sandbox -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" 2>/dev/null || true
docker exec -i "$SANDBOX_CONTAINER" psql -U comicster -d comicster_sandbox < "$DUMP_FILE"
echo "    Restore OK"

echo "==> Copie des uploads prod → sandbox..."
PROD_UPLOADS=$(docker volume inspect pa4_uploads_data --format '{{ .Mountpoint }}')
SANDBOX_UPLOADS=$(docker volume inspect pa4_uploads_sandbox --format '{{ .Mountpoint }}')
sudo cp -r "$PROD_UPLOADS"/. "$SANDBOX_UPLOADS"/
echo "    Uploads OK"

rm -f "$DUMP_FILE"
echo ""
echo "✓ Sandbox prêt avec les données de prod."
