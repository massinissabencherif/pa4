# Encarts publicitaires animés — plan

> **Statut : implémenté le 22/07/2026**, livré sur `sandbox` pour recette.
> Ce document conserve la conception et les arbitrages ; voir la section finale pour ce qui a réellement été fait.

## L'idée

Un encart publicitaire ne porte plus un seul visuel mais **plusieurs**, chacun avec son propre lien.
Le visuel change **toutes les 7 à 8 secondes**, avec une **animation de page qui se tourne** — le geste du comic papier, pas un carrousel générique.

---

## Ce qui existe déjà (et qu'on n'avait pas exploité)

**Aucune migration n'est nécessaire.** Le modèle `AdBanner` permet déjà plusieurs encarts sur un même emplacement, et porte même un champ `order` prévu pour les classer.

Mieux : `GET /ads` **récupère déjà la liste complète** des encarts actifs et dans leur fenêtre de diffusion — puis en jette tout sauf un, tiré au hasard :

```js
// backend/src/routes/ads.js:38
const ad = inWindowWithImage[Math.floor(Math.random() * inWindowWithImage.length)];
```

La donnée est là, le back-office sait déjà la produire. Il ne reste qu'à cesser de la jeter.

---

## Le travail réel

### 1. Backend — arrêter de réduire à un seul

`GET /ads` renvoie `ads: [...]` (triés par `order`) au lieu de `ad: {...}`.

Point d'attention : le champ `ad` est consommé par `AdSlot.vue`. Les deux se déploient ensemble, donc un changement franc est acceptable — mais **vérifier qu'aucun autre appelant ne lit `ad`** avant de le retirer.

Cas limites à conserver :
- `status: "hidden"` — au moins un encart existe et tous sont désactivés
- `status: "generic"` — aucun encart configuré, ou aucun visuel dans sa fenêtre
- **un seul visuel → aucune rotation**, aucune animation, aucun minuteur

### 2. Frontend — `AdSlot.vue`

Rotation toutes les 7,5 s. Les points qui demandent du soin :

- **Le lien doit suivre le visuel.** C'est le vrai piège : si l'utilisateur clique pendant la bascule, il doit atterrir sur le lien du visuel qu'il *voit*. Le `href` ne change qu'une fois l'animation terminée.
- **`prefers-reduced-motion`** → fondu simple, ou remplacement direct. Jamais de page qui tourne imposée.
- **Pause au survol** — on ne fait pas disparaître un encart sous le curseur de quelqu'un qui le lit.
- **Arrêt hors écran** via `IntersectionObserver` : un encart invisible n'a pas à consommer du temps de rendu.
- Nettoyer le minuteur au démontage du composant.

### 3. L'animation de page tournée

Rotation 3D autour du **bord gauche**, pas un fondu déguisé :

```
conteneur      perspective: 1200px
feuille        transform-style: preserve-3d
               transform-origin: left center
               transition: transform .7s cubic-bezier(.35,0,.25,1)
face avant     visuel courant
face arrière   visuel suivant, rotateY(180deg), backface-visibility: hidden
```

Le détail qui fait la différence : un **dégradé d'ombre qui balaie** la feuille pendant la rotation. Sans lui, la page a l'air en carton. Avec, elle a l'épaisseur du papier.

---

## Effort estimé

**~2 heures**, dont l'essentiel sur l'animation. Aucune migration, aucun changement de back-office, aucun risque sur les données.

---

## Ce qui a été fait

**Backend** — `GET /ads` renvoie `ads[]` (tous les encarts diffusables, triés par `order`) **et** conserve `ad` pointant sur le premier, pour ne casser aucun appelant. Changement purement additif : les 10 tests existants passent sans modification. 4 tests ajoutés (ordre, compatibilité, encart unique, exclusion hors fenêtre).

**Frontend** — `AdSlot.vue` fait défiler les visuels toutes les 7,5 s avec une rotation de page de 700 ms.

Arbitrages retenus à l'implémentation :

- **Rotation jusqu'à 90°, pas 180°.** À 90° la page est sur la tranche : elle n'occupe plus aucune largeur et découvre entièrement le visuel du dessous. Aller au-delà ferait déborder la page hors du cadre, ce qui obligerait à un `overflow: hidden` qui aplatit la scène 3D.
- **Animation CSS (`animation`) plutôt que `transition`.** Retirer la classe rend la page à plat instantanément ; avec une transition, elle serait revenue en pivotant à l'envers.
- **Clics neutralisés pendant la rotation.** Supprime par construction le risque de cliquer un visuel et d'atterrir sur le lien d'un autre.
- **Pas de `backface-visibility` sur l'élément qui porte `preserve-3d`** — la combinaison aplatit la scène dans plusieurs navigateurs. Ce sont les deux faces qui la portent.
- **`animationend` filtré sur le nom de l'animation** : l'ombre a la même durée et son événement remonte au parent, ce qui validerait la rotation deux fois.
- Un seul visuel → **ni minuteur, ni animation, ni observateur**.

## Reste à faire

- Recette visuelle sur sandbox (il faut **au moins deux encarts** configurés sur le même emplacement pour voir quoi que ce soit).
- Vérifier le rendu sur mobile et en mouvement réduit.
