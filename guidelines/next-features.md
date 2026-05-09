# Next Features — Comicster

Idées discutées et validées lors de la session du 2026-05-09.
Ce document sert de référence pour les prochaines itérations.

---

## Gamification

### XP + Système de niveaux (priorité haute)
Remplace les badges isolés par une progression continue visible.

**Principe :**
- Chaque action rapporte des XP (lire un comic fini = +10, écrire un avis = +20, recevoir un like = +5, follow = +3)
- Les XP s'accumulent sur `User.xp INT @default(0)`
- 5 niveaux : Padawan → Lecteur → Expert → Critique → Légende

**Implémentation :**
- Champ `xp INT @default(0)` sur `User`
- Helper `awardXP(userId, amount)` appelé dans les routes concernées
- Affichage sur le profil et le dashboard (barre de progression + label du rang)
- Trigger badge automatique à certains seuils de XP

---

### Streak de lecture (priorité moyenne)
Pousser l'utilisateur à revenir chaque jour.

**Principe :**
- Champs `lastActiveDate DateTime?` et `currentStreak INT @default(0)` sur `User`
- Une activité de lecture (passage en IN_PROGRESS ou FINISHED) met à jour le streak
- Badges : 7j, 30j, 100j consécutifs

**Implémentation :**
- Middleware `updateStreak(userId)` appelé dans `PATCH /reading-list/:id/status`
- Si `lastActiveDate` = hier → `currentStreak += 1`, sinon reset à 1

---

### Objectif annuel de lecture (priorité moyenne)
Similaire à Goodreads. Simple et très visible.

**Principe :**
- L'user définit un objectif ("24 comics en 2026") sur sa page paramètres
- Barre de progression sur le dashboard : `N / objectif comics finis cette année`

**Implémentation :**
- Champ `readingGoal INT?` sur `User`
- PATCH `/me/goal` pour le définir
- Comptage des `ReadingEntry` FINISHED avec `finishedAt` dans l'année en cours

---

### Leaderboard mensuel (priorité moyenne)
Visibilité sociale, encourage la compétition amicale.

**Principe :**
- Top 5 lecteurs du mois par comics finis
- Top 5 critiques du mois par nombre d'avis
- Page `/classement` publique

**Implémentation :**
- Requête Prisma `groupBy` avec `finishedAt` entre début et fin du mois
- Pas de stockage supplémentaire nécessaire, calcul à la demande
- Cache 1h si charge élevée

---

### Badges supplémentaires (priorité basse)
À ajouter dans `backend/src/lib/badges.js` :

| Clé | Nom | Condition |
|-----|-----|-----------|
| `speed_reader` | Lecteur rapide | Finir un comic dans les 24h après l'avoir commencé |
| `weekend_warrior` | Guerrier du weekend | 3 comics finis un même weekend |
| `influencer` | Influenceur | Avoir 10 followers |
| `series_completer` | Collectionneur | Finir tous les comics d'un même auteur (min 3) |
| `liked_critic` | Critique populaire | Recevoir 20 likes au total sur ses avis |

---

## Sécurité utilisateurs

### Rate limiting sur les routes write (priorité critique)
Actuellement `authLimiter` couvre uniquement `/auth`. N'importe qui peut spammer les autres routes.

**À ajouter dans `backend/src/server.js` :**
```js
const writeLimiter = rateLimit({ windowMs: 60_000, max: 20, standardHeaders: true, legacyHeaders: false });
app.use("/reviews", writeLimiter, reviewsRouter);
app.use("/comments", writeLimiter, commentsRouter);
app.use("/lists", writeLimiter, listsRouter);
app.use("/guides", writeLimiter, guidesRouter);
```

---

### Sanitization XSS des contenus (priorité haute)
Les champs `content` des reviews, commentaires et topics guides sont stockés bruts.

**Approche recommandée — rejet de tout HTML :**
```js
function rejectHtml(str) {
  if (/<[^>]+>/.test(str)) throw new Error("HTML non autorisé");
}
```
À appeler dans toutes les routes qui reçoivent du `content` libre (reviews, comments, guides topics, guides replies).

**Alternative :** `isomorphic-dompurify` si on veut autoriser du markdown rendu (mais complexité accrue).

---

### Vérification email (double opt-in) (priorité haute)
Actuellement n'importe quel compte peut être créé sans vérifier l'email. Élimine ~80% des bots.

**Logique à textualiser et valider avant implémentation :**

```
POST /auth/register
  → créer User avec emailVerified: false
  → générer token aléatoire (crypto.randomBytes(32).toString('hex'))
  → stocker dans EmailVerification { userId, token, expiresAt: +24h }
  → envoyer email avec lien GET /auth/verify-email?token=xxx
  → retourner 201 avec message "Vérifie ton email avant de te connecter"

POST /auth/login
  → si emailVerified === false → 403 "Email non vérifié — consulte ta boîte mail"

GET /auth/verify-email?token=xxx
  → trouver EmailVerification par token
  → vérifier non expiré
  → passer User.emailVerified = true
  → supprimer le EmailVerification
  → rediriger vers /auth/login?verified=1

POST /auth/resend-verification
  → si déjà vérifié → 400
  → sinon supprimer ancien token + en créer un nouveau + renvoyer email
```

**Infrastructure nécessaire :**
- Champ `emailVerified Boolean @default(false)` sur `User`
- Nouveau modèle `EmailVerification { id, userId, token(unique), expiresAt }`
- Service email : Resend (resend.com) ou Brevo — gratuit jusqu'à 300/j
- Template email minimal HTML (lien + branding Comicster)
- Les comptes OAuth (Google/GitHub) sont `emailVerified: true` d'office car l'email est garanti par le provider

**Cas particulier OAuth :** Dans les callbacks Google/GitHub, passer `emailVerified: true` à la création.

**Note :** À textualiser en spec complète avec l'équipe avant d'implémenter (impacts sur les tests existants, gestion des anciens comptes, etc.)

---

### Système de signalement (priorité haute)
Aucun mécanisme pour reporter un contenu abusif. Spec à valider avant implémentation.

**Logique proposée (à textualiser) :**

```
Cibles signalables : Review, Comment, GuideTopic, GuideReply

Modèle Report {
  id, reporterId, targetType (REVIEW|COMMENT|GUIDE_TOPIC|GUIDE_REPLY),
  targetId, reason (SPAM|HATE|NSFW|HARCELMENT|AUTRE), details?,
  status (PENDING|RESOLVED|DISMISSED), createdAt
}

POST /reports — créer un signalement (requireAuth)
  → vérifier que la cible existe
  → vérifier que l'user n'a pas déjà signalé cette cible
  → créer le Report en PENDING

GET /admin/reports — liste des signalements en attente (requireAdmin)
PATCH /admin/reports/:id — changer status (RESOLVED = supprimer cible, DISMISSED = ignorer)
```

**Questions à trancher :**
- Combien de signalements déclenchent une action automatique (suspend compte) ?
- Un report RESOLVED supprime-t-il le contenu ou le cache ?
- Notifie-t-on l'auteur du contenu signalé ?
- Historique des reports sur un user (réputation) ?

---

### Cooldown anti-spam sur les avis (priorité haute)
Rien n'empêche de poster 50 avis en rafale (le rate limiter global aide mais n'est pas assez précis).

**Approche :**
- Avant de créer une Review ou un Comment, vérifier que le dernier `createdAt` de l'user est > 30s
- Pas besoin de champ supplémentaire : `findFirst({ orderBy: { createdAt: 'desc' }, where: { userId } })`

```js
const last = await prisma.review.findFirst({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } });
if (last && Date.now() - last.createdAt.getTime() < 30_000) {
  return res.status(429).json({ error: "Attends 30 secondes entre deux avis" });
}
```

---

### Limite de longueur sur les reviews (priorité critique)
Les commentaires ont une limite à 1000 chars. Les reviews n'en ont **aucune**.

**À ajouter dans `backend/src/routes/reviews.js` (POST et PATCH) :**
```js
if (content && content.length > 5000) {
  return res.status(400).json({ error: "Avis trop long (max 5000 caractères)" });
}
```

---

### Confidentialité du profil (priorité moyenne)
Tous les profils et journals sont visibles publiquement.

**Logique proposée :**
- Champ `isPrivate Boolean @default(false)` sur `User`
- Toggle dans `/settings/security` ou une nouvelle page `/settings/privacy`
- Si `isPrivate === true` :
  - `GET /users/:username` retourne uniquement username + avatar (pas les avis, badges, listes)
  - `GET /users/:username/reviews` → 403 si l'appelant ne follow pas l'user
  - Les listes restent gérées par leur propre `isPublic`
- Les followers existants gardent l'accès

---

## Recommandations techniques générales

### Zod pour la validation backend
Actuellement : validation manuelle (`if (!x) return 400`).
Remplacer par des schemas Zod dans toutes les routes pour homogénéiser et tester la validation.

```js
import { z } from 'zod';
const reviewSchema = z.object({
  comicId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  content: z.string().max(5000).optional(),
});
```

### Service email transactionnel
Nécessaire pour la vérification email. Resend (resend.com) recommandé :
- SDK Node.js simple : `resend.emails.send({ from, to, subject, html })`
- Gratuit jusqu'à 300 emails/jour
- Var d'env à ajouter : `RESEND_API_KEY`

### Sentry (error tracking production)
`@sentry/node` sur le backend + `@sentry/nuxt` sur le frontend.
DSN à stocker en env. Zero code à écrire si on utilise le wizard Sentry.

### Backup PostgreSQL automatique
Cron `pg_dump` quotidien avant mise en prod.
```bash
pg_dump $DATABASE_URL | gzip > /backups/comicster_$(date +%Y%m%d).sql.gz
```

### CI GitHub Actions
Lancer Vitest sur chaque push sur `main` et `dev`.
Fichier `.github/workflows/test.yml` — ~20 lignes.
