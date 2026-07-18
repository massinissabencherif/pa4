#!/usr/bin/env bash
# Comicster — démarrage local en une commande.
# Depuis un clone frais : ./start.sh → app complète + données de démo, zéro étape manuelle.
#   ./start.sh          démarre (build + migrations + seeds)
#   ./start.sh down     arrête (conserve les données)
#   ./start.sh reset    supprime la base et redémarre de zéro
#   ./start.sh logs     suit les logs
set -euo pipefail

cd "$(dirname "$0")"

COMPOSE="docker compose -f docker-compose.local.yml"
FRONT_PORT="${FRONT_PORT:-3000}"
BACK_PORT="${BACK_PORT:-3001}"
CMD="${1:-up}"

require_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "❌ Docker n'est pas installé. Installe Docker Desktop / Docker Engine puis relance."
    exit 1
  fi
  if ! docker compose version >/dev/null 2>&1; then
    echo "❌ 'docker compose' (v2) est requis. Mets Docker à jour puis relance."
    exit 1
  fi
}

start() {
  require_docker
  echo "🦸  Démarrage de Comicster (build + migrations Prisma automatiques)…"
  $COMPOSE up -d --build --wait
  echo "🌱  Chargement des données de démo…"
  $COMPOSE exec -T backend node prisma/seed-guides.js  || echo "   (seed-guides ignoré)"
  $COMPOSE exec -T backend node prisma/seed-demo.js    || echo "   (seed-demo ignoré)"
  $COMPOSE exec -T backend node prisma/seed-demo-2.js  || echo "   (seed-demo-2 ignoré)"
  cat <<EOF

✅  Comicster tourne !
    Front  →  http://localhost:${FRONT_PORT}
    API    →  http://localhost:${BACK_PORT}/health
    Comptes démo : n'importe quel utilisateur de la liste, mot de passe  demo2026!
    (OAuth Google/GitHub inactif en local — connexion par email / mot de passe)

    Arrêter         →  ./start.sh down
    Repartir à zéro →  ./start.sh reset
EOF
}

case "$CMD" in
  up|"")   start ;;
  down)    require_docker; $COMPOSE down ;;
  reset)   require_docker; $COMPOSE down -v; start ;;
  logs)    require_docker; $COMPOSE logs -f ;;
  *)       echo "Usage: ./start.sh [up|down|reset|logs]"; exit 1 ;;
esac
