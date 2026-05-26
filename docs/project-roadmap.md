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

- Preparation du chantier 3 : parcours client mobile.

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

Statut : a lancer apres chantier 2.

Objectif : rendre le depot de pieces simple, rapide et fiable sur smartphone.

Livrables attendus :

- Audit UX mobile des parcours `/dashboard/my-documents` et upload.
- Gestion claire des erreurs reseau, taille, type de fichier et reprise.
- Etats de chargement et confirmation lisibles.
- Verification responsive sur mobile.

### Chantier 4 - Cockpit Admin SaaS

Statut : a planifier.

Objectif : transformer l'admin en centre de pilotage complet.

Livrables attendus :

- Vue cabinets, utilisateurs, activite, incidents et abonnements.
- Filtres, recherche, exports et actions rapides.
- Indicateurs de securite et de qualite de donnees.

### Chantier 5 - Automatisation Comptable

Statut : a planifier.

Objectif : reduire fortement la saisie manuelle.

Livrables attendus :

- Validation OCR/IA robuste.
- Workflow de rapprochement bancaire.
- Journal OD, immobilisations, FEC et exports comptables verifies.
- Tracabilite complete des corrections humaines.

## Definition Of Done Projet

- Build frontend et backend reproductible.
- Regles Firebase versionnees et deployees.
- Parcours client mobile teste.
- Parcours cabinet/admin teste.
- Donnees isolees par cabinet et role.
- Erreurs critiques journalisees.
- Secrets sortis du code et documentes.
- Procedure de deploiement et rollback explicite.
