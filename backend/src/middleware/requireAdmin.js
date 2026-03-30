import { requireAuth } from "./auth.js";
import prisma from "../lib/prisma.js";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

async function require2FA(req, res, next) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { totpEnabled: true },
  });
  if (!user?.totpEnabled) {
    return res.status(403).json({
      error: "La 2FA est obligatoire pour accéder aux fonctions administrateur",
      requires2FASetup: true,
    });
  }
  next();
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (!ADMIN_ROLES.includes(req.user.role)) {
      return res.status(403).json({ error: "Accès réservé aux administrateurs" });
    }
    require2FA(req, res, next);
  });
}

export function requireSuperAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Accès réservé au super administrateur" });
    }
    require2FA(req, res, next);
  });
}
