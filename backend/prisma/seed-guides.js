import pkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const { PrismaClient } = pkg;
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const guides = [
  {
    slug: "batman",
    character: "Batman",
    imageUrl: "/covers/defaults/hp-dayone.jpg",
    teaser:
      "De ses débuts dans les ruelles sombres de Gotham jusqu'aux récits les plus sombres de l'histoire des comics, Batman est bien plus qu'un super-héros. Un détective, un homme brisé, une légende.",
    story:
      "Bruce Wayne assiste à l'assassinat de ses parents à l'âge de huit ans. Ce traumatisme fondateur le pousse à consacrer sa vie à une guerre sans fin contre le crime. Contrairement à ses pairs, il n'a aucun pouvoir surhumain — seulement une volonté de fer, une intelligence redoutable et les ressources quasi illimitées de la famille Wayne. Au fil des décennies, Batman est devenu le personnage le plus complexe de DC Comics : un symbole d'espoir pour certains, une figure terrifiante pour les criminels, un homme profondément seul pour ses proches. Son univers regorge de récits noirs, psychologiques, politiques. C'est par là que commencent les meilleurs comics.",
    relatedSlugs: ["superman", "daredevil"],
    comics: [
      {
        title: "Batman: Year One",
        coverUrl: "/covers/defaults/hp-dayone.jpg",
        note: "Le point de départ absolu. Frank Miller réinvente l'origine de Batman avec un réalisme urbain brutal. À lire en premier.",
        order: 1,
      },
      {
        title: "The Dark Knight Returns",
        coverUrl: null,
        note: "Un Batman vieillissant sort de sa retraite dans un futur dystopique. Miller redéfinit le personnage et l'industrie entière en 1986.",
        order: 2,
      },
      {
        title: "Batman: The Killing Joke",
        coverUrl: null,
        note: "Alan Moore s'attaque à la relation entre Batman et le Joker. Court, brutal, inoubliable. La meilleure histoire du Joker jamais écrite.",
        order: 3,
      },
      {
        title: "Batman: The Long Halloween",
        coverUrl: null,
        note: "Un polar en douze épisodes sur les débuts de Batman contre la mafia de Gotham. L'influence directe des films Nolan.",
        order: 4,
      },
      {
        title: "Batman: Hush",
        coverUrl: null,
        note: "Jeph Loeb convoque tous les grands ennemis de Batman dans un thriller haletant. Idéal après les classiques pour explorer la galerie de vilains.",
        order: 5,
      },
      {
        title: "Batman: Court of Owls",
        coverUrl: null,
        note: "Scott Snyder crée de toutes pièces une société secrète qui contrôle Gotham depuis des siècles. La meilleure run moderne du personnage.",
        order: 6,
      },
    ],
  },
  {
    slug: "spider-man",
    character: "Spider-Man",
    imageUrl: "/covers/defaults/hp-spiderman.webp",
    teaser:
      "Peter Parker, le gamin ordinaire de Queens qui portait le poids du monde sur ses épaules. Avec un grand pouvoir vient une grande responsabilité — et les meilleures histoires de Spider-Man ne l'oublient jamais.",
    story:
      "Mordu par une araignée radioactive lors d'une sortie scolaire, Peter Parker aurait pu devenir riche et célèbre. Mais la mort de son oncle Ben, qu'il aurait pu empêcher, transforme cet ado brillant et solitaire en héros hanté par la culpabilité. Spider-Man est unique parmi les super-héros : il souffre, il échoue, il est cassé financièrement, ses proches sont en danger constant. C'est ce mélange de légèreté et de tragédie qui a séduit des générations de lecteurs depuis 1962. Les meilleurs récits Spider-Man parlent autant de la vie ordinaire de Peter que de ses aventures en costume.",
    relatedSlugs: ["wolverine", "batman"],
    comics: [
      {
        title: "Amazing Fantasy #15",
        coverUrl: null,
        note: "La première apparition de Spider-Man en 1962. Stan Lee et Steve Ditko posent toutes les bases en une seule histoire. Indispensable.",
        order: 1,
      },
      {
        title: "Kraven's Last Hunt",
        coverUrl: "/covers/defaults/hp-kravenlasthunt.jpeg",
        note: "Le chasseur Kraven enterre Spider-Man vivant et prend sa place. Un des récits les plus sombres et les plus beaux du personnage.",
        order: 2,
      },
      {
        title: "Spider-Man: Blue",
        coverUrl: null,
        note: "Jeph Loeb raconte la romance de Peter et Gwen Stacy. Mélancolique, magnifique. À lire si vous voulez comprendre pourquoi Gwen Stacy compte.",
        order: 3,
      },
      {
        title: "Amazing Spider-Man #121-122",
        coverUrl: null,
        note: "La mort de Gwen Stacy. Deux numéros qui ont changé les comics à jamais en 1973 — la fin de l'âge d'or de l'innocence.",
        order: 4,
      },
      {
        title: "Spider-Man: Life Story",
        coverUrl: null,
        note: "Chip Kidd imagine ce qui se serait passé si Spider-Man avait vraiment vieilli depuis 1962. Une relecture géniale de 50 ans d'histoire.",
        order: 5,
      },
      {
        title: "Superior Spider-Man",
        coverUrl: null,
        note: "Le Docteur Octopus prend le corps de Peter Parker et décide d'être un meilleur Spider-Man. Audacieux, drôle, troublant.",
        order: 6,
      },
    ],
  },
  {
    slug: "wolverine",
    character: "Wolverine",
    imageUrl: null,
    teaser:
      "Il est le meilleur dans ce qu'il fait, et ce qu'il fait n'est pas joli. Logan porte des cicatrices que même ses griffes adamantium ne peuvent guérir — des siècles de mémoire, de trahisons et de guerres.",
    story:
      "James Howlett, alias Logan, alias Wolverine, est né au XIXe siècle avec des griffes osseuses rétractables et un facteur de guérison surhumain. Capturé par le programme Weapon X, ses os sont recouverts d'adamantium indestructible — au prix d'une douleur indicible et de souvenirs effacés. Wolverine est l'anti-héros par excellence des X-Men : brutal, solitaire, loyal à sa manière. Ses meilleures histoires explorent ce que ça veut dire de vivre éternellement, de tuer sans vergogne, et pourtant de chercher à être plus qu'une arme.",
    relatedSlugs: ["spider-man", "batman"],
    comics: [
      {
        title: "Wolverine (1982)",
        coverUrl: null,
        note: "La première mini-série solo par Chris Claremont et Frank Miller. Logan au Japon, entre honneur et sauvagerie. Le socle de tout ce qui suit.",
        order: 1,
      },
      {
        title: "Weapon X",
        coverUrl: null,
        note: "Barry Windsor-Smith raconte l'expérience qui a recouvert les os de Logan d'adamantium. Graphiquement radical, psychologiquement glaçant.",
        order: 2,
      },
      {
        title: "Old Man Logan",
        coverUrl: null,
        note: "Dans un futur post-apocalyptique où les vilains ont gagné, Logan vit comme fermier pacifiste. Mark Millar signe un western comics inoubliable.",
        order: 3,
      },
      {
        title: "Enemy of the State",
        coverUrl: null,
        note: "Wolverine est reprogrammé comme assassin contre ses propres alliés. Une course-poursuite haletante par Mark Millar.",
        order: 4,
      },
      {
        title: "Logan (2008)",
        coverUrl: null,
        note: "Brian K. Vaughan revisit les origines de Logan avant même les X-Men. Intime, violent, touchant.",
        order: 5,
      },
    ],
  },
  {
    slug: "superman",
    character: "Superman",
    imageUrl: "/covers/defaults/hp-mos.webp",
    teaser:
      "Kal-El, le dernier fils de Krypton, est l'étalon-or des super-héros. Mais les meilleures histoires de Superman ne parlent pas de puissance — elles parlent de ce que ça veut dire d'être humain quand on ne l'est pas.",
    story:
      "Né sur Krypton et envoyé sur Terre par ses parents avant la destruction de leur planète, Clark Kent grandit à Smallville avec des valeurs simples et une puissance quasi divine. Superman est souvent mal compris : trop parfait, trop puissant, trop idéaliste. Mais les meilleurs auteurs ont compris que c'est précisément sa force — il représente ce que l'humanité pourrait être, pas ce qu'elle est. Les récits les plus marquants de Superman explorent ce paradoxe : comment rester humain quand on est invincible ? Comment garder l'espoir face à la barbarie ?",
    relatedSlugs: ["batman", "wolverine"],
    comics: [
      {
        title: "Man of Steel",
        coverUrl: "/covers/defaults/hp-mos.webp",
        note: "John Byrne modernise l'origine de Superman en 1986. Une réinterprétation qui reste le meilleur point d'entrée pour les nouveaux lecteurs.",
        order: 1,
      },
      {
        title: "All-Star Superman",
        coverUrl: null,
        note: "Grant Morrison et Frank Quitely signent la lettre d'amour ultime à Superman. Un chef-d'œuvre absolu — Superman mourant accomplit douze travaux.",
        order: 2,
      },
      {
        title: "Superman: Red Son",
        coverUrl: null,
        note: "Et si la capsule de Kal-El avait atterri en URSS ? Mark Millar explore ce what-if politique avec brillance.",
        order: 3,
      },
      {
        title: "Whatever Happened to the Man of Tomorrow?",
        coverUrl: null,
        note: "Alan Moore écrit en 1986 la dernière histoire de Superman — avant la refonte Byrne. Une conclusion déchirante à des décennies de continuité.",
        order: 4,
      },
      {
        title: "Kingdom Come",
        coverUrl: null,
        note: "Dans un futur où les héros ont échoué, Superman revient. Mark Waid et Alex Ross créent une épopée visuelle sur l'héritage des super-héros.",
        order: 5,
      },
    ],
  },
  {
    slug: "daredevil",
    character: "Daredevil",
    imageUrl: null,
    teaser:
      "Matt Murdock est avocat le jour, justicier aveugle la nuit. L'homme sans peur de Hell's Kitchen est l'un des personnages les plus complexes et tragiques des comics Marvel.",
    story:
      "Rendu aveugle à dix ans par un accident chimique, Matt Murdock développe des sens surhumains qui compensent sa cécité. Avocat brillant défendant les opprimés le jour, il enfile le costume de Daredevil la nuit pour faire régner une justice que les tribunaux ne peuvent pas rendre. Ce qui rend Daredevil unique, c'est sa foi catholique, son code moral rigide et sa propension à tout perdre — ses proches, sa santé mentale, son identité. Les meilleurs récits Daredevil sont des tragédies grecques habillées en comics de super-héros.",
    relatedSlugs: ["batman", "spider-man"],
    comics: [
      {
        title: "Daredevil: Born Again",
        coverUrl: null,
        note: "Frank Miller détruit méthodiquement la vie de Matt Murdock — puis le regarde se relever. Le sommet absolu de la série, un chef-d'œuvre.",
        order: 1,
      },
      {
        title: "Daredevil: The Man Without Fear",
        coverUrl: null,
        note: "Miller revient en 1993 pour raconter l'origine. Sombre, brutal, cinématographique. Influence directe de la série Netflix.",
        order: 2,
      },
      {
        title: "Daredevil: Guardian Devil",
        coverUrl: null,
        note: "Kevin Smith relance la série en 1998 avec une histoire sur la foi et la manipulation. Introduction de Bullseye à son meilleur.",
        order: 3,
      },
      {
        title: "Daredevil by Brian Michael Bendis",
        coverUrl: null,
        note: "Bendis expose l'identité secrète de Daredevil au monde. 55 numéros de polar urbain qui restent le meilleur run moderne du personnage.",
        order: 4,
      },
      {
        title: "Daredevil: Yellow",
        coverUrl: null,
        note: "Jeph Loeb revient aux origines du costume jaune et de la relation avec Karen Page. Une histoire d'amour tragique et lumineuse.",
        order: 5,
      },
      {
        title: "Daredevil by Frank Miller (run complet)",
        coverUrl: null,
        note: "Le run qui a tout changé en 1979. Miller introduit Elektra, Stick, la Hand — et transforme un personnage médiocre en icône.",
        order: 6,
      },
    ],
  },
  {
    slug: "invincible",
    character: "Invincible",
    imageUrl: "/covers/defaults/hp-invincible.jpg",
    teaser: "Le héros de l'univers",
    story: "Le héros protecteur de la terre",
    relatedSlugs: ["spider-man", "batman"],
    comics: [
      {
        title: "Invincible 1",
        coverUrl: "/covers/defaults/hp-invincible.jpg",
        comicUrl: "/comics/manual-1c64b94ae203cb1d",
        note: "L'arc du début",
        order: 0,
      },
    ],
  },
  {
    slug: "x-men",
    character: "X-Men",
    imageUrl: null,
    teaser: "Les mutants les plus célèbres des comics Marvel — une métaphore vivante de la différence, du racisme et de l'acceptation de soi depuis 1963.",
    story: "Dans un monde qui les craint et les déteste, Charles Xavier réunit des adolescents aux pouvoirs extraordinaires. Les X-Men ne sont pas seulement des super-héros : ils sont une métaphore de toutes les minorités qui luttent pour leur place dans une société hostile. Chris Claremont a transformé cette équipe au fil de 16 ans de run en quelque chose de bien plus complexe : une saga sur l'identité, la famille, le sacrifice et l'espoir. Chaque lecteur y trouve une partie de lui-même.",
    relatedSlugs: ["wolverine", "spider-man"],
    comics: [
      {
        title: "X-Men #1",
        coverUrl: null,
        comicUrl: "/comics/seed-xmen-1",
        note: "Stan Lee et Jack Kirby posent les bases en 1963. Historique.",
        order: 1,
      },
      {
        title: "The Dark Phoenix Saga",
        coverUrl: null,
        comicUrl: "/comics/seed-dark-phoenix-saga",
        note: "Jean Grey sacrifie sa vie pour protéger l'univers. La tragédie définitive des X-Men.",
        order: 2,
      },
      {
        title: "Days of Future Past",
        coverUrl: null,
        comicUrl: "/comics/seed-days-future-past",
        note: "Un futur dystopique où les mutants sont exterminés. Deux numéros qui ont changé les comics.",
        order: 3,
      },
      {
        title: "Wolverine (1982)",
        coverUrl: null,
        comicUrl: "/comics/seed-wolverine-1982",
        note: "La connexion X-Men / Wolverine solo au Japon. À lire pour comprendre Logan.",
        order: 4,
      },
    ],
  },
  {
    slug: "watchmen-univers",
    character: "Watchmen",
    imageUrl: "/covers/defaults/hp-watchmen.webp",
    teaser: "Alan Moore déconstruit le mythe du super-héros dans ce chef-d'œuvre absolu de 1986 — encore inégalé 40 ans plus tard.",
    story: "Que se passerait-il si des humains ordinaires choisissaient de porter un costume et de faire justice eux-mêmes ? Alan Moore répond avec une noirceur totale : paranoïa, fascisme, nihilisme, nostalgie. Watchmen n'est pas une histoire de super-héros — c'est une critique radicale du genre et du monde qui l'a produit. Rorschach, le Comédien, Doctor Manhattan, Ozymandias : chaque personnage incarne une philosophie, un échec de la raison humaine. Le graphic novel le plus important jamais publié.",
    relatedSlugs: ["batman", "daredevil"],
    comics: [
      {
        title: "Watchmen",
        coverUrl: "/covers/defaults/hp-watchmen.webp",
        comicUrl: "/comics/seed-watchmen",
        note: "Le chef-d'œuvre. 12 numéros d'une densité narrative inégalée. À lire absolument.",
        order: 1,
      },
      {
        title: "V for Vendetta",
        coverUrl: null,
        comicUrl: "/comics/seed-v-for-vendetta",
        note: "L'autre grand œuvre d'Alan Moore — dystopie fasciste, anarchisme, identité. Tout aussi essentiel.",
        order: 2,
      },
      {
        title: "Batman: The Killing Joke",
        coverUrl: null,
        comicUrl: "/comics/seed-killing-joke",
        note: "Moore s'attaque cette fois à Batman et au Joker. Court, brutal, inoubliable.",
        order: 3,
      },
    ],
  },
  {
    slug: "independants",
    character: "Comics Indépendants",
    imageUrl: "/covers/defaults/hp-invincible.jpg",
    teaser: "Au-delà des masques et des capes, une scène indépendante foisonnante qui a révolutionné le médium depuis les années 90.",
    story: "Image Comics, fondé en 1992 par des artistes dissidents de Marvel, a ouvert la voie à une génération de créateurs qui racontaient leurs propres histoires. Saga, Invincible, The Walking Dead — des univers entiers créés de zéro, sans contrainte d'éditeur traditionnel. En parallèle, les auteurs de graphic novels autobiographiques comme Spiegelman et Satrapi ont prouvé que la BD pouvait atteindre la même profondeur que la grande littérature. Ce parcours couvre les indispensables hors des deux grands éditeurs.",
    relatedSlugs: ["watchmen-univers", "batman"],
    comics: [
      {
        title: "Saga, Vol. 1",
        coverUrl: null,
        comicUrl: "/comics/seed-saga-vol1",
        note: "La série la plus ambitieuse de la décennie. Space opera, romance, guerre et bébé. Commencez ici.",
        order: 1,
      },
      {
        title: "Invincible, Vol. 1",
        coverUrl: "/covers/defaults/hp-invincible.jpg",
        comicUrl: "/comics/seed-invincible-vol1",
        note: "Un ado découvre qu'il est un super-héros — puis que son père est un super-vilain. Kirkman au sommet.",
        order: 2,
      },
      {
        title: "Maus",
        coverUrl: null,
        comicUrl: "/comics/seed-maus",
        note: "Art Spiegelman raconte l'Holocauste avec des souris. La BD qui a tout légitimé. Prix Pulitzer 1992.",
        order: 3,
      },
      {
        title: "Persépolis",
        coverUrl: null,
        comicUrl: "/comics/seed-persepolis",
        note: "L'Iran de la révolution islamique raconté par une enfant. Autobiographique, universel, essentiel.",
        order: 4,
      },
      {
        title: "Bone: One Volume Edition",
        coverUrl: null,
        comicUrl: "/comics/seed-bone-complete",
        note: "1.300 pages d'aventure et d'humour — l'épopée fantasy indépendante la plus accessible jamais écrite.",
        order: 5,
      },
    ],
  },
];

async function main() {
  console.log("Seeding reading guides…");

  for (const guide of guides) {
    const { comics, ...guideData } = guide;

    const existing = await prisma.readingGuide.findUnique({
      where: { slug: guideData.slug },
    });

    if (existing) {
      console.log(`  ↳ ${guideData.character} déjà présent, skip.`);
      continue;
    }

    await prisma.readingGuide.create({
      data: {
        ...guideData,
        comics: {
          create: comics,
        },
      },
    });
    console.log(`  ✓ ${guideData.character} créé avec ${comics.length} comics.`);
  }

  console.log("Done.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
