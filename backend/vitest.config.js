import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 15000,
    hookTimeout: 15000,
    sequence: { concurrent: false },
    // `sequence.concurrent` ne règle que les tests DANS un fichier. Sans ça, Vitest
    // exécute quand même les fichiers de test en parallèle les uns des autres — or
    // ils partagent tous la même base Postgres de test. Constaté sur
    // arcade-comicdle.test.js : le tirage du défi du jour pioche dans toute la
    // table Comic, et un autre fichier qui insère des comics en parallèle peut
    // faire sortir la cible du pool attendu (flaky, symptômes différents à chaque run).
    fileParallelism: false,
  },
})
