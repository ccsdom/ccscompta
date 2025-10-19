#!/bin/bash

# Ce script est obsolète et ne doit plus être utilisé.
# La configuration CORS doit être appliquée manuellement via Google Cloud Shell
# pour une meilleure fiabilité et pour éviter les problèmes d'authentification locaux.

echo "=========================================================================="
echo "ATTENTION : CE SCRIPT EST OBSOLÈTE."
echo ""
echo "Veuillez suivre les instructions mises à jour dans le fichier README.md"
echo "pour appliquer la configuration CORS via Google Cloud Shell."
echo "=========================================================================="
echo ""
echo "En résumé :"
echo "1. Allez sur https://console.cloud.google.com/storage/browser?project=ccs-compta"
echo "2. Activez le Cloud Shell (icône '>_' en haut à droite)."
echo "3. Créez le fichier de config : echo '[{\"origin\": [\"*\"], \"method\": [\"GET\", \"POST\", \"PUT\"], \"responseHeader\": [\"Content-Type\", \"x-goog-resumable\"], \"maxAgeSeconds\": 3600}]' > cors.json"
echo "4. Appliquez les règles (adaptez le nom du bucket si besoin) : gcloud storage buckets update gs://ccs-compta.appspot.com --cors-file=cors.json"
echo ""
exit 1
