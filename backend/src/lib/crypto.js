import crypto from "crypto";

// ─── Refresh token hashing ────────────────────────────────────────────────────
// Les refresh tokens sont stockés hashés (SHA-256) en base.
// On compare toujours le hash, jamais le token brut.

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ─── TOTP secret encryption (AES-256-GCM) ────────────────────────────────────
// TOTP_ENCRYPTION_KEY doit être une chaîne hex de 64 caractères (32 octets).
// Générer avec : node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

function getTotpKey() {
  const key = process.env.TOTP_ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error(
      "TOTP_ENCRYPTION_KEY manquante ou invalide. Doit être une chaîne hex de 64 caractères."
    );
  }
  return Buffer.from(key, "hex");
}

export function encryptTotp(secret) {
  const key = getTotpKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${encrypted.toString("hex")}:${tag.toString("hex")}`;
}

export function decryptTotp(stored) {
  // Compatibilité migration : si le secret ne contient pas de ':', c'est un plaintext legacy.
  if (!stored || !stored.includes(":")) {
    return stored; // retourne tel quel — sera re-chiffré au prochain write
  }
  const key = getTotpKey();
  const parts = stored.split(":");
  if (parts.length !== 3) throw new Error("Format de secret TOTP invalide");
  const [ivHex, encHex, tagHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const enc = Buffer.from(encHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}
