/**
 * URL de base de l'API, adaptée au côté d'où part la requête.
 *
 * Le navigateur et le serveur de rendu ne voient pas forcément l'API à la même
 * adresse. En local, le navigateur l'atteint sur `http://localhost:3001` (port
 * publié par Docker) alors que le conteneur frontend doit passer par le nom de
 * service, `http://backend:3001` — sur `localhost`, il ne trouve que lui-même.
 *
 * Sans cette distinction, tous les `useFetch` exécutés au rendu serveur échouaient
 * en local : Nuxt sérialisait le résultat vide vers le client sans rejouer la
 * requête, et les pages concernées (fiche comic, lecteur, guides, feed, tableau de
 * bord, arcade) s'affichaient vides malgré une API qui répondait correctement.
 *
 * `apiBaseServer` n'est renseignée qu'en local ; ailleurs on retombe sur l'URL
 * publique, joignable des deux côtés.
 */
export function useApiBase() {
  const config = useRuntimeConfig()
  if (import.meta.server && config.apiBaseServer) return config.apiBaseServer
  return config.public.apiBase
}
