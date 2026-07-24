import prisma from "./prisma.js";

export const REPORT_TARGET_TYPES = ["REVIEW", "COMMENT", "GUIDE_TOPIC", "GUIDE_REPLY"];
export const REPORT_REASONS = ["SPAM", "HATE", "NSFW", "HARCELEMENT", "AUTRE"];

const SNAPSHOT_MAX_LENGTH = 300;

function truncate(text, max = SNAPSHOT_MAX_LENGTH) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

// Résout un (targetType, targetId) vers { authorId, authorUsername, snapshot }.
// Retourne null si le contenu n'existe pas (déjà supprimé, ou id invalide).
export async function resolveReportTarget(targetType, targetId) {
  if (targetType === "REVIEW") {
    const review = await prisma.review.findUnique({
      where: { id: targetId },
      include: { user: { select: { id: true, username: true } }, comic: { select: { title: true } } },
    });
    if (!review) return null;
    const body = review.content ? ` — "${review.content}"` : "";
    return {
      authorId: review.user.id,
      authorUsername: review.user.username,
      snapshot: truncate(`Avis ${review.rating}/5 sur "${review.comic.title}"${body}`),
    };
  }

  if (targetType === "COMMENT") {
    const comment = await prisma.comment.findUnique({
      where: { id: targetId },
      include: { user: { select: { id: true, username: true } } },
    });
    if (!comment) return null;
    return {
      authorId: comment.user.id,
      authorUsername: comment.user.username,
      snapshot: truncate(comment.content),
    };
  }

  if (targetType === "GUIDE_TOPIC") {
    const topic = await prisma.guideTopic.findUnique({
      where: { id: targetId },
      include: { author: { select: { id: true, username: true } } },
    });
    if (!topic) return null;
    return {
      authorId: topic.author.id,
      authorUsername: topic.author.username,
      snapshot: truncate(`${topic.title} — ${topic.content}`),
    };
  }

  if (targetType === "GUIDE_REPLY") {
    const reply = await prisma.guideReply.findUnique({
      where: { id: targetId },
      include: { author: { select: { id: true, username: true } } },
    });
    if (!reply) return null;
    return {
      authorId: reply.author.id,
      authorUsername: reply.author.username,
      snapshot: truncate(reply.content),
    };
  }

  return null;
}

// Supprime le contenu signalé (hard delete). Tolérant si déjà supprimé
// entre-temps (ex : l'auteur l'a retiré lui-même avant que l'admin traite
// le signalement) — deleteMany ne lève pas d'erreur si la ligne n'existe plus.
export async function deleteReportedContent(targetType, targetId) {
  if (targetType === "REVIEW") return prisma.review.deleteMany({ where: { id: targetId } });
  if (targetType === "COMMENT") return prisma.comment.deleteMany({ where: { id: targetId } });
  if (targetType === "GUIDE_TOPIC") return prisma.guideTopic.deleteMany({ where: { id: targetId } });
  if (targetType === "GUIDE_REPLY") return prisma.guideReply.deleteMany({ where: { id: targetId } });
}
