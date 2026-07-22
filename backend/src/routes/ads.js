import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

const VALID_PLACEMENTS = ["HOME", "COMIC_DETAIL", "GUIDES_LIST", "GUIDE_DETAIL"];

// GET /ads?placement=HOME
// status "ad"      → un ou plusieurs encarts à afficher (champs ads[] et ad)
// status "generic" → aucun visuel perso, mais pas explicitement masqué → affiche générique
// status "hidden"  → au moins un encart existe et est explicitement désactivé → n'affiche rien
router.get("/", async (req, res) => {
  const { placement } = req.query;
  if (!placement || !VALID_PLACEMENTS.includes(placement)) {
    return res.status(400).json({ error: `placement doit être l'un de : ${VALID_PLACEMENTS.join(", ")}` });
  }

  const now = new Date();
  const rows = await prisma.adBanner.findMany({ where: { placement }, orderBy: { order: "asc" } });

  const activeRows = rows.filter((r) => r.isActive);

  if (activeRows.length === 0) {
    // Au moins une ligne existe mais aucune n'est active → masqué explicitement.
    // Aucune ligne du tout → jamais configuré, comportement par défaut (générique).
    return res.json({ status: rows.length > 0 ? "hidden" : "generic" });
  }

  const inWindowWithImage = activeRows.filter(
    (r) =>
      r.imageUrl &&
      (!r.startAt || r.startAt <= now) &&
      (!r.endAt || r.endAt >= now)
  );

  if (inWindowWithImage.length === 0) return res.json({ status: "generic" });

  // On renvoie désormais TOUS les encarts diffusables, dans l'ordre défini par
  // l'admin : le client les fait défiler. Avant, un seul était tiré au hasard et
  // les autres étaient jetés — le champ `order` ne servait donc à rien.
  //
  // Rotation dans l'ordre plutôt qu'aléatoire : l'admin contrôle la séquence, et
  // le rendu est reproductible (utile en démo comme en test). Contrepartie
  // assumée : le premier encart récolte toujours la première impression.
  //
  // `ad` est conservé — premier de la liste — pour ne casser aucun appelant qui
  // lirait encore l'ancien format.
  res.json({ status: "ad", ads: inWindowWithImage, ad: inWindowWithImage[0] });
});

export default router;
