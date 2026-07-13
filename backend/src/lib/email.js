import nodemailer from "nodemailer";

// ─── Transport ────────────────────────────────────────────────────────────────
// Postfix local (auto-hébergé, voir guidelines/INFRASTRUCTURE.md) : aucune auth,
// n'accepte que les connexions depuis localhost (mynetworks = 127.0.0.0/8).

const transport = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "localhost",
  port: Number(process.env.MAIL_PORT) || 25,
  secure: false,
  tls: { rejectUnauthorized: false },
});

const MAIL_FROM = process.env.MAIL_FROM || "Comicster <postmaster@sitedetestdemassinissabencherif.com>";
const HEADING_FONT = "Impact,'Arial Narrow Bold',Haettenschweiler,sans-serif";
const BODY_FONT = "'Courier New',Courier,monospace";

// Charte Comicster : fond noir, accent rouge #e02020, typo Impact/Courier New,
// angles droits — même identité visuelle que l'app (voir layouts/default.vue).
function layout(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:${BODY_FONT};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid #2a2a2a;border-top:4px solid #e02020;">
        <tr><td style="padding:20px 24px;border-bottom:2px solid #e02020;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="width:26px;height:26px;background:#e02020;color:#fff;font-family:${HEADING_FONT};font-size:18px;text-align:center;line-height:26px;">C</td>
            <td style="padding-left:10px;color:#fff;font-family:${HEADING_FONT};font-size:20px;letter-spacing:4px;">COMICSTER</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:28px 24px;color:#e5e5e5;font-size:14px;line-height:1.6;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:16px 24px;border-top:1px solid #2a2a2a;color:#666;font-size:11px;letter-spacing:1px;">
          COMICSTER — SITEDETESTDEMASSINISSABENCHERIF.COM<br>
          CET EMAIL A ÉTÉ ENVOYÉ AUTOMATIQUEMENT, MERCI DE NE PAS Y RÉPONDRE.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function ctaButton(url, label) {
  return `<a href="${url}" style="background:#e02020;color:#fff;padding:14px 28px;text-decoration:none;font-family:${HEADING_FONT};font-size:14px;letter-spacing:2px;text-transform:uppercase;display:inline-block;">${label}</a>`;
}

// En test, on ne parle pas au vrai Postfix (absent en CI) — no-op silencieux.
const SKIP_SEND = process.env.NODE_ENV === "test";

export async function sendEmail({ to, subject, html, text }) {
  if (SKIP_SEND) return { skipped: true };

  try {
    return await transport.sendMail({ from: MAIL_FROM, to, subject, html, text });
  } catch (err) {
    // Un email qui échoue ne doit jamais faire planter la requête HTTP qui l'a déclenché.
    console.error(`[email] Échec d'envoi à ${to} :`, err.message);
    return { error: err.message };
  }
}

export function sendPasswordResetEmail(to, resetUrl) {
  const html = layout(
    "Réinitialisation de mot de passe",
    `<p style="margin:0 0 4px;color:#e02020;font-family:${HEADING_FONT};font-size:12px;letter-spacing:3px;text-transform:uppercase;">Sécurité du compte</p>
     <p style="margin:0 0 20px;font-family:${HEADING_FONT};font-size:24px;color:#fff;letter-spacing:1px;text-transform:uppercase;">Réinitialise ton mot de passe</p>
     <p>Une demande de réinitialisation de mot de passe a été effectuée pour ce compte Comicster.</p>
     <p style="text-align:center;margin:28px 0;">${ctaButton(resetUrl, "Réinitialiser mon mot de passe")}</p>
     <p style="color:#999;">Ce lien expire dans 1 heure. Si tu n'es pas à l'origine de cette demande, ignore cet email — ton mot de passe ne sera pas modifié.</p>`
  );
  const text = `Réinitialisation de mot de passe Comicster\n\nOuvre ce lien pour choisir un nouveau mot de passe (valable 1h) :\n${resetUrl}\n\nSi tu n'es pas à l'origine de cette demande, ignore cet email.`;
  return sendEmail({ to, subject: "Réinitialisation de ton mot de passe Comicster", html, text });
}

export function sendPasswordChangedEmail(to) {
  const html = layout(
    "Mot de passe modifié",
    `<p style="margin:0 0 4px;color:#e02020;font-family:${HEADING_FONT};font-size:12px;letter-spacing:3px;text-transform:uppercase;">Sécurité du compte</p>
     <p style="margin:0 0 20px;font-family:${HEADING_FONT};font-size:24px;color:#fff;letter-spacing:1px;text-transform:uppercase;">Mot de passe modifié</p>
     <p>Le mot de passe de ton compte Comicster vient d'être modifié.</p>
     <p style="color:#999;">Si tu n'es pas à l'origine de ce changement, contacte-nous immédiatement.</p>`
  );
  const text = "Le mot de passe de ton compte Comicster vient d'être modifié. Si ce n'est pas toi, contacte-nous immédiatement.";
  return sendEmail({ to, subject: "Ton mot de passe Comicster a été modifié", html, text });
}

export function sendOAuthAccountNotice(to) {
  const html = layout(
    "Réinitialisation de mot de passe",
    `<p style="margin:0 0 4px;color:#e02020;font-family:${HEADING_FONT};font-size:12px;letter-spacing:3px;text-transform:uppercase;">Sécurité du compte</p>
     <p style="margin:0 0 20px;font-family:${HEADING_FONT};font-size:24px;color:#fff;letter-spacing:1px;text-transform:uppercase;">Compte lié à Google/GitHub</p>
     <p>Une réinitialisation de mot de passe a été demandée pour ce compte Comicster, mais ce compte est connecté via Google ou GitHub — il n'a pas de mot de passe à réinitialiser.</p>
     <p style="color:#999;">Connecte-toi directement via le bouton "Google" ou "GitHub" sur la page de connexion.</p>`
  );
  const text = "Ce compte Comicster est lié à Google ou GitHub — il n'a pas de mot de passe à réinitialiser. Connecte-toi via le bouton Google/GitHub sur la page de connexion.";
  return sendEmail({ to, subject: "À propos de ta demande de réinitialisation Comicster", html, text });
}

// Email de confirmation d'inscription. Purement informatif : pas de lien de
// vérification, aucun blocage au login tant que le double opt-in n'est pas demandé.
export function sendRegistrationConfirmationEmail(to, username) {
  const feedUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/feed`;
  const html = layout(
    "Inscription confirmée",
    `<p style="margin:0 0 4px;color:#e02020;font-family:${HEADING_FONT};font-size:12px;letter-spacing:3px;text-transform:uppercase;">Inscription confirmée</p>
     <p style="margin:0 0 20px;font-family:${HEADING_FONT};font-size:26px;color:#fff;letter-spacing:1px;text-transform:uppercase;">Bienvenue, ${username}.</p>

     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;border:1px dashed #3a3a3a;margin:0 0 24px;">
       <tr><td style="padding:16px 18px;">
         <p style="margin:0 0 6px;color:#666;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Carte de membre</p>
         <p style="margin:0;color:#fff;font-size:15px;">${username} <span style="color:#e02020;">// CONFIRMÉ</span></p>
         <p style="margin:4px 0 0;color:#888;font-size:12px;">${to}</p>
       </td></tr>
     </table>

     <p>Ton compte Comicster a bien été créé. Direction ta bibliothèque pour cataloguer tes lectures, noter tes comics et suivre d'autres lecteurs.</p>

     <p style="text-align:center;margin:28px 0;">${ctaButton(feedUrl, "Découvrir mon feed")}</p>

     <p style="color:#999;">Si tu n'es pas à l'origine de cette inscription, ignore cet email.</p>`
  );
  const text = `Bienvenue ${username} ! Ton compte Comicster a bien été créé et confirmé. Direction ${feedUrl} pour commencer.`;
  return sendEmail({ to, subject: "Ton inscription Comicster est confirmée", html, text });
}
