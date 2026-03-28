import { requireAuth } from "./auth.js";

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Accès réservé aux administrateurs" });
    }
    next();
  });
}
