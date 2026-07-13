// Streak de lecture — jours consécutifs avec au moins une activité de lecture.
// Convention : les jours sont comparés en UTC (YYYY-MM-DD) pour éviter toute
// ambiguïté de fuseau entre le serveur et les clients.

export function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

// Met à jour le streak après une activité de lecture. Idempotent sur la journée :
// une seule incrémentation par jour UTC, quelles que soient les sessions.
export async function updateStreak(userId, prisma) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentStreak: true, longestStreak: true, lastActiveDate: true },
  });
  if (!user) return null;

  const now = new Date();
  const today = dayKey(now);
  const last = user.lastActiveDate ? dayKey(user.lastActiveDate) : null;

  if (last === today) return user; // déjà compté aujourd'hui

  const yesterday = dayKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const currentStreak = last === yesterday ? user.currentStreak + 1 : 1;
  const longestStreak = Math.max(currentStreak, user.longestStreak);

  return prisma.user.update({
    where: { id: userId },
    data: { currentStreak, longestStreak, lastActiveDate: now },
  });
}

// Streak "effectif" pour l'affichage : si la dernière activité date d'avant-hier
// ou plus, le streak est cassé même si la base n'a pas encore été mise à jour.
export function effectiveStreak(user) {
  if (!user?.lastActiveDate) return 0;
  const now = new Date();
  const last = dayKey(new Date(user.lastActiveDate));
  const today = dayKey(now);
  const yesterday = dayKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  return last === today || last === yesterday ? user.currentStreak : 0;
}
