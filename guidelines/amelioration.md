# Ameliorations demandees - Specs pour Claude

Ce document contient uniquement les points demandes explicitement :

- liste de noms d'utilisateur interdits
- couvertures par defaut selon le comic
- enrichissement de la page `/feed`
- fleche de retour interne
- likes sur les commentaires

## 1. Liste de usernames interdits / reserves

Objectif : empecher la creation de comptes avec des noms problematiques, trompeurs ou reserves par l'application.

Pourquoi : les usernames sont publics et peuvent etre utilises dans des URLs/profils. Certains noms comme `admin`, `support`, `api`, `login` ou `comicster` peuvent creer de la confusion, de l'usurpation ou des conflits futurs avec les routes.

A implementer :

- ajouter une liste centralisee de usernames interdits cote backend
- bloquer ces usernames a l'inscription
- normaliser avant validation : `trim`, `lowercase`
- retourner une erreur claire : `Ce nom d'utilisateur est reserve`
- ajouter une validation frontend sur la page d'inscription si possible
- prevoir la meme validation si une future feature de changement de pseudo est ajoutee

Exemples de noms a interdire :

admin, administrator, root, superadmin, moderator, mod, support, help, api, auth, login, logout, register, me, users, user, profile, settings, dashboard, feed, comics, comic, authors, author, lists, reviews, review, stats, notifications, search, legal, rgpd, mentions-legales, security, system, null, undefined, anonymous, comicster.

Fichiers probables :

- `backend/src/routes/auth.js`
- nouveau helper possible : `backend/src/lib/reservedUsernames.js`
- `frontend/app/pages/auth/register.vue`
- `backend/src/__tests__/integration.test.js`

Implementation conseillee :

```js
const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "root",
  "support",
  "api",
  "auth",
  "login",
  "register",
  "me",
  "users",
  "profile",
  "settings",
  "dashboard",
  "feed",
  "comics",
  "authors",
  "lists",
  "reviews",
  "stats",
  "comicster",
])

export function normalizeUsername(username) {
  return String(username || "").trim().toLowerCase()
}

export function isReservedUsername(username) {
  return RESERVED_USERNAMES.has(normalizeUsername(username))
}
```

Tests a prevoir :

- inscription avec `admin` refusee
- inscription avec `Admin` refusee
- inscription avec ` admin ` refusee
- inscription avec un username normal acceptee

## 2. Couvertures par defaut intelligentes selon le comic

Objectif : eviter les fiches comics sans visuel en affichant une couverture par defaut adaptee au contenu.

Exemple attendu : si un comic Batman n'a pas de couverture specifique, afficher une illustration par defaut Batman. Si aucun theme n'est detecte, afficher une couverture generique Comicster.

A implementer :

- creer une fonction de resolution de couverture
- ne pas ecraser `coverUrl` si une vraie couverture existe
- utiliser le titre, la description, les genres, les auteurs et le publisher pour detecter un theme
- prevoir des assets par defaut dans `frontend/public/covers/defaults/`
- utiliser un fallback final `default-comic.webp`

Mapping de depart possible :

- batman -> `/covers/defaults/batman.webp`
- spider-man, spiderman, spider man -> `/covers/defaults/spiderman.webp`
- superman -> `/covers/defaults/superman.webp`
- x-men, xmen -> `/covers/defaults/xmen.webp`
- avengers -> `/covers/defaults/avengers.webp`
- deadpool -> `/covers/defaults/deadpool.webp`
- wonder woman -> `/covers/defaults/wonder-woman.webp`
- justice league -> `/covers/defaults/justice-league.webp`
- marvel -> `/covers/defaults/marvel.webp`
- dc -> `/covers/defaults/dc.webp`
- fallback -> `/covers/defaults/default-comic.webp`

Fichiers probables :

- nouveau helper : `frontend/app/utils/comicCover.js`
- `frontend/app/pages/comics/search.vue`
- `frontend/app/pages/comics/[id].vue`
- `frontend/app/pages/feed.vue`
- `frontend/app/pages/journal.vue`
- `frontend/app/pages/lists/[id].vue`
- `frontend/app/pages/lists/public/[slug].vue`
- `frontend/app/pages/profile/[username].vue`
- `frontend/app/pages/authors/[slug].vue`

Implementation conseillee :

```js
const COVER_RULES = [
  { keys: ["batman", "bruce wayne", "gotham"], cover: "/covers/defaults/batman.webp" },
  { keys: ["spider-man", "spiderman", "spider man", "peter parker"], cover: "/covers/defaults/spiderman.webp" },
  { keys: ["superman", "clark kent"], cover: "/covers/defaults/superman.webp" },
  { keys: ["x-men", "xmen", "wolverine"], cover: "/covers/defaults/xmen.webp" },
  { keys: ["avengers"], cover: "/covers/defaults/avengers.webp" },
  { keys: ["deadpool"], cover: "/covers/defaults/deadpool.webp" },
]

export function getComicCover(comic) {
  if (comic?.coverUrl) return comic.coverUrl

  const haystack = [
    comic?.title,
    comic?.description,
    ...(comic?.genres || []),
    ...(comic?.authors || []),
    comic?.publisher,
  ].filter(Boolean).join(" ").toLowerCase()

  return COVER_RULES.find((rule) =>
    rule.keys.some((key) => haystack.includes(key))
  )?.cover || "/covers/defaults/default-comic.webp"
}
```

Points d'attention :

- ne pas utiliser d'images sous copyright non autorisees si le projet est public
- preferer des illustrations originales, generees ou libres
- garder un ratio de couverture fixe pour eviter les sauts de layout
- ajouter des `alt` descriptifs

Tests a prevoir :

- comic Batman sans `coverUrl` affiche la couverture Batman
- comic avec `coverUrl` conserve sa vraie couverture
- comic inconnu affiche la couverture generique

## 3. Enrichir la page `/feed`

Objectif : transformer `/feed` en vraie page d'accueil connectee, pas seulement un flux social.

Clarification : la demande mentionne "page de connexion" avec l'URL `/feed`, mais techniquement `/feed` est la page affichee apres connexion.

Blocs a ajouter :

- derniers ajouts a la bibliotheque
- comics les plus lus aujourd'hui
- commentaires les plus aimes

UX souhaitee :

- desktop : feed principal + sections secondaires ou colonne laterale
- mobile : sections empilees
- chaque item doit etre cliquable
- prevoir des etats vides propres
- ne pas surcharger la page avec trop de texte explicatif

### Derniers ajouts a la bibliotheque

Definition recommandee : derniers comics ajoutes en base, tries par `Comic.createdAt desc`.

Endpoint possible :

`GET /comics/latest?limit=6`

Payload attendu :

```json
{
  "comics": [
    {
      "id": "...",
      "externalId": "...",
      "title": "...",
      "coverUrl": "...",
      "publisher": "...",
      "createdAt": "..."
    }
  ]
}
```

### Comics les plus lus aujourd'hui

Definition recommandee : comics ayant le plus d'entrees de lecture mises a jour aujourd'hui.

Version simple :

- compter les `ReadingEntry` dont `updatedAt` est compris entre debut et fin de journee
- grouper par `comicId`
- trier par count desc

Endpoint possible :

`GET /comics/trending?period=today&limit=6`

ou :

`GET /stats/trending/today?limit=6`

### Commentaires les plus aimes

Pre-requis : la feature de like sur les commentaires doit exister.

Definition recommandee : commentaires tries par nombre de likes decroissant, idealement sur une periode recente.

Endpoint possible :

`GET /comments/top-liked?period=7d&limit=5`

Payload attendu :

```json
{
  "comments": [
    {
      "id": "...",
      "content": "...",
      "likeCount": 12,
      "createdAt": "...",
      "user": { "id": "...", "username": "..." },
      "review": {
        "id": "...",
        "comic": {
          "id": "...",
          "externalId": "...",
          "title": "...",
          "coverUrl": "..."
        }
      }
    }
  ]
}
```

Fichiers probables :

- `frontend/app/pages/feed.vue`
- `backend/src/routes/feed.js`
- `backend/src/routes/comics.js`
- `backend/src/routes/stats.js`
- nouvelle route possible : `backend/src/routes/comments.js`
- `backend/prisma/schema.prisma` si likes commentaires ajoutes

Tests a prevoir :

- les trois blocs s'affichent quand les endpoints retournent des donnees
- etat vide discret si aucune donnee
- trending aujourd'hui ne compte pas les lectures d'hier
- commentaires populaires tries par nombre de likes decroissant

## 4. Ajouter une fleche de retour interne

Objectif : offrir une navigation retour fiable sans dependre uniquement du bouton retour du navigateur.

Pourquoi : le retour navigateur peut etre instable dans une SPA, surtout apres login, OAuth, redirections, filtres, recherche ou pages dynamiques.

A implementer :

- creer un composant reusable `BackButton`
- l'afficher sur les pages de detail ou sous-pages profondes
- prevoir une destination fallback si l'historique interne est vide
- eviter de l'afficher sur les pages principales comme `/feed`, `/dashboard`, `/comics/search`

Pages candidates :

- `frontend/app/pages/comics/[id].vue`
- `frontend/app/pages/comics/read/[id].vue`
- `frontend/app/pages/authors/[slug].vue`
- `frontend/app/pages/lists/[id].vue`
- `frontend/app/pages/lists/public/[slug].vue`
- `frontend/app/pages/profile/[username].vue`
- `frontend/app/pages/settings/security.vue`
- `frontend/app/pages/admin/users.vue`

Fallbacks recommandes :

- fiche comic -> `/comics/search`
- lecteur PDF -> `/journal` ou fiche comic si l'id est disponible
- auteur -> `/authors`
- liste privee -> `/lists`
- liste publique -> `/feed` ou `/lists`
- profil -> `/feed`
- securite -> `/dashboard`
- admin users -> `/admin`

Composant possible :

`frontend/app/components/BackButton.vue`

Props recommandees :

- `to` : route fallback
- `label` : texte accessible, par defaut `Retour`
- `compact` : option d'affichage

Logique simple :

```js
const router = useRouter()

function goBack() {
  if (import.meta.client && window.history.length > 1) {
    router.back()
  } else {
    navigateTo(props.to || '/feed')
  }
}
```

Version plus robuste :

- creer un plugin ou middleware qui memorise la derniere route interne
- le bouton revient a cette route si elle existe
- sinon il utilise le fallback

UX recommandee :

- icone fleche gauche
- placer en haut du contenu sous la navbar
- `aria-label="Retour"`
- style discret mais visible

Tests a prevoir :

- depuis une recherche vers une fiche comic, retour vers la recherche
- ouverture directe d'une fiche par URL, retour vers fallback
- bouton present sur pages profondes, absent sur pages principales

## 5. Likes sur les commentaires

Objectif : ajouter une interaction rapide sur les commentaires et permettre de faire remonter les contributions utiles ou appreciees.

Pourquoi : le modele `Comment` existe deja en base. Les likes sur commentaires renforcent la boucle sociale et alimentent le bloc "commentaires les plus aimes" sur `/feed`.

Pre-requis recommande :

- implementer les commentaires sur les avis si ce n'est pas encore fait
- puis ajouter les likes sur commentaires

Modele Prisma recommande :

```prisma
model CommentLike {
  userId    String
  commentId String
  createdAt DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  comment Comment @relation(fields: [commentId], references: [id], onDelete: Cascade)

  @@id([userId, commentId])
  @@index([commentId])
  @@index([userId])
}
```

Ajouter aussi :

```prisma
model User {
  ...
  commentLikes CommentLike[]
}

model Comment {
  ...
  likes CommentLike[]
}
```

Endpoints recommandes :

`POST /comments/:id/like`

- auth obligatoire
- like un commentaire
- retourne `{ liked: true, likeCount }`
- idempotent : si deja like, retourner 200 sans doublon

`DELETE /comments/:id/like`

- auth obligatoire
- retire le like
- retourne `{ liked: false, likeCount }` ou 204
- idempotent : si pas like, ne pas echouer

`GET /comments/top-liked?period=7d&limit=5`

- public ou auth optionnelle
- retourne les commentaires les plus likes
- sert au bloc `/feed`

Adapter les endpoints qui recuperent les commentaires :

- inclure `likeCount`
- inclure `likedByMe` si utilisateur connecte

Payload commentaire attendu :

```json
{
  "id": "comment_id",
  "content": "Tres bon avis, je suis d'accord.",
  "createdAt": "...",
  "user": {
    "id": "user_id",
    "username": "reader42"
  },
  "likeCount": 4,
  "likedByMe": true
}
```

Fichiers probables :

- `backend/prisma/schema.prisma`
- nouvelle migration Prisma
- `backend/src/routes/reviews.js` ou nouvelle route `backend/src/routes/comments.js`
- `backend/src/server.js`
- `frontend/app/pages/comics/[id].vue`
- `frontend/app/pages/feed.vue`

Regles produit :

- un utilisateur connecte peut liker un commentaire
- un utilisateur ne peut liker un meme commentaire qu'une seule fois
- un utilisateur peut retirer son like
- choisir clairement si on autorise le like de son propre commentaire
- recommandation : interdire l'auto-like si on veut eviter l'auto-promotion, ou autoriser au debut pour simplicite
- supprimer un commentaire doit supprimer ses likes via cascade
- supprimer un utilisateur doit supprimer ses likes via cascade

Notifications possibles :

- si les notifications existent, notifier l'auteur du commentaire quand quelqu'un like son commentaire
- ne pas notifier l'utilisateur s'il like son propre commentaire
- eviter les doublons si like/unlike/like repete

UX recommandee :

- bouton discret avec icone coeur ou pouce
- afficher le nombre de likes
- etat actif quand l'utilisateur a like
- optimistic UI possible avec rollback si erreur API
- si utilisateur non connecte, rediriger vers `/auth/login` ou afficher une invitation a se connecter

Tests backend a prevoir :

- liker un commentaire cree une ligne `CommentLike`
- liker deux fois ne cree pas de doublon
- unlike supprime le like
- unlike deux fois reste stable
- like sans auth retourne 401
- like sur commentaire inexistant retourne 404
- suppression d'un commentaire supprime ses likes
- top-liked trie par nombre de likes decroissant

Tests frontend a prevoir :

- compteur augmente au clic
- bouton passe en etat actif
- second clic retire le like
- utilisateur non connecte redirige ou recoit une invitation a se connecter
- bloc "commentaires les plus aimes" visible sur `/feed`
