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

function layout(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border:2px solid #111;">
        <tr><td style="background:#111;color:#fff;padding:16px 24px;font-size:20px;font-weight:bold;letter-spacing:0.5px;">
          COMICSTER
        </td></tr>
        <tr><td style="padding:24px;color:#111;font-size:15px;line-height:1.5;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:16px 24px;border-top:1px solid #ddd;color:#888;font-size:12px;">
          Comicster — sitedetestdemassinissabencherif.com<br>
          Cet email a été envoyé automatiquement, merci de ne pas y répondre.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
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
    `<p>Bonjour,</p>
     <p>Une demande de réinitialisation de mot de passe a été effectuée pour ce compte Comicster.</p>
     <p style="text-align:center;margin:28px 0;">
       <a href="${resetUrl}" style="background:#111;color:#fff;padding:12px 24px;text-decoration:none;font-weight:bold;display:inline-block;">
         Réinitialiser mon mot de passe
       </a>
     </p>
     <p>Ce lien expire dans 1 heure. Si tu n'es pas à l'origine de cette demande, ignore cet email — ton mot de passe ne sera pas modifié.</p>`
  );
  const text = `Réinitialisation de mot de passe Comicster\n\nOuvre ce lien pour choisir un nouveau mot de passe (valable 1h) :\n${resetUrl}\n\nSi tu n'es pas à l'origine de cette demande, ignore cet email.`;
  return sendEmail({ to, subject: "Réinitialisation de ton mot de passe Comicster", html, text });
}

export function sendPasswordChangedEmail(to) {
  const html = layout(
    "Mot de passe modifié",
    `<p>Bonjour,</p>
     <p>Le mot de passe de ton compte Comicster vient d'être modifié.</p>
     <p>Si tu n'es pas à l'origine de ce changement, contacte-nous immédiatement.</p>`
  );
  const text = "Le mot de passe de ton compte Comicster vient d'être modifié. Si ce n'est pas toi, contacte-nous immédiatement.";
  return sendEmail({ to, subject: "Ton mot de passe Comicster a été modifié", html, text });
}

export function sendOAuthAccountNotice(to) {
  const html = layout(
    "Réinitialisation de mot de passe",
    `<p>Bonjour,</p>
     <p>Une réinitialisation de mot de passe a été demandée pour ce compte Comicster, mais ce compte est connecté via Google ou GitHub — il n'a pas de mot de passe à réinitialiser.</p>
     <p>Connecte-toi directement via le bouton "Google" ou "GitHub" sur la page de connexion.</p>`
  );
  const text = "Ce compte Comicster est lié à Google ou GitHub — il n'a pas de mot de passe à réinitialiser. Connecte-toi via le bouton Google/GitHub sur la page de connexion.";
  return sendEmail({ to, subject: "À propos de ta demande de réinitialisation Comicster", html, text });
}

export function sendWelcomeEmail(to, username) {
  const html = layout(
    "Bienvenue sur Comicster",
    `<p>Bienvenue ${username} !</p>
     <p>Ton compte Comicster a bien été créé. Tu peux dès maintenant suivre tes lectures, noter tes comics préférés et construire tes listes.</p>
     <p>Bonne lecture !</p>`
  );
  const text = `Bienvenue ${username} ! Ton compte Comicster a bien été créé.`;
  return sendEmail({ to, subject: "Bienvenue sur Comicster", html, text });
}
