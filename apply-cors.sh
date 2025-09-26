
#!/bin/bash

# Script pour guider l'application des règles CORS à votre bucket Firebase Storage.
# L'exécution directe de ce script n'est plus la méthode recommandée.
# Veuillez suivre les instructions dans le fichier README.md pour la configuration manuelle via Google Cloud Shell.

echo "=========================================================================="
echo "ATTENTION : Avant d'exécuter ce script, assurez-vous d'avoir activé"
echo "Firebase Storage dans votre console Firebase."
echo "Allez sur : https://console.firebase.google.com/project/ccs-compta/storage"
echo "et cliquez sur 'Commencer' si ce n'est pas déjà fait."
echo "=========================================================================="
echo ""
echo "Ce script est déprécié. Veuillez suivre les instructions dans README.md"
echo "pour appliquer manuellement la configuration CORS via Google Cloud Shell."
echo "=========================================================================="
echo ""
echo "En résumé :"
echo "1. Allez sur https://console.cloud.google.com/storage/browser?project=ccs-compta"
echo "2. Activez le Cloud Shell (icône '>_' en haut à droite)."
echo "3. Assurez-vous d'être dans le bon projet avec : gcloud config set project ccs-compta"
echo "4. Créez le fichier de config : echo '[{\"origin\": [\"*\"], \"method\": [\"GET\"], \"maxAgeSeconds\": 3600}]' > cors.json"
echo "5. Appliquez les règles (adaptez le nom du bucket si besoin) : gcloud storage buckets update gs://ccs-compta.appspot.com --cors-file=cors.json"
echo "6. Rafraîchissez votre application."
echo ""
