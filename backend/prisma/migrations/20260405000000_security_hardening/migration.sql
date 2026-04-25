-- Security hardening migration
-- 1. Renomme RefreshToken.token → tokenHash (les tokens sont désormais stockés hashés)
-- 2. Crée le modèle OAuthCode pour le flux OAuth one-time code

-- Rename column (conserve les données existantes — elles seront invalides mais ne bloquent pas le démarrage)
ALTER TABLE "RefreshToken" RENAME COLUMN "token" TO "tokenHash";

-- Supprime les refresh tokens existants (en clair, donc inutilisables avec la nouvelle logique)
DELETE FROM "RefreshToken";

-- Table OAuthCode
CREATE TABLE "OAuthCode" (
    "id"        TEXT        NOT NULL,
    "code"      TEXT        NOT NULL,
    "userId"    TEXT        NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OAuthCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OAuthCode_code_key" ON "OAuthCode"("code");
