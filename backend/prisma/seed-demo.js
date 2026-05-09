/**
 * Seed de démonstration Comicster
 * Usage: DATABASE_URL=... node prisma/seed-demo.js
 *
 * Peuple la base avec des utilisateurs, comics, listes, guides, journaux, avis et discussions.
 * Idempotent : relancer ne crée pas de doublons (upsert sur les champs uniques).
 */

import pkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const { PrismaClient } = pkg;
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sample(arr, n) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

// ─── Utilisateurs ─────────────────────────────────────────────────────────────

const USERS_DATA = [
  { username: "spiderfan42",    email: "spiderfan42@demo.com",    role: "USER" },
  { username: "batmaniac",      email: "batmaniac@demo.com",      role: "USER" },
  { username: "xmen_forever",   email: "xmen_forever@demo.com",   role: "USER" },
  { username: "dc_only",        email: "dc_only@demo.com",        role: "USER" },
  { username: "marvelgeek",     email: "marvelgeek@demo.com",     role: "USER" },
  { username: "indiefan",       email: "indiefan@demo.com",       role: "USER" },
  { username: "comicnerd99",    email: "comicnerd99@demo.com",    role: "USER" },
  { username: "graphicguru",    email: "graphicguru@demo.com",    role: "USER" },
  { username: "wolverine_best", email: "wolverine_best@demo.com", role: "USER" },
  { username: "neonbat",        email: "neonbat@demo.com",        role: "USER" },
  { username: "rorschach42",    email: "rorschach42@demo.com",    role: "USER" },
  { username: "sagafan",        email: "sagafan@demo.com",        role: "USER" },
  { username: "panel_by_panel", email: "panel_by_panel@demo.com", role: "USER" },
  { username: "inkandcolor",    email: "inkandcolor@demo.com",    role: "USER" },
  { username: "frenchcomics",   email: "frenchcomics@demo.com",   role: "USER" },
  { username: "comicster_mod",  email: "comicster_mod@demo.com",  role: "ADMIN" },
];

// ─── Comics ───────────────────────────────────────────────────────────────────

const COMICS_DATA = [
  // Marvel
  { externalId: "seed-amazing-fantasy-15",   title: "Amazing Fantasy #15",          genres: ["Super-héros", "Action"], authors: ["Stan Lee", "Steve Ditko"],       publisher: "Marvel Comics", coverUrl: "/covers/defaults/hp-spiderman.webp",      publishedAt: new Date("1962-08-01") },
  { externalId: "seed-kravens-last-hunt",    title: "Kraven's Last Hunt",            genres: ["Super-héros", "Thriller"], authors: ["J.M. DeMatteis"],              publisher: "Marvel Comics", coverUrl: "/covers/defaults/hp-kravenlasthunt.jpeg",  publishedAt: new Date("1987-11-01") },
  { externalId: "seed-civil-war",            title: "Civil War",                    genres: ["Super-héros", "Action"], authors: ["Mark Millar"],                   publisher: "Marvel Comics", coverUrl: "/covers/defaults/avengers.svg",            publishedAt: new Date("2006-07-01") },
  { externalId: "seed-xmen-1",               title: "X-Men #1",                     genres: ["Super-héros", "Action"], authors: ["Stan Lee", "Jack Kirby"],        publisher: "Marvel Comics", coverUrl: "/covers/defaults/xmen.svg",                publishedAt: new Date("1963-09-01") },
  { externalId: "seed-days-future-past",     title: "Days of Future Past",           genres: ["Super-héros", "Science-fiction"], authors: ["Chris Claremont"],      publisher: "Marvel Comics", coverUrl: "/covers/defaults/xmen.svg",                publishedAt: new Date("1981-01-01") },
  { externalId: "seed-dark-phoenix-saga",    title: "The Dark Phoenix Saga",         genres: ["Super-héros", "Drame"], authors: ["Chris Claremont", "John Byrne"],  publisher: "Marvel Comics", coverUrl: "/covers/defaults/xmen.svg",                publishedAt: new Date("1980-01-01") },
  { externalId: "seed-wolverine-1982",       title: "Wolverine (1982)",              genres: ["Super-héros", "Action"], authors: ["Chris Claremont", "Frank Miller"], publisher: "Marvel Comics", coverUrl: null,                                   publishedAt: new Date("1982-09-01") },
  { externalId: "seed-old-man-logan",        title: "Old Man Logan",                genres: ["Super-héros", "Western", "Post-apocalyptique"], authors: ["Mark Millar"], publisher: "Marvel Comics", coverUrl: null,                               publishedAt: new Date("2008-06-01") },
  { externalId: "seed-born-again",           title: "Daredevil: Born Again",        genres: ["Super-héros", "Noir"], authors: ["Frank Miller"],                    publisher: "Marvel Comics", coverUrl: null,                                       publishedAt: new Date("1986-03-01") },
  { externalId: "seed-iron-man-extremis",    title: "Iron Man: Extremis",           genres: ["Super-héros", "Science-fiction"], authors: ["Warren Ellis"],          publisher: "Marvel Comics", coverUrl: null,                                       publishedAt: new Date("2005-01-01") },
  { externalId: "seed-hawkeye-2012",         title: "Hawkeye (2012)",               genres: ["Super-héros", "Humour"], authors: ["Matt Fraction"],                 publisher: "Marvel Comics", coverUrl: null,                                       publishedAt: new Date("2012-08-01") },
  { externalId: "seed-infinity-gauntlet",    title: "The Infinity Gauntlet",        genres: ["Super-héros", "Action", "Cosmique"], authors: ["Jim Starlin"],       publisher: "Marvel Comics", coverUrl: null,                                       publishedAt: new Date("1991-07-01") },
  { externalId: "seed-ms-marvel-2014",       title: "Ms. Marvel (2014)",            genres: ["Super-héros"], authors: ["G. Willow Wilson"],                       publisher: "Marvel Comics", coverUrl: null,                                       publishedAt: new Date("2014-04-01") },
  { externalId: "seed-planet-hulk",          title: "Planet Hulk",                 genres: ["Super-héros", "Aventure"], authors: ["Greg Pak"],                    publisher: "Marvel Comics", coverUrl: null,                                       publishedAt: new Date("2006-04-01") },
  // DC
  { externalId: "seed-batman-year-one",      title: "Batman: Year One",             genres: ["Super-héros", "Noir", "Polar"], authors: ["Frank Miller"],            publisher: "DC Comics",     coverUrl: "/covers/defaults/hp-dayone.jpg",           publishedAt: new Date("1987-02-01") },
  { externalId: "seed-dark-knight-returns",  title: "The Dark Knight Returns",      genres: ["Super-héros", "Dystopie"], authors: ["Frank Miller"],                publisher: "DC Comics",     coverUrl: "/covers/defaults/batman.svg",              publishedAt: new Date("1986-02-01") },
  { externalId: "seed-long-halloween",       title: "Batman: The Long Halloween",   genres: ["Super-héros", "Polar"], authors: ["Jeph Loeb"],                      publisher: "DC Comics",     coverUrl: null,                                       publishedAt: new Date("1997-10-01") },
  { externalId: "seed-batman-hush",          title: "Batman: Hush",                genres: ["Super-héros", "Thriller"], authors: ["Jeph Loeb"],                   publisher: "DC Comics",     coverUrl: null,                                       publishedAt: new Date("2002-12-01") },
  { externalId: "seed-killing-joke",         title: "Batman: The Killing Joke",    genres: ["Super-héros", "Psychologique"], authors: ["Alan Moore"],              publisher: "DC Comics",     coverUrl: null,                                       publishedAt: new Date("1988-03-01") },
  { externalId: "seed-watchmen",             title: "Watchmen",                    genres: ["Super-héros", "Dystopie", "Politique"], authors: ["Alan Moore"],      publisher: "DC Comics",     coverUrl: "/covers/defaults/hp-watchmen.webp",        publishedAt: new Date("1986-09-01") },
  { externalId: "seed-v-for-vendetta",       title: "V for Vendetta",              genres: ["Dystopie", "Politique", "Action"], authors: ["Alan Moore"],           publisher: "DC Comics",     coverUrl: null,                                       publishedAt: new Date("1982-03-01") },
  { externalId: "seed-kingdom-come",         title: "Kingdom Come",                genres: ["Super-héros", "Épique"], authors: ["Mark Waid", "Alex Ross"],        publisher: "DC Comics",     coverUrl: null,                                       publishedAt: new Date("1996-05-01") },
  { externalId: "seed-all-star-superman",    title: "All-Star Superman",           genres: ["Super-héros"], authors: ["Grant Morrison", "Frank Quitely"],        publisher: "DC Comics",     coverUrl: null,                                       publishedAt: new Date("2005-11-01") },
  { externalId: "seed-superman-red-son",     title: "Superman: Red Son",           genres: ["Super-héros", "Politique"], authors: ["Mark Millar"],                 publisher: "DC Comics",     coverUrl: "/covers/defaults/hp-mos.webp",             publishedAt: new Date("2003-04-01") },
  { externalId: "seed-wonder-woman-blood",   title: "Wonder Woman: Blood",         genres: ["Super-héros", "Mythologie"], authors: ["Brian Azzarello"],            publisher: "DC Comics",     coverUrl: null,                                       publishedAt: new Date("2012-01-01") },
  { externalId: "seed-sandman-preludes",     title: "Sandman: Preludes & Nocturnes", genres: ["Fantastique", "Horreur"], authors: ["Neil Gaiman"],               publisher: "DC Comics",     coverUrl: null,                                       publishedAt: new Date("1991-09-01") },
  // Indies / Vertigo
  { externalId: "seed-saga-vol1",            title: "Saga, Vol. 1",                genres: ["Science-fiction", "Fantastique", "Drame"], authors: ["Brian K. Vaughan"], publisher: "Image Comics", coverUrl: null,                               publishedAt: new Date("2012-10-01") },
  { externalId: "seed-walking-dead-vol1",    title: "The Walking Dead, Vol. 1",   genres: ["Horreur", "Post-apocalyptique", "Survie"], authors: ["Robert Kirkman"], publisher: "Image Comics", coverUrl: null,                               publishedAt: new Date("2004-01-01") },
  { externalId: "seed-invincible-vol1",      title: "Invincible, Vol. 1",         genres: ["Super-héros", "Action"], authors: ["Robert Kirkman"],                publisher: "Image Comics", coverUrl: "/covers/defaults/hp-invincible.jpg",       publishedAt: new Date("2003-01-01") },
  { externalId: "seed-y-last-man",           title: "Y: The Last Man, Vol. 1",    genres: ["Science-fiction", "Aventure"], authors: ["Brian K. Vaughan"],        publisher: "DC Comics",     coverUrl: null,                                       publishedAt: new Date("2003-06-01") },
  { externalId: "seed-fables-vol1",          title: "Fables, Vol. 1",             genres: ["Fantastique", "Conte"], authors: ["Bill Willingham"],                publisher: "DC Comics",     coverUrl: null,                                       publishedAt: new Date("2002-12-01") },
  { externalId: "seed-100-bullets-vol1",     title: "100 Bullets, Vol. 1",        genres: ["Polar", "Thriller"], authors: ["Brian Azzarello"],                  publisher: "DC Comics",     coverUrl: null,                                       publishedAt: new Date("1999-10-01") },
  { externalId: "seed-preacher-vol1",        title: "Preacher, Vol. 1",           genres: ["Western", "Horreur", "Humour noir"], authors: ["Garth Ennis"],       publisher: "DC Comics",     coverUrl: null,                                       publishedAt: new Date("1996-07-01") },
  { externalId: "seed-transmetropolitan",    title: "Transmetropolitan, Vol. 1",  genres: ["Science-fiction", "Politique", "Satire"], authors: ["Warren Ellis"],  publisher: "DC Comics",     coverUrl: null,                                       publishedAt: new Date("1997-09-01") },
  { externalId: "seed-maus",                 title: "Maus",                       genres: ["Autobiographie", "Histoire"], authors: ["Art Spiegelman"],            publisher: "Pantheon Books", coverUrl: null,                                      publishedAt: new Date("1991-10-01") },
  { externalId: "seed-persepolis",           title: "Persépolis",                 genres: ["Autobiographie", "Politique"], authors: ["Marjane Satrapi"],          publisher: "L'Association", coverUrl: null,                                       publishedAt: new Date("2000-10-01") },
  { externalId: "seed-ghost-world",          title: "Ghost World",                genres: ["Drame", "Indie"], authors: ["Daniel Clowes"],                        publisher: "Fantagraphics", coverUrl: null,                                        publishedAt: new Date("2001-04-01") },
  { externalId: "seed-akira-vol1",           title: "Akira, Vol. 1",              genres: ["Science-fiction", "Action", "Manga"], authors: ["Katsuhiro Otomo"],  publisher: "Kodansha",      coverUrl: null,                                       publishedAt: new Date("1984-12-01") },
  { externalId: "seed-bone-complete",        title: "Bone: One Volume Edition",   genres: ["Aventure", "Fantastique", "Humour"], authors: ["Jeff Smith"],        publisher: "Cartoon Books", coverUrl: null,                                        publishedAt: new Date("2004-06-01") },
  { externalId: "seed-sin-city-vol1",        title: "Sin City, Vol. 1",           genres: ["Noir", "Polar"], authors: ["Frank Miller"],                          publisher: "Dark Horse",    coverUrl: null,                                        publishedAt: new Date("1993-05-01") },
  // Franco-belge
  { externalId: "seed-valerian-vol1",        title: "Valérian: La Cité des Eaux Mouvantes", genres: ["Science-fiction", "Aventure"], authors: ["Pierre Christin", "Jean-Claude Mézières"], publisher: "Dargaud", coverUrl: "/covers/defaults/hp-valerian.jpg", publishedAt: new Date("1970-01-01") },
  { externalId: "seed-asterix-gaulois",      title: "Astérix le Gaulois",         genres: ["Humour", "Aventure", "Histoire"], authors: ["René Goscinny", "Albert Uderzo"], publisher: "Dargaud", coverUrl: null,                              publishedAt: new Date("1961-01-01") },
  { externalId: "seed-tintin-lune",          title: "Tintin: On a marché sur la Lune", genres: ["Aventure", "Science-fiction"], authors: ["Hergé"],              publisher: "Casterman",     coverUrl: null,                                       publishedAt: new Date("1954-01-01") },
  { externalId: "seed-blake-mortimer",       title: "Blake et Mortimer: Le Secret de l'Espadon", genres: ["Aventure", "Science-fiction"], authors: ["Edgar P. Jacobs"], publisher: "Dargaud", coverUrl: "/covers/defaults/hp-buckdanny.jpg",    publishedAt: new Date("1950-01-01") },
  { externalId: "seed-asterix-armorique",    title: "Astérix chez les Normands",  genres: ["Humour", "Aventure"], authors: ["René Goscinny", "Albert Uderzo"],   publisher: "Dargaud",       coverUrl: null,                                       publishedAt: new Date("1966-01-01") },
];

// ─── Guides de lecture ────────────────────────────────────────────────────────
// Ces guides viennent s'ajouter aux 5 déjà créés par seed-guides.js
// On met à jour les guides existants avec comicUrl

const GUIDES_DATA = [
  {
    slug: "x-men",
    character: "X-Men",
    imageUrl: "/covers/defaults/xmen.svg",
    teaser: "Les mutants les plus célèbres des comics Marvel — une métaphore vivante de la différence, du racisme et de l'acceptation de soi depuis 1963.",
    story: "Dans un monde qui les craint et les déteste, Charles Xavier réunit des adolescents aux pouvoirs extraordinaires. Les X-Men ne sont pas seulement des super-héros : ils sont une métaphore de toutes les minorités qui luttent pour leur place dans une société hostile. Chris Claremont a transformé cette équipe au fil de 16 ans de run en quelque chose de bien plus complexe : une saga sur l'identité, la famille, le sacrifice et l'espoir. Chaque lecteur y trouve une partie de lui-même.",
    relatedSlugs: ["wolverine", "spider-man"],
    comics: [
      { title: "X-Men #1", coverUrl: "/covers/defaults/xmen.svg", comicUrl: "/comics/seed-xmen-1", note: "Stan Lee et Jack Kirby posent les bases en 1963. Historique.", order: 1 },
      { title: "The Dark Phoenix Saga", coverUrl: "/covers/defaults/xmen.svg", comicUrl: "/comics/seed-dark-phoenix-saga", note: "Jean Grey sacrifie sa vie pour protéger l'univers. La tragédie définitive des X-Men.", order: 2 },
      { title: "Days of Future Past", coverUrl: "/covers/defaults/xmen.svg", comicUrl: "/comics/seed-days-future-past", note: "Un futur dystopique où les mutants sont exterminés. Deux numéros qui ont changé les comics.", order: 3 },
      { title: "Wolverine (1982)", coverUrl: null, comicUrl: "/comics/seed-wolverine-1982", note: "La connexion X-Men / Wolverine solo au Japon. À lire pour comprendre Logan.", order: 4 },
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
      { title: "Watchmen", coverUrl: "/covers/defaults/hp-watchmen.webp", comicUrl: "/comics/seed-watchmen", note: "Le chef-d'œuvre. 12 numéros d'une densité narrative inégalée. À lire absolument.", order: 1 },
      { title: "V for Vendetta", coverUrl: null, comicUrl: "/comics/seed-v-for-vendetta", note: "L'autre grand œuvre d'Alan Moore — dystopie fasciste, anarchisme, identité. Tout aussi essentiel.", order: 2 },
      { title: "Batman: The Killing Joke", coverUrl: null, comicUrl: "/comics/seed-killing-joke", note: "Moore s'attaque cette fois à Batman et au Joker. Court, brutal, inoubliable.", order: 3 },
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
      { title: "Saga, Vol. 1", coverUrl: null, comicUrl: "/comics/seed-saga-vol1", note: "La série la plus ambitieuse de la décennie. Space opera, romance, guerre et bébé. Commencez ici.", order: 1 },
      { title: "Invincible, Vol. 1", coverUrl: "/covers/defaults/hp-invincible.jpg", comicUrl: "/comics/seed-invincible-vol1", note: "Un ado découvre qu'il est un super-héros — puis que son père est un super-vilain. Kirkman au sommet.", order: 2 },
      { title: "Maus", coverUrl: null, comicUrl: "/comics/seed-maus", note: "Art Spiegelman raconte l'Holocauste avec des souris. La BD qui a tout légitimé. Prix Pulitzer 1992.", order: 3 },
      { title: "Persépolis", coverUrl: null, comicUrl: "/comics/seed-persepolis", note: "L'Iran de la révolution islamique raconté par une enfant. Autobiographique, universel, essentiel.", order: 4 },
      { title: "Bone: One Volume Edition", coverUrl: null, comicUrl: "/comics/seed-bone-complete", note: "1.300 pages d'aventure et d'humour — l'épopée fantasy indépendante la plus accessible jamais écrite.", order: 5 },
    ],
  },
];

// ─── Listes ───────────────────────────────────────────────────────────────────

const LISTS_DATA = [
  // Publiques
  { username: "batmaniac",      name: "Batman Essentials",           description: "Les comics Batman à lire avant de mourir. Triés par ordre de lecture idéal.",    isPublic: true,  comics: ["seed-batman-year-one", "seed-dark-knight-returns", "seed-killing-joke", "seed-long-halloween", "seed-batman-hush"] },
  { username: "spiderfan42",    name: "Spider-Man de A à Z",         description: "Mon parcours complet Spider-Man depuis Amazing Fantasy jusqu'à nos jours.",       isPublic: true,  comics: ["seed-amazing-fantasy-15", "seed-kravens-last-hunt"] },
  { username: "marvelgeek",     name: "Marvel Events — Top 10",      description: "Les crossover Marvel incontournables, dans l'ordre chronologique de lecture.",     isPublic: true,  comics: ["seed-civil-war", "seed-infinity-gauntlet", "seed-planet-hulk"] },
  { username: "indiefan",       name: "Indies Must-Read",            description: "La sélection ultime des comics indépendants — tout ce que Marvel/DC ne font pas.", isPublic: true,  comics: ["seed-saga-vol1", "seed-walking-dead-vol1", "seed-invincible-vol1", "seed-y-last-man", "seed-fables-vol1"] },
  { username: "graphicguru",    name: "Roman graphique et art BD",   description: "Des œuvres qui prouvent que la BD est un art à part entière.",                    isPublic: true,  comics: ["seed-maus", "seed-persepolis", "seed-ghost-world", "seed-akira-vol1"] },
  { username: "rorschach42",    name: "Alan Moore — L'intégrale",    description: "Tout Alan Moore, dans l'ordre. Commencez par Watchmen.",                          isPublic: true,  comics: ["seed-watchmen", "seed-v-for-vendetta", "seed-killing-joke"] },
  { username: "sagafan",        name: "Science-fiction Comics",      description: "SF au format comic, de Saga à Akira en passant par Valérian.",                    isPublic: true,  comics: ["seed-saga-vol1", "seed-akira-vol1", "seed-valerian-vol1", "seed-transmetropolitan", "seed-y-last-man"] },
  { username: "panel_by_panel", name: "Premier contact BD",          description: "La liste que je donne à tous ceux qui n'ont jamais lu de comics.",                isPublic: true,  comics: ["seed-bone-complete", "seed-maus", "seed-persepolis", "seed-watchmen", "seed-saga-vol1"] },
  { username: "inkandcolor",    name: "Chefs-d'œuvre graphiques",    description: "Des comics choisis pour la qualité absolue du dessin et des couleurs.",           isPublic: true,  comics: ["seed-watchmen", "seed-kingdom-come", "seed-all-star-superman", "seed-akira-vol1"] },
  { username: "frenchcomics",   name: "Franco-Belge Incontournables", description: "Les piliers de la BD franco-belge à lire au moins une fois dans sa vie.",        isPublic: true,  comics: ["seed-valerian-vol1", "seed-asterix-gaulois", "seed-tintin-lune", "seed-blake-mortimer", "seed-asterix-armorique"] },
  { username: "dc_only",        name: "DC Universe Starter Pack",    description: "Par où commencer DC sans se perdre dans 80 ans de continuité.",                  isPublic: true,  comics: ["seed-batman-year-one", "seed-watchmen", "seed-sandman-preludes", "seed-kingdom-come", "seed-all-star-superman"] },
  { username: "wolverine_best", name: "Wolverine — Les essentiels",  description: "Logan mérite mieux que les films. Ces comics le prouvent.",                      isPublic: true,  comics: ["seed-wolverine-1982", "seed-old-man-logan", "seed-days-future-past"] },
  { username: "neonbat",        name: "Horreur et Dark Comics",      description: "Comics pour les nuits sans sommeil — horreur, gore et psychologique.",            isPublic: true,  comics: ["seed-preacher-vol1", "seed-walking-dead-vol1", "seed-sandman-preludes", "seed-100-bullets-vol1"] },
  { username: "comicnerd99",    name: "Récompensés et primés",       description: "Prix Eisner, Prix Pulitzer, Prix Harvey — la crème de la crème primée.",          isPublic: true,  comics: ["seed-maus", "seed-saga-vol1", "seed-watchmen", "seed-hawkeye-2012", "seed-ms-marvel-2014"] },
  { username: "xmen_forever",   name: "X-Men Saga Complète",         description: "L'ordre de lecture de la saga X-Men pour ne pas se perdre.",                     isPublic: true,  comics: ["seed-xmen-1", "seed-dark-phoenix-saga", "seed-days-future-past", "seed-wolverine-1982", "seed-old-man-logan"] },
  // Privées
  { username: "spiderfan42",    name: "À lire cet été",              description: null,    isPublic: false, comics: ["seed-hawkeye-2012", "seed-ms-marvel-2014", "seed-planet-hulk"] },
  { username: "batmaniac",      name: "Wishlist comics",             description: null,    isPublic: false, comics: ["seed-long-halloween", "seed-batman-hush", "seed-killing-joke"] },
  { username: "marvelgeek",     name: "Relecture en cours",          description: null,    isPublic: false, comics: ["seed-civil-war", "seed-infinity-gauntlet"] },
  { username: "indiefan",       name: "Prêtés à des amis",          description: null,    isPublic: false, comics: ["seed-saga-vol1", "seed-bone-complete"] },
  { username: "graphicguru",    name: "Ma collection physique",      description: null,    isPublic: false, comics: ["seed-maus", "seed-watchmen", "seed-akira-vol1", "seed-persepolis"] },
  { username: "comicnerd99",    name: "Comics offerts en cadeau",    description: null,    isPublic: false, comics: ["seed-bone-complete", "seed-persepolis", "seed-asterix-gaulois"] },
  { username: "rorschach42",    name: "Idées cadeaux",               description: null,    isPublic: false, comics: ["seed-watchmen", "seed-v-for-vendetta"] },
  { username: "sagafan",        name: "Next up",                     description: null,    isPublic: false, comics: ["seed-transmetropolitan", "seed-preacher-vol1"] },
  { username: "panel_by_panel", name: "Pour ma nièce (12 ans)",      description: null,    isPublic: false, comics: ["seed-bone-complete", "seed-asterix-gaulois", "seed-tintin-lune"] },
  { username: "inkandcolor",    name: "Influences artistiques",      description: null,    isPublic: false, comics: ["seed-sin-city-vol1", "seed-akira-vol1", "seed-kingdom-come"] },
];

// ─── Avis (reviews) ───────────────────────────────────────────────────────────

const REVIEWS_DATA = [
  { username: "batmaniac",      externalId: "seed-batman-year-one",    rating: 5, content: "Le point de départ absolu pour comprendre Batman. Frank Miller a réinventé Gotham avec un réalisme urbain qui n'a pas pris une ride. Gordon y est aussi important que Bruce Wayne." },
  { username: "batmaniac",      externalId: "seed-dark-knight-returns", rating: 5, content: "Un chef-d'œuvre dystopique. Ce Batman vieillissant qui se bat contre Ronald Reagan (oui vraiment) est peut-être la meilleure chose que Miller ait jamais faite. La scène finale avec Superman est bouleversante." },
  { username: "spiderfan42",    externalId: "seed-amazing-fantasy-15",  rating: 5, content: "11 pages. Juste 11 pages pour créer le personnage qui allait définir Marvel pour les 60 années suivantes. La densité narrative est hallucinante par rapport aux standards modernes." },
  { username: "spiderfan42",    externalId: "seed-kravens-last-hunt",   rating: 5, content: "DeMatteis transforme un vilain de second rang en figure tragique. Cette histoire sur la mort, l'honneur et l'identité reste mon arc Spider-Man préféré. La scène dans la tombe est insupportable." },
  { username: "rorschach42",    externalId: "seed-watchmen",            rating: 5, content: "On ne lit pas Watchmen, on le survit. Moore a construit quelque chose d'une densité narrative impossible — chaque case, chaque symbole a un sens. Relire après la fin première lecture est une expérience unique." },
  { username: "rorschach42",    externalId: "seed-v-for-vendetta",      rating: 5, content: "Encore plus pertinent aujourd'hui qu'en 1982. La distinction entre anarchisme et terrorisme que Moore explore ici est d'une finesse politique rare dans les comics. Lloyd's art is perfect for this darkness." },
  { username: "indiefan",       externalId: "seed-saga-vol1",           rating: 5, content: "Staple, Vaughan et cette idée folle de mettre un bébé au cœur d'un space opera de guerre intergalactique. Le tome 1 pose des bases qui tiennent encore 60 volumes plus tard. La science-fiction adulte dans les comics existe enfin." },
  { username: "indiefan",       externalId: "seed-invincible-vol1",     rating: 4, content: "Kirkman arrive à recréer l'excitation des premiers comics Marvel avec un regard moderne. Le twist de fin du tome 1 (que je ne spoilerai pas) est l'un des meilleurs moments de la décennie Image." },
  { username: "graphicguru",    externalId: "seed-maus",                rating: 5, content: "Le seul comic qui méritait le Prix Pulitzer. Spiegelman réussit l'impossible : rendre l'Holocauste lisible sans le minimiser. L'utilisation des souris et des chats est d'une intelligence formelle totale." },
  { username: "graphicguru",    externalId: "seed-akira-vol1",          rating: 5, content: "Otomo a inventé le cyberpunk visuel. La densité des décors, la lisibilité des scènes d'action, l'ampleur du worldbuilding en quelques tomes — personne n'a encore égalé ça en manga." },
  { username: "marvelgeek",     externalId: "seed-civil-war",           rating: 4, content: "L'event Marvel le plus politiquement intéressant. Millar prend un angle réaliste sur la question de l'accountability des super-héros et ne force pas de bonne réponse. Tony et Steve ont tous les deux raison — c'est ça le génie." },
  { username: "marvelgeek",     externalId: "seed-infinity-gauntlet",   rating: 4, content: "Le crossover cosmique par excellence. Thanos avec tous les Infinity Gems, la moitié de l'univers effacée, les héros qui essaient l'impossible. Thanos qui tombe amoureux de la Mort — concept bizarre mais fascinant." },
  { username: "xmen_forever",   externalId: "seed-dark-phoenix-saga",   rating: 5, content: "Claremont a écrit la mort de Jean Grey comme une vraie tragédie shakespearienne. L'échelle cosmique de l'événement combinée avec la dimension intime des relations dans l'équipe. Rien d't comparable dans les X-Men depuis." },
  { username: "xmen_forever",   externalId: "seed-days-future-past",    rating: 5, content: "Deux numéros. Deux numéros qui ont inventé le futur dystopique comme moteur narratif dans les comics. Kitty Pryde dans le corps de son moi adulte pour changer le passé — le concept tient encore 40 ans plus tard." },
  { username: "wolverine_best", externalId: "seed-wolverine-1982",       rating: 5, content: "Le Wolverine de Miller et Claremont au Japon est le seul Wolverine solo qui compte vraiment. L'opposition entre la bestialité de Logan et l'honneur japonais est parfaitement maîtrisée. Une mini-série de 4 numéros qui donne envie d'en lire 400." },
  { username: "wolverine_best", externalId: "seed-old-man-logan",        rating: 5, content: "Millar réussit là où beaucoup échouent : rendre le futur de Logan crédible. Ce western post-apocalyptique où Logan refuse d'étendre ses griffes est dévastateur. La révélation à mi-parcours est l'une des plus choquantes des comics Marvel." },
  { username: "panel_by_panel", externalId: "seed-persepolis",           rating: 5, content: "Satrapi prouve que la BD peut être littérature. L'Iran de la révolution vue par une enfant — universel, drôle et dévastateur alternativement. Le format noir et blanc est parfait pour cette histoire." },
  { username: "panel_by_panel", externalId: "seed-bone-complete",        rating: 5, content: "Jeff Smith a créé une épopée fantasy accessible à 8 ans et à 80 ans. Le voyage de Fone Bone à travers la Vallée oscille entre Tolkien et Pogo. 1.300 pages qui filent à toute vitesse. Mon premier conseil à quiconque veut lire des comics." },
  { username: "neonbat",        externalId: "seed-preacher-vol1",        rating: 5, content: "Garth Ennis réunit western, horreur, blasphème et comédie noire dans quelque chose d'unique. Jesse Custer avec le Génesé, Cassidy le vampire irlandais, Tulip O'Hare — une des trios les plus attachants et les plus déglingués des comics." },
  { username: "neonbat",        externalId: "seed-sandman-preludes",     rating: 5, content: "Gaiman transforme un personnage mineur DC en quelque chose de mythologique. Morpheus, Seigneur des Rêves, errant entre mythologie, folklore et histoire littéraire. Les 75 numéros forment un tout cohérent et bouleversant." },
  { username: "frenchcomics",   externalId: "seed-valerian-vol1",        rating: 4, content: "Le mythe français que tout le monde a oublié pendant que Star Wars prenait toute la place. Mézières a inventé l'esthétique de la SF populaire européenne. Le film de Besson est une déclaration d'amour maladroite mais sincère." },
  { username: "frenchcomics",   externalId: "seed-asterix-gaulois",      rating: 5, content: "Goscinny est un génie. Les jeux de mots, la satire politique, les parodies de cultures antiques — Astérix fonctionne sur 3 niveaux simultanément : enfant, adulte, érudit. Un chef-d'œuvre de la BD franco-belge classique." },
  { username: "dc_only",        externalId: "seed-all-star-superman",    rating: 5, content: "Morrison et Quitely signent la lettre d'amour ultime à Superman. L'idée de base — Superman mourant accomplit 12 travaux — est magnifiquement simple. Chaque épisode est une variation sur ce que Superman représente. Parfait." },
  { username: "dc_only",        externalId: "seed-kingdom-come",         rating: 5, content: "Waid et Ross imaginent un futur où les héros ont échoué. Les aquarelles de Ross transforment chaque page en œuvre d'art. Le retour de Superman pour affronter une nouvelle génération violente de héros est dévastateur." },
  { username: "comicnerd99",    externalId: "seed-hawkeye-2012",         rating: 5, content: "Fraction et Aja prouvent qu'on peut faire quelque chose de totalement différent dans le mainstream Marvel. Clint Barton entre les aventures, dans son appartement, avec ses voisins et son chien. Le 'Pizza Dog issue' seul mérite un Eisner." },
  { username: "comicnerd99",    externalId: "seed-ms-marvel-2014",       rating: 4, content: "Wilson crée quelque chose que Marvel cherchait depuis des années : un personnage jeune et contemporain qui n'est pas juste une version féminine d'un héros existant. Kamala Khan a sa propre identité, ses propres problèmes, sa propre voix." },
  { username: "inkandcolor",    externalId: "seed-sin-city-vol1",        rating: 4, content: "Miller abandonne les couleurs pour un noir et blanc total — et révèle quelque chose de fondamental sur la narration visuelle. Sin City ressemble à aucune autre bande dessinée. Chaque page est une composition photographique." },
  { username: "inkandcolor",    externalId: "seed-superman-red-son",     rating: 4, content: "Millar joue à fond la carte du what-if politique. Superman soviétique vs Batman anarchiste ukrainien vs Lex Luthor président des États-Unis. Prévisible mais exécuté avec brio. La dernière révélation change tout rétrospectivement." },
  { username: "sagafan",        externalId: "seed-transmetropolitan",    rating: 5, content: "Spider Jerusalem est le journaliste que Hunter Thompson aurait été s'il vivait dans une mégapole cyberpunk du futur. Ellis écrit une satire politique d'une brutalité et d'une drôlerie rares. Toujours aussi pertinent." },
  { username: "comicster_mod",  externalId: "seed-watchmen",             rating: 5, content: "Je relis Watchmen tous les deux ou trois ans. À chaque fois je trouve quelque chose de nouveau. Moore a encodé une densité narrative incroyable dans chaque panel. La structure en 9 cases régulières vs. les flashbacks de Rorschach. Génial." },
];

// ─── Guide topics et réponses ─────────────────────────────────────────────────

const TOPICS_DATA = [
  {
    guideSlug: "batman",
    authorUsername: "batmaniac",
    title: "Par où commencer pour quelqu'un qui n'a jamais lu de comics ?",
    content: "Je conseille toujours Batman: Year One en premier. 4 numéros, une histoire complète, aucun prérequis de continuité. Miller a fait quelque chose de parfaitement accessible et la qualité est immédiatement évidente. Après ça, The Long Halloween pour le côté polar. Ensuite seulement The Dark Knight Returns qui demande une certaine familiarité avec le personnage pour être pleinement apprécié.",
    replies: [
      { username: "neonbat", content: "Entièrement d'accord pour Year One. J'ajouterais que The Killing Joke se lit très bien standalone aussi — c'est court, dense, et ça pose immédiatement le niveau de la BD adulte." },
      { username: "dc_only", content: "Attention The Killing Joke seul peut être difficile à appréhender sans connaître Barbara Gordon. Si c'est vraiment un débutant complet, je partirais plutôt sur une intégrale Court of Owls de Snyder — plus accessible narrativement." },
      { username: "comicnerd99", content: "La question c'est aussi : quel type de lecteur est-il ? Quelqu'un qui aime les polars ira direct sur Long Halloween. Amateur de SF dystopique : Dark Knight Returns. Noir old-school : Year One. Le parcours devrait s'adapter au lecteur." },
    ],
  },
  {
    guideSlug: "batman",
    authorUsername: "dc_only",
    title: "Batman Hush est-il vraiment essentiel ou juste fun ?",
    content: "Je vois Hush dans toutes les listes 'essentiels Batman' mais honnêtement je le trouve plus fun que fondamental. C'est un plaisir de lecture évident — Jim Lee au sommet, tous les vilains en parade — mais narrativement, Loeb ne dit rien de profond sur le personnage. Vos avis ?",
    replies: [
      { username: "batmaniac", content: "Tu as raison sur le fond narratif. Mais Hush remplit un rôle important : c'est la meilleure porte d'entrée pour les vilains. Après Year One et Long Halloween, un lecteur a besoin de voir le Rogue's Gallery complet. Hush fait ça parfaitement." },
      { username: "inkandcolor", content: "Pour moi Hush est essentiel d'un point de vue artistique. Jim Lee réinvente Gotham visuellement et pose les bases de l'esthétique Batman moderne. La narration est correcte, le dessin est exceptionnel." },
    ],
  },
  {
    guideSlug: "spider-man",
    authorUsername: "spiderfan42",
    title: "The Clone Saga : faut-il l'inclure dans un parcours Spider-Man ?",
    content: "La Clone Saga des années 90 est probablement l'arc le plus controversé de l'histoire Spider-Man. Éditoriale désastreuse, trop long, des morts annulées... Et pourtant. Il y a des moments de vraie force là-dedans. Est-ce qu'on l'inclut dans un parcours de lecture ou on l'efface pudiquement de la liste ?",
    replies: [
      { username: "marvelgeek", content: "On l'efface. La Clone Saga n'a pas besoin d'exister pour comprendre Spider-Man. Si quelqu'un est curieux de l'histoire éditoriale du comics années 90, c'est intéressant comme document. Mais comme recommandation ? Jamais." },
      { username: "comicnerd99", content: "Faux. Ben Reilly a ses fans pour une raison. L'arc 'The Real Clone Saga' de 2009 est une version condensée et améliorée qui vaut le coup. On peut mentionner ça comme alternative." },
      { username: "panel_by_panel", content: "Je pense qu'il faut séparer l'expérience de lecture (douloureuse) de l'importance historique (réelle). La Clone Saga a définitivement changé la façon dont Marvel aborde ses cross-over. En ce sens elle mérite une mention, pas une lecture." },
    ],
  },
  {
    guideSlug: "watchmen-univers",
    authorUsername: "rorschach42",
    title: "Avant Before Watchmen, ou Alan Moore avait-il raison de s'y opposer ?",
    content: "DC a sorti Before Watchmen en 2012 — des prequels par d'autres auteurs que Moore. Moore s'y est vigoureusement opposé, estimant que Watchmen était une œuvre fermée qui n'avait pas besoin d'extension. Après lecture des 7 mini-séries : j'ai du mal à lui donner tort. Vos impressions ?",
    replies: [
      { username: "dc_only", content: "Moore avait raison mais pour de mauvaises raisons peut-être. Ce n'est pas que Before Watchmen soit mauvais — certains volumes sont excellents. C'est que Watchmen n'en avait pas besoin. C'est une œuvre complète. L'ajouter c'est diluer." },
      { username: "indiefan", content: "Le Rorschach de Azzarello est objectivement excellent. Le Minutemen de Cooke aussi. Mais ils prouvent précisément ce que Moore disait : si les prequels sont bons, ils ne font qu'illustrer ce qu'on avait déjà compris. Si ils sont mauvais, ils polluent l'original." },
      { username: "graphicguru", content: "Question différente : est-ce qu'une œuvre d'art appartient à ses créateurs ou à son public ? Moore dit que Watchmen lui appartient. DC dit que c'est leur propriété. Les deux ont tort et raison simultanément. C'est ça qui rend l'affaire fascinante au-delà des comics." },
    ],
  },
  {
    guideSlug: "x-men",
    authorUsername: "xmen_forever",
    title: "House of X / Powers of X : meilleure run X-Men depuis Claremont ?",
    content: "Hickman a sorti en 2019 deux mini-séries entrelacées qui ont complètement réinventé les X-Men. HoX/PoX est dense, ambitieux, structurellement brillant. Est-ce que ça mérite d'être dans un parcours X-Men, même si c'est récent et qu'il faut une bonne base pour l'apprécier ?",
    replies: [
      { username: "marvelgeek", content: "Oui sans hésitation. Hickman a fait pour les X-Men ce que Morrison a fait pour la JLA en 2000 : réinventer le concept de zéro. HoX/PoX est lisible sans trop de continuité si on connaît les personnages de base." },
      { username: "panel_by_panel", content: "Je mettrais HoX/PoX en fin de parcours uniquement. C'est un reward pour les lecteurs qui connaissent déjà les X-Men — pas un point d'entrée. La densité narrative demande une familiarité avec la mythologie mutante." },
    ],
  },
  {
    guideSlug: "independants",
    authorUsername: "indiefan",
    title: "Saga est-elle toujours aussi bonne après le long hiatus ?",
    content: "Vaughan et Staples ont repris Saga après 3 ans d'absence. Les nouveaux volumes ont divisé la communauté — certains trouvent que la série a perdu de son élan, d'autres que c'est toujours au niveau. Mon avis : c'est un peu moins parfait mais toujours dans le top 5 des comics en cours.",
    replies: [
      { username: "sagafan", content: "Le retour de Saga est une des meilleures nouvelles comics de ces dernières années. L'ellipse temporelle qu'ils ont mise en place après le hiatus est audacieuse et ça marche. Hazel adulte est fascinante." },
      { username: "graphicguru", content: "Je suis plus mitigé. La magie des premiers volumes tenait à la nouveauté absolue du concept. Maintenant qu'on connaît le monde, les personnages, le ton — le retour ressemble davantage à une continuation solide qu'à un renouveau." },
      { username: "comicnerd99", content: "La qualité artistique de Fiona Staples est toujours irréprochable — ça c'est indiscutable. La narration de Vaughan a changé de rythme, c'est vrai. Mais je trouve ça cohérent avec l'évolution des personnages." },
    ],
  },
];

// ─── Entrées de lecture ───────────────────────────────────────────────────────

function makeReadingEntries(userMap, comicMap) {
  const entries = [];

  const assignments = [
    { username: "batmaniac",      externalId: "seed-batman-year-one",     status: "FINISHED",     progress: 100, currentPage: 96,  totalPages: 96 },
    { username: "batmaniac",      externalId: "seed-dark-knight-returns",  status: "FINISHED",     progress: 100, currentPage: 200, totalPages: 200 },
    { username: "batmaniac",      externalId: "seed-killing-joke",         status: "FINISHED",     progress: 100, currentPage: 48,  totalPages: 48 },
    { username: "batmaniac",      externalId: "seed-long-halloween",        status: "FINISHED",     progress: 100, currentPage: 374, totalPages: 374 },
    { username: "batmaniac",      externalId: "seed-batman-hush",           status: "IN_PROGRESS",  progress: 65,  currentPage: 195, totalPages: 300 },
    { username: "spiderfan42",    externalId: "seed-amazing-fantasy-15",    status: "FINISHED",     progress: 100, currentPage: 24,  totalPages: 24 },
    { username: "spiderfan42",    externalId: "seed-kravens-last-hunt",     status: "FINISHED",     progress: 100, currentPage: 160, totalPages: 160 },
    { username: "spiderfan42",    externalId: "seed-civil-war",             status: "IN_PROGRESS",  progress: 40,  currentPage: 90,  totalPages: 224 },
    { username: "spiderfan42",    externalId: "seed-hawkeye-2012",          status: "TO_READ",      progress: 0,   currentPage: 0,   totalPages: 304 },
    { username: "marvelgeek",     externalId: "seed-civil-war",             status: "FINISHED",     progress: 100, currentPage: 224, totalPages: 224 },
    { username: "marvelgeek",     externalId: "seed-infinity-gauntlet",     status: "FINISHED",     progress: 100, currentPage: 256, totalPages: 256 },
    { username: "marvelgeek",     externalId: "seed-planet-hulk",           status: "FINISHED",     progress: 100, currentPage: 416, totalPages: 416 },
    { username: "marvelgeek",     externalId: "seed-ms-marvel-2014",        status: "IN_PROGRESS",  progress: 55,  currentPage: 110, totalPages: 200 },
    { username: "xmen_forever",   externalId: "seed-xmen-1",                status: "FINISHED",     progress: 100, currentPage: 24,  totalPages: 24 },
    { username: "xmen_forever",   externalId: "seed-dark-phoenix-saga",     status: "FINISHED",     progress: 100, currentPage: 176, totalPages: 176 },
    { username: "xmen_forever",   externalId: "seed-days-future-past",      status: "FINISHED",     progress: 100, currentPage: 48,  totalPages: 48 },
    { username: "xmen_forever",   externalId: "seed-wolverine-1982",        status: "FINISHED",     progress: 100, currentPage: 128, totalPages: 128 },
    { username: "xmen_forever",   externalId: "seed-old-man-logan",         status: "IN_PROGRESS",  progress: 70,  currentPage: 186, totalPages: 266 },
    { username: "wolverine_best", externalId: "seed-wolverine-1982",        status: "FINISHED",     progress: 100, currentPage: 128, totalPages: 128 },
    { username: "wolverine_best", externalId: "seed-old-man-logan",         status: "FINISHED",     progress: 100, currentPage: 266, totalPages: 266 },
    { username: "wolverine_best", externalId: "seed-days-future-past",      status: "FINISHED",     progress: 100, currentPage: 48,  totalPages: 48 },
    { username: "wolverine_best", externalId: "seed-born-again",            status: "TO_READ",      progress: 0,   currentPage: 0,   totalPages: 256 },
    { username: "indiefan",       externalId: "seed-saga-vol1",             status: "FINISHED",     progress: 100, currentPage: 160, totalPages: 160 },
    { username: "indiefan",       externalId: "seed-invincible-vol1",       status: "FINISHED",     progress: 100, currentPage: 128, totalPages: 128 },
    { username: "indiefan",       externalId: "seed-walking-dead-vol1",     status: "FINISHED",     progress: 100, currentPage: 144, totalPages: 144 },
    { username: "indiefan",       externalId: "seed-y-last-man",            status: "IN_PROGRESS",  progress: 30,  currentPage: 60,  totalPages: 200 },
    { username: "indiefan",       externalId: "seed-fables-vol1",           status: "TO_READ",      progress: 0,   currentPage: 0,   totalPages: 192 },
    { username: "rorschach42",    externalId: "seed-watchmen",              status: "FINISHED",     progress: 100, currentPage: 416, totalPages: 416 },
    { username: "rorschach42",    externalId: "seed-v-for-vendetta",        status: "FINISHED",     progress: 100, currentPage: 296, totalPages: 296 },
    { username: "rorschach42",    externalId: "seed-killing-joke",          status: "FINISHED",     progress: 100, currentPage: 48,  totalPages: 48 },
    { username: "rorschach42",    externalId: "seed-preacher-vol1",         status: "IN_PROGRESS",  progress: 80,  currentPage: 210, totalPages: 264 },
    { username: "graphicguru",    externalId: "seed-maus",                  status: "FINISHED",     progress: 100, currentPage: 296, totalPages: 296 },
    { username: "graphicguru",    externalId: "seed-persepolis",            status: "FINISHED",     progress: 100, currentPage: 365, totalPages: 365 },
    { username: "graphicguru",    externalId: "seed-akira-vol1",            status: "FINISHED",     progress: 100, currentPage: 360, totalPages: 360 },
    { username: "graphicguru",    externalId: "seed-ghost-world",           status: "FINISHED",     progress: 100, currentPage: 80,  totalPages: 80 },
    { username: "graphicguru",    externalId: "seed-saga-vol1",             status: "IN_PROGRESS",  progress: 60,  currentPage: 96,  totalPages: 160 },
    { username: "sagafan",        externalId: "seed-saga-vol1",             status: "FINISHED",     progress: 100, currentPage: 160, totalPages: 160 },
    { username: "sagafan",        externalId: "seed-transmetropolitan",     status: "FINISHED",     progress: 100, currentPage: 224, totalPages: 224 },
    { username: "sagafan",        externalId: "seed-y-last-man",            status: "FINISHED",     progress: 100, currentPage: 200, totalPages: 200 },
    { username: "sagafan",        externalId: "seed-valerian-vol1",         status: "IN_PROGRESS",  progress: 50,  currentPage: 64,  totalPages: 128 },
    { username: "panel_by_panel", externalId: "seed-bone-complete",         status: "FINISHED",     progress: 100, currentPage: 1332, totalPages: 1332 },
    { username: "panel_by_panel", externalId: "seed-persepolis",            status: "FINISHED",     progress: 100, currentPage: 365, totalPages: 365 },
    { username: "panel_by_panel", externalId: "seed-maus",                  status: "FINISHED",     progress: 100, currentPage: 296, totalPages: 296 },
    { username: "panel_by_panel", externalId: "seed-watchmen",              status: "IN_PROGRESS",  progress: 45,  currentPage: 187, totalPages: 416 },
    { username: "inkandcolor",    externalId: "seed-watchmen",              status: "FINISHED",     progress: 100, currentPage: 416, totalPages: 416 },
    { username: "inkandcolor",    externalId: "seed-kingdom-come",          status: "FINISHED",     progress: 100, currentPage: 232, totalPages: 232 },
    { username: "inkandcolor",    externalId: "seed-all-star-superman",     status: "FINISHED",     progress: 100, currentPage: 320, totalPages: 320 },
    { username: "inkandcolor",    externalId: "seed-akira-vol1",            status: "IN_PROGRESS",  progress: 75,  currentPage: 270, totalPages: 360 },
    { username: "inkandcolor",    externalId: "seed-sin-city-vol1",         status: "FINISHED",     progress: 100, currentPage: 208, totalPages: 208 },
    { username: "frenchcomics",   externalId: "seed-valerian-vol1",         status: "FINISHED",     progress: 100, currentPage: 128, totalPages: 128 },
    { username: "frenchcomics",   externalId: "seed-asterix-gaulois",       status: "FINISHED",     progress: 100, currentPage: 48,  totalPages: 48 },
    { username: "frenchcomics",   externalId: "seed-tintin-lune",           status: "FINISHED",     progress: 100, currentPage: 64,  totalPages: 64 },
    { username: "frenchcomics",   externalId: "seed-blake-mortimer",        status: "FINISHED",     progress: 100, currentPage: 100, totalPages: 100 },
    { username: "frenchcomics",   externalId: "seed-asterix-armorique",     status: "IN_PROGRESS",  progress: 40,  currentPage: 20,  totalPages: 48 },
    { username: "dc_only",        externalId: "seed-batman-year-one",       status: "FINISHED",     progress: 100, currentPage: 96,  totalPages: 96 },
    { username: "dc_only",        externalId: "seed-watchmen",              status: "FINISHED",     progress: 100, currentPage: 416, totalPages: 416 },
    { username: "dc_only",        externalId: "seed-all-star-superman",     status: "FINISHED",     progress: 100, currentPage: 320, totalPages: 320 },
    { username: "dc_only",        externalId: "seed-kingdom-come",          status: "FINISHED",     progress: 100, currentPage: 232, totalPages: 232 },
    { username: "dc_only",        externalId: "seed-sandman-preludes",      status: "IN_PROGRESS",  progress: 55,  currentPage: 220, totalPages: 400 },
    { username: "neonbat",        externalId: "seed-preacher-vol1",         status: "FINISHED",     progress: 100, currentPage: 264, totalPages: 264 },
    { username: "neonbat",        externalId: "seed-sandman-preludes",      status: "FINISHED",     progress: 100, currentPage: 400, totalPages: 400 },
    { username: "neonbat",        externalId: "seed-walking-dead-vol1",     status: "FINISHED",     progress: 100, currentPage: 144, totalPages: 144 },
    { username: "neonbat",        externalId: "seed-100-bullets-vol1",      status: "IN_PROGRESS",  progress: 35,  currentPage: 70,  totalPages: 200 },
    { username: "comicnerd99",    externalId: "seed-hawkeye-2012",          status: "FINISHED",     progress: 100, currentPage: 304, totalPages: 304 },
    { username: "comicnerd99",    externalId: "seed-ms-marvel-2014",        status: "FINISHED",     progress: 100, currentPage: 200, totalPages: 200 },
    { username: "comicnerd99",    externalId: "seed-maus",                  status: "FINISHED",     progress: 100, currentPage: 296, totalPages: 296 },
    { username: "comicnerd99",    externalId: "seed-saga-vol1",             status: "IN_PROGRESS",  progress: 80,  currentPage: 128, totalPages: 160 },
    { username: "comicster_mod",  externalId: "seed-watchmen",              status: "FINISHED",     progress: 100, currentPage: 416, totalPages: 416 },
    { username: "comicster_mod",  externalId: "seed-batman-year-one",       status: "FINISHED",     progress: 100, currentPage: 96,  totalPages: 96 },
    { username: "comicster_mod",  externalId: "seed-saga-vol1",             status: "FINISHED",     progress: 100, currentPage: 160, totalPages: 160 },
  ];

  for (const a of assignments) {
    const userId = userMap[a.username];
    const comicId = comicMap[a.externalId];
    if (!userId || !comicId) continue;
    entries.push({
      userId, comicId,
      status: a.status,
      progress: a.progress,
      currentPage: a.currentPage,
      totalPages: a.totalPages,
      startedAt: a.status !== "TO_READ" ? new Date("2024-01-01") : null,
      finishedAt: a.status === "FINISHED" ? new Date("2024-06-01") : null,
      lastReadAt: a.status !== "TO_READ" ? new Date() : null,
    });
  }
  return entries;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🌱 Seed démonstration Comicster\n");

  // 1. Users
  console.log("👤 Création des utilisateurs…");
  const passwordHash = await bcrypt.hash("demo2026!", 12);
  const userMap = {};
  for (const u of USERS_DATA) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { email: u.email, username: u.username, passwordHash, role: u.role },
    });
    userMap[u.username] = user.id;
  }
  console.log(`  ✓ ${USERS_DATA.length} utilisateurs`);

  // 2. Comics
  console.log("📚 Création des comics…");
  const comicMap = {};
  for (const c of COMICS_DATA) {
    const { externalId, ...rest } = c;
    const comic = await prisma.comic.upsert({
      where: { externalId },
      update: {},
      create: { externalId, ...rest },
    });
    comicMap[externalId] = comic.id;
  }
  console.log(`  ✓ ${COMICS_DATA.length} comics`);

  // 3. Guides (nouveaux seulement — les 5 Batman/Spiderman/etc sont déjà là)
  console.log("📖 Création des nouveaux guides…");
  for (const g of GUIDES_DATA) {
    const existing = await prisma.readingGuide.findUnique({ where: { slug: g.slug } });
    if (existing) {
      console.log(`  ↳ ${g.character} déjà présent, skip.`);
      continue;
    }
    const { comics, relatedSlugs, ...guideData } = g;
    await prisma.readingGuide.create({
      data: {
        ...guideData,
        relatedSlugs,
        comics: { create: comics },
      },
    });
    console.log(`  ✓ ${g.character} créé avec ${comics.length} comics.`);
  }

  // 4. Mise à jour des guides existants avec comicUrl
  console.log("🔗 Mise à jour des comicUrl sur guides existants…");
  const guideComicUrlMap = {
    "seed-amazing-fantasy-15":  "/comics/seed-amazing-fantasy-15",
    "seed-kravens-last-hunt":   "/comics/seed-kravens-last-hunt",
    "seed-batman-year-one":     "/comics/seed-batman-year-one",
    "seed-dark-knight-returns": "/comics/seed-dark-knight-returns",
    "seed-killing-joke":        "/comics/seed-killing-joke",
    "seed-long-halloween":      "/comics/seed-long-halloween",
    "seed-batman-hush":         "/comics/seed-batman-hush",
    "seed-wolverine-1982":      "/comics/seed-wolverine-1982",
    "seed-old-man-logan":       "/comics/seed-old-man-logan",
    "seed-watchmen":            "/comics/seed-watchmen",
    "seed-v-for-vendetta":      "/comics/seed-v-for-vendetta",
    "seed-all-star-superman":   "/comics/seed-all-star-superman",
    "seed-superman-red-son":    "/comics/seed-superman-red-son",
    "seed-kingdom-come":        "/comics/seed-kingdom-come",
    "seed-born-again":          "/comics/seed-born-again",
  };

  const titleToUrl = {
    "Amazing Fantasy #15":          guideComicUrlMap["seed-amazing-fantasy-15"],
    "Kraven's Last Hunt":           guideComicUrlMap["seed-kravens-last-hunt"],
    "Batman: Year One":             guideComicUrlMap["seed-batman-year-one"],
    "The Dark Knight Returns":      guideComicUrlMap["seed-dark-knight-returns"],
    "Batman: The Killing Joke":     guideComicUrlMap["seed-killing-joke"],
    "Batman: The Long Halloween":   guideComicUrlMap["seed-long-halloween"],
    "Batman: Hush":                 guideComicUrlMap["seed-batman-hush"],
    "Wolverine (1982)":             guideComicUrlMap["seed-wolverine-1982"],
    "Old Man Logan":                guideComicUrlMap["seed-old-man-logan"],
    "Watchmen":                     guideComicUrlMap["seed-watchmen"],
    "V for Vendetta":               guideComicUrlMap["seed-v-for-vendetta"],
    "All-Star Superman":            guideComicUrlMap["seed-all-star-superman"],
    "Superman: Red Son":            guideComicUrlMap["seed-superman-red-son"],
    "Kingdom Come":                 guideComicUrlMap["seed-kingdom-come"],
    "Daredevil: Born Again":        guideComicUrlMap["seed-born-again"],
  };

  const allGuideComics = await prisma.guideComic.findMany();
  let urlsUpdated = 0;
  for (const gc of allGuideComics) {
    const url = titleToUrl[gc.title];
    if (url && !gc.comicUrl) {
      await prisma.guideComic.update({ where: { id: gc.id }, data: { comicUrl: url } });
      urlsUpdated++;
    }
  }
  console.log(`  ✓ ${urlsUpdated} liens comicUrl mis à jour`);

  // 5. Follows
  console.log("👥 Création des follows…");
  const followPairs = [
    ["spiderfan42",    "batmaniac"],
    ["spiderfan42",    "marvelgeek"],
    ["batmaniac",      "dc_only"],
    ["batmaniac",      "spiderfan42"],
    ["xmen_forever",   "wolverine_best"],
    ["xmen_forever",   "marvelgeek"],
    ["wolverine_best", "xmen_forever"],
    ["wolverine_best", "batmaniac"],
    ["indiefan",       "graphicguru"],
    ["indiefan",       "sagafan"],
    ["sagafan",        "indiefan"],
    ["graphicguru",    "inkandcolor"],
    ["inkandcolor",    "graphicguru"],
    ["rorschach42",    "dc_only"],
    ["rorschach42",    "batmaniac"],
    ["panel_by_panel", "graphicguru"],
    ["panel_by_panel", "indiefan"],
    ["comicnerd99",    "marvelgeek"],
    ["comicnerd99",    "spiderfan42"],
    ["frenchcomics",   "inkandcolor"],
    ["neonbat",        "rorschach42"],
    ["neonbat",        "dc_only"],
    ["dc_only",        "batmaniac"],
    ["marvelgeek",     "spiderfan42"],
    ["comicster_mod",  "batmaniac"],
    ["comicster_mod",  "indiefan"],
  ];
  let followCount = 0;
  for (const [followerName, followingName] of followPairs) {
    const followerId = userMap[followerName];
    const followingId = userMap[followingName];
    if (!followerId || !followingId) continue;
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      update: {},
      create: { followerId, followingId },
    });
    followCount++;
  }
  console.log(`  ✓ ${followCount} follows`);

  // 6. Reading entries
  console.log("📔 Création des entrées de lecture…");
  const entries = makeReadingEntries(userMap, comicMap);
  let entryCount = 0;
  for (const e of entries) {
    await prisma.readingEntry.upsert({
      where: { userId_comicId: { userId: e.userId, comicId: e.comicId } },
      update: {},
      create: e,
    });
    entryCount++;
  }
  console.log(`  ✓ ${entryCount} entrées de lecture`);

  // 7. Reviews
  console.log("⭐ Création des avis…");
  let reviewCount = 0;
  const reviewMap = {};
  for (const r of REVIEWS_DATA) {
    const userId = userMap[r.username];
    const comicId = comicMap[r.externalId];
    if (!userId || !comicId) continue;
    const review = await prisma.review.upsert({
      where: { userId_comicId: { userId, comicId } },
      update: {},
      create: { userId, comicId, rating: r.rating, content: r.content },
    });
    reviewMap[`${r.username}:${r.externalId}`] = review.id;
    reviewCount++;
  }
  console.log(`  ✓ ${reviewCount} avis`);

  // 8. Review likes (croisés entre users)
  console.log("❤️ Création des likes…");
  const likeAssignments = [
    { reviewer: "batmaniac",   externalId: "seed-batman-year-one",    likers: ["spiderfan42", "dc_only", "neonbat", "comicnerd99"] },
    { reviewer: "rorschach42", externalId: "seed-watchmen",           likers: ["dc_only", "inkandcolor", "panel_by_panel", "graphicguru", "comicster_mod"] },
    { reviewer: "indiefan",    externalId: "seed-saga-vol1",          likers: ["sagafan", "graphicguru", "comicnerd99", "panel_by_panel"] },
    { reviewer: "graphicguru", externalId: "seed-maus",               likers: ["panel_by_panel", "frenchcomics", "inkandcolor", "rorschach42"] },
    { reviewer: "xmen_forever",externalId: "seed-dark-phoenix-saga",  likers: ["wolverine_best", "marvelgeek", "xmen_forever"] },
    { reviewer: "panel_by_panel", externalId: "seed-bone-complete",   likers: ["indiefan", "sagafan", "comicnerd99"] },
    { reviewer: "comicnerd99", externalId: "seed-hawkeye-2012",       likers: ["spiderfan42", "marvelgeek", "dc_only"] },
    { reviewer: "sagafan",     externalId: "seed-transmetropolitan",  likers: ["indiefan", "rorschach42"] },
  ];
  let likeCount = 0;
  for (const la of likeAssignments) {
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

  // 9. Listes
  console.log("📋 Création des listes…");
  let listCount = 0;
  for (const l of LISTS_DATA) {
    const userId = userMap[l.username];
    if (!userId) continue;
    const slug = `${slugify(l.name)}-${l.username}`;
    const existing = await prisma.list.findUnique({ where: { slug } });
    if (existing) {
      console.log(`  ↳ Liste "${l.name}" déjà présente, skip.`);
      continue;
    }
    const list = await prisma.list.create({
      data: {
        userId,
        name: l.name,
        slug,
        description: l.description,
        isPublic: l.isPublic,
      },
    });
    for (const externalId of l.comics) {
      const comicId = comicMap[externalId];
      if (!comicId) continue;
      await prisma.listItem.upsert({
        where: { listId_comicId: { listId: list.id, comicId } },
        update: {},
        create: { listId: list.id, comicId },
      });
    }
    listCount++;
  }
  console.log(`  ✓ ${listCount} listes créées`);

  // 10. Guide topics + replies
  console.log("💬 Création des discussions de guides…");
  let topicCount = 0;
  let replyCount = 0;
  for (const t of TOPICS_DATA) {
    const guide = await prisma.readingGuide.findUnique({ where: { slug: t.guideSlug } });
    if (!guide) { console.log(`  ↳ Guide "${t.guideSlug}" introuvable, skip.`); continue; }
    const authorId = userMap[t.authorUsername];
    if (!authorId) continue;

    const existing = await prisma.guideTopic.findFirst({
      where: { guideId: guide.id, title: t.title },
    });
    if (existing) { console.log(`  ↳ Topic "${t.title}" déjà présent, skip.`); continue; }

    const topic = await prisma.guideTopic.create({
      data: { guideId: guide.id, authorId, title: t.title, content: t.content },
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

  // 11. Badges
  console.log("🏅 Attribution des badges…");
  const badgeAssignments = [
    { username: "batmaniac",      badges: ["first_review", "bookworm", "social_butterfly"] },
    { username: "spiderfan42",    badges: ["first_review", "bookworm"] },
    { username: "rorschach42",    badges: ["first_review", "critic", "bookworm"] },
    { username: "graphicguru",    badges: ["first_review", "bookworm", "critic"] },
    { username: "indiefan",       badges: ["first_review", "bookworm", "curator"] },
    { username: "panel_by_panel", badges: ["first_review", "guide", "bookworm"] },
    { username: "comicster_mod",  badges: ["first_review", "moderator", "critic", "bookworm"] },
    { username: "xmen_forever",   badges: ["first_review", "bookworm"] },
    { username: "wolverine_best", badges: ["first_review"] },
    { username: "comicnerd99",    badges: ["first_review", "critic"] },
  ];
  let badgeCount = 0;
  for (const ba of badgeAssignments) {
    const userId = userMap[ba.username];
    if (!userId) continue;
    for (const badgeKey of ba.badges) {
      await prisma.userBadge.upsert({
        where: { userId_badgeKey: { userId, badgeKey } },
        update: {},
        create: { userId, badgeKey },
      });
      badgeCount++;
    }
  }
  console.log(`  ✓ ${badgeCount} badges`);

  console.log("\n✅ Seed terminé !\n");
  console.log("Comptes de démonstration (mot de passe: demo2026!) :");
  console.log("  • comicster_mod@demo.com  (ADMIN)");
  console.log("  • batmaniac@demo.com      (USER)");
  console.log("  • spiderfan42@demo.com    (USER)");
  console.log("  • rorschach42@demo.com    (USER)");
  console.log("  • indiefan@demo.com       (USER)");
  console.log("  + 11 autres comptes USER\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
