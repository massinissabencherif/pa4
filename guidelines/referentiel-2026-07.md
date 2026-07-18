# Référentiel features — Comicster (juillet 2026)

Décisions de la session du 2026-07-13, suite au brainstorm global du projet.
**Ce document remplace `next-features.md` (2026-05-09) comme référence de priorisation.**
En cas de contradiction entre les deux, c'est ce document qui fait foi.

---

## État des lieux au 2026-07-13

Itération précédente (décidée le 2026-07-11) : **entièrement livrée en prod.**

| Feature | Statut |
|---|---|
| Réinitialisation mot de passe par email (infra Postfix maison) | ✅ PR #3 |
| Email de confirmation d'inscription stylisé (charte noir/rouge) | ✅ PR #6 |
| Encarts publicitaires (4 placements) | ✅ |
| Backup pg_dump quotidien, rotation 7 jours | ✅ PR #5 |
| Fix OAuth `trust proxy` + `sameSite:none` (stash récupéré) | ✅ PR #8 |

---

## Décisions — prochaines features

### 📖 Expérience de lecture

| Feature | Décision | Notes |
|---|---|---|
| **Lecteur avec reprise de lecture** | ✅ Validé | Le backend est déjà prêt : `PATCH /reading-list/:id/progress` + champs `currentPage`/`totalPages`/`progress`/`lastReadAt` en base, jamais appelés par le front. Remplacer l'embed PDF par pdf.js (pagination native même sur les PDF longs) ; fallback % de scroll si fichier d'un seul tenant. |
| Séries / collections | 🤔 Intérêt modéré | Regrouper les tomes, "lire la suite", progression par série. À spécifier avant d'engager. |
| **Notifications in-app** | ✅ Validé | Cloche header : follower, commentaire/like sur review, réponse guide. Transport : SSE (voir angle soutenance). |
| **Recherche full-text + filtres avancés** | ✅ Validé | PostgreSQL `tsvector` fait maison (pas d'Algolia — même esprit que Postfix). Filtres : note, année, éditeur. |
| **Notes privées sur un comic** | ✅ Validé, logique à définir | Questions ouvertes avant implémentation : portée (par comic ou par page ?), longueur max, une note ou plusieurs, visibilité future (partage ?). |

### 🎮 Gamification

| Feature | Décision | Notes |
|---|---|---|
| **Streaks de lecture** | ✅ Validé | Jours consécutifs avec activité de lecture. S'appuie sur `lastReadAt` (dépend du lecteur avec reprise). Spec de base dans `next-features.md`. |
| Objectif annuel de lecture | ❌ Écarté | Décision 2026-07-13 — annule la "priorité moyenne" de mai. |
| Badges à paliers (bronze/argent/or) | 🤔 Intérêt modéré | Extension des 10 badges binaires existants. |
| **Défis mensuels** | ✅ Validé | "3 comics d'un genre jamais lu", rotation auto. Validation via `ReadingEntry` existants. |
| Récap annuel "Comicster Wrapped" | ⏳ En attente | Pas encore tranché — à décider. |

### 🛠️ Admin

| Feature | Décision | Notes |
|---|---|---|
| **Modération + audit log** | ✅ Validé | Signalement reviews/commentaires/réponses guides, file de modération, journal des actions admin (qui a supprimé quoi, quand). |
| Dashboard analytics enrichi | ❌ Écarté | |
| **Curation éditoriale** | ✅ Validé | "Comic de la semaine" mis en avant sur le feed, sélections thématiques. |

### 🎓 Angle soutenance ESGI

| Feature | Décision | Notes |
|---|---|---|
| **Notifications temps réel SSE** | ✅ Validé | Fait main, pas de Pusher/Firebase. Démo live deux navigateurs. Porte les notifications in-app. |
| **Export RGPD des données** | ✅ Validé | Bouton "télécharger mes données" (JSON/ZIP). Complète l'histoire légale existante. |
| Pipeline images (sharp, WebP) | ⏳ Indécis | À revoir plus tard. |

---

## 🕹️ Arcade — deux jeux retenus

Décision 2026-07-13 : sur les 6 jeux imaginés, **seuls Comicdle et la Cover Mystère sont retenus**.
Écartés : Cover Clash (duel de covers ELO), Duel trivia 1v1, Boosters/cartes à collectionner, Bingo de lecture.

Principe commun : le catalogue est le contenu — chaque jeu se génère depuis la table `Comic`
(covers, genres, auteurs, éditeur, année), zéro contenu manuel. Chaque comic croisé en jeu
affiche un CTA "ajouter à ma liste" : l'Arcade est aussi un moteur de découverte du catalogue.

### Comicdle — le Wordle du comics

- **Mécanique** : un comic mystère par jour, identique pour tous (seed quotidien côté serveur). Le joueur propose des titres du catalogue ; chaque essai révèle des indices par attribut : genre ✅/❌, éditeur ✅/❌, année ↑/↓, auteur ✅/❌. 6 essais max.
- **Rétention** : streak de victoires, partage du résultat en grille d'emojis (sans spoiler).
- **Données** : `Comic.genres`, `publisher`, `publishedAt`, `authors` — tout existe déjà.
- **Modèle à créer** : `DailyPuzzle { date, comicId }`, `PuzzleAttempt { userId, date, guesses[], solved }`.
- **Anti-triche** : la réponse ne quitte jamais le serveur — le client envoie un guess, le serveur répond attribut par attribut. Rate limiting sur l'endpoint.
- **Effort** : faible-moyen.

### Cover Mystère

- **Mécanique** : une cover ultra-zoomée ou pixelisée, 4 titres proposés. Dézoom/dépixelisation progressive dans le temps — répondre tôt rapporte plus de points.
- **Modes** : défi du jour (5 covers, seed serveur commun) + mode infini (tirage aléatoire).
- **Données** : `Comic.coverUrl` ; distracteurs tirés du même genre pour la difficulté.
- **Rendu** : pixelisation/zoom côté front en canvas ; la validation de la réponse reste côté serveur.
- **Modèle à créer** : réutiliser `PuzzleAttempt` avec un champ `game` (`COMICDLE` | `COVER_MYSTERY`).
- **Effort** : faible.

### Couche commune (minimale)

- Les deux jeux alimentent un même compteur de points, aligné sur le système XP envisagé dans `next-features.md` (à unifier au moment de l'implémentation — un seul champ/table de progression, pas deux).
- Seeds quotidiens et scoring exclusivement côté serveur.
- Leaderboard : non décidé — trancher au moment de l'implémentation.

---

## Ordre de mise en œuvre (proposition, à valider)

1. **Lecteur + reprise de lecture** — fondation ; débloque streaks et fiabilise `lastReadAt`
2. **SSE + notifications in-app** — débloque le social existant ; argument soutenance
3. **Recherche full-text + filtres**
4. **Streaks + défis mensuels**
5. **Arcade** — Cover Mystère d'abord (plus simple), puis Comicdle
6. **Modération + audit log**
7. Au fil de l'eau : curation éditoriale, export RGPD, séries (si specifiée), notes privées (si logique tranchée)

---

## Rappels de workflow (inchangés)

- Toute feature : branche → `new-design` (sandbox) → `dev` (pré-prod) → PR GitHub vers `main`, validée manuellement
- Email : infra Postfix auto-hébergée uniquement, jamais de SaaS
- Pas de double opt-in email (pas de champ `emailVerified`) sans nouvelle décision explicite
