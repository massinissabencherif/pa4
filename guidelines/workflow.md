# Workflow de développement — Comicster

> **Document de référence.** Il remplace toutes les règles antérieures (README, notes éparses). En cas de doute, c'est ce fichier qui fait foi.

---

## 1. Le principe

Trois étapes en ligne, plus le local. **Une seule direction de circulation**, et **chaque passage d'étape est une Pull Request** que l'on valide.

```
local  →  feature branch  →  sandbox  →  dev  →  prod (main)
```

| Environnement | Branche | Rôle | Qui teste |
|---|---|---|---|
| **local** | n'importe laquelle | Liberté totale du dev. On code, on casse, on recommence. | le dev lui-même |
| **sandbox** | `sandbox` | **Terrain de jeu / intégration.** Toutes les features des devs s'y rencontrent. | les devs |
| **dev** | `dev` | **Release candidate.** Ce qui est sur le point de partir en prod. | clients, marketing, PM, toutes les équipes |
| **prod** | `main` | **Le réel.** Vrais utilisateurs. Protégée au maximum. | les utilisateurs |

---

## 2. La règle d'or (l'invariant)

> **`prod ⊆ dev ⊆ sandbox`** — en permanence.
>
> Autrement dit : **`dev` et `main` ne reçoivent jamais de modification « directe ». Ils ne font qu'avancer pour rattraper l'étape du dessus.**

C'est la règle qui garantit tout le reste :
- `dev` n'est **jamais en retard** sur la prod → c'est un vrai miroir de ce qui va sortir, donc les tests des équipes sont représentatifs.
- Aucune **dérive** possible entre les branches (plus besoin de réaligner à la main).
- La prod est protégée par construction : rien n'y arrive qui ne soit passé par sandbox **puis** dev.

Toutes les dérives qu'on a connues venaient d'une violation de cette règle (un changement poussé directement sur `main`, ou une promotion qui n'est jamais redescendue).

### Comment vérifier l'invariant (et éviter les faux positifs)

Chaque merge de PR crée un **commit de merge** sur la branche cible. Compter les « commits de retard » donne donc des **faux positifs** : une branche peut afficher un commit d'écart alors qu'aucun contenu ne lui manque. **Ce qui compte, c'est le contenu.**

```bash
git fetch origin
# Du contenu de la prod manque-t-il à sandbox ? (on ne doit rien voir venir de main)
git diff origin/main origin/sandbox --stat
```

Les différences dans le sens « sandbox est en avance » sont normales et attendues.

### Redescendre : toujours en chaîne, jamais en parallèle

Quand il faut faire redescendre quelque chose (hotfix, remise à niveau), procéder **en séquence** :

```
main → dev,  PUIS  dev → sandbox
```

❌ Ne **jamais** lancer `main → dev` et `main → sandbox` **en parallèle** : ça crée deux commits de merge indépendants et les branches divergent structurellement (même si le contenu reste correct). Erreur commise une fois — la chaîne évite le problème.

---

## 3. Le cycle d'une feature

### a. Se mettre à jour (retour de congés, début de journée)

```bash
# Voir où en est la prod (la référence "réel")
git checkout main && git pull

# Récupérer l'en-cours de l'équipe (contient déjà tout ce qui est en prod)
git checkout sandbox && git pull
```

> Grâce à l'invariant, `sandbox` contient **déjà** tout ce qui est en prod. La 2ᵉ commande suffit donc à tout avoir.

### b. Démarrer la feature — **toujours depuis `sandbox`**

```bash
git checkout sandbox && git pull
git checkout -b feat/nom-de-la-feature
```

> ⚠️ **Ne jamais brancher une feature depuis `main`.** `main` est volontairement en retard ; partir de là, c'est construire sur une base périmée et se garantir des conflits au moment de la PR.

### c. Coder et tester en local

```bash
./start.sh reset     # stack complète + données de démo
```

### d. Soumettre — PR vers `sandbox`

```bash
git push -u origin feat/nom-de-la-feature
```
Puis sur GitHub : ouvrir une **PR vers `sandbox`**. La CI lance les tests, on relit le diff, on valide, on merge.

### e. Promotions (une PR à chaque porte)

1. **PR `sandbox → dev`** → les équipes testent sur `dev.sitedetestdemassinissabencherif.com`.
2. **PR `dev → main`** → déploiement en production.

### f. Nettoyage

Supprimer la branche feature après merge (activer *« Automatically delete head branches »* dans les réglages GitHub pour que ce soit automatique).

---

## 4. Ce qui est interdit

- ❌ Commit ou push **direct** sur `dev` ou `main`.
- ❌ Brancher une feature depuis `main`.
- ❌ Merger sans passer par une PR.
- ❌ Faire arriver quoi que ce soit en prod sans être passé par sandbox **puis** dev.

---

## 5. Le seul cas particulier : le hotfix

Pour un **correctif urgent en production** (faute de texte, bug bloquant, rien de structurant) :

```bash
git checkout main && git pull
git checkout -b hotfix/description
```
→ PR vers `main`, on valide, ça part en prod.

**⚠️ Obligatoire juste après :** faire **redescendre** le hotfix dans `dev` puis `sandbox` (PR `main → dev`, puis `dev → sandbox`). Sans ça, l'invariant est cassé et la dérive repart.

> C'est la seule exception, et elle a un prix : la redescente immédiate. Si on n'est pas prêt à la faire, on passe par le flux normal.

---

## 6. Rappel : à quoi sert une PR

Une PR n'est pas une commande git, c'est le **sas de contrôle** de GitHub entre deux branches :
elle affiche **le diff**, lance **la CI (tests + build)**, permet la relecture, et ce n'est qu'au clic sur **Merge** que le code entre réellement dans la branche cible. C'est ce qui garantit que rien n'atterrit dans un environnement partagé sans avoir été vu et testé.

---

## 7. Infrastructure — état

### ✅ Corrigé : isolation des projets Docker
Aucun fichier compose ne déclarait de nom de projet, donc Compose prenait le nom du dossier (`pa4`) : **prod et sandbox cohabitaient dans le même projet**. Chaque déploiement sandbox listait les conteneurs de production comme « orphelins » et Docker suggérait `--remove-orphans` — c'est-à-dire de les supprimer. Chaque environnement déclare désormais son projet (`pa4`, `comicster-sandbox`, `pa4-staging`), et les volumes sandbox sont épinglés sur leurs noms existants pour ne pas perdre les données au changement de projet.

### ✅ Corrigé : déploiement sandbox automatisé
`sandbox` est maintenant dans les déclencheurs de `.github/workflows/deploy.yml`. Auparavant seuls `main` et `dev` se déployaient automatiquement : merger dans `sandbox` mettait à jour la branche **mais pas les conteneurs**, et l'écart était silencieux (on a testé du code vieux de 3 jours en croyant valider le nouveau).

**Sandbox travaille dans un répertoire dédié** — un *git worktree* en `/home/ubuntu/pa4-sandbox` — et non dans `/home/ubuntu/pa4`. Ainsi la branche `main` reste toujours en place dans le dépôt principal pour le déploiement prod. Le script recrée le worktree s'il est absent (le `.env`, non versionné, est lié par symlink).

### ⚠️ Reste à faire
- **Dossier partagé entre prod et staging** : leurs déploiements font tous deux `cd /home/ubuntu/pa4 && git pull origin <branche>`. Or `git pull origin dev` fusionne dev dans la branche actuellement checkout → on peut builder depuis un état mélangé. Donner aussi à staging son propre worktree réglerait le dernier cas.
- **Activer la suppression automatique des branches** après merge dans les réglages GitHub.
- **Ajouter `sandbox` aux déclencheurs de la CI** (`ci.yml`) pour faire tourner les tests aussi sur sandbox — à faire en décidant quelle URL utiliser pour les tests E2E.
