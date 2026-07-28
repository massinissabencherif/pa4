import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import session from "express-session";
import passport from "passport";

import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import comicsRouter from "./routes/comics.js";
import readingRouter from "./routes/reading.js";
import reviewsRouter from "./routes/reviews.js";
import listsRouter from "./routes/lists.js";
import adminRouter from "./routes/admin.js";
import feedRouter from "./routes/feed.js";
import authorsRouter from "./routes/authors.js";
import statsRouter from "./routes/stats.js";
import commentsRouter from "./routes/comments.js";
import guidesRouter from "./routes/guides.js";
import adsRouter from "./routes/ads.js";
import featuredRouter from "./routes/featured.js";
import arcadeRouter from "./routes/arcade.js";
import arcadeComicdleRouter from "./routes/arcadeComicdle.js";
import arcadeCoverMysteryRouter from "./routes/arcadeCoverMystery.js";
import notificationsRouter from "./routes/notifications.js";
import assistantRouter from "./routes/assistant.js";
import reportsRouter from "./routes/reports.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Validation des secrets critiques au démarrage ───────────────────────────
const isProduction = process.env.NODE_ENV === "production";

const REQUIRED_SECRETS = ["JWT_SECRET", "SESSION_SECRET", "TOTP_ENCRYPTION_KEY"];
const WEAK_DEFAULTS = ["change_me_in_production", "change_me_staging", "change_me"];

for (const key of REQUIRED_SECRETS) {
  const value = process.env[key];
  if (!value) {
    if (isProduction) {
      console.error(`FATAL: Variable d'environnement "${key}" manquante. Arrêt.`);
      process.exit(1);
    } else {
      console.warn(`[WARN] "${key}" non définie — utiliser une valeur forte en production.`);
    }
  } else if (isProduction && WEAK_DEFAULTS.some((w) => value.includes(w))) {
    console.error(`FATAL: "${key}" utilise une valeur par défaut faible. Arrêt.`);
    process.exit(1);
  }
}

if (isProduction && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === process.env.JWT_SECRET)) {
  console.error("FATAL: SESSION_SECRET doit être distinct de JWT_SECRET en production.");
  process.exit(1);
}

const app = express();

// Obligatoire derrière nginx qui termine le SSL : permet à express-session
// de connaître le proto réel (https) et d'honorer secure: true sur les cookies.
app.set("trust proxy", 1);

// ─── Sécurité ────────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // autorise les uploads servis à d'autres origines
}));

// Les plafonds sont réglables par variable d'environnement, avec les valeurs de
// production par défaut. Cela permet de les desserrer temporairement (démo, salle
// où tout le monde partage une IP) puis de revenir à la normale en retirant la
// variable — sans redéployer de code.
function limitFromEnv(name, fallback) {
  const raw = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
}

// Le quota d'authentification était unique et partagé par les 14 routes du
// routeur /auth — connexion, inscription, rafraîchissement, déconnexion, OAuth,
// mot de passe oublié, 2FA. Comme il compte par IP et que plusieurs personnes
// derrière un même wifi partagent une seule IP publique, quatre inscriptions
// simultanées suffisaient à bloquer tout le monde pendant 15 minutes.
//
// On sépare donc selon ce qui est réellement attaquable par force brute.

// Deviner compte ici : on garde une limite serrée.
const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: limitFromEnv("AUTH_STRICT_RATE_LIMIT", 30),
  skip: () => process.env.NODE_ENV === "test",
  message: { error: "Trop de tentatives, réessaie dans 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// L'inscription n'est pas devinable, mais reste automatisable : on borne la
// création en masse sans gêner un groupe qui s'inscrit depuis le même réseau.
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: limitFromEnv("REGISTER_RATE_LIMIT", 30),
  skip: () => process.env.NODE_ENV === "test",
  message: { error: "Trop de créations de compte depuis ce réseau, réessaie dans une heure." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Mécanique de session : rafraîchissement, déconnexion, rappels OAuth. Rien à
// deviner, et c'est ce qui consommait le quota d'un usage parfaitement légitime.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: limitFromEnv("AUTH_RATE_LIMIT", 300),
  skip: () => process.env.NODE_ENV === "test",
  message: { error: "Trop de requêtes, réessaie dans quelques minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const writeLimiter = rateLimit({
  windowMs: 60_000,
  max: limitFromEnv("WRITE_RATE_LIMIT", 20),
  skip: () => process.env.NODE_ENV === "test",
  message: { error: "Trop de requêtes, réessaie dans une minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

const allowedOrigins = [
  ...(process.env.FRONTEND_URL || "http://localhost:3000").split(",").map(o => o.trim()),
  "http://localhost:3005",
];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// SESSION_SECRET séparé de JWT_SECRET — pas de fallback croisé
app.use(session({
  secret: process.env.SESSION_SECRET || "dev_session_secret_change_me",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    // "none" requis pour que le cookie survive au redirect cross-site Google→app
    sameSite: isProduction ? "none" : "lax",
    maxAge: 10 * 60 * 1000, // 10 min — seulement pour le flux OAuth
  },
}));
app.use(passport.initialize());
app.use(passport.session());

// Servir les fichiers uploadés (PDFs, couvertures)
// Les PDFs sont affichés dans un iframe depuis le frontend — on lève les restrictions de framing
app.use("/uploads", (req, res, next) => {
  res.removeHeader("X-Frame-Options");
  res.setHeader("Content-Security-Policy", "default-src 'none'");
  next();
}, express.static(path.join(__dirname, "..", "uploads")));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (req, res) => {
  res.json({ name: "Comicster API", version: "1.0.0", status: "ok" });
});

// Les limiteurs ciblés sont montés avant le limiteur général : une requête vers
// /auth/login traverse le strict puis le général, et c'est le strict qui borne.
app.use("/auth/login", strictAuthLimiter);
app.use("/auth/forgot-password", strictAuthLimiter);
app.use("/auth/reset-password", strictAuthLimiter);
app.use("/auth/2fa/verify", strictAuthLimiter);
app.use("/auth/register", registerLimiter);
app.use("/auth", authLimiter, authRouter);
app.use("/comics", comicsRouter);
app.use("/authors", authorsRouter);
app.use("/stats", statsRouter);
app.use("/ads", adsRouter);
app.use("/featured", featuredRouter);
app.use("/arcade", arcadeRouter);
app.use("/arcade/comicdle", arcadeComicdleRouter);
app.use("/arcade/cover-mystery", arcadeCoverMysteryRouter);
app.use("/comments", writeLimiter, commentsRouter);
app.use(["/reviews", "/lists", "/guides", "/reports"], writeLimiter);
app.use("/", readingRouter);
app.use("/", reviewsRouter);
app.use("/", listsRouter);
app.use("/", adminRouter);
app.use("/", usersRouter);
app.use("/", feedRouter);
app.use("/", guidesRouter);
app.use("/", notificationsRouter);
app.use("/", assistantRouter);
app.use("/", reportsRouter);

// ─── Middleware d'erreur global ───────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === "P2002") return res.status(409).json({ error: "Conflit : cette valeur existe déjà" });
  if (err.code === "P2025") return res.status(404).json({ error: "Ressource introuvable" });
  // Erreurs déjà porteuses d'un status (ex: PayloadTooLargeError du body-parser
  // sur un corps de requête énorme) : le respecter plutôt qu'un 500 générique.
  const status = err.status || err.statusCode;
  if (status && status >= 400 && status < 500) {
    return res.status(status).json({ error: err.message || "Requête invalide" });
  }
  res.status(500).json({ error: "Erreur serveur" });
});

const port = process.env.PORT || 3001;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
  });
}

export { app };
