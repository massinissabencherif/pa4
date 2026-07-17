# Notifications — Cartographie, tests, plan d'implémentation

Feature : notifications in-app pour les événements sociaux existants (follow, commentaire sur avis, réponse sur parcours) + badges. Voir discussion `improve.md` #16 (badges attribués trop tard) — cette feature en dépend partiellement.

---

## 1. Cartographie des interactions

### 1.1 Base de données (migration Prisma requise)

Nouveau modèle `Notification` :

```prisma
model Notification {
  id        String    @id @default(cuid())
  userId    String    // destinataire
  type      String    // 'FOLLOW' | 'REVIEW_COMMENT' | 'GUIDE_REPLY' | 'BADGE'
  actorId   String?   // déclencheur — null pour BADGE
  entityId  String?   // reviewId / guideReplyId / badgeKey selon type
  readAt    DateTime?
  createdAt DateTime  @default(now())

  user  User  @relation(fields: [userId],  references: [id], onDelete: Cascade)
  actor User? @relation("NotificationActor", fields: [actorId], references: [id], onDelete: SetNull)

  @@index([userId, readAt])
  @@index([userId, createdAt])
}
```

- `userId` → `onDelete: Cascade` (cohérent avec `UserBadge`, `Follow`, `ReviewLike`, `CommentLike` déjà en cascade).
- `actorId` → `onDelete: SetNull` : si l'acteur supprime son compte, la notification du destinataire reste (avec un fallback "quelqu'un" côté frontend) plutôt que de disparaître.

### 1.2 Backend — points d'insertion (call sites existants touchés)

| Événement | Fichier | Destinataire | Garde-fou |
|---|---|---|---|
| Follow créé | `backend/src/routes/users.js:94` | `followingId` | — |
| Comment créé sur une review | `backend/src/routes/reviews.js:177` | `review.userId` | pas de self-notif si `comment.userId === review.userId` |
| `GuideReply` créé, `parentId = null` | `backend/src/routes/guides.js:154` | `GuideTopic.authorId` | pas de self-notif si auteur = auteur du topic |
| `GuideReply` créé, `parentId` défini | `backend/src/routes/guides.js:154` | auteur de la reply parente (pas le topic) | pas de self-notif |
| Badge décroché | `backend/src/lib/badges.js` (`checkAndAwardBadges`) | l'utilisateur lui-même | uniquement les badges **nouvellement** décrochés |

Chaque insertion doit être faite dans le **même `prisma.$transaction`** que l'action principale (Follow/Comment/GuideReply), pas en `try/catch` séparé après coup — sinon on peut se retrouver avec un Follow créé sans notification si l'insert échoue isolément.

### 1.3 Interaction avec les badges (dépendance croisée avec `improve.md` #16)

Aujourd'hui `checkAndAwardBadges` ne tourne qu'à l'appel de `GET /stats/me` (lazy). Pour notifier "en temps réel", il faut aussi l'appeler juste après les actions concernées :

- `backend/src/routes/reading.js` — passage à `FINISHED` / `IN_PROGRESS`
- `backend/src/routes/reviews.js` — création d'un avis
- `backend/src/routes/users.js` — follow
- `backend/src/routes/auth.js` — inscription (`early_adopter`)

Ça touche **4 fichiers de routes existants**, pas seulement le nouveau code. `checkAndAwardBadges` doit retourner la liste des badges **nouvellement** attribués (pas juste vrai/faux) pour que l'appelant sache pour lesquels créer une notification, et pour ne pas re-notifier un badge déjà détenu.

### 1.4 Nouvelles routes (auth normale, pas admin)

- `GET /notifications` (paginé, `requireAuth`)
- `GET /notifications/unread-count` (`requireAuth`)
- `PATCH /notifications/:id/read` (`requireAuth`, vérifie ownership)
- `PATCH /notifications/read-all` (`requireAuth`)

Aucune route admin. Pas de middleware 2FA à hériter — bien vérifier que ces routes ne sont pas montées sous le namespace `/admin`.

### 1.5 Frontend

- `layouts/default.vue` — ajout d'une icône cloche + badge de compteur + dropdown. **Ce layout est partagé par les 24 routes authentifiées** : c'est le point de plus gros risque de régression de toute la feature (une erreur ici casse la nav partout, pas juste une page).
- Nouveau composable `useNotifications.js`, même pattern que `useAuth.js`/`useApi.js` (pas de Pinia — cf. décision prise avec le skill `vue-expert`).
- **Premier polling périodique de l'app** : rien d'autre ne fait de `setInterval` aujourd'hui. Le composable doit nettoyer son interval au `onUnmounted` (règle "MUST DO: cleanup in composables" du skill vue-expert, justement pertinente ici).
- Pas de nouvelle route `/notifications` en v1 — dropdown seul (20 dernières, non-lues en premier) pour limiter le scope.
- Le dropdown est un candidat direct pour le pattern d'animation modal/popover identifié dans la session `find-animation-opportunities` (même recette que `GifPicker.vue` / `lists/index.vue`) — cohérence visuelle à réutiliser, pas un nouveau composant à inventer.

### 1.6 Tests & CI existants

- `ci.yml` fait déjà `npx prisma migrate deploy` avant les tests → la nouvelle migration sera prise automatiquement, aucun changement de workflow nécessaire.
- Vérifier que les tests E2E existants (`e2e/tests/`) qui naviguent via le header ne cassent pas avec l'ajout de la cloche dans `default.vue`.

### 1.7 Ce qui NE change PAS (bon signe pour le scope)

Aucune variable d'environnement, aucun changement dans `docker-compose*.yml` (les 4 environnements), pas de nouvelle dépendance (pas de websocket, pas de queue, pas de lib d'email) — tout repose sur des tables Prisma + polling `$fetch`, cohérent avec l'existant.

---

## 2. Fiche de test

### Backend (unit / intégration)

1. Follow → crée une notification `FOLLOW` pour le suivi, `actorId` correct.
2. Unfollow ne supprime pas les notifications `FOLLOW` déjà créées (historique conservé).
3. Commentaire sur l'avis d'un autre → notification `REVIEW_COMMENT` pour l'auteur de l'avis.
4. Commentaire sur son propre avis → **aucune** notification.
5. Reply top-level (`parentId=null`) sur un topic → notifie l'auteur du topic.
6. Réponse à son propre topic → aucune notification.
7. Reply imbriquée (`parentId` défini) → notifie l'auteur de la reply parente, pas l'auteur du topic (sauf si même personne).
8. Réponse à sa propre reply → aucune notification.
9. Action qui décroche un badge → notification `BADGE` créée une seule fois.
10. Badge déjà détenu → pas de re-notification lors d'une action ultérieure.
11. `GET /notifications` sans token → 401.
12. `GET /notifications` ne retourne que les notifications de l'utilisateur courant (pas de fuite entre comptes).
13. `GET /notifications/unread-count` correspond bien au nombre de lignes `readAt IS NULL`.
14. `PATCH /notifications/:id/read` refuse si la notification n'appartient pas à l'appelant.
15. `PATCH /notifications/read-all` ne touche que les notifications de l'utilisateur courant.
16. Suppression d'un compte → cascade sur ses notifications reçues (plus de lignes orphelines).
17. Suppression du compte acteur → `actorId` passe à `null` sur les notifications déjà créées, la notification reste visible côté destinataire.
18. Pagination `GET /notifications` (limit/offset) validée.
19. Échec de l'insert notification → la transaction annule aussi l'action principale (Follow/Comment/Reply), pas de désynchronisation.

### Frontend

20. La cloche affiche le bon compteur de non-lues au chargement.
21. Le compteur se met à jour après le cycle de polling suivant.
22. Le dropdown liste les notifications, plus récentes en premier.
23. Cliquer une notification la marque lue et navigue vers l'entité concernée (avis, topic, profil).
24. "Tout marquer comme lu" vide le badge.
25. L'interval de polling est bien nettoyé au démontage du composant (pas de fuite mémoire).
26. La cloche s'affiche correctement sur les 24 routes authentifiées (régression layout).
27. État vide (aucune notification) : message clair, pas de dropdown cassé/vide.
28. Accessibilité : l'état non-lu n'est pas signalé uniquement par la couleur (icône/point + texte).

### E2E (Playwright)

29. User A suit User B → User B voit une notification non lue.
30. User A commente l'avis de User B → User B notifié, clic → navigation vers l'avis.
31. User A répond au topic de User B, puis User B répond à cette reply → notifications croisées correctes.
32. Les tests E2E existants (auth, nav) passent toujours avec la cloche présente dans le header.

### Manuel / exploratoire (sandbox)

33. Actions rapides répétées (follow/unfollow/follow) → pas de notifications dupliquées ou cassées.
34. Deux onglets/sessions ouverts pour le même utilisateur → pas de désync visible du compteur au-delà d'un cycle de polling (pas de push temps réel, c'est attendu — à vérifier que ça reste acceptable en usage réel).

---

## 3. Plan de déploiement (rappel du workflow validé)

1. Branche dédiée `feat/notifications` (locale, à partir de `main`).
2. Implémentation (migration + backend + frontend) + tests unitaires/intégration sur la branche.
3. Merge `feat/notifications` → `new-design` (sandbox) — merge direct, pas de PR (cohérent avec l'historique `feat/reading-streaks`, `fix/oauth-trust-proxy`).
4. Déploiement/rebuild sandbox + tests manuels/E2E sur sandbox.
5. Si validé → merge vers `dev` (pré-prod) — merge direct.
6. PR GitHub `dev` → `main` (jamais de merge CLI vers main) — l'utilisateur valide et merge lui-même.
7. Suppression de la branche `feat/notifications` après merge.
