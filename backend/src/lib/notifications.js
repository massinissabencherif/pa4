// Création de notifications — best-effort, ne doit jamais faire échouer l'action principale
// (même philosophie que sendRegistrationConfirmationEmail dans auth.js)
export async function notify(prisma, { userId, type, actorId = null, entityId = null }) {
  if (actorId && actorId === userId) return // pas d'auto-notification

  try {
    await prisma.notification.create({ data: { userId, type, actorId, entityId } })
  } catch (err) {
    console.error("Erreur création notification:", err)
  }
}
