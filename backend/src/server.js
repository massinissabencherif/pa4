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

// ─── Sécurité ────────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // autorise les uploads servis à d'autres origines
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: "Trop de tentatives, réessaie dans 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000", credentials: true }));
app.use(express.json());

// SESSION_SECRET séparé de JWT_SECRET — pas de fallback croisé
app.use(session({
  secret: process.env.SESSION_SECRET || "dev_session_secret_change_me",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,   // HTTPS seulement en prod
    httpOnly: true,
    sameSite: isProduction ? "lax" : "lax",
    maxAge: 10 * 60 * 1000, // 10 min — seulement pour le flux OAuth
  },
}));
app.use(passport.initialize());
app.use(passport.session());

// Servir les fichiers uploadés (PDFs, couvertures)
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (req, res) => {
  res.json({ name: "Comicster API", version: "1.0.0", status: "ok" });
});

app.use("/auth", authLimiter, authRouter);
app.use("/comics", comicsRouter);
app.use("/authors", authorsRouter);
app.use("/stats", statsRouter);
app.use("/comments", commentsRouter);
app.use("/", readingRouter);
app.use("/", reviewsRouter);
app.use("/", listsRouter);
app.use("/", adminRouter);
app.use("/", usersRouter);
app.use("/", feedRouter);

// ─── Middleware d'erreur global ───────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === "P2002") return res.status(409).json({ error: "Conflit : cette valeur existe déjà" });
  if (err.code === "P2025") return res.status(404).json({ error: "Ressource introuvable" });
  res.status(500).json({ error: "Erreur serveur" });
});

const port = process.env.PORT || 3001;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
  });
}

export { app };
