# Comicster

Plateforme web communautaire dédiée aux lecteurs de comics : suivi de lectures, avis et notes, listes personnalisées, parcours de lecture guidés et fonctionnalités sociales.

Projet réalisé dans le cadre du **Projet Annuel ESGI 2026** (PA4).

> URLs : [Production](https://sitedetestdemassinissabencherif.com) · [Staging/Dev](https://dev.sitedetestdemassinissabencherif.com) · [Sandbox](https://sandbox.sitedetestdemassinissabencherif.com)

---

## Équipe

| Pseudo GitHub | Nom | Prénom |
|---------------|-----|--------|
| [massinissabencherif](https://github.com/massinissabencherif) | Bencherif | Massinissa |
| [Kiikx](https://github.com/Kiikx) | Gonçalves | Killian |
| [Daruiii](https://github.com/Daruiii) | Meguira | David |
| [lukaab](https://github.com/lukaab) | Boudjelal | Luka |

---

## Table des matières

1. [Stack technique](#stack-technique)
2. [Architecture](#architecture)
3. [Fonctionnalités](#fonctionnalités)
4. [Modèle de données](#modèle-de-données)
5. [API — Routes disponibles](#api--routes-disponibles)
6. [Sécurité](#sécurité)
7. [Authentification](#authentification)
8. [Environnements](#environnements)
9. [CI/CD](#cicd)
10. [Installation locale](#installation-locale)
11. [Variables d'environnement](#variables-denvironnement)
12. [Workflow de développement](#workflow-de-développement)

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Nuxt 4 (Vue 3, SSR) |
| Backend | Express 5 (Node.js, ESM) |
| Base de données | PostgreSQL 16 |
| ORM | Prisma |
| Auth | JWT (access 15min) + Refresh tokens (30j) + 2FA TOTP + OAuth2 |
| Style | CSS brutalist custom |
| Containerisation | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Tests E2E | Playwright |
| Tests backend | Vitest |

---

## Architecture

```
pa4/
├── frontend/          # Nuxt 4 — port 3000
│   └── app/
│       ├── pages/     # Routes de l'application
│       ├── components/
│       ├── layouts/
│       └── composables/
├── backend/           # Express 5 — port 3001
│   ├── src/
│   │   ├── routes/    # Un fichier par domaine métier
│   │   ├── middleware/ # auth, requireAdmin, requireSuperAdmin
│   │   └── lib/       # prisma, badges, slug, crypto
│   └── prisma/
│       ├── schema.prisma
│       ├── migrations/
│       ├── seed-guides.js   # 9 parcours de lecture
│       ├── seed-demo.js     # ~15 utilisateurs demo
│       └── seed-demo-2.js   # reviews, listes, badges demo
├── e2e/               # Tests Playwright
├── .github/workflows/ # CI + Deploy
├── docker-compose.yml           # Production
├── docker-compose.staging.yml   # Staging (dev)
└── docker-compose.sandbox.yml   # Sandbox
```

La communication frontend ↔ backend se fait exclusivement via API REST JSON. Le frontend ne touche pas directement la base de données.

---

## Fonctionnalités

### Authentification & Profil
- **Inscription / Connexion** par email + mot de passe (bcrypt, min 8 chars)
- **OAuth2** Google et GitHub — callback sécurisé via code OAuthCode éphémère (2min), session Express uniquement pour ce flux
- **2FA TOTP** — activation optionnelle, secret chiffré en base (AES-256), compatible Google Authenticator / Authy
- **JWT stateless** — access token 15min, refresh token 30j en base (hashé SHA-256), rotation à chaque refresh
- **Rôles** : USER, ADMIN, SUPER_ADMIN
- **Profil public** — page `/profile/:username` avec avis, badges, statistiques de lecture
- **Follow / Unfollow** — système d'abonnement entre utilisateurs
- **Paramètres** — changement de mot de passe, activation 2FA (`/settings/security`)

### Journal de lecture
- Ajouter un comic à sa liste (statuts : TO_READ, IN_PROGRESS, FINISHED)
- Suivre sa progression (page courante / total pages)
- Historique des lectures avec dates de début et fin
- Détection automatique de la fin (finishedAt enregistré au passage FINISHED)
- Attribution automatique de badges lors du passage à FINISHED

### Recherche & Découverte
- **Recherche de comics** via Marvel API ou catalogue interne (`/comics/search`)
- Filtres par genre, auteur, éditeur
- Page de détail d'un comic avec couverture, description, auteurs, genres
- **Lecture intégrée** — PDF viewer dans l'interface pour les comics uploadés
- **Tendances** — comics les plus consultés (`/comics/trending`)
- **Nouveautés** — derniers comics ajoutés (`/comics/latest`)

### Avis & Notes
- Note de 1 à 5 étoiles par comic (une seule review par user/comic)
- Contenu textuel optionnel (max 5 000 caractères)
- Like / Unlike sur les avis
- Commentaires sur les avis (max 1 000 caractères)
- Like / Unlike sur les commentaires
- Feed des avis récents des personnes suivies

### Listes personnalisées
- Créer des listes thématiques (ex : "Top Batman", "À lire cet été")
- Chaque liste a un nom, une description optionnelle et un slug unique
- Visibilité publique ou privée (toggle)
- Ajout / suppression de comics dans une liste
- **Discover** — page de découverte des listes publiques (`/lists/public`)

### Parcours de lecture (Guides)
- 9 parcours curatés : Batman, Spider-Man, Wolverine, Superman, Daredevil, Invincible, X-Men, Watchmen, Comics Indépendants
- Chaque parcours contient : présentation du personnage, ordre de lecture recommandé avec notes, parcours liés
- **Forum par parcours** — topics de discussion avec réponses imbriquées (thread)
- Support GIFs dans les réponses (Giphy API ou URL manuelle)
- Suppression de ses propres topics et réponses
- Administration des parcours via dashboard admin (CRUD complet)

### Badges
10 badges débloqués automatiquement selon les actions :

| Badge | Condition |
|-------|-----------|
| Premier pas | Finir son 1er comic |
| Rat de bibliothèque | Finir 5 comics |
| Bibliothécaire | Finir 20 comics |
| Critique en herbe | Poster son 1er avis |
| Grand critique | Poster 10 avis |
| Connecté | Suivre 5 personnes |
| Explorateur | Lire des comics de 3 genres différents |
| Maître des genres | Lire des comics de 5 genres différents |
| Multitâche | Avoir 3 comics en cours simultanément |
| Pionnier | Faire partie des 50 premiers inscrits |

### Statistiques
- Dashboard personnel : total lus, en cours, à lire, note moyenne donnée
- Badges obtenus
- Profil public avec stats visibles

### Administration (ADMIN / SUPER_ADMIN)
- **Comics** : ajout manuel, import CSV, modification (titre, couverture, PDF, genres, auteurs), suppression
- **Auteurs** : CRUD complet, liaison auteur ↔ comics
- **Parcours de lecture** : CRUD complet
- **Utilisateurs** : liste, modification des rôles (SUPER_ADMIN uniquement)
- **Stats globales** : nombre d'utilisateurs, comics, avis

---

## Modèle de données

```
User
├── id, email (unique), username (unique), passwordHash?, oauthProvider?, oauthId?
├── role (USER | ADMIN | SUPER_ADMIN)
├── totpSecret? (AES-256 chiffré), totpEnabled
├── createdAt, updatedAt
│
├── ReadingEntry[]    — journal de lecture
├── Review[]          — avis postés
├── Comment[]         — commentaires sur avis
├── List[]            — listes personnalisées
├── Follow[]          — abonnements (followerId / followingId)
├── ReviewLike[]      — likes sur avis
├── CommentLike[]     — likes sur commentaires
├── UserBadge[]       — badges obtenus
├── RefreshToken[]    — tokens de session
├── GuideTopic[]      — sujets de discussion dans les parcours
└── GuideReply[]      — réponses dans les discussions

Comic
├── id, externalId (unique), title, description?, coverUrl?, pdfUrl?
├── genres[], authors[], publisher?, publishedAt?
├── ReadingEntry[], Review[], ListItem[], AuthorOnComic[]

ReadingEntry
├── userId, comicId (unique ensemble)
├── status (TO_READ | IN_PROGRESS | FINISHED)
├── currentPage?, totalPages?, progress (0-100)
├── startedAt?, finishedAt?, lastReadAt?

Review
├── userId, comicId (unique ensemble — une seule review par user/comic)
├── rating (1-5), content? (max 5000 chars)
├── Comment[], ReviewLike[]

List
├── userId, name, slug (unique), description?, isPublic
├── ListItem[] (cascade delete)

ReadingGuide
├── slug (unique), character, imageUrl?, teaser, story
├── relatedSlugs[] — références vers d'autres parcours
├── GuideComic[] — liste ordonnée de comics recommandés
└── GuideTopic[] — forum de discussion

GuideTopic
├── guideId, authorId, title (max 200), content (max 5000), imageUrl?
└── GuideReply[] — réponses imbriquées (parentId pour les threads)

UserBadge
└── userId, badgeKey (unique ensemble), earnedAt
```

---

## API — Routes disponibles

### Auth — `/auth`
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/auth/register` | — | Inscription email/password |
| POST | `/auth/login` | — | Connexion, retourne token + refreshToken |
| POST | `/auth/refresh` | — | Renouveler l'access token |
| POST | `/auth/logout` | — | Invalider le refresh token |
| POST | `/auth/2fa/enable` | ✓ | Générer secret TOTP |
| POST | `/auth/2fa/verify` | ✓ | Valider et activer le 2FA |
| POST | `/auth/2fa/disable` | ✓ | Désactiver le 2FA |
| GET | `/auth/google` | — | Démarrer flux OAuth Google |
| GET | `/auth/github` | — | Démarrer flux OAuth GitHub |
| POST | `/auth/oauth/exchange` | — | Échanger code OAuthCode contre tokens JWT |

### Comics — `/comics`
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/comics` | — | Liste paginée |
| GET | `/comics/search` | — | Recherche full-text |
| GET | `/comics/latest` | — | Dernières ajouts |
| GET | `/comics/trending` | — | Les plus consultés |
| GET | `/comics/genres` | — | Liste des genres disponibles |
| GET | `/comics/:externalId` | — | Détail d'un comic |

### Journal — `/reading-list`
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/reading-list` | ✓ | Ajouter un comic |
| DELETE | `/reading-list/:id` | ✓ | Retirer un comic |
| PATCH | `/reading-list/:id/status` | ✓ | Changer le statut |
| PATCH | `/reading-list/:id/progress` | ✓ | Mettre à jour la progression |
| GET | `/history` | ✓ | Historique de lecture |

### Avis — `/reviews`
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/reviews` | ✓ | Créer un avis (cooldown 30s) |
| PATCH | `/reviews/:id` | ✓ | Modifier son avis |
| DELETE | `/reviews/:id` | ✓ | Supprimer son avis |
| GET | `/reviews/me` | ✓ | Mes avis |
| GET | `/reviews/comic/:comicId` | opt. | Avis sur un comic |
| POST | `/reviews/:id/like` | ✓ | Liker un avis |
| DELETE | `/reviews/:id/like` | ✓ | Retirer un like |
| POST | `/reviews/:id/comments` | ✓ | Commenter un avis (cooldown 30s) |
| DELETE | `/reviews/comments/:id` | ✓ | Supprimer son commentaire |

### Listes — `/lists`
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/lists` | ✓ | Mes listes |
| GET | `/lists/discover` | — | Listes publiques |
| GET | `/lists/public/:slug` | — | Lire une liste publique |
| POST | `/lists` | ✓ | Créer une liste |
| PATCH | `/lists/:id` | ✓ | Modifier une liste |
| PATCH | `/lists/:id/visibility` | ✓ | Changer la visibilité |
| DELETE | `/lists/:id` | ✓ | Supprimer une liste |
| POST | `/lists/:id/comics` | ✓ | Ajouter un comic |
| DELETE | `/lists/:id/comics/:comicId` | ✓ | Retirer un comic |

### Parcours — `/guides`
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/guides` | — | Tous les parcours |
| GET | `/guides/:slug` | opt. | Détail d'un parcours |
| GET | `/guides/:slug/topics/:topicId` | — | Thread de discussion |
| POST | `/guides/:slug/topics` | ✓ | Créer un topic |
| POST | `/guides/:slug/topics/:topicId/replies` | ✓ | Répondre dans un topic |
| DELETE | `/guides/:slug/topics/:topicId` | ✓ | Supprimer son topic |
| DELETE | `/guides/:slug/topics/:topicId/replies/:replyId` | ✓ | Supprimer sa réponse |

### Utilisateurs — `/users`, `/me`
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/me` | ✓ | Mon profil |
| GET | `/users/:username` | — | Profil public |
| GET | `/users/:username/reviews` | — | Avis d'un utilisateur |
| GET | `/users/:username/badges` | — | Badges d'un utilisateur |
| POST | `/users/:id/follow` | ✓ | Suivre |
| DELETE | `/users/:id/follow` | ✓ | Ne plus suivre |

### Stats — `/stats`
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/stats/me` | ✓ | Mes statistiques de lecture |
| GET | `/stats/badges` | ✓ | Mes badges |

### Administration — `/admin`
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/admin/setup` | ✓ | Promouvoir le premier admin |
| GET | `/admin/users` | SUPER_ADMIN | Liste des utilisateurs |
| PATCH | `/admin/users/:id/role` | SUPER_ADMIN | Modifier le rôle |
| GET/POST/PATCH/DELETE | `/admin/comics` | ADMIN | Gestion des comics |
| POST | `/admin/comics/import-csv` | ADMIN | Import en masse |
| GET/POST/PATCH/DELETE | `/admin/authors` | ADMIN | Gestion des auteurs |
| GET/POST/PATCH/DELETE | `/admin/guides` | ADMIN | Gestion des parcours |
| GET | `/admin/stats` | ADMIN | Statistiques globales |

---

## Sécurité

### Mesures en place

| Mesure | Détail |
|--------|--------|
| **Rate limiting auth** | 20 req / 15min sur `/auth` (express-rate-limit) |
| **Rate limiting write** | 20 req / min sur `/reviews`, `/comments`, `/lists`, `/guides` |
| **Helmet** | Headers HTTP sécurisés (XSS, clickjacking, MIME sniffing) |
| **CORS strict** | Origines autorisées explicitement (FRONTEND_URL) |
| **Rejet XSS** | Tout contenu contenant du HTML (`<tag>`) est rejeté avec 400 |
| **Limite de longueur** | Reviews : max 5 000 chars · Commentaires : max 1 000 · Topics : max 5 000 · Réponses : max 2 000 |
| **Cooldown anti-spam** | 30s entre deux avis · 30s entre deux commentaires |
| **bcrypt** | Mots de passe hashés (cost factor 12) |
| **JWT court** | Access token expiré en 15min, refresh token hashé en base |
| **TOTP chiffré** | Secret 2FA stocké chiffré AES-256 (TOTP_ENCRYPTION_KEY) |
| **Session courte** | Uniquement pour le flux OAuth (10min, httpOnly, SameSite=Lax) |
| **Secrets validés** | Au démarrage en production : arrêt si secret absent ou valeur par défaut |
| **HTTPS only** | Cookie secure=true en production |

### Ce qui est prévu (roadmap)
- Email double opt-in (vérification à l'inscription)
- Système de signalement de contenu abusif
- Confidentialité de profil (profil privé)
- fail2ban + ufw sur le VPS
- Backup PostgreSQL quotidien (cron `pg_dump`)

---

## Authentification

### Flux standard (email / password)
```
POST /auth/register → crée User, retourne token + refreshToken
POST /auth/login    → vérifie hash bcrypt + TOTP si activé, retourne token + refreshToken
POST /auth/refresh  → valide refreshToken (hash en base), retourne nouveau token
POST /auth/logout   → supprime refreshToken de la base
```

### Flux OAuth (Google / GitHub)
```
GET /auth/google → redirect vers Google OAuth
GET /auth/google/callback → reçoit code Google
  → crée ou trouve l'User (email garanti par le provider)
  → génère un OAuthCode (code aléatoire, TTL 2min, stocké en base)
  → redirige vers /auth/callback?code=xxx sur le frontend
GET /auth/callback (frontend) → appelle POST /auth/oauth/exchange
POST /auth/oauth/exchange → valide OAuthCode, retourne token + refreshToken JWT
```

La session Express n'est utilisée que pendant le flux OAuth. Elle n'est pas utilisée comme mécanisme d'authentification principal.

### 2FA TOTP
```
POST /auth/2fa/enable  → génère secret TOTP, retourne QR code (otpauth://)
POST /auth/2fa/verify  → valide un code TOTP, active le 2FA, chiffre et stocke le secret
POST /auth/2fa/disable → valide un code TOTP, supprime le secret
```

Au login, si `totpEnabled === true`, un champ `totp` est attendu dans le body.

---

## Environnements

| Environnement | URL | Compose file | Usage |
|---------------|-----|--------------|-------|
| **Local** | localhost | `docker-compose.dev.yml` | Développement, tests rapides |
| **Sandbox** | sandbox.sitedetestdemassinissabencherif.com | `docker-compose.sandbox.yml` | Validation des features avant push |
| **Dev / Staging** | dev.sitedetestdemassinissabencherif.com | `docker-compose.staging.yml` | Pré-production, basic auth |
| **Production** | sitedetestdemassinissabencherif.com | `docker-compose.yml` | Utilisateurs réels |

**Ports sandbox :**
- Frontend : 3005
- Backend : 3021
- PostgreSQL : 5434

**Données de démo (sandbox + staging) :**
- ~15 utilisateurs avec `demo2026!` comme mot de passe
- Avis, commentaires, listes, badges pré-générés
- 9 parcours de lecture avec comics

---

## CI/CD

### Workflow CI (`.github/workflows/ci.yml`)
Déclenché sur chaque push sur `main` et `dev` :
1. Tests backend (Vitest)
2. Build frontend (`nuxt build`)
3. Build image Docker
4. Tests E2E Playwright (contre l'URL staging ou prod)

### Workflow Deploy (`.github/workflows/deploy.yml`)
Déclenché sur push `main` (prod) ou `dev` (staging) :

**Production :**
```bash
git pull origin main
docker compose up -d --build
npx prisma migrate deploy
node prisma/seed-guides.js   # idempotent — upsert
docker image prune -f
```

**Staging :**
```bash
git pull origin dev
docker compose -f docker-compose.staging.yml up -d --build
npx prisma migrate deploy
node prisma/seed-guides.js
node prisma/seed-demo.js
node prisma/seed-demo-2.js
docker image prune -f
```

Les seeds sont idempotents (upsert / findFirst avant création) — ils peuvent être relancés sans créer de doublons.

---

## Installation locale

### Prérequis
- Git
- Docker + Docker Compose

### 1. Cloner le repo
```bash
git clone git@github.com:massinissabencherif/pa4.git
cd pa4
```

### 2. Variables d'environnement
```bash
cp backend/.env.example backend/.env
# Éditer backend/.env avec tes valeurs (voir section suivante)
```

### 3. Lancer avec Docker
```bash
# Sandbox (recommandé pour le développement)
docker compose -f docker-compose.sandbox.yml up -d --build

# Dev local
docker compose -f docker-compose.dev.yml up -d --build
```

Le backend sera disponible sur `http://localhost:3001` (ou 3021 en sandbox), le frontend sur `http://localhost:3000` (ou 3005 en sandbox).

### 4. Initialiser les données
```bash
# Migrations
docker compose exec backend npx prisma migrate deploy

# Parcours de lecture (9 guides)
docker compose exec backend node prisma/seed-guides.js

# Données de démo (optionnel)
docker compose exec backend node prisma/seed-demo.js
docker compose exec backend node prisma/seed-demo-2.js
```

---

## Variables d'environnement

```env
# Serveur
PORT=3001
NODE_ENV=development

# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/comicster"

# JWT (générer avec : node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET="64-chars-hex-string"
JWT_EXPIRES_IN="15m"

# Session OAuth (distinct de JWT_SECRET)
SESSION_SECRET="64-chars-hex-string"

# TOTP (générer avec : node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
TOTP_ENCRYPTION_KEY="64-chars-hex-string"

# CORS
FRONTEND_URL="http://localhost:3000"
API_BASE_URL="http://localhost:3001"

# OAuth2 (optionnel)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# APIs externes (optionnel)
MARVEL_PUBLIC_KEY=""
MARVEL_PRIVATE_KEY=""
GIPHY_API_KEY=""       # Active la recherche GIF dans les discussions guides

# Docker (prod)
POSTGRES_PASSWORD="strong-password"
```

En production, `JWT_SECRET`, `SESSION_SECRET` et `TOTP_ENCRYPTION_KEY` sont **obligatoires** — le serveur s'arrête au démarrage s'ils sont absents ou s'ils contiennent une valeur par défaut.

---

## Workflow de développement

### Règles fondamentales

- Toute **feature** passe par sandbox avant d'être mergée — on ne saute jamais sandbox
- Toute feature fait l'objet d'une **PR GitHub** — jamais de merge direct en CLI (`git merge feat/xxx`)
- Les branches feature sont **supprimées après merge** (origin + local)
- Les pushs directs sur `main` sont réservés aux **correctifs et maintenance** (fix CI, fix tests, README, chore)
- Pas de reviewer obligatoire (projet solo) — à activer quand l'équipe s'agrandit

### Cycle complet — nouvelle feature
1. Créer une branche depuis `main`
   ```bash
   git checkout main && git pull origin main
   git checkout -b feat/nom-de-la-feature
   ```
2. Développer et **tester sur sandbox** (copie des fichiers ou rebuild du container)
3. Push et PR vers `main`
   ```bash
   git push -u origin feat/nom-de-la-feature
   # Ouvrir la PR sur GitHub
   ```
4. Le CI tourne automatiquement (backend tests, frontend build, docker build)
5. Merger la PR sur GitHub une fois les checks verts
6. Supprimer la branche feature
   ```bash
   git push origin --delete feat/nom-de-la-feature
   git branch -D feat/nom-de-la-feature
   git checkout main && git pull origin main
   ```

### Cycle complet — correctif / maintenance
Pour les fix de tests, CI, README, chore — push direct sur `main` autorisé :
```bash
git add <fichiers>
git commit -m "fix(...): ..."
git push origin main
```

### Ce qu'on ne fait jamais
```bash
# INTERDIT — merger une feature sans PR
git merge feat/xxx
git push origin feat/xxx:main

# INTERDIT — pusher directement une nouvelle feature sur main ou dev
# (les features passent toujours par une PR)
```

### Tests E2E
```bash
cd e2e
npx playwright test              # tous les tests
npx playwright test auth.spec.ts # un fichier spécifique
npx playwright show-report       # rapport HTML
```

---

## Roadmap

| Feature | Effort estimé | Statut |
|---------|--------------|--------|
| XP + Niveaux (Padawan → Légende) | ~1j | À faire |
| Streak de lecture + objectif annuel | ~4h | À faire |
| Leaderboard mensuel | ~2h | À faire |
| Confidentialité du profil (isPrivate) | ~4h | À faire |
| Email double opt-in (Resend) | ~1j | À faire |
| Système de signalement | ~1j | À spécifier |
| Déploiement VPS final (Nginx, HTTPS, fail2ban) | — | À faire |
