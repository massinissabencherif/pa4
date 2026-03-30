# Tests — Comicster (PA 2026)

Tous les tests à réaliser sur les fonctionnalités implémentées.
Mis à jour le 29/03/2026.

## Résultats globaux

| Section | Tests | Statut |
|---|---|---|
| 1. Auth register/login | 8/8 | ✅ |
| 2. Profil /me | 4/4 | ✅ |
| 3. Comics | 7/7 | ✅ |
| 4. Journal de lecture | 5/5 | ✅ |
| 5. Listes | 5/5 | ✅ |
| 6. Avis | 4/4 | ✅ |
| 7. Social (profils + follow) | 4/4 | ✅ |
| 8. Admin | 4/4 | ✅ |
| 9. OAuth2 Google + GitHub | 3/3 | ✅ |
| 10. 2FA TOTP | 4/4 | ✅ |
| 11. Refresh token | 3/3 | ✅ |
| 12. Sécurité (headers, injection) | 5/5 | ✅ |
| 13. Accessibilité | 5/5 | ✅ |
| 14. Umami analytics | 3/3 | ✅ |
| 15. CI/CD | 3/3 | ✅ |
| 16. Base de données | 4/4 | ✅ |
| **Total** | **71/71** | ✅ |

---

## Prérequis

Le site est accessible en prod sur **https://sitedetestdemassinissabencherif.com**

Pour tester l'API directement :
```bash
BASE="https://sitedetestdemassinissabencherif.com/api"
```

---

## 1. Auth — Register / Login

### 1.1 Inscription — succès
```bash
curl -s -X POST $BASE/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@comicster.fr","username":"testuser","password":"Password123!"}'
```
**Attendu — HTTP 201 :** `{ "token": "eyJ...", "refreshToken": "...", "user": {...} }`

---

### 1.2 Inscription — champs manquants
```bash
curl -s -X POST $BASE/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"x@x.fr"}'
```
**Attendu — HTTP 400 :** `{"error": "email, username et password sont requis"}`

---

### 1.3 Inscription — email dupliqué
```bash
curl -s -X POST $BASE/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@comicster.fr","username":"autre","password":"Password123!"}'
```
**Attendu — HTTP 409 :** `{"error": "Email ou username déjà utilisé"}`

---

### 1.4 Inscription — username dupliqué
```bash
curl -s -X POST $BASE/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"autre@comicster.fr","username":"testuser","password":"Password123!"}'
```
**Attendu — HTTP 409 :** `{"error": "Email ou username déjà utilisé"}`

---

### 1.5 Connexion — succès
```bash
curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@comicster.fr","password":"Password123!"}'
```
**Attendu — HTTP 200 :** `{ "token": "eyJ...", "refreshToken": "...", "user": {...} }`

---

### 1.6 Connexion — mauvais mot de passe
```bash
curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@comicster.fr","password":"mauvais"}'
```
**Attendu — HTTP 401 :** `{"error": "Identifiants invalides"}`

---

### 1.7 Connexion — email inexistant
```bash
curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"fantome@comicster.fr","password":"Password123!"}'
```
**Attendu — HTTP 401 :** `{"error": "Identifiants invalides"}`

---

### 1.8 Connexion — champs manquants
```bash
curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@comicster.fr"}'
```
**Attendu — HTTP 400 :** `{"error": "email et password sont requis"}`

---

## 2. Profil — /me

### 2.1 GET /me avec token valide
```bash
TOKEN=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@comicster.fr","password":"Password123!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

curl -s $BASE/me -H "Authorization: Bearer $TOKEN"
```
**Attendu — HTTP 200 :** profil sans passwordHash ni totpSecret

---

### 2.2 GET /me sans token
```bash
curl -s $BASE/me
```
**Attendu — HTTP 401**

---

### 2.3 GET /me token invalide
```bash
curl -s $BASE/me -H "Authorization: Bearer tokenbidon"
```
**Attendu — HTTP 401**

---

### 2.4 Le passwordHash n'est jamais exposé
Vérifier dans la réponse de 2.1 : absence de `passwordHash`, `totpSecret`, `oauthId`.

---

## 3. Comics

### 3.1 Recherche — query trop courte
```bash
curl -s "$BASE/comics/search?q=x"
```
**Attendu — HTTP 400**

---

### 3.2 Recherche — succès
```bash
curl -s "$BASE/comics/search?q=batman&limit=5"
```
**Attendu — HTTP 200 :** `{ "total": ..., "comics": [...] }`

---

### 3.3 Recherche — pagination
```bash
curl -s "$BASE/comics/search?q=spider&limit=5&offset=0"
curl -s "$BASE/comics/search?q=spider&limit=5&offset=5"
```
**Attendu :** les deux listes de comics sont différentes.

---

### 3.4 Détail comic — cache DB
```bash
# 1er appel : frappe Marvel et met en cache
curl -s "$BASE/comics/search?q=batman&limit=1" > /dev/null

# Récupère l'externalId
ID=$(curl -s "$BASE/comics/search?q=batman&limit=1" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['comics'][0]['externalId'])")

# 2e appel : depuis la DB, plus rapide
time curl -s "$BASE/comics/$ID" > /dev/null
```
**Attendu :** 2e appel < 100ms (vs ~300ms le 1er)

---

### 3.5 Page recherche — bouton désactivé si query < 2 chars
1. Aller sur **/comics/search**
2. Taper un seul caractère
3. **Attendu :** bouton "Rechercher" désactivé

---

### 3.6 Page détail comic
1. Cliquer sur un comic depuis la recherche
2. **Attendu :** couverture, titre, auteurs, genres, description
3. Bouton "Ajouter au journal" visible si connecté

---

### 3.7 Ajout au journal depuis la page comic
1. Être connecté, aller sur un comic
2. Cliquer "Ajouter au journal"
3. **Attendu :** le comic apparaît dans /journal

---

## 4. Journal de lecture

### 4.1 Ajouter un comic
```bash
curl -s -X POST $BASE/reading-list \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comicId":"ID_DU_COMIC"}'
```
**Attendu — HTTP 201**

---

### 4.2 Changer le statut
```bash
curl -s -X PATCH $BASE/reading-list/ID_ENTRY/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"IN_PROGRESS"}'
```
**Attendu — HTTP 200 :** entry avec `startedAt` rempli

---

### 4.3 Filtres sur /journal
1. Aller sur **/journal**
2. Cliquer sur "En cours", "À lire", "Terminé"
3. **Attendu :** la liste filtre correctement

---

### 4.4 Supprimer un comic du journal
1. Sur /journal, cliquer sur la croix d'un comic
2. **Attendu :** le comic disparaît de la liste sans reload

---

### 4.5 Accès sans authentification
1. Se déconnecter et aller sur **/journal**
2. **Attendu :** redirection vers /auth/login

---

## 5. Listes personnalisées

### 5.1 Créer une liste
```bash
curl -s -X POST $BASE/lists \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Mes favoris Marvel"}'
```
**Attendu — HTTP 201 :** liste avec slug unique généré

---

### 5.2 Rendre une liste publique
```bash
curl -s -X PATCH $BASE/lists/ID_LIST/visibility \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isPublic":true}'
```
**Attendu — HTTP 200**

---

### 5.3 Accès à une liste publique sans auth
```bash
curl -s "$BASE/lists/public/SLUG_DE_LA_LISTE"
```
**Attendu — HTTP 200 :** contenu de la liste visible

---

### 5.4 Accès à une liste privée sans auth
```bash
curl -s "$BASE/lists/ID_LIST_PRIVEE"
```
**Attendu — HTTP 401 ou 403**

---

### 5.5 Page de partage
1. Copier l'URL **/lists/public/:slug**
2. L'ouvrir en navigation privée
3. **Attendu :** liste visible sans connexion

---

## 6. Avis et notes

### 6.1 Laisser un avis
```bash
curl -s -X POST $BASE/reviews \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comicId":"ID_COMIC","rating":4,"content":"Excellent comic !"}'
```
**Attendu — HTTP 201**

---

### 6.2 Double avis impossible
```bash
# Même comicId que 6.1
curl -s -X POST $BASE/reviews \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comicId":"ID_COMIC","rating":5,"content":"Deuxième avis"}'
```
**Attendu — HTTP 409 ou 400**

---

### 6.3 Modifier un avis
```bash
curl -s -X PATCH $BASE/reviews/ID_REVIEW \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rating":5,"content":"Encore mieux !"}'
```
**Attendu — HTTP 200**

---

### 6.4 Supprimer un avis
```bash
curl -s -X DELETE $BASE/reviews/ID_REVIEW \
  -H "Authorization: Bearer $TOKEN"
```
**Attendu — HTTP 200 ou 204**

---

## 7. Social — Profils + Follow

### 7.1 Voir un profil public
```bash
curl -s "$BASE/users/testuser"
```
**Attendu — HTTP 200 :** `{ username, stats, reviews, lists }`

---

### 7.2 Suivre un utilisateur
```bash
curl -s -X POST "$BASE/users/ID_USER/follow" \
  -H "Authorization: Bearer $TOKEN"
```
**Attendu — HTTP 201**

---

### 7.3 Vérifier le statut follow
```bash
curl -s "$BASE/users/ID_USER/follow" \
  -H "Authorization: Bearer $TOKEN"
```
**Attendu — HTTP 200 :** `{ "following": true }`

---

### 7.4 Se désabonner
```bash
curl -s -X DELETE "$BASE/users/ID_USER/follow" \
  -H "Authorization: Bearer $TOKEN"
```
**Attendu — HTTP 200**

---

## 8. Admin

### 8.1 Accès dashboard sans rôle admin
1. Se connecter avec un compte normal
2. Aller sur **/admin**
3. **Attendu :** redirection ou erreur 403

---

### 8.2 Stats admin
```bash
curl -s "$BASE/admin/stats" \
  -H "Authorization: Bearer $TOKEN_ADMIN"
```
**Attendu — HTTP 200 :** `{ usersCount, comicsCount, reviewsCount }`

---

### 8.3 Upload comic (admin)
1. Aller sur **/admin**
2. Remplir le formulaire avec titre + couverture + PDF
3. **Attendu :** comic créé et visible dans la liste

---

### 8.4 Supprimer un comic (admin)
```bash
curl -s -X DELETE "$BASE/admin/comics/ID_COMIC" \
  -H "Authorization: Bearer $TOKEN_ADMIN"
```
**Attendu — HTTP 200**

---

## 9. OAuth2 Google + GitHub

### 9.1 Connexion Google
1. Aller sur **/auth/login**
2. Cliquer "Se connecter avec Google"
3. **Attendu :** fenêtre Google → autorisation → redirection vers `/` connecté

---

### 9.2 Connexion GitHub
1. Aller sur **/auth/login**
2. Cliquer "Se connecter avec GitHub"
3. **Attendu :** fenêtre GitHub → autorisation → redirection vers `/` connecté

---

### 9.3 OAuth sans clés configurées
```bash
# Si les clés ne sont pas dans .env
curl -s "$BASE/auth/google"
```
**Attendu — HTTP 503 :** `{"error": "Google OAuth non configuré"}`

---

## 10. 2FA TOTP

### 10.1 Activer la 2FA
1. Être connecté → aller sur **/settings/security**
2. Cliquer "Activer la 2FA"
3. **Attendu :** QR code affiché → scanner avec Google Authenticator

---

### 10.2 Vérifier l'activation
1. Saisir le code à 6 chiffres de l'app
2. **Attendu :** message "2FA activée"

---

### 10.3 Login avec 2FA activée
1. Se déconnecter
2. Se reconnecter avec email/password
3. **Attendu :** étape 2FA demandée → saisir le code → connecté

---

### 10.4 Désactiver la 2FA
1. Sur /settings/security → cliquer "Désactiver"
2. Saisir le code TOTP courant
3. **Attendu :** 2FA désactivée, login normal à nouveau

---

## 11. Refresh token

### 11.1 Obtenir un nouveau token
```bash
REFRESH=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@comicster.fr","password":"Password123!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['refreshToken'])")

curl -s -X POST $BASE/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH\"}"
```
**Attendu — HTTP 200 :** nouveau `token` + nouveau `refreshToken`

---

### 11.2 Refresh token invalide
```bash
curl -s -X POST $BASE/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"tokenbidon"}'
```
**Attendu — HTTP 401**

---

### 11.3 Rotation — l'ancien refresh token est révoqué
```bash
# Après utilisation du refresh token en 11.1, réutiliser l'ANCIEN
curl -s -X POST $BASE/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH\"}"
```
**Attendu — HTTP 401** (le token a été révoqué après rotation)

---

## 12. Sécurité

### 12.1 Headers de sécurité présents
```bash
curl -I https://sitedetestdemassinissabencherif.com
```
**Attendu :** présence de :
- `Strict-Transport-Security`
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Content-Security-Policy`
- `Referrer-Policy`

---

### 12.2 HTTP redirige vers HTTPS
```bash
curl -I http://sitedetestdemassinissabencherif.com
```
**Attendu — HTTP 301** vers `https://`

---

### 12.3 Injection SQL via email
```bash
curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com\" OR 1=1 --","password":"test"}'
```
**Attendu — HTTP 401** (Prisma utilise des requêtes paramétrées)

---

### 12.4 Fail2ban actif
```bash
sudo fail2ban-client status
```
**Attendu :** 3 jails actives : `sshd`, `nginx-http-auth`, `nginx-limit-req`

---

### 12.5 Accès root SSH désactivé
```bash
ssh root@141.94.33.230
```
**Attendu :** connexion refusée (`Permission denied`)

---

## 13. Accessibilité

### 13.1 Score Lighthouse
1. Ouvrir Chrome → F12 → Lighthouse
2. Tester **/auth/login** et **/journal**
3. Cocher uniquement "Accessibility"
4. **Attendu :** score ≥ 90

---

### 13.2 Navigation clavier — login
1. Aller sur **/auth/login**
2. Appuyer sur Tab plusieurs fois
3. **Attendu :** focus visible passe dans l'ordre : Email → Mot de passe → Se connecter → Google → GitHub

---

### 13.3 Labels formulaires
1. Sur **/auth/login**, inspecter le champ email (F12)
2. **Attendu :** `<label for="login-email">` lié à `<input id="login-email">`

---

### 13.4 Boutons filtres journal
1. Sur **/journal**, inspecter les boutons de filtre (F12)
2. **Attendu :** attribut `aria-pressed="true"` sur le filtre actif

---

### 13.5 Sémantique HTML journal
1. Sur **/journal**, inspecter la liste de comics (F12)
2. **Attendu :** `<ul>` avec des `<li>` (et non des `<div>`)

---

## 14. Umami analytics

### 14.1 Script de tracking présent
1. Ouvrir **https://sitedetestdemassinissabencherif.com**
2. F12 → Network → recharger
3. **Attendu :** requête vers `/umami/script.js` avec statut 200

---

### 14.2 Visite enregistrée
1. Naviguer sur plusieurs pages du site
2. Ouvrir le dashboard Umami sur **/umami/**
3. **Attendu :** visite et pages vues apparaissent dans les stats

---

### 14.3 Proxy HTTPS Umami
```bash
curl -I https://sitedetestdemassinissabencherif.com/umami/script.js
```
**Attendu — HTTP 200** (pas de mixed content)

---

## 15. CI/CD

### 15.1 Tests automatisés en CI
1. Aller sur GitHub → Actions → dernier run
2. **Attendu :** job "Backend — lint & test" vert avec 22 tests passants

---

### 15.2 Déploiement automatique
1. Pusher un commit sur `main`
2. GitHub Actions → workflow "Deploy"
3. **Attendu :** déploiement SSH réussi, site mis à jour

---

### 15.3 Build Docker en CI
1. Même run → job "Docker — compose build"
2. **Attendu :** build des 3 images (postgres, backend, frontend) sans erreur

---

## 16. Base de données

### 16.1 Tables présentes
```bash
sudo docker compose exec postgres psql -U comicster -c "\dt"
```
**Attendu :** User, RefreshToken, Follow, Comic, ReadingEntry, Review, Comment, List, ListItem

---

### 16.2 Index présents
```bash
sudo docker compose exec postgres psql -U comicster -c "\di" | grep -E "idx"
```
**Attendu :** 6 index créés par la migration `add_indexes`

---

### 16.3 Passwords hashés en bcrypt
```bash
sudo docker compose exec postgres psql -U comicster -c 'SELECT email, "passwordHash" FROM "User" LIMIT 3;'
```
**Attendu :** `passwordHash` commence par `$2b$`

---

### 16.4 Migration appliquée
```bash
sudo docker compose exec postgres psql -U comicster -c 'SELECT "migrationName" FROM "_prisma_migrations" ORDER BY "finishedAt";'
```
**Attendu :** 4 migrations dont `20260329001204_add_indexes`
