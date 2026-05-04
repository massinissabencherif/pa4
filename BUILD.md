# Build local — Comicster

Ce guide explique comment faire tourner Comicster sur ta machine pour développer et tester.

---

## Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (inclut Docker Compose)
- [Node.js 22+](https://nodejs.org/) avec npm — pour le serveur de dev Nuxt
- Git

Vérifie que tout est installé :

```bash
docker --version    # Docker 24+
node --version      # v22+
npm --version       # 10+
```

---

## 1. Cloner le repo

```bash
git clone <url-du-repo>
cd pa4
```

---

## 2. Variables d'environnement

Copie le fichier exemple et remplis les valeurs :

```bash
cp .env.example .env
```

Pour un usage **local uniquement**, les valeurs par défaut suffisent. Seules ces lignes sont obligatoires :

```env
POSTGRES_PASSWORD=comicster_secret
JWT_SECRET=une_chaine_aleatoire_longue
SESSION_SECRET=une_autre_chaine_differente
TOTP_ENCRYPTION_KEY=64_caracteres_hexadecimaux
```

> Générer une clé aléatoire : `openssl rand -hex 32`
> Générer la TOTP_ENCRYPTION_KEY (64 hex) : `openssl rand -hex 32`

Les clés OAuth (Google, GitHub) et Marvel sont optionnelles — les features correspondantes seront désactivées si absentes.

---

## 3. Démarrer le backend (Docker)

Le backend (API Express + PostgreSQL) tourne dans Docker :

```bash
docker compose up -d
```

Cela démarre :
- **PostgreSQL** sur le port `5432` (interne)
- **Backend API** sur le port `3001`

Les migrations Prisma s'exécutent automatiquement au démarrage.

Vérifie que tout tourne :

```bash
docker compose ps
curl http://localhost:3001/health  # → {"status":"ok"}
```

---

## 4. Démarrer le frontend (dev server)

Le frontend Nuxt tourne en dehors de Docker pour bénéficier du Hot Module Replacement (HMR) :

```bash
cd frontend
npm install
NUXT_PUBLIC_APP_ENV=dev npm run dev -- --port 3005
```

> `NUXT_PUBLIC_APP_ENV=dev` est **obligatoire** en local : il désactive le flag `secure` sur les cookies (qui bloquerait la connexion sur HTTP).

Le site est accessible sur **http://localhost:3005**

---

## 5. Compte de test

Un super admin est disponible en local après le premier lancement :

| Champ | Valeur |
|-------|--------|
| Email | `admin2@test.com` |
| Mot de passe | `admin1234` |

> Si le compte n'existe pas, crée-le via la page d'inscription puis passe son rôle en `SUPER_ADMIN` directement en DB (voir ci-dessous).

---

## Commandes utiles

### Logs backend
```bash
docker compose logs -f backend
```

### Réinitialiser la base de données
```bash
docker compose down -v   # supprime les volumes (données perdues)
docker compose up -d
```

### Accéder à la DB en ligne de commande
```bash
docker exec -it pa4-postgres-1 psql -U comicster -d comicster
```

### Passer un utilisateur en SUPER_ADMIN
```bash
docker exec -it pa4-postgres-1 psql -U comicster -d comicster \
  -c "UPDATE \"User\" SET role='SUPER_ADMIN' WHERE email='ton@email.com';"
```

### Rebuilder le backend après modification
```bash
docker compose up --build -d backend
```

---

## Arborescence des environnements

| Env | Accès | Frontend | Backend | Usage |
|-----|-------|----------|---------|-------|
| **local** | localhost | port 3005 (HMR) | port 3001 (Docker) | Dev quotidien |
| **sandbox** | sandbox.sitedetestdemassinissabencherif.com | Docker | Docker | Tests A/B, nouvelles features |
| **dev** | dev.sitedetestdemassinissabencherif.com | Docker | Docker | Pré-prod, validation finale |
| **prod** | sitedetestdemassinissabencherif.com | Docker | Docker | Utilisateurs réels |

Le flux de déploiement suit toujours : **local → sandbox → dev → prod**
