# Tests — Comicster (Phase 1 & 2)

Tous les tests à réaliser sur les fonctionnalités implémentées.
Chaque test indique : la commande exacte, la réponse attendue, et ce que ça valide.

## Résultats d'exécution (26/03/2026)

| Section | Tests | Statut |
|---|---|---|
| 1. Auth register | 4/4 | ✅ |
| 2. Auth login | 4/4 | ✅ |
| 3. GET /me | 4/4 | ✅ |
| 4. Comics (validation + no-key) | 4/4 | ✅ |
| 5. Base de données | 2/2 | ✅ |
| 6. Sécurité (bcrypt, injection, header) | 4/4 | ✅ |
| **Total** | **22/22** | ✅ |

> Tests 3.4, 3.5, 3.7 (avec clés Marvel) et tests frontend 4.x : à faire une fois les clés Marvel renseignées.

---

## Prérequis

Les deux services doivent être en cours d'exécution :

```bash
# Terminal 1 — Backend (port 3001)
cd backend
npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend
npm run dev
```

Vérification rapide :
```bash
curl http://localhost:3001/health
# → {"status":"ok"}
```

---

## 1. Tests Backend — Auth (`/auth`)

### 1.1 Inscription — succès

```bash
curl -s -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","username":"alice","password":"motdepasse123"}'
```

**Réponse attendue — HTTP 201 :**
```json
{
  "token": "eyJ...",
  "user": {
    "id": "...",
    "email": "alice@test.com",
    "username": "alice"
  }
}
```

**Ce que ça valide :** création du compte, hash du mot de passe (bcrypt), génération du JWT.

---

### 1.2 Inscription — champs manquants

```bash
curl -s -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"bob@test.com"}'
```

**Réponse attendue — HTTP 400 :**
```json
{"error": "email, username et password sont requis"}
```

---

### 1.3 Inscription — email déjà utilisé

```bash
# (après avoir créé alice@test.com au test 1.1)
curl -s -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","username":"alice2","password":"autremdp123"}'
```

**Réponse attendue — HTTP 409 :**
```json
{"error": "Email ou username déjà utilisé"}
```

---

### 1.4 Inscription — username déjà utilisé

```bash
curl -s -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"autre@test.com","username":"alice","password":"autremdp123"}'
```

**Réponse attendue — HTTP 409 :**
```json
{"error": "Email ou username déjà utilisé"}
```

---

### 1.5 Connexion — succès

```bash
curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"motdepasse123"}'
```

**Réponse attendue — HTTP 200 :**
```json
{
  "token": "eyJ...",
  "user": {
    "id": "...",
    "email": "alice@test.com",
    "username": "alice"
  }
}
```

**Ce que ça valide :** comparaison bcrypt du mot de passe, émission d'un nouveau JWT.

---

### 1.6 Connexion — mauvais mot de passe

```bash
curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"mauvaismdp"}'
```

**Réponse attendue — HTTP 401 :**
```json
{"error": "Identifiants invalides"}
```

---

### 1.7 Connexion — email inexistant

```bash
curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"fantome@test.com","password":"nimporte"}'
```

**Réponse attendue — HTTP 401 :**
```json
{"error": "Identifiants invalides"}
```

> Note : la réponse est identique à 1.6 volontairement (évite l'énumération des comptes).

---

### 1.8 Connexion — champs manquants

```bash
curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com"}'
```

**Réponse attendue — HTTP 400 :**
```json
{"error": "email et password sont requis"}
```

---

## 2. Tests Backend — Profil (`/me`)

### 2.1 GET /me — avec token valide

```bash
# Étape 1 : récupérer le token
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"motdepasse123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Étape 2 : appeler /me
curl -s http://localhost:3001/me \
  -H "Authorization: Bearer $TOKEN"
```

**Réponse attendue — HTTP 200 :**
```json
{
  "id": "...",
  "email": "alice@test.com",
  "username": "alice",
  "role": "USER",
  "createdAt": "2026-..."
}
```

**Ce que ça valide :** middleware JWT, lecture en DB, données sensibles absentes (passwordHash non retourné).

---

### 2.2 GET /me — sans token

```bash
curl -s http://localhost:3001/me
```

**Réponse attendue — HTTP 401 :**
```json
{"error": "Token manquant"}
```

---

### 2.3 GET /me — token invalide (forgé)

```bash
curl -s http://localhost:3001/me \
  -H "Authorization: Bearer tokenbidonquinesertarien"
```

**Réponse attendue — HTTP 401 :**
```json
{"error": "Token invalide ou expiré"}
```

---

### 2.4 GET /me — token mal formé (sans "Bearer ")

```bash
curl -s http://localhost:3001/me \
  -H "Authorization: montoken"
```

**Réponse attendue — HTTP 401 :**
```json
{"error": "Token manquant"}
```

---

## 3. Tests Backend — Comics (`/comics`)

### 3.1 Recherche — query trop courte (1 caractère)

```bash
curl -s "http://localhost:3001/comics/search?q=x"
```

**Réponse attendue — HTTP 400 :**
```json
{"error": "Le paramètre q doit contenir au moins 2 caractères"}
```

---

### 3.2 Recherche — sans paramètre q

```bash
curl -s "http://localhost:3001/comics/search"
```

**Réponse attendue — HTTP 400 :**
```json
{"error": "Le paramètre q doit contenir au moins 2 caractères"}
```

---

### 3.3 Recherche — sans clés API Marvel

> Ce test s'applique tant que `MARVEL_PUBLIC_KEY` est vide dans `.env`

```bash
curl -s "http://localhost:3001/comics/search?q=batman"
```

**Réponse attendue — HTTP 503 :**
```json
{"error": "Clés API Marvel non configurées"}
```

---

### 3.4 Recherche — avec clés API Marvel configurées

> Nécessite `MARVEL_PUBLIC_KEY` et `MARVEL_PRIVATE_KEY` renseignés dans `backend/.env`

```bash
curl -s "http://localhost:3001/comics/search?q=batman&limit=5" | python3 -m json.tool
```

**Réponse attendue — HTTP 200 :**
```json
{
  "total": 1234,
  "count": 5,
  "offset": 0,
  "comics": [
    {
      "id": "...",
      "externalId": "...",
      "title": "Batman ...",
      "coverUrl": "https://...",
      "genres": [...],
      "authors": [...]
    }
  ]
}
```

**Ce que ça valide :** appel Marvel API, normalisation des données, upsert en DB.

---

### 3.5 Cache DB — le second appel ne recontacte pas Marvel

```bash
# Appel 1 (frappe Marvel API + sauvegarde en DB)
curl -s "http://localhost:3001/comics/search?q=batman&limit=1" > /dev/null

# Récupère l'externalId du comic
EXTERNAL_ID=$(curl -s "http://localhost:3001/comics/search?q=batman&limit=1" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['comics'][0]['externalId'])")

# Appel 2 : GET /comics/:id — doit servir depuis la DB, pas Marvel
time curl -s "http://localhost:3001/comics/$EXTERNAL_ID" > /dev/null
```

**Résultat attendu :** le second appel est nettement plus rapide (< 50ms vs ~300ms pour Marvel).
**Ce que ça valide :** la logique de cache `findUnique` avant l'appel API.

---

### 3.6 Détail comic — ID inexistant (sans clés Marvel)

```bash
curl -s "http://localhost:3001/comics/99999999"
```

**Réponse attendue — HTTP 503 :**
```json
{"error": "Clés API Marvel non configurées"}
```

---

### 3.7 Pagination — offset

> Nécessite les clés Marvel

```bash
# Page 1
curl -s "http://localhost:3001/comics/search?q=spider&limit=5&offset=0" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print([c['title'] for c in d['comics']])"

# Page 2
curl -s "http://localhost:3001/comics/search?q=spider&limit=5&offset=5" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print([c['title'] for c in d['comics']])"
```

**Résultat attendu :** les deux listes sont différentes (pas de doublons entre pages).

---

## 4. Tests Frontend — Navigation

### 4.1 Page d'accueil

1. Ouvrir **http://localhost:3000**
2. Vérifier : titre "Comicster" visible avec "Comic" en rouge
3. Vérifier : bouton "Rechercher des comics" présent
4. Vérifier : bouton "Créer un compte" visible (utilisateur non connecté)
5. Vérifier : les 3 cartes features (Journal, Notes, Communauté) sont affichées

---

### 4.2 Navbar — état non connecté

1. Sur n'importe quelle page
2. Vérifier : liens "Rechercher", "Connexion", "S'inscrire" présents
3. Vérifier : "Journal" et "Déconnexion" absents

---

### 4.3 Page inscription

1. Aller sur **http://localhost:3000/auth/register**
2. Remplir : email `bob@test.com`, username `bob`, password `motdepasse123`
3. Cliquer "Créer mon compte"
4. **Résultat attendu :** redirection vers `/`
5. Vérifier : la navbar affiche maintenant "Journal" et "Déconnexion"

---

### 4.4 Inscription — erreur (compte existant)

1. Sur **http://localhost:3000/auth/register**
2. Soumettre avec `email: alice@test.com` (créé au test 1.1)
3. **Résultat attendu :** message d'erreur rouge "Email ou username déjà utilisé"
4. Vérifier : pas de redirection

---

### 4.5 Page connexion

1. Se déconnecter (si connecté)
2. Aller sur **http://localhost:3000/auth/login**
3. Remplir : `alice@test.com` / `motdepasse123`
4. Cliquer "Se connecter"
5. **Résultat attendu :** redirection vers `/`
6. Vérifier : navbar met à jour (Journal + Déconnexion visibles)

---

### 4.6 Connexion — erreur mauvais mot de passe

1. Sur **http://localhost:3000/auth/login**
2. Saisir un mot de passe incorrect
3. **Résultat attendu :** message "Identifiants invalides" en rouge
4. Vérifier : pas de redirection

---

### 4.7 Persistance de session (cookie)

1. Se connecter via le frontend
2. Fermer et rouvrir l'onglet (**http://localhost:3000**)
3. **Résultat attendu :** toujours connecté (cookie `auth_token` persisté)

---

### 4.8 Déconnexion

1. Être connecté
2. Cliquer "Déconnexion" dans la navbar
3. **Résultat attendu :** redirection vers `/`
4. Vérifier : navbar revient à l'état non connecté

---

### 4.9 Page recherche comics — sans clés Marvel

1. Aller sur **http://localhost:3000/comics/search**
2. Taper "batman" et soumettre
3. **Résultat attendu :** bandeau jaune "Clés API Marvel non configurées" avec lien vers developer.marvel.com

---

### 4.10 Page recherche — validation query trop courte

1. Sur **http://localhost:3000/comics/search**
2. Taper un seul caractère
3. Vérifier : le bouton "Rechercher" est désactivé (attribut `disabled`)

---

### 4.11 Page recherche — avec clés Marvel

> Nécessite les clés Marvel dans `.env`

1. Sur **http://localhost:3000/comics/search**
2. Taper "x-men" et valider
3. **Résultat attendu :**
   - Grille de comics avec couvertures
   - Chaque carte cliquable
   - Bouton "Voir plus" si plus de 20 résultats
4. Cliquer "Voir plus" → les comics suivants s'ajoutent sans remplacer les premiers

---

### 4.12 Page détail comic — avec clés Marvel

> Nécessite les clés Marvel

1. Depuis la page recherche, cliquer sur un comic
2. **Résultat attendu :**
   - URL `/comics/:externalId`
   - Couverture, titre, auteurs, genres, description affichés
   - Boutons "Ajouter à ma liste" / "Donner un avis" visibles (si connecté)
   - Message "Connecte-toi pour ajouter..." (si non connecté)
3. Lien "← Retour à la recherche" fonctionnel

---

## 5. Tests base de données (vérification directe)

### 5.1 Vérifier qu'un utilisateur est bien créé

```bash
psql comicster -c "SELECT id, email, username, role, \"createdAt\" FROM \"User\";"
```

**Résultat attendu :** lignes correspondant aux comptes créés pendant les tests.

---

### 5.2 Vérifier que le mot de passe est hashé (jamais en clair)

```bash
psql comicster -c "SELECT email, \"passwordHash\" FROM \"User\" LIMIT 3;"
```

**Résultat attendu :** `passwordHash` commence par `$2b$` (format bcrypt). Jamais le mot de passe en clair.

---

### 5.3 Vérifier le cache comics en DB

> Après une recherche Marvel réussie

```bash
psql comicster -c "SELECT \"externalId\", title, \"coverUrl\" FROM \"Comic\" LIMIT 5;"
```

**Résultat attendu :** les comics recherchés sont présents en base.

---

### 5.4 Vérifier les tables créées par la migration

```bash
psql comicster -c "\dt"
```

**Tables attendues :**
```
Comic
Comment
Follow
List
ListItem
ReadingEntry
Review
User
```

---

## 6. Tests de sécurité

### 6.1 Le passwordHash n'est jamais exposé par l'API

```bash
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"motdepasse123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

curl -s http://localhost:3001/me -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

**Vérifier :** absence totale de `passwordHash`, `totpSecret`, `oauthId` dans la réponse.

---

### 6.2 Injection de header Authorization malformé

```bash
# Avec espace avant Bearer
curl -s http://localhost:3001/me \
  -H "Authorization:  Bearer validtoken"

# Avec Bearer en minuscules
curl -s http://localhost:3001/me \
  -H "Authorization: bearer validtoken"
```

**Résultat attendu — HTTP 401** dans les deux cas.

---

### 6.3 Token expiré (simulation)

Modifier temporairement `JWT_EXPIRES_IN=1s` dans `backend/.env`, redémarrer le backend, créer un token, attendre 2 secondes, puis :

```bash
curl -s http://localhost:3001/me -H "Authorization: Bearer $TOKEN_EXPIRE"
```

**Résultat attendu — HTTP 401 :**
```json
{"error": "Token invalide ou expiré"}
```

Remettre `JWT_EXPIRES_IN=7d` après le test.

---

### 6.4 Injection SQL — tentative via le champ email

```bash
curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com\" OR 1=1 --","password":"test"}'
```

**Résultat attendu — HTTP 401** (Prisma utilise des requêtes paramétrées, l'injection échoue).

---

## 7. Récapitulatif des cas couverts

| # | Endpoint | Cas | Statut attendu |
|---|---|---|---|
| 1.1 | POST /auth/register | Succès | 201 + token |
| 1.2 | POST /auth/register | Champs manquants | 400 |
| 1.3 | POST /auth/register | Email dupliqué | 409 |
| 1.4 | POST /auth/register | Username dupliqué | 409 |
| 1.5 | POST /auth/login | Succès | 200 + token |
| 1.6 | POST /auth/login | Mauvais mot de passe | 401 |
| 1.7 | POST /auth/login | Email inexistant | 401 |
| 1.8 | POST /auth/login | Champs manquants | 400 |
| 2.1 | GET /me | Token valide | 200 + profil |
| 2.2 | GET /me | Sans token | 401 |
| 2.3 | GET /me | Token forgé | 401 |
| 2.4 | GET /me | Header mal formé | 401 |
| 3.1 | GET /comics/search | Query < 2 chars | 400 |
| 3.2 | GET /comics/search | Sans paramètre q | 400 |
| 3.3 | GET /comics/search | Sans clés Marvel | 503 |
| 3.4 | GET /comics/search | Avec clés Marvel | 200 + liste |
| 3.5 | GET /comics/:id | Cache DB (2e appel) | 200 rapide |
| 3.6 | GET /comics/:id | ID inexistant sans Marvel | 503 |
| 3.7 | GET /comics/search | Pagination offset | 200 pages distinctes |
