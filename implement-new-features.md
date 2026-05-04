# Plan d'implémentation — Nouvelles features Sandbox

Environnement cible : **sandbox** (sandbox.sitedetestdemassinissabencherif.com)
Branche : **new-design**
Ordre : du plus rapide au plus structurant

---

## Logique de priorisation

1. **Recommandations** — backend 100% prêt, zéro risque, valeur immédiate
2. **Commentaires sur les avis** — backend 100% prêt (routes + données incluses), ajoute l'engagement social
3. **Progression de lecture** — nécessite une migration Prisma, enrichit le cœur de l'app (journal + lecteur)

Ces 3 features sont complémentaires : découvrir (recommandations) → discuter (commentaires) → suivre (progression).

---

## Feature 1 — Page Recommandations

### Statut : ✅ TERMINÉ

### Étapes

- [x] Vérifier que `GET /recommendations` retourne les bonnes données
- [x] Créer `frontend/app/pages/recommendations.vue`
  - Grille 5 colonnes brutalist (même style que search)
  - Section "Pour toi" (basis=taste) ou "Populaire" (basis=popular)
  - Raisons affichées sur chaque carte (topGenres)
  - Bouton "Ajouter au journal" sur chaque carte
  - État vide, état loading
- [x] Ajouter le lien "Recos" dans la navbar (`layouts/default.vue`)

### Ce qui existait déjà
- `GET /recommendations` dans `backend/src/routes/feed.js` — algo complet :
  scoring par genres/auteurs favoris, exclusion des comics déjà lus, fallback "popular" si pas d'historique

---

## Feature 2 — Commentaires sur les avis

### Statut : ✅ TERMINÉ

### Étapes

- [x] Vérifier que `GET /reviews/comic/:comicId` retourne les commentaires (oui, inclus)
- [x] Vérifier routes POST/DELETE commentaires (oui, opérationnelles)
- [x] Mettre à jour `frontend/app/pages/comics/[id].vue`
  - Afficher les commentaires sous chaque avis
  - Formulaire d'ajout de commentaire (utilisateur connecté)
  - Bouton supprimer sur ses propres commentaires
  - Like/unlike commentaire (route existe : POST/DELETE `/comments/:id/like`)
  - États vides, loading, erreur

### Ce qui existait déjà
- `POST /reviews/:id/comments` — créer un commentaire (max 1000 chars)
- `DELETE /reviews/comments/:id` — supprimer le sien
- `POST /comments/:id/like` — liker un commentaire
- `DELETE /comments/:id/like` — retirer le like
- `GET /reviews/comic/:comicId` — retourne déjà les commentaires avec likeCount/likedByMe

---

## Feature 3 — Progression de lecture

### Statut : ✅ TERMINÉ

### Étapes

#### Backend
- [x] Ajouter champs à `ReadingEntry` dans `schema.prisma` :
  - `currentPage Int?`
  - `totalPages  Int?`
  - `progress    Int @default(0)` (pourcentage 0-100)
  - `lastReadAt  DateTime?`
- [x] Créer migration Prisma : `npx prisma migrate dev --name add_reading_progress`
- [x] Ajouter endpoint `PATCH /reading-list/:id/progress`
  - Validation : currentPage >= 0, totalPages > 0, currentPage <= totalPages
  - Calcul auto de `progress` (%)
  - Passage auto à `IN_PROGRESS` si currentPage > 0
  - Passage auto à `FINISHED` si currentPage === totalPages
  - Mise à jour `lastReadAt`
- [x] Exposer les nouveaux champs dans `GET /reading-list` et `GET /reading-list/:comicId`

#### Frontend
- [x] `frontend/app/pages/journal.vue` — barre de progression + "X / Y pages" + lastReadAt
- [x] `frontend/app/pages/comics/[id].vue` — widget "Ma progression" avec input page actuelle

#### Rebuild sandbox
- [x] Commit sur `new-design`
- [x] Rebuild sandbox : `docker compose -f docker-compose.sandbox.yml up --build -d`
- [x] Copier migration vers sandbox (auto via entrypoint)

---

## Récapitulatif des fichiers modifiés

| Fichier | Feature |
|---------|---------|
| `frontend/app/pages/recommendations.vue` | Créé — Feature 1 |
| `frontend/app/layouts/default.vue` | Modifié — lien Recos navbar |
| `frontend/app/pages/comics/[id].vue` | Modifié — commentaires + progression |
| `frontend/app/pages/journal.vue` | Modifié — barres de progression |
| `backend/prisma/schema.prisma` | Modifié — champs progression |
| `backend/src/routes/reading.js` | Modifié — endpoint /progress |
