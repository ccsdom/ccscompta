# Firebase Studio

This is a NextJS starter in Firebase Studio.

## Configuration Post-Création

### Étape 1 : Activer Firebase Storage (Action Requise)

Si vous n'avez jamais utilisé Firebase Storage sur ce projet, vous devez l'activer. C'est une étape indispensable qui crée votre "bucket" de stockage.

1.  **Accédez à la console Firebase** de votre projet : [https://console.firebase.google.com/project/ccs-compta/storage](https://console.firebase.google.com/project/ccs-compta/storage)
2.  Si le service n'est pas activé, vous verrez un écran d'accueil pour Storage. Cliquez sur le bouton **"Commencer"** (ou "Get Started").
3.  Suivez les instructions à l'écran. Vous pouvez généralement conserver les options par défaut (mode production, emplacement du bucket).
4.  Une fois l'opération terminée, votre bucket de stockage est prêt.

### Étape 2 : Activer le téléversement de fichiers (CORS)

Après avoir activé Storage, vous devez autoriser votre application à y téléverser des fichiers en configurant les règles CORS.

#### Instructions (Méthode recommandée via Google Cloud Shell)

Cette méthode est la plus fiable et fonctionne sur tous les systèmes d'exploitation (Windows, macOS, Linux).

1.  **Accédez à la liste des buckets de stockage** de votre projet en cliquant sur ce lien : [https://console.cloud.google.com/storage/browser?project=ccs-compta](https://console.cloud.google.com/storage/browser?project=ccs-compta)

2.  En haut à droite de la page, cliquez sur l'icône **"Activer Cloud Shell"** (`>_`). Une nouvelle fenêtre de terminal s'ouvrira en bas de votre écran. Patientez quelques instants pendant son initialisation.

    ![Activer Cloud Shell](https://raw.githubusercontent.com/firebase/studio-images/main/cors-guide/activate-cloud-shell.png)

3.  Une fois le terminal Cloud Shell prêt, copiez et collez la commande suivante pour vous assurer d'être dans le bon projet, puis appuyez sur **Entrée** :
    ```bash
    gcloud config set project ccs-compta
    ```

4.  Créez le fichier de configuration `cors.json` en copiant-collant la commande suivante, puis appuyez sur **Entrée** :

    ```bash
    echo '[{"origin": ["*"], "method": ["GET", "POST", "PUT"], "responseHeader": ["Content-Type", "x-goog-resumable"], "maxAgeSeconds": 3600}]' > cors.json
    ```

5.  Maintenant, appliquez la configuration à votre bucket. **ATTENTION :** trouvez l'adresse exacte de votre bucket dans la console Firebase (Storage -> onglet Fichiers, elle commence par `gs://`) et remplacez `gs://VOTRE-BUCKET-ICI.appspot.com` dans la commande ci-dessous. Le nom du bucket pour ce projet est `ccs-compta.firebasestorage.app`.
    
    ```bash
    # Exemple : gcloud storage buckets update gs://mon-projet-a-moi.appspot.com --cors-file=cors.json
    gcloud storage buckets update gs://ccs-compta.firebasestorage.app --cors-file=cors.json
    ```

6.  Un message de succès devrait s'afficher. C'est terminé ! Vous pouvez fermer la fenêtre Cloud Shell. Les modifications peuvent prendre quelques minutes à se propager.

### Étape 3 : Sécuriser l'application (Action Requise)

Après avoir configuré l'application, vous devez sécuriser l'accès aux données.

#### 1. Appliquer les règles de sécurité Firestore

1.  Dans l'application, naviguez vers **Paramètres > Sécurité des Données**.
2.  Cliquez sur le bouton **"Générer les règles Firestore"**.
3.  Copiez les règles qui s'affichent.
4.  Allez dans votre **Console Firebase > Firestore Database > Règles**.
5.  Collez les nouvelles règles et cliquez sur **Publier**.

#### 2. Définir votre compte comme Administrateur (Action Unique)

Pour que les nouvelles règles de sécurité vous reconnaissent comme administrateur, vous devez vous attribuer ce rôle manuellement. **C'est une action unique à faire pour votre propre compte utilisateur.**

1. Connectez-vous à l'application avec le compte que vous souhaitez définir comme administrateur (ex: `admin@ccs.com`).

2. Naviguez vers **Paramètres > Administration**.

3. Dans la section "Administration", cliquez sur le bouton **"Me donner le rôle Admin"**.
    - Un message de succès devrait apparaître, vous invitant à vous déconnecter.

4. **Déconnectez-vous** de l'application, puis **reconnectez-vous**.

5. C'est terminé ! Votre compte a maintenant les pleins pouvoirs d'administrateur. Les autres utilisateurs (comptables, secrétaires, clients) n'auront que les permissions de leur rôle respectif.
