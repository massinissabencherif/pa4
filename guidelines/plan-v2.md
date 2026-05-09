# Plan d'implémentation — Comicster v2

Établi le 2026-05-09. Voir `next-features.md` pour le détail des specs.

---

## Étape 0 — Push sandbox → dev → main (BLOQUANT, à faire en premier)

Analyse des changements en attente sur la branche `feature/reading-guides` :

### Ce qui a changé depuis le dernier commit

**Backend :**
- `schema.prisma` — 4 nouveaux modèles (ReadingGuide, GuideComic, GuideTopic, GuideReply) + `List.description` + cascade sur ListItem
- `routes/guides.js` (nouveau) — 288 lignes, CRUD guides + proxy Giphy + topics + replies imbriquées
- `routes/admin.js` — PATCH `/admin/comics/:id` supporte maintenant multipart
- `routes/comics.js` — helper `withRatings()` sur toutes les listes
- `routes/lists.js` — GET `/lists/discover` (public), champ description
- `server.js` — guidesRouter monté
- `.env.example` — GIPHY_API_KEY documenté

**Frontend :**
- `pages/guides/[slug].vue` (nouveau)
- `components/GifPicker.vue` (nouveau)
- `components/GuideReplyThread.vue` (nouveau)
- 14 pages modifiées (refonte brutalist)
- `layouts/default.vue`

**Infra :**
- `docker-compose.sandbox.yml` — GIPHY_API_KEY transmis

**Assets :**
- `frontend/public/covers/defaults/` — 9 nouvelles images de couverture

**Docs :**
- `guidelines/` — fichiers déplacés depuis la racine + nouveaux

### ⚠️ Point bloquant avant tout push

**Il n'existe aucune migration Prisma pour les nouveaux modèles.**
La dernière migration est `20260504000000_add_reading_progress`.
Sans migration, `prisma migrate deploy` ne crée pas les tables → crash au runtime.

**Action requise :**
```bash
cd backend
npx prisma migrate dev --name add_guides_list_description
```
Génère une migration pour :
- Les 4 modèles Guides
- `List.description String?`
- `ListItem` onDelete Cascade

### Fichiers à exclure du commit (gitignore)
```
audit/
e2e/test-results/
test-results/
.playwright-mcp/
.superpowers/
```

### Ordre des opérations pour le push

1. Créer la migration Prisma
2. Ajouter les nouveaux fichiers au staging (guides, components, pages, assets, guidelines)
3. Vérifier `.gitignore` pour exclure les dossiers de test/audit
4. Commit sur `feature/reading-guides`
5. Merge PR → `main` (après validation sandbox)
6. Déployer en dev, valider
7. Déployer en prod

---

## Étape 1 — Sécurité quick wins (priorité critique, 1-2h)

Ces deux points ont le meilleur ROI : risque réel, correction triviale.

### 1a. Limite de longueur reviews backend
- Fichier : `backend/src/routes/reviews.js`
- POST + PATCH : ajouter `if (content && content.length > 5000) return 400`
- Effort : 5 minutes

### 1b. Rate limiting sur toutes les routes write
- Fichier : `backend/src/server.js`
- Ajouter `writeLimiter` (20 req/min) sur `/reviews`, `/comments`, `/lists`, `/guides`
- Effort : 15 minutes

### 1c. Sanitization XSS
- Fichier : `backend/src/routes/reviews.js`, `comments.js`, `guides.js`
- Rejeter tout contenu contenant des balises HTML (`/<[^>]+>/`)
- Effort : 30 minutes

**Branch :** `feat/security-quick-wins` → merge dans `main` après tests

---

## Étape 2 — Email + Vérification double opt-in (priorité haute, ~1 jour)

Spec complète dans `next-features.md`.

### Prérequis
- Compte Resend créé, `RESEND_API_KEY` en env
- DNS vérifié sur le domaine d'envoi (ex: `noreply@sitedetestdemassinissabencherif.com`)

### Fichiers à créer / modifier
- `backend/prisma/schema.prisma` — champ `emailVerified`, modèle `EmailVerification`
- `backend/src/lib/email.js` (nouveau) — wrapper Resend
- `backend/src/lib/templates/verify-email.html` (nouveau) — template email
- `backend/src/routes/auth.js` — POST /register, POST /login, GET /verify-email, POST /resend-verification
- `frontend/app/pages/auth/verify-pending.vue` (nouveau) — page "Vérifie ton email"
- `backend/.env.example` — documenter RESEND_API_KEY, RESEND_FROM

### Impact tests existants
- Les tests d'intégration qui créent des users et logent immédiatement sont cassés
- Ajouter `emailVerified: true` dans les seeds de test

**À textualiser en spec complète avant d'implémenter.**
**Branch :** `feat/email-verification`

---

## Étape 3 — Système de signalement (priorité haute, ~1 jour)

Spec complète dans `next-features.md`. **À textualiser avec l'équipe avant de coder.**

### Questions à trancher d'abord
- Nombre de signalements déclenchant une action automatique ?
- Contenu supprimé ou caché lors d'un RESOLVED ?
- Notification à l'auteur ?

### Fichiers à créer / modifier (après spec validée)
- `backend/prisma/schema.prisma` — modèle `Report`
- `backend/src/routes/reports.js` (nouveau)
- `backend/src/routes/admin.js` — GET + PATCH `/admin/reports`
- `frontend/app/pages/admin/index.vue` — section signalements
- UI : bouton "Signaler" sur les avis et commentaires

**Branch :** `feat/reporting-system`

---

## Étape 4 — Cooldown anti-spam (priorité haute, 30 min)

Simple à faire, fort impact anti-abus.

### Fichiers à modifier
- `backend/src/routes/reviews.js` — vérifier last review timestamp avant création
- `backend/src/routes/comments.js` — idem

**Branch :** `feat/security-quick-wins` (peut être groupé avec étape 1)

---

## Étape 5 — Confidentialité du profil (priorité moyenne, ~4h)

### Fichiers à créer / modifier
- `backend/prisma/schema.prisma` — champ `isPrivate Boolean @default(false)` sur `User`
- `backend/src/routes/users.js` — conditionner les réponses selon `isPrivate` + relation follow
- `frontend/app/pages/settings/privacy.vue` (nouveau) — toggle confidentialité
- `frontend/app/layouts/default.vue` — lien vers paramètres confidentialité
- `frontend/app/pages/profile/[username].vue` — afficher message "Profil privé" si applicable

**Branch :** `feat/profile-privacy`

---

## Étape 6 — Gamification XP + Niveaux (priorité moyenne, ~1 jour)

### Fichiers à créer / modifier
- `backend/prisma/schema.prisma` — champ `xp INT @default(0)` sur `User`
- `backend/src/lib/xp.js` (nouveau) — `awardXP(userId, amount)`, `getUserLevel(xp)`, seuils
- `backend/src/routes/reading.js`, `reviews.js`, `users.js` — appels `awardXP`
- `backend/src/routes/stats.js` — retourner `xp` + `level` dans `/stats/me`
- `frontend/app/pages/dashboard.vue` — barre XP + badge de rang
- `frontend/app/pages/profile/[username].vue` — rang visible sur le profil

**Branch :** `feat/xp-system`

---

## Étape 7 — Streak + Objectif annuel (priorité moyenne, ~4h)

### Fichiers à modifier
- `backend/prisma/schema.prisma` — `lastActiveDate DateTime?`, `currentStreak INT @default(0)`, `readingGoal INT?`
- `backend/src/routes/reading.js` — `updateStreak()` sur PATCH status
- `backend/src/routes/users.js` — PATCH `/me/goal`
- `frontend/app/pages/dashboard.vue` — afficher streak + objectif annuel

**Branch :** `feat/streak-goal` (peut être groupé avec étape 6)

---

## Étape 8 — Déploiement VPS final (priorité critique)

- Nginx + Certbot HTTPS
- Variables d'env prod configurées
- fail2ban + ufw
- Cron backup PostgreSQL quotidien
- Sentry (optionnel pour la demo mais recommandé)

---

## Récapitulatif priorisé

| # | Feature | Effort | Priorité | Branch |
|---|---------|--------|----------|--------|
| 0 | Push sandbox → dev → main | 1h | 🔴 BLOQUANT | `feature/reading-guides` |
| 1 | Rate limit + longueur reviews + XSS | 1h | 🔴 Critique | `feat/security-quick-wins` |
| 2 | Email vérification (double opt-in) | 1j | 🟠 Haute | `feat/email-verification` |
| 3 | Système de signalement | 1j | 🟠 Haute (spec d'abord) | `feat/reporting-system` |
| 4 | Cooldown anti-spam | 30min | 🟠 Haute | (groupé avec #1) |
| 5 | Confidentialité profil | 4h | 🟡 Moyenne | `feat/profile-privacy` |
| 6 | XP + Niveaux | 1j | 🟡 Moyenne | `feat/xp-system` |
| 7 | Streak + Objectif annuel | 4h | 🟡 Moyenne | (groupé avec #6) |
| 8 | Déploiement VPS final | - | 🔴 Critique | infra |
