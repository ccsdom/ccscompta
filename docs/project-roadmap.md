# CCS Compta - Pilotage Projet

Derniere mise a jour : 2026-05-26

## Cap Produit

CCS Compta doit devenir une plateforme SaaS cabinet/client pour reduire les operations de saisie comptable, securiser le depot de pieces, accelerer la validation comptable et fournir une interface mobile fluide pour les clients.

## Etat Actuel

### Livre

- Securite multi-tenant renforcee autour des custom claims Firebase.
- Creation de comptes sans mot de passe par defaut.
- Invitations cabinet par lien securise avec jeton expire et stocke sous forme de hash.
- Onboarding cabinet via verification backend.
- Regles Firestore et Storage durcies et deployees.
- App Hosting deploye sur `ccscompta--ccs-compta.europe-west4.hosted.app`.
- Compatibilite `/login` vers `/connexion`.

### En Cours

- Chantier 3 : parcours client mobile, tranche consultation et historique documents.
- Remediation post-audit securite (2026-06-01) : verrouillage des creations Firestore multi-tenant, neutralisation du middleware base cookie, et durcissement de la source de role d'impersonation.

### Risques Ouverts

- `inboundEmailWebhook` depend de `INBOUND_EMAIL_TOKEN` et ne doit pas etre redeploye sans secret configure.
- Les workflows metier critiques manquent encore de tests automatises fonctionnels.
- L'interface admin doit encore etre structuree comme un vrai cockpit SaaS : supervision, cabinets, abonnements, activite, incidents, exports.
- Les performances mobile doivent etre mesurees sur les parcours client reels : upload, scan, consultation documents, notifications.

## Feuille De Route

### Chantier 1 - Securite Multi-Tenant

Statut : termine et deploye.

Objectif : supprimer les failles d'isolation cabinet/client et rendre la creation de comptes propre.

### Chantier 2 - Industrialisation Qualite

Statut : termine.

Objectif : rendre chaque changement verifiable automatiquement avant merge/deploiement.

Livrables attendus :

- Pipeline CI GitHub Actions.
- Scripts de verification root et backend.
- Audit npm niveau high sur les deux perimetres.
- Documentation de pilotage.

Commandes locales :

- Frontend : `npm run build`, puis `npm run verify:static`.
- Backend : `npm --prefix backend run verify`.

### Chantier 3 - Parcours Client Mobile

Statut : en cours.

Objectif : rendre le depot de pieces simple, rapide et fiable sur smartphone.

Livrables attendus :

- Audit UX mobile des parcours `/dashboard/my-documents` et upload.
- Gestion claire des erreurs reseau, taille, type de fichier et reprise.
- Etats de chargement et confirmation lisibles.
- Verification responsive sur mobile.

Livre le 2026-05-26 :

- Validation client des fichiers avant upload : type, taille et limite par lot.
- Chemin d'upload partage entre page client et ajout rapide.
- Creation Firestore et compteur client atomises apres upload Storage.
- Correction du comptage de succes dans l'ajout rapide.
- Scan mobile aligne sur le meme helper d'upload avec nettoyage anti-fichier orphelin.
- Import photo depuis smartphone en secours quand l'acces camera navigateur est indisponible.
- Historique documents mobile rendu plus lisible : statut, metadonnees comptables, commentaires et actions compactes.
- Consultation document mobile restructuree par onglets `Apercu`, `Donnees`, `Notes`, avec ouverture externe du justificatif.
- Recherche locale et filtres de statut ajoutes a l'historique client mobile.
- Centre de suivi client ajoute : documents en attente, en examen, erreurs, fichiers rejetes et justificatifs manquants.
- Livré le 2026-07-03 (Phase 6 & 7) :
  - Scanner Mobile intelligent avec Auto-crop canvas, filtre contraste papier premium et binarisation Noir & Blanc nette.
  - Upload résumable en tâche de fond avec progression dynamique circular loader.
  - Centre de notifications métier bidirectionnel avec règles d'isolation Firestore.
  - Alerte interactive hebdomadaire pour les justificatifs manquants du lundi matin.
- Livré le 2026-07-03 (Phase 8) :
  - Assistant IA de clavardage conversationnel ("Mon Assistant IA") intégré au menu client.
  - Clavardage persistant (localStorage) avec questions suggérées et animations de chargement.
  - Panneau latéral de monitoring financier synthétisant en temps réel les données clés (dépenses, TVA, top fournisseurs, alertes) servant de contexte à l'IA.
- Livré le 2026-07-03 (Phase 9) :
  - Onglet "Flux Trésorerie" avec double graphique interactif et ligne de flux net.
  - Onglet "Prévisions & Simulations" avec solde initial modifiable et simulateur de dépenses récurrentes sous forme de switchs.
  - Onglet "Calculateur TVA" avec jauge de TVA nette et alertes intelligentes de trésorerie.
  - Intégration du widget "Conseils Stratégiques IA" sur la page des Bilans (/dashboard/my-reports).

### Chantier 4 - Cockpit Admin SaaS

Statut : terminé.

Objectif : transformer l'admin en centre de pilotage complet.

Livrables terminés :
- Cockpit multi-onglets premium avec monitoring infra (SystemHealth).
- Annuaire de recherche et filtrage des utilisateurs par rôle/cabinet.
- Outil de support d'impersonation directe avec journalisation des événements.
- Suivi de la qualité IA, indicateurs de confiance OCR et résolution des incidents documentaires.

### Chantier 5 - Automatisation Comptable

Statut : terminé.

Objectif : réduire fortement la saisie manuelle.

Livrables terminés :
- Moteur d'extraction IA & OCR haute confiance.
- Connexion réelle GoCardless (Nordigen) et synchronisation de transactions bancaires.
- Algorithme d'auto-matching et rapprochement par IA.
- Journal OD, export FEC conforme, PAF logs (Piste d'Audit Fiable) et traçabilité des modifications.

## Definition Of Done Projet

- Build frontend et backend reproductible.
- Regles Firebase versionnees et deployees.
- Parcours client mobile teste.
- Parcours cabinet/admin teste.
- Donnees isolees par cabinet et role.
- Erreurs critiques journalisees.
- Secrets sortis du code et documentes.
- Procedure de deploiement et rollback explicite.
