# Roadmap — Comicster

Application web pour lecteurs de comics : suivi de lectures, notes/avis, listes personnalisées, recommandations et fonctionnalités sociales.

**Stack :** Nuxt 3 + TailwindCSS · Express 5 · PostgreSQL · Prisma · JWT · OAuth2 · Docker

---

## Phase 1 — Infrastructure & Auth
> Socle technique : base de données, authentification, sécurité

| # | Feature | Endpoint / Fichier | Tests |
|---|---|---|---|
| 1.1 | PostgreSQL + Prisma (setup, migrations) | `prisma/schema.prisma` | ✅ Connexion DB, migration OK |
| 1.2 | Schéma Prisma : User, Comic, ReadingEntry, Review, List | `prisma/schema.prisma` | ✅ Schéma validé, migration appliquée |
| 1.3 | Inscription / Login email + password (bcrypt + JWT) | `POST /auth/register` `POST /auth/login` | ✅ 201/200 · token JWT retourné |
| 1.4 | Middleware JWT + route protégée | `GET /me` | ✅ 401 sans token · 200 avec token valide |
| 1.5 | OAuth2 Google & GitHub (Passport.js) | `GET /auth/google` `GET /auth/github` | Callback redirect, token émis |
| 1.6 | 2FA TOTP (otplib) | `POST /auth/2fa/enable` `POST /auth/2fa/verify` | Unit: génération/vérification OTP |
| 1.7 | Refresh token + logout | `POST /auth/refresh` `POST /auth/logout` | Token révoqué après logout |

---

## Phase 2 — Données comics (API externe)
> Source de données : Marvel API ou ComicVine

| # | Feature | Endpoint / Fichier | Tests |
|---|---|---|---|
| 2.1 | Intégration API Marvel (search, get by ID) | `GET /comics/search` `GET /comics/:id` | ✅ Routes opérationnelles (nécessite clés Marvel) |
| 2.2 | Cache BDD des comics consultés (éviter appels répétés) | `src/lib/marvel.js` + upsert Prisma | ✅ upsert automatique à chaque appel API |
| 2.3 | Page recherche comics (frontend) | `pages/comics/search.vue` | ✅ Grille + pagination + message no-key |
| 2.4 | Page détail comic (frontend) | `pages/comics/[id].vue` | ✅ Couverture, description, boutons actions |

---

## Phase 3 — Journal de lecture
> Cœur métier : suivi et notation des comics

| # | Feature | Endpoint / Fichier | Tests |
|---|---|---|---|
| 3.1 | Ajouter/retirer un comic à sa liste | `POST /reading-list` `DELETE /reading-list/:id` | ✅ Persistance OK |
| 3.2 | Statuts : À lire / En cours / Terminé | `PATCH /reading-list/:id/status` | ✅ Transitions + dates auto |
| 3.3 | Notes (1–5 étoiles) + avis texte | `POST /reviews` `PATCH /reviews/:id` `DELETE /reviews/:id` | ✅ Validation, stockage |
| 3.4 | Historique de lecture (dates de début/fin) | `GET /history` | ✅ Tri chronologique |
| 3.5 | Page journal (frontend) | `pages/journal.vue` | ✅ Filtres, statut, notes, suppression |

---

## Phase 4 — Listes personnalisées
> Organisation et partage de collections

| # | Feature | Endpoint / Fichier | Tests |
|---|---|---|---|
| 4.1 | Créer / modifier / supprimer une liste | `POST/PATCH/DELETE /lists` | ✅ CRUD complet |
| 4.2 | Ajouter / retirer un comic d'une liste | `POST/DELETE /lists/:id/comics` | ✅ Checkbox depuis page détail |
| 4.3 | Rendre une liste publique / privée | `PATCH /lists/:id/visibility` | ✅ Toggle inline |
| 4.4 | URL publique partageable | `GET /lists/public/:slug` | ✅ Page publique sans auth |

---

## Phase 5 — Recommandations
> Découverte personnalisée

| # | Feature | Endpoint / Fichier | Tests |
|---|---|---|---|
| 5.1 | Recommandations par genres lus | `GET /recommendations` | Unit: algo de scoring |
| 5.2 | "Les autres ont aussi aimé..." (collaborative filtering) | `GET /recommendations/social` | Intégration: résultats pertinents |
| 5.3 | Section recommandations (frontend) | `pages/recommendations.vue` | E2E: affichage, navigation |

---

## Phase 6 — Fonctionnalités sociales
> Communauté et interactions

| # | Feature | Endpoint / Fichier | Tests |
|---|---|---|---|
| 6.1 | Profils utilisateurs publics | `GET /users/:username` | ✅ Stats, avis récents, listes publiques |
| 6.2 | Suivre / ne plus suivre un utilisateur | `POST/DELETE /users/:id/follow` | ✅ Toggle + compteur followers |
| 6.3 | Feed d'activité (amis) | `GET /feed` | Intégration: événements triés |
| 6.4 | Commentaires sur les avis | `POST/DELETE /reviews/:id/comments` | CRUD commentaires |
| 6.5 | Notifications (nouvelle activité) | `GET /notifications` | Intégration: déclenchement |

---

## Phase 7 — Dashboard admin
> Modération et supervision

| # | Feature | Endpoint / Fichier | Tests |
|---|---|---|---|
| 7.1 | Rôle admin + middleware | `src/middleware/requireAdmin.js` | Unit: 403 si non-admin |
| 7.2 | Gestion utilisateurs (ban, suppression) | `PATCH/DELETE /admin/users/:id` | Intégration: statut modifié |
| 7.3 | Modération avis/commentaires | `DELETE /admin/reviews/:id` | Intégration: suppression |
| 7.4 | Statistiques globales | `GET /admin/stats` | Intégration: métriques retournées |
| 7.5 | Interface admin (frontend) | `pages/admin/` | E2E: actions admin |

---

## Phase 8 — DevOps & Qualité
> Déploiement, CI/CD, tests complets

| # | Feature | Fichier | Tests |
|---|---|---|---|
| 8.1 | Docker Compose (frontend + backend + postgres) | `docker-compose.yml` | `docker-compose up` fonctionnel |
| 8.2 | Variables d'env sécurisées | `.env.example` complet | Aucun secret en clair dans le repo |
| 8.3 | GitHub Actions CI (lint + tests à chaque PR) | `.github/workflows/ci.yml` | Pipeline vert |
| 8.4 | Tests E2E Playwright (parcours critiques) | `tests/e2e/` | Auth, lecture, liste, social |
| 8.5 | Déploiement VPS Linux | `.github/workflows/deploy.yml` | URL production accessible |

---

## Suivi d'avancement

| Phase | Statut |
|---|---|
| 1 — Infrastructure & Auth | ✅ Terminée (register/login, OAuth2 Google+GitHub, 2FA TOTP, refresh token + logout) |
| 2 — Données comics | ✅ Terminée (admin PDF upload, DB search fallback) |
| 3 — Journal de lecture | ✅ Terminée |
| 4 — Listes personnalisées | ✅ Terminée |
| 5 — Recommandations | ⏳ À faire |
| 6 — Social | 🔄 En cours (6.1→6.2 ✅, reste feed + commentaires + notifications) |
| 7 — Dashboard admin | ✅ Terminée (upload PDF, stats, CRUD comics, rôle middleware) |
| 8 — DevOps & Qualité | 🔄 En cours (Docker ✅, CI/CD GitHub Actions ✅, RGPD ✅, reste VPS + tests + analytics) |
