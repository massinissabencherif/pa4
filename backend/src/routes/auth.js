import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { generateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { hashToken, encryptTotp, decryptTotp } from "../lib/crypto.js";
import { isReservedUsername, normalizeUsername } from "../lib/reservedUsernames.js";

const router = Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function signAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
  );
}

async function createRefreshToken(userId) {
  const token = crypto.randomBytes(64).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  await prisma.refreshToken.create({
    data: { tokenHash: hashToken(token), userId, expiresAt },
  });
  return token; // retourne le token brut au client, seul le hash est en base
}

function sanitizeUser(user) {
  return { id: user.id, email: user.email, username: user.username, role: user.role };
}

// ─── Validation ───────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(rules, body) {
  for (const [field, rule] of Object.entries(rules)) {
    const val = body[field];
    if (rule.required && (val === undefined || val === null || String(val).trim() === "")) {
      return `Le champ "${field}" est requis`;
    }
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      const str = String(val).trim();
      if (rule.email && !EMAIL_RE.test(str)) return `Format email invalide`;
      if (rule.min && str.length < rule.min)
        return `"${field}" doit contenir au moins ${rule.min} caractères`;
      if (rule.max && str.length > rule.max)
        return `"${field}" dépasse la longueur maximale de ${rule.max} caractères`;
    }
  }
  return null;
}

// ─── Passport OAuth setup ────────────────────────────────────────────────────

async function findOrCreateOAuthUser(provider, profile) {
  const email = profile.emails?.[0]?.value;
  const username =
    profile.username ||
    profile.displayName?.replace(/\s+/g, "_").toLowerCase() ||
    `${provider}_${profile.id}`;

  let user = await prisma.user.findFirst({
    where: { oauthProvider: provider, oauthId: profile.id },
  });
  if (user) return user;

  if (email) {
    user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      return prisma.user.update({
        where: { id: user.id },
        data: { oauthProvider: provider, oauthId: profile.id },
      });
    }
  }

  let finalUsername = username;
  let suffix = 1;
  while (await prisma.user.findUnique({ where: { username: finalUsername } })) {
    finalUsername = `${username}_${suffix++}`;
  }

  return prisma.user.create({
    data: {
      email: email || `${provider}_${profile.id}@oauth.local`,
      username: finalUsername,
      oauthProvider: provider,
      oauthId: profile.id,
    },
  });
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.API_BASE_URL || "http://localhost:3001"}/auth/google/callback`,
        passReqToCallback: true,
      },
      async (req, _accessToken, _refreshToken, profile, done) => {
        // Vérifie le state anti-CSRF
        const sessionState = req.session?.oauthState;
        const queryState = req.query?.state;
        if (!sessionState || !queryState || sessionState !== queryState) {
          return done(new Error("OAuth state mismatch — possible CSRF"));
        }
        delete req.session.oauthState;
        try {
          const user = await findOrCreateOAuthUser("google", profile);
          done(null, user);
        } catch (err) {
          done(err);
        }
      }
    )
  );
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${process.env.API_BASE_URL || "http://localhost:3001"}/auth/github/callback`,
        scope: ["user:email"],
        passReqToCallback: true,
      },
      async (req, _accessToken, _refreshToken, profile, done) => {
        const sessionState = req.session?.oauthState;
        const queryState = req.query?.state;
        if (!sessionState || !queryState || sessionState !== queryState) {
          return done(new Error("OAuth state mismatch — possible CSRF"));
        }
        delete req.session.oauthState;
        try {
          const user = await findOrCreateOAuthUser("github", profile);
          done(null, user);
        } catch (err) {
          done(err);
        }
      }
    )
  );
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// ─── Register ─────────────────────────────────────────────────────────────────

router.post("/register", async (req, res) => {
  const err = validate(
    {
      email:    { required: true, email: true, max: 254 },
      username: { required: true, min: 2, max: 30 },
      password: { required: true, min: 8, max: 128 },
    },
    req.body
  );
  if (err) return res.status(400).json({ error: err });

  const { email, username, password } = req.body;

  if (isReservedUsername(username)) {
    return res.status(400).json({ error: "Ce nom d'utilisateur est réservé" });
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: email.trim().toLowerCase() }, { username: username.trim() }] },
  });
  if (existing) {
    return res.status(409).json({ error: "Email ou username déjà utilisé" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email: email.trim().toLowerCase(), username: username.trim(), passwordHash },
  });

  const accessToken = signAccessToken(user);
  const refreshToken = await createRefreshToken(user.id);
  res.status(201).json({ token: accessToken, refreshToken, user: sanitizeUser(user) });
});

// ─── Login ────────────────────────────────────────────────────────────────────

router.post("/login", async (req, res) => {
  const err = validate(
    {
      email:    { required: true, email: true },
      password: { required: true },
    },
    req.body
  );
  if (err) return res.status(400).json({ error: err });

  const { email, password, totpCode } = req.body;

  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: "Identifiants invalides" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Identifiants invalides" });
  }

  if (user.totpEnabled) {
    if (!totpCode) {
      return res.status(200).json({ requires2FA: true });
    }
    // Déchiffrement du secret TOTP avant vérification
    let rawSecret;
    try {
      rawSecret = decryptTotp(user.totpSecret);
    } catch {
      return res.status(500).json({ error: "Erreur lors de la vérification 2FA" });
    }
    const ok = verifySync({ token: String(totpCode), secret: rawSecret, type: "totp" }).valid;
    if (!ok) {
      return res.status(401).json({ error: "Code 2FA invalide" });
    }
  }

  const accessToken = signAccessToken(user);
  const refreshToken = await createRefreshToken(user.id);

  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role);
  if (isAdmin && !user.totpEnabled) {
    return res.json({
      token: accessToken,
      refreshToken,
      user: sanitizeUser(user),
      requires2FASetup: true,
    });
  }

  res.json({ token: accessToken, refreshToken, user: sanitizeUser(user) });
});

// ─── Refresh token ────────────────────────────────────────────────────────────

router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken || typeof refreshToken !== "string") {
    return res.status(400).json({ error: "refreshToken requis" });
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
  });
  if (!stored || stored.expiresAt < new Date()) {
    return res.status(401).json({ error: "Refresh token invalide ou expiré" });
  }

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user) return res.status(401).json({ error: "Utilisateur introuvable" });

  // Rotation : supprime l'ancien, crée un nouveau
  await prisma.refreshToken.delete({ where: { tokenHash: hashToken(refreshToken) } });
  const newRefreshToken = await createRefreshToken(user.id);
  const accessToken = signAccessToken(user);

  res.json({ token: accessToken, refreshToken: newRefreshToken });
});

// ─── Logout ───────────────────────────────────────────────────────────────────

router.post("/logout", async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken && typeof refreshToken === "string") {
    await prisma.refreshToken.deleteMany({
      where: { tokenHash: hashToken(refreshToken) },
    });
  }
  res.json({ message: "Déconnecté" });
});

// ─── 2FA ──────────────────────────────────────────────────────────────────────

router.post("/2fa/enable", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (user.totpEnabled) {
    return res.status(400).json({ error: "2FA déjà activé" });
  }

  const secret = generateSecret();
  const otpauth = generateURI({ secret, label: user.email, issuer: "Comicster", type: "totp" });
  const qrDataUrl = await QRCode.toDataURL(otpauth);

  // Stocke le secret chiffré (pas encore activé, en attente de vérification)
  await prisma.user.update({
    where: { id: user.id },
    data: { totpSecret: encryptTotp(secret) },
  });

  res.json({ secret, qrCode: qrDataUrl });
});

router.post("/2fa/verify", requireAuth, async (req, res) => {
  const { code } = req.body;
  if (!code || typeof code !== "string" || code.trim() === "") {
    return res.status(400).json({ error: "Code requis" });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user.totpSecret) {
    return res.status(400).json({ error: "Lance d'abord /auth/2fa/enable" });
  }

  let rawSecret;
  try {
    rawSecret = decryptTotp(user.totpSecret);
  } catch {
    return res.status(500).json({ error: "Erreur lors de la vérification 2FA" });
  }

  const ok = verifySync({ token: code.trim(), secret: rawSecret, type: "totp" }).valid;
  if (!ok) return res.status(401).json({ error: "Code invalide" });

  await prisma.user.update({
    where: { id: user.id },
    data: { totpEnabled: true },
  });

  res.json({ message: "2FA activé avec succès" });
});

router.post("/2fa/disable", requireAuth, async (req, res) => {
  const { code } = req.body;
  if (!code || typeof code !== "string" || code.trim() === "") {
    return res.status(400).json({ error: "Code requis pour désactiver la 2FA" });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user.totpEnabled) {
    return res.status(400).json({ error: "2FA n'est pas activé" });
  }

  let rawSecret;
  try {
    rawSecret = decryptTotp(user.totpSecret);
  } catch {
    return res.status(500).json({ error: "Erreur lors de la vérification 2FA" });
  }

  const ok = verifySync({ token: code.trim(), secret: rawSecret, type: "totp" }).valid;
  if (!ok) return res.status(401).json({ error: "Code invalide" });

  await prisma.user.update({
    where: { id: user.id },
    data: { totpEnabled: false, totpSecret: null },
  });

  res.json({ message: "2FA désactivé" });
});

// ─── OAuth2 — initiation avec state anti-CSRF ─────────────────────────────────

router.get("/google", (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({ error: "Google OAuth non configuré" });
  }
  // Génère et stocke un state en session pour protection CSRF
  const state = crypto.randomBytes(16).toString("hex");
  req.session.oauthState = state;
  req.session.save(() => {
    passport.authenticate("google", { scope: ["profile", "email"], state, session: false })(req, res, next);
  });
});

router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/login?error=oauth`,
  })(req, res, async (err) => {
    if (err || !req.user) {
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/login?error=oauth`);
    }
    await redirectWithOAuthCode(req, res);
  });
});

router.get("/github", (req, res, next) => {
  if (!process.env.GITHUB_CLIENT_ID) {
    return res.status(503).json({ error: "GitHub OAuth non configuré" });
  }
  const state = crypto.randomBytes(16).toString("hex");
  req.session.oauthState = state;
  req.session.save(() => {
    passport.authenticate("github", { scope: ["user:email"], state, session: false })(req, res, next);
  });
});

router.get("/github/callback", (req, res, next) => {
  passport.authenticate("github", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/login?error=oauth`,
  })(req, res, async (err) => {
    if (err || !req.user) {
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/login?error=oauth`);
    }
    await redirectWithOAuthCode(req, res);
  });
});

// ─── OAuth2 — échange code → tokens ──────────────────────────────────────────
// Après OAuth, le backend génère un code court durée de vie (2 min, usage unique).
// Le frontend échange ce code contre les tokens via POST /auth/oauth/exchange.
// Les tokens ne passent JAMAIS dans l'URL.

async function redirectWithOAuthCode(req, res) {
  const code = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
  await prisma.oAuthCode.create({
    data: { code, userId: req.user.id, expiresAt },
  });
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  res.redirect(`${frontendUrl}/auth/callback?code=${code}`);
}

router.post("/oauth/exchange", async (req, res) => {
  const { code } = req.body;
  if (!code || typeof code !== "string") {
    return res.status(400).json({ error: "code requis" });
  }

  const oauthCode = await prisma.oAuthCode.findUnique({ where: { code } });
  if (!oauthCode || oauthCode.expiresAt < new Date()) {
    // Nettoyage si expiré
    if (oauthCode) await prisma.oAuthCode.delete({ where: { code } });
    return res.status(401).json({ error: "Code OAuth invalide ou expiré" });
  }

  // Usage unique — supprime immédiatement
  await prisma.oAuthCode.delete({ where: { code } });

  const user = await prisma.user.findUnique({ where: { id: oauthCode.userId } });
  if (!user) return res.status(401).json({ error: "Utilisateur introuvable" });

  const accessToken = signAccessToken(user);
  const refreshToken = await createRefreshToken(user.id);

  res.json({ token: accessToken, refreshToken, user: sanitizeUser(user) });
});

export default router;
