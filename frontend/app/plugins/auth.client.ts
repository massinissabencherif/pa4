export default defineNuxtPlugin(async () => {
  const { fetchMe, token, refreshToken } = useAuth()

  // Le cookie auth_token ne vit que 15 minutes. En revenant sur le site après
  // une absence, il a disparu alors que refresh_token est encore valide 30 jours.
  // Sans cette reprise, le middleware de route ne voyait plus de jeton et
  // renvoyait vers la page de connexion — l'utilisateur était déconnecté au bout
  // de 15 minutes au lieu d'un mois.
  //
  // Le plugin s'exécute avant le middleware de la première navigation : quand la
  // reprise réussit, elle réécrit le cookie et le middleware laisse passer.
  if (!token.value && refreshToken.value) {
    await fetchMe()
    return
  }

  if (token.value) {
    await fetchMe()
  }
})
