
# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Configuration Post-Création

### Activer l'accès à Firebase Storage (CORS)

Si vous rencontrez des erreurs `Failed to fetch` ou des problèmes de CORS en essayant d'afficher des documents, vous devez autoriser votre application à accéder aux fichiers stockés.

1.  **Ouvrez un terminal** à la racine de ce projet.
2.  **Assurez-vous que gcloud CLI est installé** sur votre machine. Si ce n'est pas le cas, suivez les instructions [ici](https://cloud.google.com/sdk/docs/install).
3.  **Connectez-vous** à votre compte Google en exécutant : `gcloud auth login`.
4.  **Rendez le script exécutable** en exécutant : `chmod +x apply-cors.sh`.
5.  **Exécutez le script** : `./apply-cors.sh`.

Ce script configurera automatiquement votre bucket Firebase Storage pour autoriser les requêtes de votre application web.
