<template>
  <div class="max-w-3xl mx-auto px-4 py-16 space-y-10">
    <div>
      <h1 class="text-3xl font-bold mb-2">Politique de confidentialité</h1>
      <p class="text-gray-500 text-sm">Dernière mise à jour : janvier 2026</p>
    </div>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold">1. Responsable du traitement</h2>
      <p class="text-gray-400 text-sm leading-relaxed">
        Comicster est un projet développé dans le cadre du Projet Annuel ESGI (Ingénierie du Web, promotion 2026).
        Le responsable du traitement est l'équipe projet Comicster — ESGI Paris.
      </p>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold">2. Données collectées</h2>
      <p class="text-gray-400 text-sm leading-relaxed">Nous collectons les données suivantes :</p>
      <ul class="list-disc list-inside text-sm text-gray-400 space-y-1 ml-2">
        <li><strong class="text-gray-300">Compte</strong> : adresse e-mail, nom d'utilisateur, mot de passe (hashé avec bcrypt)</li>
        <li><strong class="text-gray-300">Activité</strong> : comics ajoutés au journal, notes et avis, listes personnalisées</li>
        <li><strong class="text-gray-300">Social</strong> : abonnements, abonnés, commentaires</li>
        <li><strong class="text-gray-300">Technique</strong> : logs de connexion, tokens JWT (session)</li>
      </ul>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold">3. Finalités du traitement</h2>
      <ul class="list-disc list-inside text-sm text-gray-400 space-y-1 ml-2">
        <li>Fournir les fonctionnalités de l'application (journal, listes, avis)</li>
        <li>Authentification et sécurité du compte</li>
        <li>Amélioration du service et statistiques anonymes</li>
      </ul>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold">4. Base légale</h2>
      <p class="text-gray-400 text-sm leading-relaxed">
        Le traitement est fondé sur le contrat (exécution du service) pour les données de compte et d'activité,
        et sur le consentement pour les cookies analytiques.
      </p>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold">5. Conservation des données</h2>
      <p class="text-gray-400 text-sm leading-relaxed">
        Les données sont conservées tant que le compte est actif. En cas de suppression du compte, les données
        sont effacées dans un délai de 30 jours.
      </p>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold">6. Vos droits (RGPD)</h2>
      <p class="text-gray-400 text-sm leading-relaxed">Conformément au RGPD, vous disposez des droits suivants :</p>
      <ul class="list-disc list-inside text-sm text-gray-400 space-y-1 ml-2">
        <li><strong class="text-gray-300">Accès</strong> : obtenir une copie de vos données</li>
        <li><strong class="text-gray-300">Rectification</strong> : corriger des données inexactes</li>
        <li><strong class="text-gray-300">Effacement</strong> : demander la suppression de votre compte</li>
        <li><strong class="text-gray-300">Portabilité</strong> : recevoir vos données dans un format structuré</li>
        <li><strong class="text-gray-300">Opposition</strong> : s'opposer à certains traitements</li>
      </ul>
      <p class="text-gray-500 text-sm">Pour exercer vos droits, contactez-nous via les paramètres du compte ou par e-mail.</p>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold">7. Cookies</h2>
      <p class="text-gray-400 text-sm leading-relaxed">
        Comicster utilise des cookies strictement nécessaires au fonctionnement du service (token d'authentification)
        et, avec votre consentement, des cookies analytiques anonymes via Umami pour mesurer l'audience.
      </p>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold">8. Hébergement & sécurité</h2>
      <p class="text-gray-400 text-sm leading-relaxed">
        L'application est hébergée sur un VPS situé dans l'Union Européenne. Les communications sont chiffrées
        via HTTPS (TLS). Les mots de passe sont systématiquement hachés (bcrypt, 12 rounds).
      </p>
    </section>
  </div>
</template>
