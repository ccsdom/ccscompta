# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Configuration Post-Création

### Activer l'accès à Firebase Storage (CORS)

Si vous rencontrez des erreurs `Failed to fetch`, `storage/retry-limit-exceeded` ou des problèmes de CORS en essayant de téléverser ou d'afficher des documents, vous devez autoriser votre application à accéder aux fichiers stockés.

#### Instructions (Méthode recommandée via Google Cloud Shell)

Cette méthode est la plus fiable et fonctionne sur tous les systèmes d'exploitation (Windows, macOS, Linux).

1.  **Accédez à la liste des buckets de stockage** de votre projet en cliquant sur ce lien : [https://console.cloud.google.com/storage/browser?project=ccs-compta](https://console.cloud.google.com/storage/browser?project=ccs-compta)

2.  En haut à droite de la page, cliquez sur l'icône **"Activer Cloud Shell"** (`>_`). Une nouvelle fenêtre de terminal s'ouvrira en bas de votre écran. Patientez quelques instants pendant son initialisation.

    ![Activer Cloud Shell](httpshttps://raw.githubusercontent.com/firebase/studio-images/main/cors-guide/activate-cloud-shell.png)

3.  Une fois le terminal Cloud Shell prêt, copiez et collez la commande suivante, puis appuyez sur **Entrée**. Cela créera le fichier de configuration `cors.json`.

    ```bash
    echo '[{"origin": ["*"], "method": ["GET"], "maxAgeSeconds": 3600}]' > cors.json
    ```

4.  Maintenant, copiez et collez cette deuxième commande, puis appuyez sur **Entrée**. Elle appliquera la configuration à votre bucket de stockage.

    ```bash
    gcloud storage buckets update gs://ccs-compta.appspot.com --cors-file=cors.json
    ```

5.  Un message de succès devrait s'afficher. C'est terminé ! Vous pouvez fermer la fenêtre Cloud Shell. Rafraîchissez votre application, l'erreur de téléversement devrait être résolue.
