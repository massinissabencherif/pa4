# Infrastructure & Sécurité VPS — Comicster

## Environnements

| Env | URL | Branche | Ports Docker |
|-----|-----|---------|--------------|
| Production | sitedetestdemassinissabencherif.com | `main` | 3000 (front), 3001 (back) |
| Staging | dev.sitedetestdemassinissabencherif.com | `dev` | 3010 (front), 3011 (back) |

---

## VPS

- **Fournisseur** : OVH / Scaleway / DigitalOcean (VPS Linux)
- **OS** : Ubuntu 24.04 LTS
- **Accès** : SSH uniquement par clé (pas de mot de passe)

---

## Sécurité SSH

Fichier `/etc/ssh/sshd_config` :

```
PasswordAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
Port 22
```

Redémarrer après modification :
```bash
sudo systemctl restart sshd
```

---

## Pare-feu (ufw)

```bash
# Réinitialiser
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Autoriser SSH, HTTP, HTTPS uniquement
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Activer
sudo ufw enable
sudo ufw status verbose
```

---

## Fail2Ban (protection brute-force SSH)

```bash
sudo apt install fail2ban -y

# /etc/fail2ban/jail.local
[sshd]
enabled = true
port = ssh
maxretry = 5
bantime = 3600
findtime = 600
```

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## HTTPS — Let's Encrypt (Certbot)

```bash
sudo apt install certbot python3-certbot-nginx -y

sudo certbot --nginx -d sitedetestdemassinissabencherif.com -d www.sitedetestdemassinissabencherif.com
sudo certbot --nginx -d dev.sitedetestdemassinissabencherif.com
```

Renouvellement automatique (cron) :
```bash
sudo systemctl enable certbot.timer
```

---

## Nginx — Headers de sécurité

Les headers suivants sont configurés dans `/etc/nginx/sites-available/comicster` :

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; frame-src 'self';" always;
```

| Header | Valeur | Protection |
|--------|--------|------------|
| HSTS | max-age=31536000 | Force HTTPS, empêche le downgrade |
| X-Frame-Options | SAMEORIGIN | Protège contre le clickjacking |
| X-Content-Type-Options | nosniff | Empêche le MIME sniffing |
| Referrer-Policy | strict-origin | Limite les infos dans le referrer |
| CSP | default-src 'self' | Restreint les ressources chargées |

---

## Backend — Sécurité applicative

**Helmet.js** (headers HTTP sécurité, activé dans `backend/src/server.js`) :
```js
app.use(helmet())
```

**Rate limiting** sur `/auth/*` (20 req / 15 min par IP) :
```js
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 })
app.use('/auth', authLimiter, authRouter)
```

---

## Mises à jour automatiques

```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

---

## CI/CD — GitHub Actions

Les secrets GitHub suivants doivent être configurés dans le repo :

| Secret | Description |
|--------|-------------|
| `VPS_HOST` | IP ou domaine du VPS |
| `VPS_USER` | Utilisateur SSH |
| `VPS_SSH_KEY` | Clé SSH privée |
| `PROD_URL` | URL production (pour les tests E2E) |
| `STAGING_URL` | URL staging (pour les tests E2E) |
| `BASIC_AUTH_USER` | Login basic auth staging |
| `BASIC_AUTH_PASS` | Mot de passe basic auth staging |

Pipeline :
1. `push` sur `dev` → CI (tests backend, build frontend) → deploy staging
2. `push` sur `main` → CI → deploy production → tests E2E
