import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function signAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
  );
}

async function createRefreshToken(userId) {
  const token = crypto.randomBytes(64).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  await prisma.refreshToken.create({ data: { token, userId, expiresAt } });
  return token;
}

function sanitizeUser(user) {
  return { id: user.id, email: user.email, username: user.username, role: user.role };
}

// ─── Passport OAuth setup ────────────────────────────────────────────────────

async function findOrCreateOAuthUser(provider, profile) {
  const email = profile.emails?.[0]?.value;
  const username =
    profile.username ||
    profile.displayName?.replace(/\s+/g, "_").toLowerCase() ||
    `${provider}_${profile.id}`;

  // Try to find by oauthId
  let user = await prisma.user.findFirst({
    where: { oauthProvider: provider, oauthId: profile.id },
  });
  if (user) return user;

  // Try to find by email (link existing account)
  if (email) {
    user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      return prisma.user.update({
        where: { id: user.id },
        data: { oauthProvider: provider, oauthId: profile.id },
      });
    }
  }

  // Create new user — ensure unique username
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
      },
      async (_accessToken, _refreshToken, profile, done) => {
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
      },
      async (_accessToken, _refreshToken, profile, done) => {
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
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ error: "email, username et password sont requis" });
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    return res.status(409).json({ error: "Email ou username déjà utilisé" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, username, passwordHash },
  });

  const accessToken = signAccessToken(user);
  const refreshToken = await createRefreshToken(user.id);
  res.status(201).json({ token: accessToken, refreshToken, user: sanitizeUser(user) });
});

// ─── Login ────────────────────────────────────────────────────────────────────

router.post("/login", async (req, res) => {
  const { email, password, totpCode } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email et password sont requis" });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: "Identifiants invalides" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Identifiants invalides" });
  }

  // 2FA check
  if (user.totpEnabled) {
    if (!totpCode) {
      return res.status(200).json({ requires2FA: true });
    }
    const ok = authenticator.verify({ token: totpCode, secret: user.totpSecret });
    if (!ok) {
      return res.status(401).json({ error: "Code 2FA invalide" });
    }
  }

  const accessToken = signAccessToken(user);
  const refreshToken = await createRefreshToken(user.id);
  res.json({ token: accessToken, refreshToken, user: sanitizeUser(user) });
});

// ─── Refresh token ────────────────────────────────────────────────────────────

router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: "refreshToken requis" });

  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!stored || stored.expiresAt < new Date()) {
    return res.status(401).json({ error: "Refresh token invalide ou expiré" });
  }

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user) return res.status(401).json({ error: "Utilisateur introuvable" });

  // Rotate: delete old, create new
  await prisma.refreshToken.delete({ where: { token: refreshToken } });
  const newRefreshToken = await createRefreshToken(user.id);
  const accessToken = signAccessToken(user);

  res.json({ token: accessToken, refreshToken: newRefreshToken });
});

// ─── Logout ───────────────────────────────────────────────────────────────────

router.post("/logout", async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }
  res.json({ message: "Déconnecté" });
});

// ─── 2FA ──────────────────────────────────────────────────────────────────────

// POST /auth/2fa/enable — generate secret + QR code
router.post("/2fa/enable", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (user.totpEnabled) {
    return res.status(400).json({ error: "2FA déjà activé" });
  }

  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(user.email, "Comicster", secret);
  const qrDataUrl = await QRCode.toDataURL(otpauth);

  // Store secret temporarily (not yet enabled)
  await prisma.user.update({
    where: { id: user.id },
    data: { totpSecret: secret },
  });

  res.json({ secret, qrCode: qrDataUrl });
});

// POST /auth/2fa/verify — confirm OTP, finalize activation
router.post("/2fa/verify", requireAuth, async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "Code requis" });

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user.totpSecret) {
    return res.status(400).json({ error: "Lance d'abord /auth/2fa/enable" });
  }

  const ok = authenticator.verify({ token: code, secret: user.totpSecret });
  if (!ok) return res.status(401).json({ error: "Code invalide" });

  await prisma.user.update({
    where: { id: user.id },
    data: { totpEnabled: true },
  });

  res.json({ message: "2FA activé avec succès" });
});

// POST /auth/2fa/disable
router.post("/2fa/disable", requireAuth, async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "Code requis pour désactiver la 2FA" });

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user.totpEnabled) {
    return res.status(400).json({ error: "2FA n'est pas activé" });
  }

  const ok = authenticator.verify({ token: code, secret: user.totpSecret });
  if (!ok) return res.status(401).json({ error: "Code invalide" });

  await prisma.user.update({
    where: { id: user.id },
    data: { totpEnabled: false, totpSecret: null },
  });

  res.json({ message: "2FA désactivé" });
});

// ─── OAuth2 — Google ──────────────────────────────────────────────────────────

router.get(
  "/google",
  (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({ error: "Google OAuth non configuré" });
    }
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/login?error=oauth` }),
  async (req, res) => {
    const user = req.user;
    const accessToken = signAccessToken(user);
    const refreshToken = await createRefreshToken(user.id);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}&refreshToken=${refreshToken}`);
  }
);

// ─── OAuth2 — GitHub ──────────────────────────────────────────────────────────

router.get(
  "/github",
  (req, res, next) => {
    if (!process.env.GITHUB_CLIENT_ID) {
      return res.status(503).json({ error: "GitHub OAuth non configuré" });
    }
    next();
  },
  passport.authenticate("github", { scope: ["user:email"], session: false })
);

router.get(
  "/github/callback",
  passport.authenticate("github", { session: false, failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/login?error=oauth` }),
  async (req, res) => {
    const user = req.user;
    const accessToken = signAccessToken(user);
    const refreshToken = await createRefreshToken(user.id);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}&refreshToken=${refreshToken}`);
  }
);

export default router;
