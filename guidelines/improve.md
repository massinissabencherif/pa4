# Comicster - Ameliorations et corrections relevees

Ce document liste les problemes, risques et pistes d'amelioration releves lors de l'analyse du projet. Il est redige pour servir de base exploitable par un agent de code comme Claude: chaque point donne le contexte, l'impact, les fichiers concernes et une piste de correction.

## Priorite haute

### 1. Le lien Admin n'apparait pas pour les SUPER_ADMIN

**Constat**

Dans le layout principal, le bouton Admin est affiche uniquement si le role decode depuis le JWT vaut `ADMIN`.

Fichier concerne:

- `frontend/app/layouts/default.vue`

Zone concernee:

```js
const isAdmin = computed(() => {
  if (!token.value) return false
  try {
    const payload = JSON.parse(atob(token.value.split('.')[1]))
    return payload.role === 'ADMIN'
  } catch {
    return false
  }
})
```

Le middleware frontend, lui, autorise bien `ADMIN` et `SUPER_ADMIN`.

Fichier concerne:

- `frontend/app/middleware/admin.js`

```js
if (!['ADMIN', 'SUPER_ADMIN'].includes(payload.role)) return navigateTo('/')
```

**Impact**

Un super administrateur peut techniquement acceder a `/admin`, mais l'interface ne lui affiche pas le raccourci. C'est une incoherence UX et cela peut donner l'impression que le compte super admin n'a pas les droits attendus.

**Correction recommandee**

Modifier le computed du layout:

```js
return ['ADMIN', 'SUPER_ADMIN'].includes(payload.role)
```

**Tests a ajouter**

- Test composant ou E2E: un JWT avec role `SUPER_ADMIN` affiche le lien Admin.
- Test existant ou manuel: un JWT `USER` ne l'affiche pas.

---

### 2. Configuration Docker incomplete pour les secrets critiques

**Constat**

Le serveur valide plusieurs secrets critiques au demarrage:

Fichier concerne:

- `backend/src/server.js`

Secrets attendus:

```js
const REQUIRED_SECRETS = ["JWT_SECRET", "SESSION_SECRET", "TOTP_ENCRYPTION_KEY"];
```

Mais `docker-compose.yml` ne transmet pas `SESSION_SECRET` ni `TOTP_ENCRYPTION_KEY` au service backend.

Fichier concerne:

- `docker-compose.yml`

Bloc backend actuel:

```yaml
environment:
  PORT: 3001
  DATABASE_URL: postgresql://comicster:${POSTGRES_PASSWORD:-comicster_secret}@postgres:5432/comicster
  JWT_SECRET: ${JWT_SECRET:-change_me_in_production}
  JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-7d}
  MARVEL_PUBLIC_KEY: ${MARVEL_PUBLIC_KEY:-}
  MARVEL_PRIVATE_KEY: ${MARVEL_PRIVATE_KEY:-}
  GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:-}
  GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET:-}
  GITHUB_CLIENT_ID: ${GITHUB_CLIENT_ID:-}
  GITHUB_CLIENT_SECRET: ${GITHUB_CLIENT_SECRET:-}
  API_BASE_URL: ${API_BASE_URL:-}
  FRONTEND_URL: ${FRONTEND_URL:-http://localhost:3000}
```

Le `.env.example` racine contient `SESSION_SECRET`, mais pas `TOTP_ENCRYPTION_KEY`. Le fichier `backend/.env.example` contient une cle TOTP d'exemple, mais ce fichier n'est pas celui utilise par `docker-compose.yml` a la racine.

**Impact**

- En production, si `NODE_ENV=production` est ajoute, le backend peut refuser de demarrer car les variables sont absentes.
- La 2FA peut echouer au moment de generer/verifier les secrets TOTP.
- Les secrets documentes ne correspondent pas exactement aux secrets injectes.

**Correction recommandee**

Ajouter au backend dans `docker-compose.yml`:

```yaml
NODE_ENV: ${NODE_ENV:-production}
SESSION_SECRET: ${SESSION_SECRET:?SESSION_SECRET is required}
TOTP_ENCRYPTION_KEY: ${TOTP_ENCRYPTION_KEY:?TOTP_ENCRYPTION_KEY is required}
```

Eventuellement rendre aussi `JWT_SECRET` obligatoire:

```yaml
JWT_SECRET: ${JWT_SECRET:?JWT_SECRET is required}
```

Completer `.env.example` racine:

```env
NODE_ENV=production
TOTP_ENCRYPTION_KEY=replace_with_64_hex_chars
```

Verifier que `SESSION_SECRET` et `JWT_SECRET` sont distincts.

**Tests / verification**

- `docker compose config` doit montrer les variables attendues.
- En mode production avec secrets manquants, le backend doit echouer explicitement.
- Avec secrets corrects, le backend doit demarrer.

---

### 3. Refresh token stocke dans un cookie accessible au JavaScript

**Constat**

Le frontend stocke les tokens via `useCookie`:

Fichier concerne:

- `frontend/app/composables/useAuth.js`

```js
const token = useCookie('auth_token', { maxAge: 60 * 60 * 24 * 15 })
const refreshTokenCookie = useCookie('refresh_token', { maxAge: 60 * 60 * 24 * 30 })
```

Ces cookies sont crees cote client et ne sont donc pas `HttpOnly`. Le refresh token est accessible au JavaScript.

**Impact**

En cas de faille XSS, un attaquant peut recuperer le refresh token, ce qui est plus grave que le vol d'un access token court. Le projet a deja une logique de rotation des refresh tokens cote backend, mais le stockage frontend affaiblit ce benefice.

**Correction recommandee**

Option robuste:

- Faire poser le refresh token par le backend dans un cookie `HttpOnly`, `Secure`, `SameSite=Lax` ou `Strict`.
- Ne retourner au frontend que l'access token et les infos utilisateur.
- Modifier `/auth/login`, `/auth/register`, `/auth/oauth/exchange`, `/auth/refresh` et `/auth/logout`.
- Modifier CORS pour accepter les credentials.
- Cote frontend, appeler `/auth/refresh` avec `credentials: 'include'` et ne plus lire `refresh_token`.

Option intermediaire si l'architecture actuelle est conservee:

- Ajouter au minimum les options `sameSite`, `secure` selon l'environnement, et une duree plus coherente avec l'expiration reelle des tokens.
- Centraliser les appels API pour reduire l'exposition et les incoherences.

Exemple minimal cote client:

```js
const secure = config.public.appEnv === 'production'
const token = useCookie('auth_token', {
  maxAge: 60 * 15,
  sameSite: 'lax',
  secure,
})
```

Mais la vraie correction securite reste le cookie `HttpOnly` pose par le serveur.

**Tests a ajouter**

- Login pose bien un cookie refresh `HttpOnly`.
- Refresh fonctionne sans refresh token dans le body.
- Logout supprime le cookie et invalide le token en base.

---

### 4. Pas de refresh automatique centralise sur les appels API

**Constat**

Le composable `useApi` ajoute seulement le header Authorization:

Fichier concerne:

- `frontend/app/composables/useApi.js`

```js
function apiFetch(path, options = {}) {
  return $fetch(base + path, {
    ...options,
    headers: {
      ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
      ...options.headers,
    },
  })
}
```

Plusieurs pages utilisent directement `$fetch` ou `useFetch` avec le token courant. Le refresh automatique existe dans `fetchMe`, mais pas pour les autres appels.

**Impact**

Quand l'access token expire:

- certaines pages peuvent afficher une erreur au lieu de rafraichir le token;
- le comportement varie selon la page;
- duplication de logique d'auth dans les composants;
- risque de bugs intermittents difficiles a reproduire.

**Correction recommandee**

Faire de `useApi` le point d'entree unique des appels authentifies.

Piste:

```js
export function useApi() {
  const config = useRuntimeConfig()
  const base = config.public.apiBase
  const { token, refreshAccessToken, logout } = useAuth()

  async function apiFetch(path, options = {}) {
    try {
      return await $fetch(base + path, {
        ...options,
        headers: {
          ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
          ...options.headers,
        },
      })
    } catch (error) {
      if (error?.status === 401) {
        try {
          await refreshAccessToken()
          return await $fetch(base + path, {
            ...options,
            headers: {
              ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
              ...options.headers,
            },
          })
        } catch {
          await logout()
        }
      }
      throw error
    }
  }

  return { apiFetch }
}
```

Ensuite migrer progressivement les pages:

- `frontend/app/pages/feed.vue`
- `frontend/app/pages/dashboard.vue`
- `frontend/app/pages/journal.vue`
- `frontend/app/pages/reviews.vue`
- `frontend/app/pages/lists/index.vue`
- `frontend/app/pages/lists/[id].vue`
- `frontend/app/pages/admin/index.vue`
- `frontend/app/pages/admin/users.vue`
- `frontend/app/pages/settings/security.vue`

**Tests a ajouter**

- Simuler un 401 puis un refresh reussi: l'appel initial est rejoue.
- Simuler un refresh echoue: utilisateur deconnecte et redirige.

---

### 5. Suppression de comics potentiellement bloquee par les relations Prisma

**Constat**

Le schema Prisma definit plusieurs relations vers `Comic` sans `onDelete: Cascade`:

Fichier concerne:

- `backend/prisma/schema.prisma`

Relations concernees:

- `ReadingEntry -> Comic`
- `Review -> Comic`
- `ListItem -> Comic`

La route admin supprime directement le comic:

Fichier concerne:

- `backend/src/routes/admin.js`

```js
await prisma.comic.delete({ where: { id: req.params.id } });
```

**Impact**

Si un comic a ete ajoute au journal d'un utilisateur, note, ou ajoute dans une liste, la suppression admin peut echouer avec une contrainte de cle etrangere. Les fichiers uploades peuvent aussi etre supprimes avant que la suppression DB echoue, ce qui cree une incoherence: fichier disparu, entree DB encore presente.

**Correction recommandee**

Choisir une strategie explicite:

Option A - Cascade DB:

- Ajouter `onDelete: Cascade` sur les relations depuis `ReadingEntry`, `Review`, `ListItem`, `AuthorOnComic` si coherent produit.
- Generer une migration Prisma.

Option B - Suppression applicative transactionnelle:

```js
await prisma.$transaction(async (tx) => {
  await tx.comment.deleteMany({ where: { review: { comicId: comic.id } } })
  await tx.review.deleteMany({ where: { comicId: comic.id } })
  await tx.readingEntry.deleteMany({ where: { comicId: comic.id } })
  await tx.listItem.deleteMany({ where: { comicId: comic.id } })
  await tx.authorOnComic.deleteMany({ where: { comicId: comic.id } })
  await tx.comic.delete({ where: { id: comic.id } })
})
```

Puis supprimer les fichiers seulement apres succes DB, ou prevoir rollback/cleanup en cas d'erreur.

**Tests a ajouter**

- Creer un comic avec review, reading entry et list item, puis le supprimer via admin.
- Verifier que les donnees liees sont supprimees ou que l'API retourne une erreur claire selon la strategie choisie.
- Verifier que les fichiers ne sont pas supprimes si la transaction DB echoue.

---

## Priorite moyenne

### 6. Recherche locale par auteur trop stricte

**Constat**

Sans cles Marvel, la recherche locale fait:

Fichier concerne:

- `backend/src/routes/comics.js`

```js
const search = q.trim().toLowerCase();
...
{ authors: { has: search } }
```

`authors` est un tableau de strings. `has` cherche une valeur exacte dans le tableau, pas une correspondance partielle. Si `authors = ["Alan Moore"]`, une recherche `alan` ne matchera pas.

**Impact**

La recherche semble incomplete ou cassee pour les auteurs en mode local.

**Correction recommandee**

Options:

- Normaliser les auteurs en table relationnelle et chercher via `Author`.
- Ajouter un champ denormalise `searchText`.
- Faire une recherche SQL custom sur array/string si PostgreSQL est assume.
- A court terme, chercher d'abord par titre en DB, puis filtrer les auteurs cote JS sur un nombre borne de resultats.

Exemple court terme:

```js
const search = q.trim().toLowerCase()
const candidates = await prisma.comic.findMany({
  where: {
    OR: [
      { title: { contains: search, mode: "insensitive" } },
      { authors: { isEmpty: false } },
    ],
  },
  take: 200,
})
const comics = candidates.filter((comic) =>
  comic.title.toLowerCase().includes(search) ||
  comic.authors.some((a) => a.toLowerCase().includes(search))
)
```

Mieux: utiliser un vrai index de recherche.

**Tests a ajouter**

- Comic avec auteur `Alan Moore`.
- `/comics/search?q=alan` doit le retourner.
- `/comics/search?q=moore` doit le retourner.

---

### 7. Slug auteur non garanti unique lors de la mise a jour

**Constat**

La creation auteur gere les collisions de slug:

Fichier concerne:

- `backend/src/routes/admin.js`

```js
let slug = baseSlug;
let i = 1;
while (await prisma.author.findUnique({ where: { slug } })) {
  slug = `${baseSlug}-${i++}`;
}
```

Mais le PATCH auteur met le slug directement:

```js
updates.slug = slugify(name.trim());
```

**Impact**

Renommer un auteur avec un nom dont le slug existe deja provoque une erreur Prisma. L'API peut retourner une 500 au lieu d'une erreur claire ou d'un slug unique.

**Correction recommandee**

Extraire un helper `uniqueAuthorSlug(base, excludeId = null)`:

```js
async function uniqueAuthorSlug(name, excludeId = null) {
  const baseSlug = slugify(name)
  let slug = baseSlug
  let i = 1

  while (true) {
    const existing = await prisma.author.findUnique({ where: { slug } })
    if (!existing || existing.id === excludeId) return slug
    slug = `${baseSlug}-${i++}`
  }
}
```

Utiliser ce helper en POST et PATCH.

**Tests a ajouter**

- Creer `Alan Moore`, creer `Alan Moore 2`, renommer le deuxieme en `Alan Moore`.
- Verifier qu'un slug suffixe est genere ou qu'une erreur 409 explicite est retournee.

---

### 8. Slug de liste regenere a chaque renommage

**Constat**

La route PATCH liste regenere le slug quand le nom change:

Fichier concerne:

- `backend/src/routes/lists.js`

```js
updates.name = name.trim();
updates.slug = await uniqueSlug(name.trim());
```

**Impact**

Une liste publique partagee via `/lists/public/:slug` change d'URL des qu'elle est renommee. Les anciens liens publics cassent. Ce n'est pas forcement un bug, mais c'est une decision produit importante.

**Correction recommandee**

Choisir explicitement:

- Garder le slug stable apres creation, meme si le nom change.
- Ou ajouter un systeme d'alias/redirections si le slug change.
- Ou documenter que renommer une liste change son lien public.

Pour un produit social, il est generalement preferable de garder le slug stable.

**Tests a ajouter**

- Creer une liste publique.
- Renommer la liste.
- Verifier que l'ancien lien public fonctionne encore si slug stable souhaite.

---

### 9. Pas de gestion d'erreurs globale Express

**Constat**

La plupart des routes sont des handlers async sans wrapper `try/catch`. Les erreurs Prisma, reseau Marvel, parsing date, ou contraintes uniques peuvent remonter en erreur non formatee.

Fichiers concernes:

- `backend/src/server.js`
- toutes les routes dans `backend/src/routes/*.js`

**Impact**

- Reponses 500 non uniformes.
- Risque de logs incomplets.
- Experience frontend moins previsible.
- Tests difficiles a ecrire pour les cas d'erreur.

**Correction recommandee**

Ajouter un helper:

```js
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
}
```

L'utiliser sur les routes async:

```js
router.get("/me", requireAuth, asyncHandler(async (req, res) => {
  ...
}))
```

Ajouter un middleware d'erreur a la fin de `server.js`:

```js
app.use((err, req, res, next) => {
  console.error(err)
  if (err.code === "P2002") {
    return res.status(409).json({ error: "Conflit de donnees uniques" })
  }
  if (err.code === "P2025") {
    return res.status(404).json({ error: "Ressource introuvable" })
  }
  res.status(500).json({ error: "Erreur serveur" })
})
```

**Tests a ajouter**

- Collision unique retourne 409.
- Ressource inexistante retourne 404.
- Erreur inconnue retourne JSON `{ error }`.

---

### 10. Validation faible ou non centralisee des parametres `limit` / `offset`

**Constat**

Plusieurs routes convertissent directement des query params:

Exemples:

- `backend/src/routes/comics.js`
- `backend/src/routes/feed.js`

```js
skip: Number(offset),
take: Number(limit),
```

Dans `feed.js`, il y a une limite haute:

```js
const limit = Math.min(parseInt(req.query.limit) || 30, 50);
```

Mais ce n'est pas applique partout.

**Impact**

- `Number("abc")` donne `NaN`.
- Une valeur negative ou enorme peut causer des erreurs ou ralentissements.
- Incoherence entre endpoints.

**Correction recommandee**

Ajouter un helper:

```js
function parsePagination(query, defaults = { limit: 20, max: 100 }) {
  const limitRaw = Number.parseInt(query.limit, 10)
  const offsetRaw = Number.parseInt(query.offset, 10)

  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), defaults.max)
    : defaults.limit

  const offset = Number.isFinite(offsetRaw)
    ? Math.max(offsetRaw, 0)
    : 0

  return { limit, offset }
}
```

Utiliser partout.

**Tests a ajouter**

- `limit=abc` retourne valeur par defaut.
- `limit=-1` retourne 1 ou erreur 400 selon choix.
- `limit=10000` est borne.

---

### 11. Uploads: MIME + extension verifies, mais pas signature reelle du fichier

**Constat**

La route admin upload verifie:

- champ autorise;
- MIME;
- extension.

Fichier concerne:

- `backend/src/routes/admin.js`

Mais le MIME vient du client ou de Multer et ne garantit pas le contenu reel.

**Impact**

Un fichier malveillant peut etre deguise avec une extension et un MIME acceptes. Le risque est plus limite car les fichiers sont servis statiquement, mais cela reste un point securite.

**Correction recommandee**

Utiliser une librairie comme `file-type` pour lire les premiers octets apres upload temporaire.

Approche:

- stocker d'abord le fichier;
- lire la signature;
- verifier que PDF commence bien par `%PDF`;
- verifier que les images correspondent a jpeg/png/webp/gif;
- supprimer le fichier si mismatch.

Pour PDF:

```js
const buffer = await fs.promises.readFile(pdfFile.path, { length: 4 })
// ou lire un stream
```

**Tests a ajouter**

- Fichier `.pdf` avec contenu texte doit etre rejete.
- Image avec extension `.jpg` mais contenu non image doit etre rejetee.

---

### 12. Suppression de fichiers avant suppression DB

**Constat**

Dans la suppression admin d'un comic, les fichiers sont supprimes avant la suppression de la ligne DB:

Fichier concerne:

- `backend/src/routes/admin.js`

```js
for (const url of [comic.pdfUrl, comic.coverUrl]) {
  ...
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

await prisma.comic.delete({ where: { id: req.params.id } });
```

**Impact**

Si la suppression DB echoue apres suppression des fichiers, la base garde un comic pointant vers des fichiers inexistants.

**Correction recommandee**

- Faire la suppression DB d'abord dans une transaction.
- Supprimer les fichiers apres succes DB.
- Utiliser `fs.promises` plutot que `unlinkSync`.
- Logger les erreurs de suppression fichier sans casser la reponse si la DB est deja propre.

**Tests a ajouter**

- Simuler une erreur DB et verifier que les fichiers ne sont pas supprimes.
- Supprimer un comic valide et verifier que fichiers + DB sont nettoyes.

---

### 13. Incoherence possible autour de l'expiration JWT

**Constat**

Le backend utilise:

```js
process.env.JWT_EXPIRES_IN || "15m"
```

Mais dans `docker-compose.yml`, la valeur par defaut est:

```yaml
JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-7d}
```

Dans `.env.example`, elle vaut:

```env
JWT_EXPIRES_IN=15m
```

**Impact**

Selon l'environnement, les access tokens peuvent durer 15 minutes ou 7 jours. Cela change fortement le profil de securite.

**Correction recommandee**

Uniformiser sur `15m` pour l'access token, sauf raison explicite.

Dans `docker-compose.yml`:

```yaml
JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-15m}
```

**Tests / verification**

- Decoder un token emis en docker local et verifier `exp - iat`.

---

## Priorite basse / ameliorations produit

### 14. OAuth: emails GitHub parfois absents ou prives

**Constat**

`findOrCreateOAuthUser` lit:

```js
const email = profile.emails?.[0]?.value;
```

Pour GitHub, l'email principal peut etre prive ou absent selon les permissions et la strategie Passport. Le code cree alors un email artificiel:

```js
email || `${provider}_${profile.id}@oauth.local`
```

**Impact**

- Un utilisateur peut avoir deux comptes si son email n'est pas expose sur un provider puis l'est plus tard.
- Les emails artificiels ne sont pas utilisables pour communication ou recuperation compte.

**Correction recommandee**

- Pour GitHub, appeler explicitement l'API `/user/emails` si necessaire.
- Stocker les identites OAuth dans une table separee `OAuthAccount` plutot que dans `User.oauthProvider/oauthId`.
- Permettre plusieurs providers par utilisateur.

Modele possible:

```prisma
model OAuthAccount {
  id         String @id @default(cuid())
  provider   String
  providerId String
  userId     String
  user       User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerId])
}
```

---

### 15. Structure OAuth limitee a un seul provider par utilisateur

**Constat**

Le modele `User` contient:

```prisma
oauthProvider String?
oauthId       String?
```

**Impact**

Un utilisateur ne peut pas proprement lier Google + GitHub au meme compte. Si un compte local existe, le premier OAuth peut remplir ces champs; un second provider ecraserait potentiellement ou serait difficile a gerer.

**Correction recommandee**

Introduire une table `OAuthAccount` comme decrit au point precedent.

---

### 16. Badges attribues uniquement quand `/stats/me` est appele

**Constat**

Les badges sont attribues dans:

Fichier concerne:

- `backend/src/routes/stats.js`

```js
await checkAndAwardBadges(userId, prisma)
```

**Impact**

Un utilisateur peut accomplir une action mais ne voir le badge apparaitre qu'en ouvrant le dashboard stats. C'est acceptable pour un prototype, mais moins satisfaisant produit.

**Correction recommandee**

Attribuer les badges apres les actions pertinentes:

- passage d'une lecture a `FINISHED`;
- creation d'un avis;
- follow d'un utilisateur;
- passage a `IN_PROGRESS`;
- inscription pour `early_adopter`.

Ou garder une attribution lazy, mais renommer/assumer ce comportement.

**Tests a ajouter**

- Apres avoir termine un premier comic, `first_read` est attribue sans appeler `/stats/me`.

---

### 17. Feed vide: "random" pas vraiment random sur toute la base

**Constat**

Quand l'utilisateur ne suit personne, le feed prend les 20 derniers avis puis fait un shuffle JS:

Fichier concerne:

- `backend/src/routes/feed.js`

```js
const randomReviews = await prisma.review.findMany({
  where: { content: { not: null } },
  orderBy: { createdAt: "desc" },
  take: 20,
})

const shuffled = randomReviews.sort(() => Math.random() - 0.5).slice(0, 3);
```

**Impact**

Les suggestions viennent uniquement des 20 avis les plus recents, pas de toute la communaute. Le `sort(() => Math.random() - 0.5)` est aussi une methode de shuffle biaisee.

**Correction recommandee**

Options:

- Assumer "avis recents suggeres" au lieu de "aleatoires".
- Utiliser un shuffle Fisher-Yates.
- Utiliser une requete SQL random si la base est petite:

```sql
ORDER BY random()
LIMIT 3
```

Avec Prisma, passer par `$queryRaw` si necessaire.

---

### 18. Recommandations: score simple et pas de ponderation temporelle

**Constat**

Le moteur de recommandations compte les genres/auteurs des comics dans le journal, puis score les candidats avec:

- correspondance genre;
- correspondance auteur;
- note moyenne ou 3 par defaut.

Fichier concerne:

- `backend/src/routes/feed.js`

**Impact**

Le systeme est clair et suffisant pour une premiere version, mais il peut recommander des choses peu pertinentes:

- les comics "a lire" influencent autant les gouts que les comics termines;
- une seule note 5 peut surpondere un comic;
- pas de prise en compte des avis de l'utilisateur;
- pas de popularite robuste.

**Ameliorations possibles**

- Ne compter que les lectures terminees ou avis positifs.
- Ponderer par rating donne par l'utilisateur.
- Ajouter un minimum de reviews avant d'utiliser la moyenne.
- Ajouter une composante popularite/logarithme du nombre d'avis.
- Expliquer le pourquoi de chaque recommandation cote API.

Exemple de payload utile:

```js
{
  id,
  title,
  score,
  reasons: ["Genre: Super Hero", "Auteur: Brian Michael Bendis"]
}
```

---

### 19. Authors: duplication entre champ texte `Comic.authors` et relation `AuthorOnComic`

**Constat**

Le modele `Comic` contient:

```prisma
authors String[]
authorLinks AuthorOnComic[]
```

Il y a donc deux sources de verite:

- tableau texte venant de Marvel ou de l'admin;
- relation structuree vers `Author`.

**Impact**

- Les pages peuvent afficher des auteurs differents selon la source utilisee.
- Les recommandations utilisent `Comic.authors`, pas `AuthorOnComic`.
- Les pages auteurs utilisent `AuthorOnComic`.
- L'admin doit maintenir deux champs.

**Correction recommandee**

Choisir une source canonique:

Option A:

- Garder `Comic.authors` comme cache denormalise.
- Mettre a jour automatiquement ce tableau quand `AuthorOnComic` change.

Option B:

- Migrer vers `AuthorOnComic` comme source canonique.
- Adapter recherche/recommandations pour utiliser la relation.

Pour une app evolutive, l'option B est plus propre.

---

### 20. Pages frontend: beaucoup d'appels directs a `$fetch` / `useFetch`

**Constat**

Plusieurs pages construisent directement les URLs API et headers.

Exemples:

- `frontend/app/pages/feed.vue`
- `frontend/app/pages/dashboard.vue`
- `frontend/app/pages/admin/index.vue`
- `frontend/app/pages/admin/users.vue`
- `frontend/app/pages/settings/security.vue`

**Impact**

- Duplication de code.
- Gestion auth/erreurs heterogene.
- Plus difficile de changer la strategie de token plus tard.

**Correction recommandee**

- Utiliser `useApi` partout pour les appels authentifies.
- Ajouter un `usePublicApi` ou permettre `auth: false` pour les appels publics.
- Centraliser base URL, headers, refresh, logout, messages d'erreurs.

---

### 21. Tests backend dependants d'une base reelle

**Constat**

Les tests d'integration utilisent Prisma directement et l'app Express:

Fichier concerne:

- `backend/src/__tests__/integration.test.js`

Ils supposent qu'une base PostgreSQL est disponible via `DATABASE_URL`.

**Impact**

Les tests peuvent echouer localement ou en CI si la base n'est pas lancee/migree. Cela semble volontaire, mais doit etre documente.

**Correction recommandee**

- Ajouter une section README "Tests".
- Fournir une commande compose pour lancer une DB de test.
- Utiliser une base separee `comicster_test`.
- Ajouter `prisma migrate deploy` ou `prisma migrate reset` dans le setup de test selon environnement.

Exemple:

```bash
docker compose -f docker-compose.dev.yml up -d postgres
DATABASE_URL=postgresql://comicster:comicster_secret@localhost:5432/comicster_test npm test
```

---

### 22. Playwright cible par defaut une URL distante

**Constat**

Fichier concerne:

- `e2e/playwright.config.ts`

```ts
const BASE_URL = process.env.BASE_URL || 'https://dev.sitedetestdemassinissabencherif.com'
```

**Impact**

Les tests E2E lancent par defaut contre une URL distante, pas contre l'environnement local. Cela peut etre voulu pour staging, mais surprenant en local.

**Correction recommandee**

Options:

- Defaut local: `http://localhost:3000`.
- Garder staging seulement en CI via variable `BASE_URL`.
- Documenter clairement.

Possibilite:

```ts
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
```

---

### 23. pgAdmin expose avec identifiants faibles par defaut

**Constat**

Dans `docker-compose.yml`:

```yaml
PGADMIN_DEFAULT_EMAIL: ${PGADMIN_EMAIL:-admin@comicster.com}
PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD:-admin}
ports:
  - "5050:80"
```

**Impact**

Si ce compose est utilise sur un serveur expose publiquement sans reverse proxy/protection, pgAdmin peut etre accessible avec un mot de passe faible.

**Correction recommandee**

- Ne pas lancer pgAdmin en production par defaut.
- Le mettre dans un profile Docker:

```yaml
profiles: ["tools"]
```

- Rendre `PGADMIN_PASSWORD` obligatoire si active.
- Restreindre l'exposition a `127.0.0.1:5050:80` si usage local.

---

### 24. PostgreSQL expose publiquement par defaut dans compose principal

**Constat**

Dans `docker-compose.yml`:

```yaml
ports:
  - "5432:5432"
```

**Impact**

Sur une machine serveur, PostgreSQL peut etre expose sur l'interface publique si le firewall ne bloque pas. C'est inutile si seul le backend Docker y accede.

**Correction recommandee**

- Pour production, supprimer le mapping `5432:5432`.
- Ou limiter a localhost:

```yaml
ports:
  - "127.0.0.1:5432:5432"
```

- Garder l'exposition uniquement dans `docker-compose.dev.yml`.

---

### 25. Umami expose avec secret par defaut

**Constat**

Dans `docker-compose.yml`:

```yaml
APP_SECRET: ${UMAMI_SECRET:-change_me_in_production}
```

**Impact**

Si `UMAMI_SECRET` n'est pas configure, l'analytics tourne avec un secret faible.

**Correction recommandee**

Rendre obligatoire:

```yaml
APP_SECRET: ${UMAMI_SECRET:?UMAMI_SECRET is required}
```

Et documenter la generation:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Qualite code et maintenabilite

### 26. Extraire les validations communes

**Constat**

Il existe plusieurs validations ad hoc:

- `validate` dans `auth.js`;
- `requireField` et `maxLen` dans `admin.js`;
- validations manuelles dans `reviews.js`, `lists.js`, `reading.js`.

**Impact**

Duplication, messages incoherents, oublis possibles.

**Correction recommandee**

Introduire une librairie de validation comme Zod, ou un petit module interne.

Exemple avec Zod:

```js
const createReviewSchema = z.object({
  comicId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  content: z.string().max(5000).optional().nullable(),
})
```

Ajouter un helper:

```js
function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) return res.status(400).json({ error: result.error.issues[0].message })
    req.body = result.data
    next()
  }
}
```

---

### 27. Ajouter des index supplementaires selon les requetes

**Constat**

Le schema a deja certains index utiles:

- `ReadingEntry.userId`
- `ReadingEntry.userId,status`
- `Review.comicId`
- `Follow.followingId`
- `List.userId`

Mais plusieurs requetes filtrent/trient sur:

- `Review.userId`
- `Review.createdAt`
- `ReadingEntry.finishedAt`
- `ReadingEntry.startedAt`
- `Comic.createdAt`
- `Comic.publisher`

**Impact**

Quand la base grossit, feed, profils publics, reviews utilisateur et dashboard peuvent ralentir.

**Correction recommandee**

Evaluer et ajouter:

```prisma
model Review {
  ...
  @@index([userId, createdAt])
  @@index([comicId, createdAt])
}

model ReadingEntry {
  ...
  @@index([userId, updatedAt])
  @@index([status, finishedAt])
  @@index([status, startedAt])
}

model Comic {
  ...
  @@index([createdAt])
}
```

Adapter selon les requetes reelles et EXPLAIN ANALYZE.

---

### 28. Harmoniser le style JavaScript

**Constat**

Certains fichiers utilisent des points-virgules, d'autres non. Certains utilisent commentaires tres riches, d'autres peu.

Exemples:

- `backend/src/routes/authors.js` sans points-virgules.
- `backend/src/routes/auth.js` avec points-virgules.

**Impact**

Pas bloquant, mais cela donne une base moins homogene.

**Correction recommandee**

- Ajouter ESLint + Prettier.
- Definir une convention unique.
- Ajouter un script:

```json
"lint": "eslint .",
"format": "prettier --write ."
```

---

### 29. Centraliser les helpers de slug

**Constat**

Il y a plusieurs fonctions `slugify`:

- `backend/src/routes/lists.js`
- `backend/src/routes/admin.js`

Elles n'ont pas exactement la meme logique. Celle des listes ne gere pas les accents, celle des auteurs les normalise.

**Impact**

Comportements differents selon ressource. Les noms avec accents peuvent produire des slugs moins propres cote listes.

**Correction recommandee**

Créer `backend/src/lib/slug.js`:

```js
export function slugify(str) {
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}
```

Puis importer partout.

---

### 30. Dates invalides non gerees explicitement

**Constat**

Certaines routes convertissent directement:

```js
publishedAt ? new Date(publishedAt) : null
birthDate ? new Date(birthDate) : null
```

**Impact**

Une date invalide peut produire `Invalid Date` et provoquer une erreur Prisma, ou etre stockee de facon inattendue selon driver.

**Correction recommandee**

Ajouter un helper:

```js
function parseOptionalDate(value, fieldName) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} doit etre une date valide`)
  }
  return date
}
```

Retourner 400 si invalide.

---

## Tests recommandes a ajouter

### Backend

- `SUPER_ADMIN` accede aux routes admin et voit les donnees attendues.
- `ADMIN` sans 2FA recoit `403` + `requires2FASetup`.
- `USER` ne peut pas acceder aux routes admin.
- Login 2FA:
  - sans code retourne `requires2FA`;
  - mauvais code retourne 401;
  - bon code retourne tokens.
- Recherche locale auteur partielle.
- Suppression comic avec relations existantes.
- PATCH auteur avec collision de slug.
- Validation `limit` / `offset`.
- Upload faux PDF rejete par signature.
- Logout invalide refresh token.
- Rotation refresh: ancien token invalide, nouveau token valide.

### Frontend / E2E

- Super admin voit le lien Admin.
- Token expire: appel API refresh automatiquement puis continue.
- Refresh echoue: redirection login.
- Flow 2FA setup admin.
- Liste publique reste accessible apres renommage si slug stable choisi.
- Recherche comic par auteur partiel.
- Acces `/admin` refuse pour user standard.

---

## Petites corrections rapides conseillees

Ces corrections sont peu risquees et peuvent etre faites rapidement:

1. Dans `frontend/app/layouts/default.vue`, remplacer `payload.role === 'ADMIN'` par `['ADMIN', 'SUPER_ADMIN'].includes(payload.role)`.
2. Dans `docker-compose.yml`, ajouter `SESSION_SECRET` et `TOTP_ENCRYPTION_KEY` au backend.
3. Dans `.env.example`, ajouter `TOTP_ENCRYPTION_KEY`.
4. Harmoniser `JWT_EXPIRES_IN` a `15m` dans `docker-compose.yml`.
5. Mettre pgAdmin dans un profile Docker ou restreindre son port a `127.0.0.1`.
6. Restreindre PostgreSQL a `127.0.0.1` ou retirer le port du compose production.
7. Extraire un helper `slugify` commun.
8. Ajouter un helper `parsePagination`.
9. Ajouter un middleware d'erreur Express.
10. Centraliser les appels API frontend via `useApi`.

