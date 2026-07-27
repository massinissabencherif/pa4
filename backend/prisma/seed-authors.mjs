// Peuple la table `Author` (auteurs curatés, liés aux comics en M2M) à partir du
// champ texte `Comic.authors[]` déjà chargé par les seeds de démo.
//
// L'ancienne version listait 5 auteurs et les rattachait aux comics par motifs de
// titre ('Batman', 'Spider-Man', …) : sur le catalogue de démo, 6 comics sur 45
// correspondaient et 3 des 5 auteurs se retrouvaient sans aucun comic. On part
// désormais des données réelles — chaque nom présent dans `Comic.authors[]`
// devient une ligne `Author` liée à ses comics — et les biographies rédigées
// ci-dessous viennent enrichir ceux qu'on a documentés à la main.
import prisma from '../src/lib/prisma.js'

const BIOS = {
  'Frank Miller':
    "Scénariste et dessinateur légendaire, Frank Miller a redéfini Batman avec 'The Dark Knight Returns' et révolutionné Daredevil. Son style noir et son écriture sombre ont marqué toute une génération de comics.",
  'Stan Lee':
    "Co-créateur de Spider-Man, les X-Men, Iron Man, Thor et des dizaines d'autres héros Marvel. Stan Lee a bâti l'univers Marvel tel qu'on le connaît aujourd'hui, avec un style narratif unique mêlant humour et drame.",
  'Grant Morrison':
    "Auteur écossais visionnaire, Grant Morrison est connu pour des runs emblématiques sur JLA, Batman et New X-Men. Ses récits mélangent philosophie, méta-fiction et action superhéroïque de façon unique.",
  'Mark Waid':
    "Scénariste prolifique et érudit du comics, Mark Waid est célèbre pour ses runs sur Flash, Captain America et 'Kingdom Come'. Il excelle dans la caractérisation des héros classiques tout en les modernisant.",
  'Alan Moore':
    "Auteur britannique majeur, Alan Moore a signé 'Watchmen', 'V pour Vendetta' et 'From Hell'. Son écriture dense et sa déconstruction du super-héros ont durablement transformé le medium.",
  'René Goscinny':
    "Scénariste français au dialogue inimitable, René Goscinny a co-créé Astérix avec Albert Uderzo et écrit Lucky Luke et Iznogoud. Son humour et son sens du rythme ont façonné la bande dessinée franco-belge.",
  'Albert Uderzo':
    "Dessinateur et co-créateur d'Astérix, Albert Uderzo a donné leur silhouette aux irréductibles Gaulois. Son trait rond et expressif est indissociable du succès de la série.",
  Hergé:
    "Créateur de Tintin et père de la ligne claire, Hergé a posé les fondations de la bande dessinée européenne moderne. Son exigence documentaire et son épure graphique restent une référence.",
  'Katsuhiro Otomo':
    "Mangaka japonais, auteur d'« Akira ». Son travail sur l'architecture urbaine et le mouvement a redéfini la science-fiction dessinée et ouvert le manga à un large public occidental.",
  'Marjane Satrapi':
    "Autrice et réalisatrice franco-iranienne, Marjane Satrapi a raconté son enfance à Téhéran dans « Persepolis ». Son noir et blanc épuré a imposé le récit autobiographique en bande dessinée.",
}

const slugify = name =>
  name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

async function main() {
  const comics = await prisma.comic.findMany({ select: { id: true, authors: true } })

  // nom d'auteur → identifiants des comics dans lesquels il apparaît
  const byAuthor = new Map()
  for (const comic of comics) {
    for (const raw of comic.authors ?? []) {
      const name = raw.trim()
      if (!name) continue
      if (!byAuthor.has(name)) byAuthor.set(name, [])
      byAuthor.get(name).push(comic.id)
    }
  }

  if (byAuthor.size === 0) {
    console.log("Aucun auteur dans Comic.authors[] — lance d'abord les seeds de comics.")
    return
  }

  let authors = 0
  let links = 0

  for (const [name, comicIds] of [...byAuthor].sort((a, b) => a[0].localeCompare(b[0], 'fr'))) {
    const data = {
      name,
      slug: slugify(name),
      bio:
        BIOS[name] ??
        `${name} figure au catalogue Comicster à travers ${comicIds.length} œuvre${comicIds.length > 1 ? 's' : ''}.`,
      photoUrl: null,
    }

    const author = await prisma.author.upsert({
      where: { slug: data.slug },
      update: data,
      create: data,
    })
    authors++

    for (const comicId of comicIds) {
      await prisma.authorOnComic.upsert({
        where: { authorId_comicId: { authorId: author.id, comicId } },
        update: {},
        create: { authorId: author.id, comicId },
      })
      links++
    }
  }

  console.log(`  ✓ ${authors} auteurs, ${links} liaisons auteur↔comic`)
}

main()
  .catch(err => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
