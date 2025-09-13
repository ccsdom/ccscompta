#!/bin/bash

# Script pour guider l'application des règles CORS à votre bucket Firebase Storage.
# L'exécution directe de ce script n'est plus la méthode recommandée.
# Veuillez suivre les instructions dans le fichier README.md pour la configuration manuelle via Google Cloud Shell.

echo "=========================================================================="
echo "Ce script est déprécié. Veuillez suivre les instructions dans README.md"
echo "pour appliquer manuellement la configuration CORS via Google Cloud Shell."
echo "=========================================================================="
echo ""
echo "En résumé :"
echo "1. Allez sur https://console.cloud.google.com/storage/browser?project=ccs-compta"
echo "2. Activez le Cloud Shell (icône '>_' en haut à droite)."
echo "3. Exécutez : echo '[{\"origin\": [\"*\"], \"method\": [\"GET\"], \"maxAgeSeconds\": 3600}]' > cors.json"
echo "4. Exécutez : gcloud storage buckets update gs://ccs-compta.appspot.com --cors-file=cors.json"
echo "5. Rafraîchissez votre application."
echo ""
