#!/bin/bash

# Script pour appliquer les règles CORS à votre bucket Firebase Storage.

# 1. Assurez-vous d'avoir gcloud CLI installé.
#    https://cloud.google.com/sdk/docs/install

# 2. Connectez-vous à votre compte Google Cloud.
#    gcloud auth login

# 3. Récupérez l'ID de votre projet Firebase. Vous pouvez le trouver
#    dans les paramètres de votre projet sur la console Firebase.
#    Remplacez "VOTRE_ID_PROJET" ci-dessous par votre ID de projet.

PROJECT_ID="ccs-compta" # L'ID de projet utilisé par l'application
BUCKET="gs://${PROJECT_ID}.appspot.com"

echo "Application des règles CORS au bucket : ${BUCKET}"
echo "Assurez-vous que votre CLI gcloud est configurée pour utiliser le projet '${PROJECT_ID}'."

# Crée le fichier de configuration CORS temporaire
cat <<EOF > cors-config.json
[
  {
    "origin": ["*"],
    "method": ["GET"],
    "maxAgeSeconds": 3600
  }
]
EOF

# Applique la configuration CORS depuis le fichier
gcloud storage buckets update ${BUCKET} --cors-file=./cors-config.json

# Supprime le fichier temporaire
rm cors-config.json

echo "Configuration CORS appliquée avec succès."
echo "Veuillez rafraîchir votre application. L'erreur de fetch devrait être résolue."
