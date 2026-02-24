# Comicster

Application web dédiée aux lecteurs de comics : suivi de lectures, avis/notes, listes personnalisées, recommandations et fonctionnalités sociales.

## Objectifs
- Suivre ses lectures (journal)
- Centraliser notes/avis/historiques
- Découvrir des recommandations
- Favoriser les échanges communautaires
- Administrer le contenu via un dashboard

## Stack
- Frontend : Nuxt 3 + TailwindCSS
- Backend : Node.js (Express ou Fastify)
- Base de données : PostgreSQL (SQL)
- Auth : OAuth2 (Google/GitHub) + 2FA TOTP
- DevOps : Docker / Docker Compose, VPS Linux
- CI/CD : GitHub Actions (tests + déploiement)
- Tests : unitaires, intégration, E2E

## Liens
- Board projet : (à renseigner)
- Repo : (à renseigner)
- URL production : (à renseigner)
- Documentation : `/docs`

---

## Prérequis
- Git
- Docker + Docker Compose (recommandé)

---

## Installation & lancement (recommandé : Docker)

### 1) Copier les variables d’environnement
```bash
cp .env.example .env