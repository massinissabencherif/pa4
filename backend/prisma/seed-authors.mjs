import prisma from '../src/lib/prisma.js'

const AUTHORS = [
  {
    name: 'Frank Miller',
    slug: 'frank-miller',
    bio: "Scénariste et dessinateur légendaire, Frank Miller a redéfini Batman avec 'The Dark Knight Returns' et révolutionné Daredevil. Son style noir et son écriture sombre ont marqué toute une génération de comics.",
    photoUrl: null,
    comicPatterns: ['Batman', 'Absolute Batman'],
  },
  {
    name: 'Stan Lee',
    slug: 'stan-lee',
    bio: "Co-créateur de Spider-Man, les X-Men, Iron Man, Thor et des dizaines d'autres héros Marvel. Stan Lee a bâti l'univers Marvel tel qu'on le connaît aujourd'hui, avec un style narratif unique mêlant humour et drame.",
    photoUrl: null,
    comicPatterns: ['Spider-Man', 'Spectacular Spider-Man'],
  },
  {
    name: 'Grant Morrison',
    slug: 'grant-morrison',
    bio: "Auteur écossais visionnaire, Grant Morrison est connu pour des runs emblématiques sur JLA, Batman et New X-Men. Ses récits mélangent philosophie, méta-fiction et action superhéroïque de façon unique.",
    photoUrl: null,
    comicPatterns: ['Justice League', 'Superman'],
  },
  {
    name: 'Mark Waid',
    slug: 'mark-waid',
    bio: "Scénariste prolifique et érudit du comics, Mark Waid est célèbre pour ses runs sur Flash, Captain America et 'Kingdom Come'. Il excelle dans la caractérisation des héros classiques tout en les modernisant.",
    photoUrl: null,
    comicPatterns: ["World's Finest", 'Superman - Spider-Man'],
  },
  {
    name: 'Chip Kidd',
    slug: 'chip-kidd',
    bio: "Directeur artistique et auteur de comics, Chip Kidd est connu pour son travail graphique innovant chez DC Comics. Il a travaillé sur plusieurs titres Batman et s'est imposé comme une figure incontournable du design de couvertures.",
    photoUrl: null,
    comicPatterns: ['Batman/Superman'],
  },
]

async function main() {
  const comics = await prisma.comic.findMany({ select: { id: true, title: true } })

  for (const authorData of AUTHORS) {
    const { comicPatterns, ...data } = authorData

    const author = await prisma.author.upsert({
      where: { slug: data.slug },
      update: data,
      create: data,
    })
    console.log(`✓ Auteur créé : ${author.name}`)

    // Trouver les comics correspondants
    const matchedComics = comics.filter(c =>
      comicPatterns.some(p => c.title.toLowerCase().includes(p.toLowerCase()))
    )

    for (const comic of matchedComics) {
      await prisma.authorOnComic.upsert({
        where: { authorId_comicId: { authorId: author.id, comicId: comic.id } },
        update: {},
        create: { authorId: author.id, comicId: comic.id },
      })
      console.log(`  → Lié à : ${comic.title}`)
    }
  }

  console.log('\nSeed auteurs terminé !')
}

main().catch(console.error).finally(() => prisma.$disconnect())
