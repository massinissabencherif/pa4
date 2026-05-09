1. Commentaires sur les avis
Objectif : transformer les reviews en vrais points d’échange communautaire.
Pourquoi c’est prioritaire : le modèle Comment existe déjà en base, les avis existent déjà, les profils publics et le feed aussi. C’est donc la feature la plus naturelle et la plus rentable.
À implémenter :

permettre à un utilisateur connecté de commenter un avis
afficher les commentaires sous chaque avis sur la page d’un comic
afficher éventuellement les commentaires sur la page profil si pertinent
permettre à l’auteur d’un commentaire de le supprimer
trier les commentaires par date
gérer les états vides, les erreurs et les limites de longueur
Valeur produit :
augmente fortement l’engagement
donne plus de vie aux pages comics
renforce la dimension sociale déjà présente
2. Notifications utilisateur
Objectif : rendre visibles les interactions et créer une boucle de retour.
Pourquoi c’est prioritaire : dès qu’il y a des follows, commentaires ou badges, l’utilisateur doit être informé. Sans ça, l’app reste passive.
À implémenter :

notifications pour nouveau follower
notifications pour nouveau commentaire sur un avis
notifications pour badge débloqué
statut lu / non lu
page ou dropdown de notifications
compteur de notifications non lues dans le header
endpoints pour lister et marquer comme lues
Valeur produit :
augmente la rétention
rend le social réellement utile
prépare bien un passage futur au temps réel
3. Recommandations collaboratives
Objectif : compléter les recommandations actuelles par une logique “les lecteurs comme toi ont aussi aimé”.
Pourquoi c’est prioritaire : l’algorithme actuel existe déjà, mais il est surtout basé sur genres et auteurs. Il manque une vraie recommandation sociale et comportementale.
À implémenter :

identifier les utilisateurs ayant des goûts proches via lectures finies et/ou notes similaires
proposer des comics lus et bien notés par ces utilisateurs que l’utilisateur courant n’a pas encore lus
afficher une justification simple du type “recommandé car tu as aimé X et Y”
ajouter un endpoint dédié, par exemple /recommendations/social
afficher ces recommandations dans le feed, le dashboard ou une page dédiée
Valeur produit :
donne une vraie impression d’intelligence produit
exploite mieux les données déjà collectées
améliore la découverte de contenu
4. Objectifs de lecture et streaks
Objectif : transformer le journal en outil de progression personnelle.
Pourquoi c’est prioritaire : le dashboard, les stats et les badges sont déjà là, donc il manque surtout une couche d’objectifs explicites.
À implémenter :

définir un objectif mensuel de comics terminés
afficher la progression en cours
calculer des streaks de lecture sur plusieurs jours/semaines/mois
proposer des objectifs simples et lisibles
afficher les objectifs sur le dashboard
déclencher éventuellement des badges ou notifications associés
Valeur produit :
très bon levier de rétention
donne une raison de revenir régulièrement
complète parfaitement la logique de suivi personnel
5. Reprise de lecture PDF et progression
Objectif : enrichir fortement l’expérience de lecture.
Pourquoi c’est prioritaire : le lecteur PDF existe déjà, mais il est encore minimal. C’est une excellente zone de différenciation.
À implémenter :

mémoriser la dernière page lue pour chaque comic
permettre de reprendre automatiquement là où la lecture s’est arrêtée
afficher une progression de lecture
ajouter éventuellement des marque-pages
enregistrer la progression côté backend
afficher dans le journal ou sur la fiche comic un état “reprendre la lecture”
Valeur produit :
améliore énormément l’utilité réelle de l’app
crée une expérience plus premium
transforme la lecture en feature forte, pas juste en iframe PDF
6. Likes ou réactions sur les avis
Objectif : ajouter une interaction légère et rapide autour des reviews.
Pourquoi c’est pertinent : c’est plus simple que les commentaires, mais très complémentaire. Ça peut aussi nourrir les notifications et le feed.
À implémenter :

liker/unliker un avis
afficher le nombre de likes
trier éventuellement les avis d’un comic par popularité
déclencher une notification à l’auteur
empêcher les doubles likes
Valeur produit :
augmente l’engagement social sans alourdir l’UX
aide à mettre en avant les meilleurs avis
s’intègre très bien avec notifications + profils
7. Modération des avis et commentaires
Objectif : garder une communauté saine à mesure que les interactions augmentent.
Pourquoi c’est pertinent : dès que tu ajoutes commentaires, likes ou plus de social, la modération devient nécessaire.
À implémenter :

suppression admin des avis problématiques
suppression admin des commentaires
signalement par les utilisateurs
file de modération simple dans le back-office
historique minimal des signalements
éventuellement suspension ou désactivation de comptes
Valeur produit :
rend le système communautaire crédible
évite que les nouvelles features sociales deviennent risquées
renforce le dashboard admin
8. Pages éditeurs / publishers
Objectif : mieux exploiter les métadonnées déjà présentes dans les comics.
Pourquoi c’est pertinent : le champ publisher existe déjà, mais n’est pas vraiment valorisé.
À implémenter :

pages dédiées par éditeur
liste des comics par éditeur
navigation depuis la fiche comic vers l’éditeur
filtres de recherche par éditeur
stats ou mise en avant des éditeurs les plus lus
Valeur produit :
améliore la découverte
enrichit le catalogue sans demander de nouvelle source de données
rend l’univers comics plus structuré
9. Recherche avancée et exploration enrichie
Objectif : faire de la découverte un pilier du produit.
Pourquoi c’est pertinent : la recherche existe déjà, mais elle peut devenir beaucoup plus puissante.
À implémenter :

filtres combinés par genre, auteur, éditeur, note moyenne
tri par popularité, nouveauté, note, nombre d’avis
navigation plus claire entre recherche, auteurs, éditeurs et genres
sections “à découvrir”, “mieux notés”, “récemment ajoutés”
meilleure UX de recherche côté frontend
Valeur produit :
améliore fortement l’exploration
augmente la profondeur de navigation
met mieux en valeur le catalogue
10. Collections éditoriales mises en avant
Objectif : ajouter une curation manuelle forte au-dessus du catalogue.
Pourquoi c’est pertinent : l’app a déjà des listes publiques, donc il est naturel d’ajouter des sélections mises en avant par l’admin.
À implémenter :

marquer certaines listes comme “éditoriales” ou “en vedette”
afficher ces collections sur la home ou dans une page découverte
permettre à l’admin de les ordonner et de les gérer
exemples : “Par où commencer avec Batman”, “Incontournables Marvel”, “Meilleurs one-shots”
Valeur produit :
donne une vraie personnalité au produit
aide les nouveaux utilisateurs à entrer dans l’univers comics
très bon levier UX avec peu de complexité algorithmique
11. Profil public enrichi
Objectif : transformer le profil en vraie vitrine personnelle.
Pourquoi c’est pertinent : le profil existe déjà, mais peut devenir beaucoup plus marquant.
À implémenter :

bio utilisateur
comics favoris épinglés
listes mises en avant
statistiques publiques choisies par l’utilisateur
plus belle présentation des badges
activité récente plus lisible
Valeur produit :
renforce l’identité utilisateur
améliore la dimension communautaire
donne plus d’intérêt au follow
12. Notifications temps réel
Objectif : rendre l’application plus vivante et moderne.
Pourquoi c’est pertinent : une fois les notifications classiques en place, le temps réel est l’évolution logique.
À implémenter :

mise à jour live des notifications
apparition immédiate des nouveaux commentaires/likes/follows
éventuellement feed live
WebSockets ou SSE selon l’architecture choisie
Valeur produit :
très fort effet perçu
bon bonus technique pour le projet
rend l’expérience beaucoup plus réactive
13. Défis communautaires et événements
Objectif : créer des temps forts autour de la lecture.
Pourquoi c’est pertinent : les badges, stats et objectifs rendent cette feature très cohérente.
À implémenter :

challenge du mois
objectif partagé par thème ou genre
badge spécial événement
page listant les défis actifs
progression individuelle dans les défis
Valeur produit :
augmente la rétention
renforce la communauté
donne un rythme au produit
14. Avis avancés avec spoilers et formats
Objectif : rendre les reviews plus riches et mieux adaptées aux usages.
Pourquoi c’est pertinent : le système d’avis existe déjà, mais reste simple.
À implémenter :

balise spoiler masquable
distinction entre avis court et critique détaillée
tri des avis par utilité, date, note
meilleures mises en forme sur la page comic
Valeur produit :
améliore la qualité des contenus
rend les fiches comics plus intéressantes
prépare mieux le terrain pour commentaires et likes
15. Historique visuel et analytics personnels avancés
Objectif : donner une lecture plus visuelle du parcours de l’utilisateur.
Pourquoi c’est pertinent : il y a déjà un dashboard, mais il peut devenir un vrai espace d’analyse personnelle.
À implémenter :

timeline de lecture
heatmap d’activité
évolution des goûts dans le temps
auteurs/genres découverts récemment
comparatifs mois par mois
Valeur produit :
augmente l’attachement au produit
valorise les données personnelles collectées
renforce l’intérêt du dashboard

16. Liste de usernames interdits / réservés
Objectif : empêcher la création de comptes avec des noms qui posent problème techniquement, légalement ou socialement.
Pourquoi c’est pertinent : les usernames sont utilisés dans les profils publics (`/profile/[username]` côté frontend et `/users/:username` côté backend). Certains noms peuvent entrer en conflit avec des routes, tromper les utilisateurs ou servir à l’usurpation.

À implémenter :

ajouter une liste centralisée de usernames interdits côté backend
bloquer ces usernames à l’inscription
bloquer ces usernames si une future fonctionnalité de changement de pseudo est ajoutée
normaliser avant validation : trim, lowercase, éventuellement suppression accents selon la politique choisie
retourner une erreur claire : “Ce nom d’utilisateur est réservé”
ajouter une validation frontend pour afficher l’erreur avant soumission quand possible
ajouter des tests unitaires et intégration sur les cas interdits

Exemples de noms à interdire :

admin
administrator
root
superadmin
moderator
mod
support
help
api
auth
login
logout
register
me
users
user
profile
settings
dashboard
feed
comics
comic
authors
author
lists
reviews
review
stats
notifications
search
legal
rgpd
mentions-legales
security
system
null
undefined
anonymous
comicster

Fichiers probablement concernés :

backend/src/routes/auth.js
frontend/app/pages/auth/register.vue
backend/src/__tests__/integration.test.js

Implémentation backend conseillée :

créer un helper `backend/src/lib/reservedUsernames.js`
exporter un `Set` ou une fonction `isReservedUsername(username)`
utiliser ce helper dans `POST /auth/register`
si la fonction reçoit `Admin`, ` admin ` ou `ADMIN`, elle doit le considérer comme réservé

Exemple de logique :

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

Tests à prévoir :

inscription avec `admin` retourne 400 ou 409 avec message clair
inscription avec `Admin` est aussi bloquée
inscription avec ` admin ` est aussi bloquée
inscription avec un username normal fonctionne toujours
la validation existante email/password n’est pas cassée

Valeur produit :

évite les profils trompeurs
protège les routes actuelles et futures
donne une base plus propre pour les profils publics

17. Couverture par défaut intelligente selon le comic
Objectif : éviter les fiches comics sans visuel en affichant une couverture ou illustration par défaut adaptée au contenu.
Pourquoi c’est pertinent : les couvertures sont centrales dans une app comics. Un comic sans `coverUrl` rend la recherche, le feed, les listes et les profils moins attractifs. Une image générique unique est mieux que rien, mais une image contextuelle est beaucoup plus qualitative.

Exemple attendu :

si un comic Batman n’a pas de couverture spécifique, afficher une illustration par défaut orientée Batman
si un comic Spider-Man n’a pas de couverture, afficher une illustration par défaut Spider-Man
si aucun thème/personnage n’est détecté, afficher une couverture Comicster générique

À implémenter :

créer une fonction de résolution de couverture par défaut
détecter le thème à partir du titre, des auteurs, genres, description et éventuellement publisher
ne pas écraser `coverUrl` en base si elle existe
retourner une propriété calculée côté API, par exemple `displayCoverUrl`
ou appliquer la logique côté frontend via un helper partagé
prévoir des assets statiques par défaut dans `frontend/public/covers/defaults/`
prévoir une image générique finale `default-comic.webp`

Approche recommandée :

ne pas stocker automatiquement la couverture par défaut dans `Comic.coverUrl`
garder `coverUrl` comme donnée réelle
ajouter une fonction `resolveComicCover(comic)` côté frontend ou backend
utiliser cette fonction partout où une couverture est affichée

Mapping de départ possible :

batman -> `/covers/defaults/batman.webp`
spider-man, spiderman, spider man -> `/covers/defaults/spiderman.webp`
superman -> `/covers/defaults/superman.webp`
x-men, xmen -> `/covers/defaults/xmen.webp`
avengers -> `/covers/defaults/avengers.webp`
deadpool -> `/covers/defaults/deadpool.webp`
wonder woman -> `/covers/defaults/wonder-woman.webp`
justice league -> `/covers/defaults/justice-league.webp`
marvel -> `/covers/defaults/marvel.webp`
dc -> `/covers/defaults/dc.webp`
fallback -> `/covers/defaults/default-comic.webp`

Fichiers probablement concernés :

frontend/app/pages/comics/search.vue
frontend/app/pages/comics/[id].vue
frontend/app/pages/feed.vue
frontend/app/pages/journal.vue
frontend/app/pages/lists/[id].vue
frontend/app/pages/lists/public/[slug].vue
frontend/app/pages/profile/[username].vue
frontend/app/pages/authors/[slug].vue
frontend/app/composables ou frontend/app/utils à créer
éventuellement backend/src/routes/comics.js si la logique est côté API

Implémentation frontend conseillée :

créer `frontend/app/utils/comicCover.js`

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

Points d’attention :

ne pas utiliser d’images sous copyright non autorisées si le projet est public
préférer des illustrations originales/générées ou des assets libres
prévoir un style cohérent entre toutes les couvertures par défaut
ajouter `alt` descriptif sur les images
éviter que le layout saute quand une image manque : fixer un ratio de couverture

Tests à prévoir :

comic Batman sans `coverUrl` retourne/affiche la couverture Batman
comic avec `coverUrl` garde sa vraie couverture
comic inconnu reçoit la couverture générique
les pages principales n’affichent plus d’emplacement vide ou cassé

Valeur produit :

améliore fortement la qualité visuelle
réduit l’impression de catalogue incomplet
rend la recherche et les listes plus agréables

18. Enrichir la page feed connectée avec blocs de découverte
Objectif : transformer `/feed` en vraie page d’accueil connectée, pas seulement un flux social.
Pourquoi c’est pertinent : l’utilisateur connecté arrive actuellement sur le feed. S’il ne suit personne ou si le feed est peu actif, la page peut sembler vide. Ajouter des blocs de découverte rend l’écran immédiatement utile.

Clarification importante :

la demande mentionne “page de connexion” avec l’URL `https://dev.sitedetestdemassinissabencherif.com/feed`
techniquement `/feed` est une page connectée, pas la page de login
il faut donc comprendre cette demande comme : enrichir la page `/feed` affichée après connexion

Blocs à ajouter :

dernier ajout à la bibliothèque
comics les plus lus aujourd’hui
commentaires les plus aimés

À implémenter côté produit :

afficher ces blocs sous ou à côté du feed selon la place disponible
sur desktop : feed principal + colonne ou sections secondaires
sur mobile : sections empilées sous le feed
prévoir des états vides propres
chaque item doit être cliquable vers la fiche comic, l’avis ou le profil selon le cas
éviter les textes explicatifs trop longs dans l’UI

Bloc “Derniers ajouts à la bibliothèque” :

Définition recommandée :

les derniers comics ajoutés à la base de données, triés par `Comic.createdAt desc`

Alternative possible :

les derniers comics ajoutés dans les journaux de lecture des utilisateurs, triés par `ReadingEntry.createdAt desc`

Recommandation :

commencer par les derniers comics créés en base, car c’est simple et stable
nom UI possible : “Derniers ajouts”

Endpoint possible :

`GET /comics/latest?limit=6`

Retour attendu :

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

Bloc “Comics les plus lus aujourd’hui” :

Définition recommandée :

comics ayant le plus d’entrées de lecture mises à jour ou terminées aujourd’hui

Version simple :

compter les `ReadingEntry` dont `updatedAt` est compris entre début et fin de journée
grouper par `comicId`
ordonner par count desc

Version plus stricte :

compter seulement les passages à `IN_PROGRESS` ou `FINISHED`
nécessite idéalement un historique d’activité, car aujourd’hui `ReadingEntry` ne conserve que l’état courant

Recommandation pour première version :

utiliser `ReadingEntry.updatedAt` sur la journée courante
nom UI possible : “Les plus lus aujourd’hui”

Endpoint possible :

`GET /stats/trending/today?limit=6`

ou

`GET /comics/trending?period=today&limit=6`

Bloc “Commentaires les plus aimés” :

Pré-requis :

la feature de like sur les commentaires doit exister

Définition recommandée :

commentaires triés par nombre de likes décroissant, idéalement sur une fenêtre récente pour éviter que les anciens dominent toujours

Endpoint possible :

`GET /comments/top-liked?period=7d&limit=5`

Retour attendu :

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

Fichiers probablement concernés :

frontend/app/pages/feed.vue
backend/src/routes/feed.js
backend/src/routes/comics.js
backend/src/routes/stats.js
nouvelle route possible `backend/src/routes/comments.js`
backend/prisma/schema.prisma si likes commentaires ajoutés

Tests à prévoir :

feed affiche les trois blocs quand les endpoints retournent des données
feed affiche un état vide discret quand il n’y a pas de données
trending aujourd’hui ne compte pas les lectures d’hier
les commentaires les plus aimés sont triés par nombre de likes décroissant
les liens mènent vers les bonnes pages

Valeur produit :

rend la page connectée beaucoup plus vivante
améliore la découverte de comics
met en avant l’activité communautaire
donne de l’intérêt même aux utilisateurs qui suivent peu de monde

19. Ajouter une flèche de retour interne
Objectif : offrir une navigation de retour fiable sans dépendre uniquement du bouton retour du navigateur.
Pourquoi c’est pertinent : le retour navigateur peut être instable dans une SPA, surtout après login, redirections, filtres, recherche, pages dynamiques ou états chargés via fetch. Une flèche interne donne un repère clair et contrôlé.

À implémenter :

ajouter un composant réutilisable `BackButton`
l’afficher sur les pages de détail ou sous-pages profondes
prévoir une destination fallback quand l’historique interne est vide
éviter de casser les pages de premier niveau comme feed, dashboard, recherche principale

Pages candidates :

frontend/app/pages/comics/[id].vue
frontend/app/pages/comics/read/[id].vue
frontend/app/pages/authors/[slug].vue
frontend/app/pages/lists/[id].vue
frontend/app/pages/lists/public/[slug].vue
frontend/app/pages/profile/[username].vue
frontend/app/pages/settings/security.vue
frontend/app/pages/admin/users.vue

Comportement recommandé :

si `window.history.length > 1`, utiliser `router.back()`
sinon naviguer vers une route fallback fournie en prop
si la page vient d’un contexte connu, utiliser un fallback logique :

fiche comic -> `/comics/search`
lecteur PDF -> `/comics/:id` si possible, sinon `/journal`
auteur -> `/authors`
liste privée -> `/lists`
liste publique -> `/feed` ou `/lists`
profil -> `/feed`
sécurité -> `/dashboard`
admin users -> `/admin`

Composant possible :

`frontend/app/components/BackButton.vue`

Props recommandées :

`to` : route fallback
`label` : texte accessible, par défaut “Retour”
`compact` : option d’affichage

Exemple de logique :

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

UX recommandée :

utiliser une icône flèche gauche
placer le bouton en haut du contenu, sous la navbar
garder un style discret mais visible
ajouter `aria-label="Retour"`
ne pas utiliser uniquement un caractère texte si une librairie d’icônes est disponible

Points d’attention :

`window.history.length` ne garantit pas que la page précédente appartient à l’app
pour un comportement plus robuste, on peut stocker la dernière route interne dans un state Nuxt ou middleware global
éviter d’envoyer l’utilisateur vers une page externe si l’historique vient d’un autre site

Version robuste possible :

créer un middleware/plugin qui mémorise `previousRoute` dans `useState`
le bouton utilise `previousRoute` si disponible, sinon fallback

Tests à prévoir :

sur une fiche comic visitée depuis la recherche, le bouton revient à la recherche
sur une fiche ouverte directement par URL, le bouton va au fallback
le bouton existe sur les pages profondes et pas sur les pages principales
le bouton fonctionne après navigation OAuth/login sans bloquer

Valeur produit :

navigation plus rassurante
moins de dépendance au navigateur
meilleure expérience mobile

20. Likes sur les commentaires
Objectif : ajouter une interaction légère sur les commentaires et permettre de faire remonter les contributions utiles ou appréciées.
Pourquoi c’est pertinent : le modèle `Comment` existe déjà dans Prisma, mais les routes de commentaires sont encore à compléter. Les likes sur commentaires renforcent la boucle sociale et alimentent aussi le bloc “commentaires les plus aimés” du feed.

Pré-requis recommandé :

implémenter d’abord les commentaires sur les avis si ce n’est pas encore fait
ensuite ajouter les likes sur commentaires

Modèle de données recommandé :

ajouter un modèle `CommentLike`

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

Modifier aussi `User` et `Comment` :

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

Endpoints recommandés :

`POST /comments/:id/like`
like un commentaire
auth obligatoire
retourne `{ liked: true, likeCount }`
si déjà liké, soit retourner 200 idempotent, soit 409
recommandation : 200 idempotent

`DELETE /comments/:id/like`
retire le like
auth obligatoire
retourne 204 ou `{ liked: false, likeCount }`
si pas liké, retourner 204 idempotent

`GET /comments/top-liked?period=7d&limit=5`
public ou auth optionnelle
retourne les commentaires les plus likés
sert au bloc feed

Adapter les endpoints de lecture des commentaires :

quand on récupère les commentaires d’un avis, inclure :

`likeCount`
`likedByMe` si utilisateur connecté

Exemple de payload commentaire :

```json
{
  "id": "comment_id",
  "content": "Très bon avis, je suis d’accord.",
  "createdAt": "...",
  "user": {
    "id": "user_id",
    "username": "reader42"
  },
  "likeCount": 4,
  "likedByMe": true
}
```

Fichiers probablement concernés :

backend/prisma/schema.prisma
nouvelle migration Prisma
backend/src/routes/reviews.js ou nouvelle route `backend/src/routes/comments.js`
backend/src/server.js pour monter la nouvelle route si nécessaire
frontend pages affichant les avis/commentaires :
frontend/app/pages/comics/[id].vue
frontend/app/pages/profile/[username].vue si commentaires affichés plus tard
frontend/app/pages/feed.vue pour les commentaires populaires

Règles produit :

un utilisateur connecté peut liker un commentaire
un utilisateur ne peut liker un même commentaire qu’une seule fois
un utilisateur peut retirer son like
on peut autoriser ou interdire de liker son propre commentaire, mais il faut choisir clairement
recommandation : autoriser au début pour simplicité, ou interdire si on veut éviter l’auto-promotion
un commentaire supprimé supprime ses likes via cascade
un utilisateur supprimé supprime ses likes via cascade

Notifications :

si le système de notifications est implémenté, créer une notification quand quelqu’un like un commentaire
éviter de notifier si l’utilisateur like son propre commentaire
éviter les notifications doublons si like/unlike/like répété

UX recommandée :

bouton discret avec icône coeur ou pouce
afficher le nombre de likes
état actif quand l’utilisateur a liké
optimistic UI possible, mais prévoir rollback si l’API échoue
si utilisateur non connecté, clic redirige vers `/auth/login` ou affiche une invitation à se connecter

Tests backend à prévoir :

liker un commentaire crée une ligne `CommentLike`
liker deux fois ne crée pas de doublon
unlike supprime le like
unlike deux fois reste stable
like sans auth retourne 401
like sur commentaire inexistant retourne 404
suppression d’un commentaire supprime ses likes
top-liked retourne les commentaires triés par nombre de likes

Tests frontend à prévoir :

le compteur augmente au clic
le bouton passe en état actif
un second clic retire le like
un utilisateur non connecté est redirigé ou invité à se connecter
le bloc “commentaires les plus aimés” affiche les données attendues sur `/feed`

Valeur produit :

augmente l’engagement sans demander un effort de rédaction
met en avant les commentaires utiles
prépare les notifications et le classement des contenus communautaires
