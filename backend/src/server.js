import express from "express";
import cors from "cors";
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 10 * 60 * 1000 }, // 10min, only for OAuth flow
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

app.use("/auth", authRouter);
app.use("/comics", comicsRouter);
app.use("/", readingRouter);
app.use("/", reviewsRouter);
app.use("/", listsRouter);
app.use("/", adminRouter);
app.use("/", usersRouter);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
