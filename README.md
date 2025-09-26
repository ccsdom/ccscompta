
# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Configuration Post-Création

### Étape 1 : Activer Firebase Storage (Action Requise)

Si vous n'avez jamais utilisé Firebase Storage sur ce projet, vous devez l'activer. C'est une étape indispensable qui crée votre "bucket" de stockage.

1.  **Accédez à la console Firebase** de votre projet : [https://console.firebase.google.com/project/ccs-compta/storage](https://console.firebase.google.com/project/ccs-compta/storage)
2.  Si le service n'est pas activé, vous verrez un écran d'accueil pour Storage. Cliquez sur le bouton **"Commencer"** (ou "Get Started").
3.  Suivez les instructions à l'écran. Vous pouvez généralement conserver les options par défaut (mode production, emplacement du bucket).
4.  Une fois l'opération terminée, votre bucket de stockage est prêt. Son nom sera `ccs-compta.appspot.com`.

### Étape 2 : Activer l'accès aux fichiers (CORS)

Après avoir activé Storage, vous devez autoriser votre application à y accéder en configurant les règles CORS.

#### Instructions (Méthode recommandée via Google Cloud Shell)

Cette méthode est la plus fiable et fonctionne sur tous les systèmes d'exploitation (Windows, macOS, Linux).

1.  **Accédez à la liste des buckets de stockage** de votre projet en cliquant sur ce lien : [https://console.cloud.google.com/storage/browser?project=ccs-compta](https://console.cloud.google.com/storage/browser?project=ccs-compta)

2.  En haut à droite de la page, cliquez sur l'icône **"Activer Cloud Shell"** (`>_`). Une nouvelle fenêtre de terminal s'ouvrira en bas de votre écran. Patientez quelques instants pendant son initialisation.

    ![Activer Cloud Shell](https://raw.githubusercontent.com/firebase/studio-images/main/cors-guide/activate-cloud-shell.png)

3.  Une fois le terminal Cloud Shell prêt, copiez et collez la commande suivante, puis appuyez sur **Entrée**. Cela créera le fichier de configuration `cors.json`.

    ```bash
    echo '[{"origin": ["*"], "method": ["GET"], "maxAgeSeconds": 3600}]' > cors.json
    ```

4.  Maintenant, copiez et collez cette deuxième commande, puis appuyez sur **Entrée**. Elle appliquera la configuration à votre bucket de stockage.

    ```bash
    gcloud storage buckets update gs://ccs-compta.appspot.com --cors-file=cors.json
    ```

5.  Un message de succès devrait s'afficher. C'est terminé ! Vous pouvez fermer la fenêtre Cloud Shell. Rafraîchissez votre application, l'erreur de téléversement devrait être résolue.
