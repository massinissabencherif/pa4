import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

const VALID_PLACEMENTS = ["HOME", "COMIC_DETAIL", "GUIDES_LIST", "GUIDE_DETAIL"];

// GET /ads?placement=HOME
// status "ad"      → un vrai encart configuré à afficher (champ ad)
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

  const ad = inWindowWithImage[Math.floor(Math.random() * inWindowWithImage.length)];
  res.json({ status: "ad", ad });
});

export default router;
