#!/usr/bin/env node
/**
 * Rattache la planche générique aux comics qui n'ont pas de fichier de lecture.
 *
 * Pourquoi : la fiche comic n'affiche son bouton de lecture que si `pdfUrl` est
 * renseigné. Sur un catalogue où la grande majorité des titres n'a pas de fichier,
 * le lecteur intégré paraît absent du produit. La planche générique rend le
 * parcours visible tout en annonçant que le titre n'est pas encore lisible.
 *
 * Le lecteur reconnaît cette planche à son chemin et n'écrit alors rien dans le
 * journal : parcourir le catalogue ne crée pas de fausses lectures.
 *
 * Sûr à relancer : ne touche qu'aux comics dont `pdfUrl` est nul, jamais aux
 * fichiers réels. Le retour arrière est exact sans journal de bord, l'URL de la
 * planche servant elle-même de marqueur.
 *
 *   docker compose exec -T backend node scripts/attach-placeholder-pdf.mjs --dry-run
 *   docker compose exec -T backend node scripts/attach-placeholder-pdf.mjs
 *   docker compose exec -T backend node scripts/attach-placeholder-pdf.mjs --revert
 */
import prisma from "../src/lib/prisma.js";

const PLACEHOLDER = "/placeholder/bientot-disponible.pdf";

const dryRun = process.argv.includes("--dry-run");
const revert = process.argv.includes("--revert");

async function main() {
  const [sansFichier, avecPlanche, avecFichierReel] = await Promise.all([
    prisma.comic.count({ where: { pdfUrl: null } }),
    prisma.comic.count({ where: { pdfUrl: PLACEHOLDER } }),
    prisma.comic.count({ where: { pdfUrl: { not: null, notIn: [PLACEHOLDER] } } }),
  ]);

  console.log(`État : ${sansFichier} sans fichier · ${avecPlanche} avec la planche · ${avecFichierReel} avec un fichier réel`);

  if (revert) {
    if (dryRun) {
      console.log(`--dry-run : ${avecPlanche} comic(s) repasseraient sans fichier.`);
      return;
    }
    const { count } = await prisma.comic.updateMany({
      where: { pdfUrl: PLACEHOLDER },
      data: { pdfUrl: null },
    });
    console.log(`✓ ${count} comic(s) remis sans fichier de lecture.`);
    return;
  }

  if (sansFichier === 0) {
    console.log("Rien à faire.");
    return;
  }
  if (dryRun) {
    const exemples = await prisma.comic.findMany({
      where: { pdfUrl: null },
      select: { title: true },
      take: 5,
    });
    console.log(`--dry-run : ${sansFichier} comic(s) recevraient la planche.`);
    console.log("Exemples :", exemples.map((c) => c.title).join(" · "));
    return;
  }

  const { count } = await prisma.comic.updateMany({
    where: { pdfUrl: null },
    data: { pdfUrl: PLACEHOLDER },
  });
  console.log(`✓ planche générique rattachée à ${count} comic(s).`);
  console.log(`  Retour arrière : node scripts/attach-placeholder-pdf.mjs --revert`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
