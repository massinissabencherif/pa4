/**
 * Seed démonstration Comicster — Batch 2
 * Ajoute : avis croisés, commentaires sur avis, topics sur guides restants,
 *           entrées de lecture supplémentaires, follows et likes additionnels.
 *
 * Usage: DATABASE_URL=... node prisma/seed-demo-2.js
 */

import pkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const { PrismaClient } = pkg;
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function buildMaps() {
  const users  = await prisma.user.findMany({ select: { id: true, username: true } });
  const comics = await prisma.comic.findMany({ select: { id: true, externalId: true } });
  const guides = await prisma.readingGuide.findMany({ select: { id: true, slug: true } });
  const reviews = await prisma.review.findMany({
    include: { user: { select: { username: true } }, comic: { select: { externalId: true } } },
  });

  const userMap   = Object.fromEntries(users.map(u => [u.username, u.id]));
  const comicMap  = Object.fromEntries(comics.map(c => [c.externalId, c.id]));
  const guideMap  = Object.fromEntries(guides.map(g => [g.slug, g.id]));
  const reviewMap = Object.fromEntries(
    reviews.map(r => [`${r.user.username}:${r.comic.externalId}`, r.id])
  );

  return { userMap, comicMap, guideMap, reviewMap };
}

// ─── Nouveaux avis ────────────────────────────────────────────────────────────

const NEW_REVIEWS = [
  { username: "dc_only",        externalId: "seed-dark-knight-returns",  rating: 5, content: "Miller a réussi à vieillir Batman de façon crédible — ce qui est presque impossible pour un super-héros. Le sous-texte politique Reagan est daté mais fascinant pour qui connaît le contexte. La séquence Superman finale reste l'une des plus déchirantes des comics DC." },
  { username: "dc_only",        externalId: "seed-killing-joke",          rating: 5, content: "Alan Moore condense toute la relation Batman/Joker en 48 pages. La théorie du Joker sur la folie — qu'un seul mauvais jour suffit — est glaçante. Bolland aux couleurs de 2008 transforme un chef-d'œuvre en quelque chose de visuellement parfait." },
  { username: "neonbat",        externalId: "seed-v-for-vendetta",        rating: 5, content: "Ce que Moore a compris, et que peu de comics font : un protagoniste qui est à la fois héros et monstre. V est fascinant parce qu'il a raison sur les idées et tort sur les méthodes. Lloyd's stark black-and-white is absolutely essential to the mood." },
  { username: "comicster_mod",  externalId: "seed-dark-knight-returns",   rating: 4, content: "Techniquement brillant, politiquement daté. La vision de Miller sur la masculinité toxique et l'autoritarisme était provocatrice en 1986 — aujourd'hui elle demande plus de recul. Reste obligatoire comme document historique du medium." },
  { username: "comicster_mod",  externalId: "seed-saga-vol1",             rating: 5, content: "Vaughan et Staples ont construit quelque chose d'unique dans le paysage comics américain : un space opera qui parle d'abord de parentalité, de guerre et d'identité. Le premier tome est une masterclass en worldbuilding économique." },
  { username: "batmaniac",      externalId: "seed-sandman-preludes",      rating: 4, content: "Les premiers numéros de Gaiman tâtonnent encore — l'arc Sandman n'est pas encore le chef-d'œuvre qu'il deviendra. Mais les graines sont là : la mythologie, la prose, l'ambition. Un investissement qui paye au tome 3." },
  { username: "batmaniac",      externalId: "seed-watchmen",              rating: 5, content: "Je résiste à la tentation de dire que c'est surestimé — ce n'est pas vrai. Watchmen fait exactement ce qu'il prétend faire, et mieux que quiconque avant ou après. La structure formelle (9 cases, symétries) est prodigieuse." },
  { username: "spiderfan42",    externalId: "seed-civil-war",             rating: 4, content: "L'event Marvel le plus polarisant — et c'est intentionnel. Millar ne désigne pas de bon camp. Spider-Man qui révèle son identité publiquement reste l'un des moments comics les plus forts des années 2000." },
  { username: "spiderfan42",    externalId: "seed-born-again",            rating: 5, content: "Miller détruit Matt Murdock avec une précision chirurgicale. La montée — la trahison, la perte, la folie — est insupportable à lire. La reconstruction christique qui suit est un sommet du comics mainstream." },
  { username: "wolverine_best", externalId: "seed-civil-war",             rating: 3, content: "Millar fait de gros effets mais l'arc de Wolverine dans Civil War est mineur. Logan est fondamentalement incompatible avec le concept d'enregistrement — son positionnement dans l'event est frustrant. Préférez Planet Hulk sorti en même temps." },
  { username: "xmen_forever",   externalId: "seed-old-man-logan",         rating: 5, content: "McNiven aux dessins fait des choses impossibles — chaque planche est une composition cinématographique. Millar comprend Logan d'une façon rare : c'est un personnage qui fonctionne mieux dans des contextes sans filet de sécurité. Old Man Logan est le meilleur Wolverine solo depuis 1982." },
  { username: "marvelgeek",     externalId: "seed-hawkeye-2012",          rating: 5, content: "Fraction et Aja ont inventé une nouvelle grammaire visuelle pour les comics mainstream. Le numéro du chien, le numéro raconté à l'envers — chaque épisode est une expérimentation formelle. Hawkeye est le comic Marvel des années 2010." },
  { username: "comicnerd99",    externalId: "seed-watchmen",              rating: 5, content: "On pourrait passer des années à analyser Watchmen sans l'épuiser. La structure en pirate-story-in-story, les rapports psychiatriques, les interviews fictifs — Moore a construit un roman graphique au sens le plus littéral du terme." },
  { username: "panel_by_panel", externalId: "seed-akira-vol1",            rating: 5, content: "Otomo a inventé quelque chose ici. La densité des backgrounds, la lisibilité des séquences d'action — Akira se lit comme un film dont on peut contrôler la vitesse. La SF japonaise n'a jamais eu d'équivalent occidental." },
  { username: "frenchcomics",   externalId: "seed-tintin-lune",           rating: 5, content: "Hergé a publié On a marché sur la Lune en 1954 — 15 ans avant Apollo 11. La précision scientifique est stupéfiante pour l'époque. Tintin et Milou en combinaison spatiale reste une des images les plus iconiques de la BD mondiale." },
  { username: "frenchcomics",   externalId: "seed-persepolis",            rating: 5, content: "Satrapi a fait quelque chose de rare : un comics autobiographique qui parle d'histoire mondiale sans jamais perdre le point de vue intime. La montée islamique racontée à hauteur d'enfant est plus percutante que n'importe quel documentaire." },
  { username: "inkandcolor",    externalId: "seed-bone-complete",         rating: 5, content: "Jeff Smith maîtrise quelque chose que peu de créateurs ont : l'évolution de ton. Bone commence comme du Pogo humoristique et finit comme une épopée tolkienienne. La transition se fait si naturellement qu'on ne la voit jamais arriver." },
  { username: "rorschach42",    externalId: "seed-preacher-vol1",         rating: 5, content: "Ennis n'a pas écrit Preacher pour plaire à tout le monde — et c'est précisément pour ça que ça fonctionne. La violence, le blasphème et la comédie noire créent un cocktail unique. Garth Ennis aimait les personnages qu'il torturait, et ça se voit." },
  { username: "graphicguru",    externalId: "seed-ghost-world",           rating: 4, content: "Clowes capture quelque chose d'insaisissable : l'ennui existentiel de la fin de l'adolescence. Enid et Rebecca ne font rien de spectaculaire et pourtant on ne peut pas s'arrêter de les lire. L'indie comics à son niveau le plus littéraire." },
  { username: "sagafan",        externalId: "seed-y-last-man",            rating: 5, content: "Vaughan s'est imposé avec Y: Last Man avant Saga. L'idée est simple — tous les mammifères mâles meurent sauf un homme et un singe — mais l'exécution est d'une richesse politique et émotionnelle rare. Yorick Brown est attachant malgré lui." },
  { username: "indiefan",       externalId: "seed-100-bullets-vol1",      rating: 4, content: "Azzarello construit un puzzle narratif sur 100 numéros. Le premier tome pose des questions sans réponse : qui est Agent Graves ? Pourquoi 100 balles et un flingue intraçable ? La récompense pour les patients est immense." },
  { username: "neonbat",        externalId: "seed-100-bullets-vol1",      rating: 4, content: "Un des comics les plus ambitieux structurellement des années 2000. Azzarello joue avec les codes du polar noir américain et cache une mythologie secrète derrière des vignettes aparemment indépendantes. Latcham aux dessins est parfait pour l'ambiance." },
  { username: "comicnerd99",    externalId: "seed-ms-marvel-2014",        rating: 5, content: "G. Willow Wilson a créé un personnage qui manquait cruellement au catalogue Marvel : une adolescente musulmane américaine qui ne se réduit pas à son identité culturelle. Kamala Khan est drôle, attachante, et sa relation aux Inhumains est parfaitement gérée." },
  { username: "wolverine_best", externalId: "seed-born-again",            rating: 5, content: "Miller connaît Matt Murdock mieux que quiconque. Born Again est une descente aux enfers méthodique — le Kingpin démantèle Murdock pièce par pièce — suivie d'une résurrection qui n'efface rien. La construction en 7 chapitres est imparable." },
  { username: "dc_only",        externalId: "seed-superman-red-son",      rating: 5, content: "Millar s'amuse avec les codes de la Guerre Froide et pose une question pertinente : est-ce que Superman est bon parce qu'il est américain, ou malgré ça ? La réponse de Red Son est délicieusement ambiguë." },
  { username: "batmaniac",      externalId: "seed-long-halloween",        rating: 5, content: "Loeb et Sale signent le meilleur polar Batman de l'histoire. Un assassin qui tue un jour férié par mois, la montée de Harvey Dent, la chute de la mafia — The Long Halloween justifie entièrement l'intérêt de Nolan pour ces comics." },
];

// ─── Commentaires sur avis ────────────────────────────────────────────────────

const COMMENTS_DATA = [
  {
    reviewerUsername: "batmaniac",
    externalId: "seed-batman-year-one",
    comments: [
      { username: "dc_only",        content: "Entièrement d'accord sur Gordon. Miller a compris que l'histoire de Gordon et celle de Batman sont inséparables — ce sont deux origines racontées en parallèle." },
      { username: "spiderfan42",    content: "Je l'ai lu après ta recommandation et tu avais raison. Ça tient mieux que 90% des comics sortis depuis." },
      { username: "comicster_mod",  content: "Year One reste la référence non contestée pour toute relecture de l'origine Batman. Morrison lui-même le cite systématiquement." },
    ],
  },
  {
    reviewerUsername: "rorschach42",
    externalId: "seed-watchmen",
    comments: [
      { username: "panel_by_panel", content: "La structure en 9 cases que tu mentionnes est fascinante — Moore et Gibbons ont construit une grille comme une cage. Quand elle se brise, ça a un sens narratif immédiat." },
      { username: "inkandcolor",    content: "J'ai lu Watchmen 4 fois et je découvre encore des choses. Le smiley ensanglanté dans des dizaines de cases différentes. Les couleurs qui évoluent avec l'humeur. C'est un objet unique." },
      { username: "comicnerd99",    content: "La relecture annuelle c'est ma tradition aussi. Watchmen est le seul comics que je relis systématiquement — chaque fois le contexte historique où je le lis change ma lecture." },
      { username: "dc_only",        content: "Le 'Tales of the Black Freighter' en pirate inséré dans le récit — impossible à adapter en film. C'est du cinéma impossible, du comics pur." },
    ],
  },
  {
    reviewerUsername: "indiefan",
    externalId: "seed-saga-vol1",
    comments: [
      { username: "sagafan",        content: "J'ai offert Saga vol.1 à 6 personnes qui ne lisaient pas de comics. 5 ont continué la série. C'est le meilleur indicateur de qualité que je connaisse." },
      { username: "graphicguru",    content: "Fiona Staples est injustement éclipsée par Vaughan dans les discussions Saga. Son character design et sa façon de gérer les émotions sont extraordinaires." },
      { username: "comicnerd99",    content: "Le fait que Saga commence avec une naissance — pas une mort, pas une explosion — dit tout sur ce que Vaughan veut faire. C'est un anti-event total." },
    ],
  },
  {
    reviewerUsername: "graphicguru",
    externalId: "seed-maus",
    comments: [
      { username: "panel_by_panel", content: "Maus est le seul comics dans mon programme de littérature au lycée. La métonymie des animaux — souris/juifs, chats/nazis — est expliquée dans le livre lui-même, ce qui rend l'analyse accessible à tous." },
      { username: "frenchcomics",   content: "Spiegelman a fait quelque chose d'impossible : rendre l'horreur lisible sans la minimiser. La couverture du volume 2 est un des objets graphiques les plus forts du XXe siècle." },
    ],
  },
  {
    reviewerUsername: "spiderfan42",
    externalId: "seed-kravens-last-hunt",
    comments: [
      { username: "marvelgeek",     content: "DeMatteis a pris Kraven au sérieux alors que personne ne le faisait. La dernière page — Kraven qui se tire dessus — est d'une sobriété totale. Aucun autre écrivain Marvel n'aurait osé ça en 1987." },
      { username: "comicnerd99",    content: "Spider-Man enterré vivant et remplacé par son pire ennemi. Et pourtant c'est une histoire sur l'honneur. DeMatteis a un rapport à la philosophie orientale évident dans l'écriture de Kraven." },
      { username: "wolverine_best", content: "Le meilleur arc Spider-Man pour quelqu'un qui vient des comics d'action. Kraven's Last Hunt est physique, violent, psychologique. Rien à voir avec les aventures habituelles." },
    ],
  },
  {
    reviewerUsername: "panel_by_panel",
    externalId: "seed-bone-complete",
    comments: [
      { username: "indiefan",       content: "Bone est le seul comics que j'ai lu d'une traite en une nuit — 1.300 pages. Jeff Smith a une façon de gérer le rythme qui rend la lecture addictive sans jamais paraître artificielle." },
      { username: "frenchcomics",   content: "Bone marche aussi bien pour les enfants que pour les adultes parce que Smith ne simplifie jamais pour les jeunes. Il raconte une vraie histoire épique accessible à tous les âges." },
    ],
  },
  {
    reviewerUsername: "comicnerd99",
    externalId: "seed-hawkeye-2012",
    comments: [
      { username: "spiderfan42",    content: "Le numéro 11 — entièrement du point de vue du chien — est peut-être le numéro de comics le plus inventif des années 2010. Fraction et Aja se sont complètement lâchés." },
      { username: "marvelgeek",     content: "Je pense que Hawkeye 2012 a influencé toute une génération de comics creators. La mise en page déconstruite, le ton humour/drame — on le voit partout maintenant." },
      { username: "batmaniac",      content: "Matt Fraction écrit le meilleur Clint Barton parce qu'il comprend que le personnage est intéressant précisément parce qu'il est le moins super de tous les super-héros." },
    ],
  },
  {
    reviewerUsername: "sagafan",
    externalId: "seed-transmetropolitan",
    comments: [
      { username: "rorschach42",    content: "Spider Jerusalem est le Hunter Thompson que les comics méritaient. Ellis a compris que le journalisme de gonzo est par nature un genre graphique — les descriptions de Thompson sont des panels." },
      { username: "indiefan",       content: "Transmetropolitan est encore plus pertinent aujourd'hui qu'en 1997. La satire des médias, de la politique spectacle, du public anesthésié — Ellis avait 25 ans d'avance." },
    ],
  },
  {
    reviewerUsername: "wolverine_best",
    externalId: "seed-wolverine-1982",
    comments: [
      { username: "xmen_forever",   content: "Miller au dessin dans cette mini-série est d'une économie totale — quelques traits, beaucoup de noir. C'est visuellement l'inverse de ce qu'il fera sur Dark Knight Returns 4 ans plus tard, et les deux fonctionnent parfaitement." },
      { username: "batmaniac",      content: "Claremont a su donner à Logan une motivation claire : il veut être plus qu'une arme. Le Japon comme contexte pour explorer l'honneur vs la sauvagerie est parfait. La meilleure utilisation du personnage depuis sa création." },
    ],
  },
  {
    reviewerUsername: "marvelgeek",
    externalId: "seed-civil-war",
    comments: [
      { username: "spiderfan42",    content: "La révélation d'identité de Spider-Man dans Civil War reste pour moi l'acte de bravoure éditorial Marvel de la décennie. Ils ont vraiment fait ça. Et ils ont dû passer 5 ans à défaire les conséquences." },
      { username: "wolverine_best", content: "Iron Man dans Civil War est le personnage le plus complexe — il fait la mauvaise chose pour les bonnes raisons. Millar a réussi à le rendre à la fois antagoniste crédible et protagoniste sympathique." },
    ],
  },
];

// ─── Topics sur guides non encore touchés ─────────────────────────────────────

const NEW_TOPICS = [
  // Wolverine
  {
    guideSlug: "wolverine",
    authorUsername: "wolverine_best",
    title: "Old Man Logan vs Wolverine 1982 : lequel recommander en premier ?",
    content: "Question récurrente que je reçois souvent : par quel solo Wolverine commencer ? Ma réponse change selon le profil du lecteur. Pour quelqu'un qui aime les westerns et les atmosphères post-apo : Old Man Logan d'emblée. Pour quelqu'un qui veut comprendre le personnage de zéro : la mini-série 1982, obligatoirement. Les deux sont essentiels mais racontent des choses très différentes sur Logan.",
    replies: [
      { username: "xmen_forever",  content: "La mini-série 1982 est mon choix pour un débutant absolu parce qu'elle pose la question fondamentale de Logan : peut-il choisir d'être autre chose qu'un tueur ? Old Man Logan y répond 26 ans plus tard de façon déchirante." },
      { username: "marvelgeek",    content: "J'ai découvert Wolverine avec Old Man Logan et j'ai ensuite tout remonté. Ça marche dans ce sens aussi — le choc émotionnel d'Old Man Logan est plus fort si on ne connaît pas le contexte, bizarrement." },
      { username: "batmaniac",     content: "Enemy of the State est souvent oublié dans cette conversation mais je le trouve fondamental. Wolverine reprogrammé en assassin contre ses propres alliés — c'est le test ultime du personnage moralement." },
    ],
  },
  {
    guideSlug: "wolverine",
    authorUsername: "xmen_forever",
    title: "Les films ont-ils nui à la perception de Wolverine en comics ?",
    content: "Depuis la trilogie X-Men et les films solo Wolverine, j'ai l'impression que beaucoup de gens qui viennent aux comics cherchent le Logan de Hugh Jackman. Ce n'est pas le même personnage — le comics Logan est plus brutal, plus ambigu moralement, moins romantique. Est-ce que vous trouvez que les films ont créé des attentes qui compliquent la lecture des comics ?",
    replies: [
      { username: "wolverine_best", content: "Les films Logan (2017) est à part — c'est une adaptation Old Man Logan qui comprend le matériau source. Mais oui, les films X-Men ont construit un Wolverine plus propre que la version comics. Ce n'est pas forcément un problème si le lecteur est ouvert." },
      { username: "spiderfan42",   content: "Je pense que c'est l'inverse — les films font venir des lecteurs qui découvrent ensuite la richesse des comics. Le Wolverine de Claremont est plus complexe que le film, c'est une bonne surprise." },
    ],
  },
  // Daredevil
  {
    guideSlug: "daredevil",
    authorUsername: "neonbat",
    title: "Born Again ou le run Bendis : lequel a le plus changé Daredevil ?",
    content: "Les deux piliers absolus du personnage sont Born Again de Miller (1986) et le run de Bendis (2001-2006). Born Again détruit Matt pour le reconstruire. Bendis expose son identité secrète au monde entier. Les deux transforment le status quo de façon irréversible. Mais lequel a eu le plus d'impact sur le personnage tel qu'on le connaît aujourd'hui ?",
    replies: [
      { username: "rorschach42",  content: "Born Again définit ce qu'est Daredevil thématiquement — la foi, la chute, la rédemption. Bendis définit Daredevil narrativement — en rendant son identité secrète publique, il change les règles de toutes les histoires suivantes." },
      { username: "batmaniac",    content: "Pour moi c'est Born Again sans hésitation. Bendis a fait quelque chose de brillant mais réversible (Marvel a effacé les conséquences avec le temps). Miller a posé une définition du personnage qui tient encore 40 ans après." },
      { username: "dc_only",      content: "Intéressant que vous parliez des deux — parce que la série Netflix combine exactement ces deux runs. Saison 1 = Man Without Fear. Saison 3 = Born Again. C'est la meilleure adaptation comics Marvel jamais faite." },
      { username: "comicster_mod", content: "Le run Bendis est aussi important parce qu'il a ramené Daredevil dans la conversation alors que le personnage végétait depuis les années 90. Sans le travail de Bendis et Maleev, pas sûr qu'on aurait eu la série Netflix." },
    ],
  },
  {
    guideSlug: "daredevil",
    authorUsername: "comicnerd99",
    title: "Recommandez-vous le run de Chip Kidd à un lecteur moderne ?",
    content: "Chip Kidd a fait Spider-Man: Life Story et je veux lire son Daredevil. Mais je ne suis pas fan de sa façon de réécrire la continuité. Est-ce que son run Daredevil est accessible à quelqu'un qui a surtout lu Miller et Bendis ?",
    replies: [
      { username: "neonbat",        content: "Je pense que tu confonds Chip Kidd (graphiste) et Chip Kidd l'auteur comics. Le Life Story est de Chip Zdarsky. Le run Daredevil 2019-2022 est aussi de Zdarsky — et c'est excellent. Accessible après Miller, oui." },
      { username: "wolverine_best", content: "Zdarsky sur Daredevil est une des meilleures runs modernes chez Marvel. Il reprend exactement là où Miller et Bendis ont laissé — la culpabilité catholique de Matt, son rapport à la violence. À lire absolument après Born Again." },
    ],
  },
  // Superman
  {
    guideSlug: "superman",
    authorUsername: "dc_only",
    title: "All-Star Superman est-il lisible sans connaître Superman ?",
    content: "Je veux recommander All-Star Superman à des amis qui ne connaissent pas du tout le personnage. Morrison dit qu'il a écrit l'histoire pour qu'elle soit universellement accessible. Mais est-ce que la densité des références (Krypto, Jimmy Olsen, Lois Lane, Lex Luthor) la rend hermétique pour un nouveau venu ?",
    replies: [
      { username: "panel_by_panel", content: "J'ai testé ça — offert All-Star Superman à trois personnes sans background comics. Deux ont adoré sans avoir besoin d'explication. Morrison écrit Superman comme une figure mythologique, pas comme un personnage de continuité." },
      { username: "inkandcolor",    content: "All-Star Superman est accessible mais peut paraître anecdotique à quelqu'un qui ne comprend pas ce que représentent ces personnages. Ce n'est pas le meilleur point d'entrée — je dirais Man of Steel de Byrne d'abord." },
      { username: "marvelgeek",     content: "La lecture de débutant d'All-Star Superman est : 'belles aventures d'un super-héros mourant'. La lecture experte : 'lettre d'amour à 70 ans de mythologie'. Les deux fonctionnent — mais la deuxième est tellement plus riche." },
    ],
  },
  {
    guideSlug: "superman",
    authorUsername: "graphicguru",
    title: "Superman Red Son : meilleure utilisation du format 'Elseworlds' ?",
    content: "Les Elseworlds DC (histoires hors continuité avec des what-ifs) ont produit quelques chefs-d'œuvre et beaucoup de médiocrité. Superman Red Son est clairement dans la première catégorie. Mais est-ce le meilleur usage du format ? Kingdom Come est aussi un Elseworlds. The Dark Knight Returns aussi dans un sens.",
    replies: [
      { username: "dc_only",        content: "Kingdom Come pour moi. Waid et Ross utilisent le format pour poser une question sur le rôle des super-héros dans la société qui n'est possible que hors continuité. Red Son est un exercice brillant mais Kingdom Come est une vision." },
      { username: "rorschach42",    content: "Watchmen est techniquement un Elseworlds dans le sens où Moore crée un univers parallèle complet. Si on l'inclut dans la catégorie, la conversation s'arrête là." },
      { username: "batmaniac",      content: "Red Son gagne pour moi à cause de la dernière révélation — je ne spoile pas — qui transforme rétrospectivement toute la lecture. C'est du twist narratif au service du thème, pas du twist gratuit." },
    ],
  },
  // Spider-Man (guides existant)
  {
    guideSlug: "spider-man",
    authorUsername: "marvelgeek",
    title: "Superior Spider-Man est-il vraiment à recommander à un nouveau lecteur ?",
    content: "Le parcours inclut Superior Spider-Man (Doc Ock dans le corps de Parker) et je me pose des questions. C'est un run brillant mais qui demande de connaître l'histoire de Peter Parker sur plusieurs décennies pour mesurer l'impact. Est-ce qu'on peut le lire sans cette base ?",
    replies: [
      { username: "spiderfan42",  content: "Non. Superior Spider-Man n'a de sens que si vous êtes attaché à Peter Parker. La dynamique du run entier repose sur le lecteur qui sait ce que Doc Ock ne comprend pas. Sans ça, c'est juste un Spider-Man un peu agressif." },
      { username: "comicnerd99",  content: "Je le mettrais en fin de parcours, après Amazing Fantasy, Kraven's Last Hunt et les Death of Gwen Stacy. Superior Spider-Man est la récompense des lecteurs investis, pas une introduction." },
      { username: "panel_by_panel", content: "Slott a eu l'intelligence de ne pas exiger une connaissance encyclopédique. Chaque numéro rappelle qui est Peter, qui est Ock, ce qui s'est passé. Mais l'impact émotionnel est décuplé avec le contexte — vous avez raison." },
    ],
  },
];

// ─── Nouvelles entrées de lecture ─────────────────────────────────────────────

const NEW_ENTRIES = [
  { username: "batmaniac",      externalId: "seed-born-again",            status: "FINISHED",    progress: 100, currentPage: 256, totalPages: 256 },
  { username: "batmaniac",      externalId: "seed-watchmen",              status: "FINISHED",    progress: 100, currentPage: 416, totalPages: 416 },
  { username: "batmaniac",      externalId: "seed-kingdom-come",          status: "TO_READ",     progress: 0,   currentPage: 0,   totalPages: 232 },
  { username: "spiderfan42",    externalId: "seed-born-again",            status: "FINISHED",    progress: 100, currentPage: 256, totalPages: 256 },
  { username: "spiderfan42",    externalId: "seed-old-man-logan",         status: "TO_READ",     progress: 0,   currentPage: 0,   totalPages: 266 },
  { username: "rorschach42",    externalId: "seed-sandman-preludes",      status: "FINISHED",    progress: 100, currentPage: 400, totalPages: 400 },
  { username: "rorschach42",    externalId: "seed-transmetropolitan",     status: "FINISHED",    progress: 100, currentPage: 224, totalPages: 224 },
  { username: "rorschach42",    externalId: "seed-kingdom-come",          status: "TO_READ",     progress: 0,   currentPage: 0,   totalPages: 232 },
  { username: "marvelgeek",     externalId: "seed-born-again",            status: "FINISHED",    progress: 100, currentPage: 256, totalPages: 256 },
  { username: "marvelgeek",     externalId: "seed-iron-man-extremis",     status: "FINISHED",    progress: 100, currentPage: 176, totalPages: 176 },
  { username: "marvelgeek",     externalId: "seed-wolverine-1982",        status: "FINISHED",    progress: 100, currentPage: 128, totalPages: 128 },
  { username: "xmen_forever",   externalId: "seed-invincible-vol1",       status: "TO_READ",     progress: 0,   currentPage: 0,   totalPages: 128 },
  { username: "xmen_forever",   externalId: "seed-civil-war",             status: "FINISHED",    progress: 100, currentPage: 224, totalPages: 224 },
  { username: "indiefan",       externalId: "seed-preacher-vol1",         status: "FINISHED",    progress: 100, currentPage: 264, totalPages: 264 },
  { username: "indiefan",       externalId: "seed-sin-city-vol1",         status: "IN_PROGRESS", progress: 50,  currentPage: 104, totalPages: 208 },
  { username: "indiefan",       externalId: "seed-maus",                  status: "FINISHED",    progress: 100, currentPage: 296, totalPages: 296 },
  { username: "graphicguru",    externalId: "seed-bone-complete",         status: "FINISHED",    progress: 100, currentPage: 1332, totalPages: 1332 },
  { username: "graphicguru",    externalId: "seed-sandman-preludes",      status: "IN_PROGRESS", progress: 70,  currentPage: 280, totalPages: 400 },
  { username: "graphicguru",    externalId: "seed-v-for-vendetta",        status: "FINISHED",    progress: 100, currentPage: 296, totalPages: 296 },
  { username: "neonbat",        externalId: "seed-born-again",            status: "FINISHED",    progress: 100, currentPage: 256, totalPages: 256 },
  { username: "neonbat",        externalId: "seed-killing-joke",          status: "FINISHED",    progress: 100, currentPage: 48,  totalPages: 48 },
  { username: "neonbat",        externalId: "seed-v-for-vendetta",        status: "IN_PROGRESS", progress: 60,  currentPage: 178, totalPages: 296 },
  { username: "panel_by_panel", externalId: "seed-saga-vol1",             status: "FINISHED",    progress: 100, currentPage: 160, totalPages: 160 },
  { username: "panel_by_panel", externalId: "seed-asterix-gaulois",       status: "FINISHED",    progress: 100, currentPage: 48,  totalPages: 48 },
  { username: "panel_by_panel", externalId: "seed-tintin-lune",           status: "FINISHED",    progress: 100, currentPage: 64,  totalPages: 64 },
  { username: "inkandcolor",    externalId: "seed-dark-knight-returns",   status: "FINISHED",    progress: 100, currentPage: 200, totalPages: 200 },
  { username: "inkandcolor",    externalId: "seed-batman-year-one",       status: "FINISHED",    progress: 100, currentPage: 96,  totalPages: 96 },
  { username: "inkandcolor",    externalId: "seed-persepolis",            status: "IN_PROGRESS", progress: 45,  currentPage: 164, totalPages: 365 },
  { username: "frenchcomics",   externalId: "seed-saga-vol1",             status: "TO_READ",     progress: 0,   currentPage: 0,   totalPages: 160 },
  { username: "frenchcomics",   externalId: "seed-maus",                  status: "IN_PROGRESS", progress: 30,  currentPage: 89,  totalPages: 296 },
  { username: "sagafan",        externalId: "seed-fables-vol1",           status: "FINISHED",    progress: 100, currentPage: 192, totalPages: 192 },
  { username: "sagafan",        externalId: "seed-100-bullets-vol1",      status: "IN_PROGRESS", progress: 55,  currentPage: 110, totalPages: 200 },
  { username: "sagafan",        externalId: "seed-preacher-vol1",         status: "FINISHED",    progress: 100, currentPage: 264, totalPages: 264 },
  { username: "comicnerd99",    externalId: "seed-watchmen",              status: "FINISHED",    progress: 100, currentPage: 416, totalPages: 416 },
  { username: "comicnerd99",    externalId: "seed-bone-complete",         status: "IN_PROGRESS", progress: 35,  currentPage: 466, totalPages: 1332 },
  { username: "comicnerd99",    externalId: "seed-persepolis",            status: "TO_READ",     progress: 0,   currentPage: 0,   totalPages: 365 },
  { username: "wolverine_best", externalId: "seed-xmen-1",                status: "FINISHED",    progress: 100, currentPage: 24,  totalPages: 24 },
  { username: "wolverine_best", externalId: "seed-civil-war",             status: "FINISHED",    progress: 100, currentPage: 224, totalPages: 224 },
  { username: "comicster_mod",  externalId: "seed-born-again",            status: "FINISHED",    progress: 100, currentPage: 256, totalPages: 256 },
  { username: "comicster_mod",  externalId: "seed-all-star-superman",     status: "FINISHED",    progress: 100, currentPage: 320, totalPages: 320 },
  { username: "comicster_mod",  externalId: "seed-invincible-vol1",       status: "IN_PROGRESS", progress: 40,  currentPage: 51,  totalPages: 128 },
  { username: "dc_only",        externalId: "seed-dark-knight-returns",   status: "FINISHED",    progress: 100, currentPage: 200, totalPages: 200 },
  { username: "dc_only",        externalId: "seed-killing-joke",          status: "FINISHED",    progress: 100, currentPage: 48,  totalPages: 48 },
  { username: "dc_only",        externalId: "seed-v-for-vendetta",        status: "FINISHED",    progress: 100, currentPage: 296, totalPages: 296 },
];

// ─── Nouveaux follows ─────────────────────────────────────────────────────────

const NEW_FOLLOWS = [
  ["sagafan",        "comicnerd99"],
  ["comicnerd99",    "graphicguru"],
  ["comicnerd99",    "panel_by_panel"],
  ["panel_by_panel", "frenchcomics"],
  ["inkandcolor",    "rorschach42"],
  ["rorschach42",    "sagafan"],
  ["rorschach42",    "graphicguru"],
  ["frenchcomics",   "panel_by_panel"],
  ["frenchcomics",   "graphicguru"],
  ["wolverine_best", "spiderfan42"],
  ["neonbat",        "indiefan"],
  ["neonbat",        "sagafan"],
  ["xmen_forever",   "spiderfan42"],
  ["dc_only",        "rorschach42"],
  ["batmaniac",      "comicster_mod"],
  ["comicster_mod",  "rorschach42"],
  ["comicster_mod",  "graphicguru"],
  ["marvelgeek",     "wolverine_best"],
  ["spiderfan42",    "comicnerd99"],
  ["graphicguru",    "frenchcomics"],
];

// ─── Likes supplémentaires ────────────────────────────────────────────────────

const NEW_LIKES = [
  { reviewer: "dc_only",        externalId: "seed-dark-knight-returns", likers: ["batmaniac", "neonbat", "comicster_mod"] },
  { reviewer: "neonbat",        externalId: "seed-v-for-vendetta",      likers: ["rorschach42", "dc_only", "indiefan"] },
  { reviewer: "spiderfan42",    externalId: "seed-born-again",          likers: ["wolverine_best", "batmaniac", "comicnerd99"] },
  { reviewer: "xmen_forever",   externalId: "seed-old-man-logan",       likers: ["wolverine_best", "marvelgeek", "xmen_forever"] },
  { reviewer: "graphicguru",    externalId: "seed-akira-vol1",          likers: ["inkandcolor", "panel_by_panel", "sagafan"] },
  { reviewer: "batmaniac",      externalId: "seed-long-halloween",      likers: ["dc_only", "spiderfan42", "neonbat", "comicster_mod"] },
  { reviewer: "comicnerd99",    externalId: "seed-watchmen",            likers: ["rorschach42", "inkandcolor", "panel_by_panel", "graphicguru"] },
  { reviewer: "panel_by_panel", externalId: "seed-persepolis",          likers: ["frenchcomics", "graphicguru", "indiefan"] },
  { reviewer: "frenchcomics",   externalId: "seed-asterix-gaulois",     likers: ["panel_by_panel", "frenchcomics"] },
  { reviewer: "wolverine_best", externalId: "seed-born-again",          likers: ["spiderfan42", "batmaniac", "neonbat"] },
  { reviewer: "inkandcolor",    externalId: "seed-bone-complete",       likers: ["panel_by_panel", "indiefan", "comicnerd99"] },
  { reviewer: "dc_only",        externalId: "seed-all-star-superman",   likers: ["batmaniac", "inkandcolor", "comicster_mod"] },
  { reviewer: "marvelgeek",     externalId: "seed-hawkeye-2012",        likers: ["spiderfan42", "comicnerd99", "batmaniac"] },
];

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🌱 Seed démonstration Comicster — Batch 2\n");

  const { userMap, comicMap, guideMap, reviewMap: existingReviewMap } = await buildMaps();

  // 1. Nouveaux avis
  console.log("⭐ Nouveaux avis…");
  const reviewMap = { ...existingReviewMap };
  let reviewCount = 0;
  for (const r of NEW_REVIEWS) {
    const userId  = userMap[r.username];
    const comicId = comicMap[r.externalId];
    if (!userId || !comicId) { console.log(`  ↳ Skip review ${r.username}:${r.externalId} (introuvable)`); continue; }
    const review = await prisma.review.upsert({
      where: { userId_comicId: { userId, comicId } },
      update: {},
      create: { userId, comicId, rating: r.rating, content: r.content },
    });
    reviewMap[`${r.username}:${r.externalId}`] = review.id;
    reviewCount++;
  }
  console.log(`  ✓ ${reviewCount} avis ajoutés`);

  // 2. Commentaires sur avis
  console.log("💬 Commentaires sur avis…");
  let commentCount = 0;
  for (const cd of COMMENTS_DATA) {
    const reviewId = reviewMap[`${cd.reviewerUsername}:${cd.externalId}`];
    if (!reviewId) { console.log(`  ↳ Review ${cd.reviewerUsername}:${cd.externalId} introuvable`); continue; }

    for (const c of cd.comments) {
      const userId = userMap[c.username];
      if (!userId) continue;

      // Vérifie si le commentaire existe déjà (par contenu tronqué)
      const existing = await prisma.comment.findFirst({
        where: { reviewId, userId, content: { startsWith: c.content.slice(0, 30) } },
      });
      if (existing) continue;

      await prisma.comment.create({ data: { reviewId, userId, content: c.content } });
      commentCount++;
    }
  }
  console.log(`  ✓ ${commentCount} commentaires ajoutés`);

  // 3. Nouveaux topics + réponses
  console.log("📖 Nouveaux topics de guides…");
  let topicCount = 0;
  let replyCount = 0;
  for (const t of NEW_TOPICS) {
    const guideId  = guideMap[t.guideSlug];
    const authorId = userMap[t.authorUsername];
    if (!guideId || !authorId) { console.log(`  ↳ Skip topic (guide ${t.guideSlug} ou user introuvable)`); continue; }

    const existing = await prisma.guideTopic.findFirst({
      where: { guideId, title: t.title },
    });
    if (existing) { console.log(`  ↳ Topic "${t.title.slice(0, 40)}…" déjà présent`); continue; }

    const topic = await prisma.guideTopic.create({
      data: { guideId, authorId, title: t.title, content: t.content },
    });
    topicCount++;

    for (const r of t.replies) {
      const replyAuthorId = userMap[r.username];
      if (!replyAuthorId) continue;
      await prisma.guideReply.create({
        data: { topicId: topic.id, authorId: replyAuthorId, content: r.content },
      });
      replyCount++;
    }
  }
  console.log(`  ✓ ${topicCount} topics, ${replyCount} réponses`);

  // 4. Nouvelles entrées de lecture
  console.log("📔 Entrées de lecture supplémentaires…");
  let entryCount = 0;
  for (const e of NEW_ENTRIES) {
    const userId  = userMap[e.username];
    const comicId = comicMap[e.externalId];
    if (!userId || !comicId) continue;
    await prisma.readingEntry.upsert({
      where: { userId_comicId: { userId, comicId } },
      update: {},
      create: {
        userId, comicId,
        status: e.status,
        progress: e.progress,
        currentPage: e.currentPage,
        totalPages: e.totalPages,
        startedAt: e.status !== "TO_READ" ? new Date("2025-01-01") : null,
        finishedAt: e.status === "FINISHED" ? new Date("2025-09-01") : null,
        lastReadAt: e.status !== "TO_READ" ? new Date() : null,
      },
    });
    entryCount++;
  }
  console.log(`  ✓ ${entryCount} entrées de lecture`);

  // 5. Nouveaux follows
  console.log("👥 Follows supplémentaires…");
  let followCount = 0;
  for (const [fn, fg] of NEW_FOLLOWS) {
    const followerId  = userMap[fn];
    const followingId = userMap[fg];
    if (!followerId || !followingId || followerId === followingId) continue;
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      update: {},
      create: { followerId, followingId },
    });
    followCount++;
  }
  console.log(`  ✓ ${followCount} follows`);

  // 6. Likes supplémentaires
  console.log("❤️  Likes supplémentaires…");
  let likeCount = 0;
  for (const la of NEW_LIKES) {
    const reviewId = reviewMap[`${la.reviewer}:${la.externalId}`];
    if (!reviewId) continue;
    for (const liker of la.likers) {
      const userId = userMap[liker];
      if (!userId || liker === la.reviewer) continue;
      await prisma.reviewLike.upsert({
        where: { userId_reviewId: { userId, reviewId } },
        update: {},
        create: { userId, reviewId },
      });
      likeCount++;
    }
  }
  console.log(`  ✓ ${likeCount} likes`);

  // 7. Résumé final
  const [users, comics, guides, lists, reviews, entries, follows, comments, topics] =
    await Promise.all([
      prisma.user.count(),
      prisma.comic.count(),
      prisma.readingGuide.count(),
      prisma.list.count(),
      prisma.review.count(),
      prisma.readingEntry.count(),
      prisma.follow.count(),
      prisma.comment.count(),
      prisma.guideTopic.count(),
    ]);

  console.log("\n✅ Batch 2 terminé ! État de la base :\n");
  console.log(`  Utilisateurs    : ${users}`);
  console.log(`  Comics          : ${comics}`);
  console.log(`  Guides          : ${guides}`);
  console.log(`  Listes          : ${lists}`);
  console.log(`  Avis            : ${reviews}`);
  console.log(`  Entrées lecture : ${entries}`);
  console.log(`  Follows         : ${follows}`);
  console.log(`  Commentaires    : ${comments}`);
  console.log(`  Topics guides   : ${topics}\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
