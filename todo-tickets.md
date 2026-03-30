# Tickets GitHub Projects — Comicster PA 2026

Copie-colle chaque bloc dans GitHub Issues → New Issue.
Glisse ensuite chaque issue dans la bonne colonne du board.

---

## COLONNE : Done

---

**Titre :** Auth — Register / Login / JWT

```
### Environment

- [ ] Staging
- [x] Production

### Steps to reproduce

- Accéder à /auth/register
- Créer un compte avec email, username, password
- Se connecter sur /auth/login
- Utiliser l'access token retourné pour appeler une route protégée

### What is the current _bug_ behavior?

- N/A — fonctionnalité implémentée et opérationnelle

### What is the expected _correct_ behavior?

- POST /auth/register crée un compte et retourne un access token (JWT 15min) + refresh token (30j)
- POST /auth/login vérifie les identifiants et retourne les tokens
- POST /auth/refresh effectue la rotation du refresh token
- POST /auth/logout révoque le refresh token en base

### Relevant error and/or screenshots

- Testé en CI via Vitest + Supertest (22 tests passent)
```

---

**Titre :** Auth — OAuth2 Google + GitHub

```
### Environment

- [ ] Staging
- [x] Production

### Steps to reproduce

- Accéder à /auth/login
- Cliquer sur "Connexion avec Google" ou "Connexion avec GitHub"
- Autoriser l'application sur la console Google/GitHub
- Être redirigé vers /auth/callback avec un token

### What is the current _bug_ behavior?

- N/A — fonctionnalité implémentée et opérationnelle

### What is the expected _correct_ behavior?

- Connexion via Google OAuth2 (passport-google-oauth20)
- Connexion via GitHub OAuth2 (passport-github2)
- Création automatique de compte si l'email est inconnu
- Liaison au compte existant si l'email correspond
- Redirect vers /auth/callback?token=...&refreshToken=...

### Relevant error and/or screenshots

- Redirect URIs configurées sur Google Cloud Console et GitHub Developer Settings
- FRONTEND_URL requis dans les variables d'environnement
```

---

**Titre :** Auth — 2FA TOTP

```
### Environment

- [ ] Staging
- [x] Production

### Steps to reproduce

- Se connecter puis aller sur /settings/security
- Activer la 2FA → scanner le QR code avec Google Authenticator
- Se déconnecter et se reconnecter
- Saisir le code TOTP à 6 chiffres pour finaliser le login

### What is the current _bug_ behavior?

- N/A — fonctionnalité implémentée et opérationnelle

### What is the expected _correct_ behavior?

- Génération du secret TOTP et du QR code (otplib v13 + qrcode)
- Vérification du code via verifySync
- Login bloqué si 2FA activé et code absent ou invalide
- Désactivation possible depuis /settings/security

### Relevant error and/or screenshots

- otplib v13 : import nommé (generateSecret, generateURI, verifySync) — pas d'export default
```

---

**Titre :** Comics — API Marvel + cache DB + lecteur PDF

```
### Environment

- [ ] Staging
- [x] Production

### Steps to reproduce

- Aller sur /comics/search et rechercher un comic
- Cliquer sur un résultat pour voir le détail
- (Admin) Uploader un PDF depuis /admin

### What is the current _bug_ behavior?

- N/A — fonctionnalité implémentée et opérationnelle

### What is the expected _correct_ behavior?

- GET /comics/search interroge l'API Marvel et met en cache les résultats en DB
- GET /comics/:externalId retourne le détail depuis le cache DB
- Upload de PDF et couverture via multer (admin uniquement)
- Lecteur PDF intégré sur /comics/read/:id

### Relevant error and/or screenshots

- Clés MARVEL_PUBLIC_KEY et MARVEL_PRIVATE_KEY requises dans .env
```

---

**Titre :** Journal de lecture

```
### Environment

- [ ] Staging
- [x] Production

### Steps to reproduce

- Se connecter et aller sur /comics/search
- Ajouter un comic au journal
- Aller sur /journal
- Filtrer par statut (TO_READ / IN_PROGRESS / FINISHED)
- Changer le statut d'un comic

### What is the current _bug_ behavior?

- N/A — fonctionnalité implémentée et opérationnelle

### What is the expected _correct_ behavior?

- Ajout/suppression de comics dans le journal
- Trois statuts : TO_READ, IN_PROGRESS, FINISHED
- Dates automatiques (startedAt à IN_PROGRESS, finishedAt à FINISHED)
- Filtres par statut sur la page /journal

### Relevant error and/or screenshots

- Contrainte unique (userId, comicId) : un comic ne peut être ajouté qu'une fois par user
```

---

**Titre :** Avis et notes

```
### Environment

- [ ] Staging
- [x] Production

### Steps to reproduce

- Aller sur la page d'un comic (/comics/:id)
- Laisser un avis avec une note de 1 à 5
- Aller sur /reviews pour voir tous ses avis
- Modifier ou supprimer un avis

### What is the current _bug_ behavior?

- N/A — fonctionnalité implémentée et opérationnelle

### What is the expected _correct_ behavior?

- POST /reviews (note 1-5 + contenu optionnel)
- PATCH /reviews/:id, DELETE /reviews/:id
- GET /reviews/me (tous ses avis)
- GET /reviews/comic/:comicId (avis sur un comic)

### Relevant error and/or screenshots

- Contrainte unique (userId, comicId) : un seul avis par comic par user
```

---

**Titre :** Listes personnalisées

```
### Environment

- [ ] Staging
- [x] Production

### Steps to reproduce

- Aller sur /lists et créer une liste
- Ajouter des comics à la liste
- Rendre la liste publique
- Partager l'URL /lists/public/:slug

### What is the current _bug_ behavior?

- N/A — fonctionnalité implémentée et opérationnelle

### What is the expected _correct_ behavior?

- CRUD complet des listes
- Ajout/suppression de comics dans une liste
- Toggle public/privé
- Slug unique généré automatiquement
- URL partageable accessible sans authentification

### Relevant error and/or screenshots

- N/A
```

---

**Titre :** Social — Profils publics + Follow/Unfollow

```
### Environment

- [ ] Staging
- [x] Production

### Steps to reproduce

- Aller sur /profile/:username
- Cliquer sur "Suivre"
- Vérifier le compteur de followers mis à jour

### What is the current _bug_ behavior?

- N/A — fonctionnalité implémentée et opérationnelle

### What is the expected _correct_ behavior?

- Profil public avec stats (comics lus, avis, listes publiques)
- POST /users/:id/follow et DELETE /users/:id/follow
- Compteurs followers/following mis à jour en temps réel
- Page /profile/:username accessible sans authentification

### Relevant error and/or screenshots

- N/A
```

---

**Titre :** Dashboard Admin

```
### Environment

- [ ] Staging
- [x] Production

### Steps to reproduce

- Créer le premier compte admin via POST /admin/setup
- Accéder à /admin
- Ajouter, modifier, supprimer des comics
- Consulter les stats (nb users, comics, reviews)

### What is the current _bug_ behavior?

- N/A — fonctionnalité implémentée et opérationnelle

### What is the expected _correct_ behavior?

- Rôle ADMIN sur le modèle User (enum Role)
- Route /admin/setup pour initialiser le premier admin
- CRUD complet des comics depuis le dashboard
- Stats globales de la plateforme
- Middleware requireAdmin protège toutes les routes admin

### Relevant error and/or screenshots

- N/A
```

---

**Titre :** DevOps — Docker + CI/CD + VPS OVH

```
### Environment

- [ ] Staging
- [x] Production

### Steps to reproduce

- Pusher sur la branche main
- Observer la CI GitHub Actions (lint + test + build)
- Observer le déploiement automatique SSH sur le VPS
- Vérifier que le site est accessible en HTTPS

### What is the current _bug_ behavior?

- N/A — fonctionnalité implémentée et opérationnelle

### What is the expected _correct_ behavior?

- docker-compose.yml : postgres + backend + frontend + umami
- docker-compose.dev.yml : postgres seul pour le dev local
- CI : prisma generate + tests vitest + build nuxt
- Deploy : SSH → git pull → docker compose up --build → prisma migrate deploy
- Nginx reverse proxy avec HTTPS/TLS 1.3 et Let's Encrypt

### Relevant error and/or screenshots

- Secrets GitHub requis : VPS_HOST, VPS_USER, VPS_SSH_KEY
```

---

**Titre :** Légal — RGPD + Cookie Consent

```
### Environment

- [ ] Staging
- [x] Production

### Steps to reproduce

- Accéder au site sans être connecté
- Observer la bannière cookie consent
- Consulter /rgpd et /mentions-legales

### What is the current _bug_ behavior?

- N/A — fonctionnalité implémentée et opérationnelle

### What is the expected _correct_ behavior?

- Page /rgpd informant sur la collecte et l'utilisation des données
- Page /mentions-legales
- Bannière CookieBanner.vue avec consentement explicite

### Relevant error and/or screenshots

- N/A
```

---

**Titre :** Performances — Index Prisma (optimisation SQL)

```
### Environment

- [ ] Staging
- [x] Production

### Steps to reproduce

- Charger /journal avec de nombreuses entrées
- Filtrer par statut
- Consulter la page d'un comic avec ses avis

### What is the current _bug_ behavior?

- Sans index, les requêtes effectuaient un sequential scan sur toutes les lignes

### What is the expected _correct_ behavior?

- @@index([userId]) sur ReadingEntry → chargement du journal
- @@index([userId, status]) sur ReadingEntry → filtre par statut
- @@index([comicId]) sur Review → avis d'un comic
- @@index([reviewId]) sur Comment → commentaires d'un avis
- @@index([followingId]) sur Follow → liste des followers
- @@index([userId]) sur List → listes d'un utilisateur

### Relevant error and/or screenshots

- Migration 20260329001204_add_indexes appliquée en production
```

---

**Titre :** Qualité — Tests automatisés Vitest + Supertest

```
### Environment

- [ ] Staging
- [x] Production

### Steps to reproduce

- Pusher sur main ou develop
- Observer le job "Backend — lint & test" dans GitHub Actions
- Vérifier que les 22 tests passent

### What is the current _bug_ behavior?

- N/A — tests implémentés et passants en CI

### What is the expected _correct_ behavior?

- Tests unitaires : JWT (génération, expiry, invalid, malformé) + bcrypt (hash, compare, salt)
- Tests d'intégration : register (201/409/400), login (200/401), routes protégées (401), refresh (200/401)
- 22 tests au total, exécutés automatiquement à chaque push via GitHub Actions

### Relevant error and/or screenshots

- npx prisma generate requis avant npm test (client Prisma non inclus dans devDeps)
```

---

**Titre :** Analytics — Umami self-hosted

```
### Environment

- [ ] Staging
- [x] Production

### Steps to reproduce

- Visiter n'importe quelle page du site
- Ouvrir le dashboard Umami sur /umami/
- Vérifier que la visite apparaît dans les statistiques

### What is the current _bug_ behavior?

- N/A — fonctionnalité implémentée et opérationnelle

### What is the expected _correct_ behavior?

- Container Umami déployé via docker-compose.yml
- Nginx proxifie /umami/ → localhost:3002 (HTTPS, pas de mixed content)
- Script de tracking injecté conditionnellement dans le layout Nuxt (useHead)
- Variables NUXT_PUBLIC_UMAMI_ID et NUXT_PUBLIC_UMAMI_URL baked au build

### Relevant error and/or screenshots

- Variables NUXT_PUBLIC_* doivent être déclarées comme ARG/ENV dans le Dockerfile frontend
```

---

## COLONNE : Todo

---

**Titre :** Social — Feed d'activité

```
### Environment

- [ ] Staging
- [ ] Production

### Steps to reproduce

- Se connecter et suivre plusieurs utilisateurs
- Aller sur /feed
- Observer les activités récentes des utilisateurs suivis

### What is the current _bug_ behavior?

- La page /feed n'existe pas
- Aucun endpoint GET /feed n'est implémenté

### What is the expected _correct_ behavior?

- GET /feed retourne les ReadingEntry + Review récents des followings triés par date
- Pagination du feed (cursor-based ou offset)
- Page /feed côté frontend avec affichage chronologique
- Affichage du type d'activité (a lu, a noté, a ajouté à une liste)

### Relevant error and/or screenshots

- Les modèles ReadingEntry, Review et Follow existent déjà en base
```

---

**Titre :** Social — Commentaires sur les avis

```
### Environment

- [ ] Staging
- [ ] Production

### Steps to reproduce

- Aller sur la page d'un comic
- Lire un avis
- Poster un commentaire sur cet avis

### What is the current _bug_ behavior?

- Le modèle Comment existe dans schema.prisma mais aucune route n'est implémentée
- Impossible de commenter un avis depuis l'interface

### What is the expected _correct_ behavior?

- POST /reviews/:id/comments (créer un commentaire)
- GET /reviews/:id/comments (lister les commentaires)
- DELETE /reviews/:id/comments/:commentId (supprimer le sien)
- Affichage des commentaires sous chaque avis

### Relevant error and/or screenshots

- Modèle Comment déjà migré en base : id, userId, reviewId, content, createdAt
- @@index([reviewId]) déjà en place
```

---

**Titre :** Social — Notifications

```
### Environment

- [ ] Staging
- [ ] Production

### Steps to reproduce

- Être suivi par un utilisateur
- Recevoir une notification "X vous suit"
- Consulter ses notifications depuis le header

### What is the current _bug_ behavior?

- Aucun système de notification n'existe (ni modèle, ni routes, ni UI)

### What is the expected _correct_ behavior?

- Modèle Notification dans schema.prisma (userId, type, actorId, read, createdAt)
- Déclencheurs : nouveau follower, commentaire sur un avis
- GET /notifications (liste des notifs non lues)
- PATCH /notifications/:id/read
- Indicateur de notifs non lues dans le header

### Relevant error and/or screenshots

- Peut être implémenté en polling simple (pas de WebSocket requis)
```

---

**Titre :** Recommandations — Phase 5

```
### Environment

- [ ] Staging
- [ ] Production

### Steps to reproduce

- Se connecter avec un compte ayant des comics lus et notés
- Accéder à /recommendations
- Observer les suggestions basées sur ses préférences

### What is the current _bug_ behavior?

- Aucun algorithme de recommandation n'est implémenté
- La page /recommendations n'existe pas

### What is the expected _correct_ behavior?

- GET /recommendations retourne des comics suggérés
- Algo basé sur les genres des comics lus (ReadingEntry FINISHED) et bien notés (Review rating >= 4)
- Exclusion des comics déjà dans le journal
- Page /recommendations avec affichage des suggestions

### Relevant error and/or screenshots

- Les champs genres[] et rating existent déjà sur Comic et Review
```
