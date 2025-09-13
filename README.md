# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Configuration Post-Création

### Activer l'accès à Firebase Storage (CORS)

Si vous rencontrez des erreurs `Failed to fetch`, `storage/retry-limit-exceeded` ou des problèmes de CORS en essayant de téléverser ou d'afficher des documents, vous devez autoriser votre application à accéder aux fichiers stockés.

#### Instructions

1.  **Ouvrez un terminal.** Dans la plupart des éditeurs en ligne, vous pouvez le faire via le menu "Terminal" > "Nouveau Terminal".
2.  **Assurez-vous que gcloud CLI est installé** sur votre machine. Si ce n'est pas le cas, suivez les instructions [ici](https://cloud.google.com/sdk/docs/install).
3.  **Connectez-vous** à votre compte Google et configurez le bon projet en exécutant : `gcloud init`. Suivez les instructions et assurez-vous de sélectionner le projet **`ccs-compta`**.
4.  **Exécutez la commande appropriée** ci-dessous pour appliquer la configuration.

#### Pour macOS / Linux

Copiez et exécutez la commande suivante directement dans votre terminal :

```bash
gcloud storage buckets update gs://ccs-compta.appspot.com --cors-file=./cors.json
```

#### Pour Windows (Invite de commandes ou PowerShell)

Copiez et exécutez la commande suivante directement dans votre terminal :

```bash
gcloud storage buckets update gs://ccs-compta.appspot.com --update-labels=^#^cors_config='[{"origin": ["*"], "method": ["GET"], "maxAgeSeconds": 3600}]'
```

Après avoir exécuté la commande, un message de succès devrait s'afficher. Rafraîchissez votre application, l'erreur de téléversement devrait être résolue.
