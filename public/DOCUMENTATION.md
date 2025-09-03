
# Manuel Utilisateur de CCS Compta

## 1. Introduction

Bienvenue sur CCS Compta, votre plateforme tout-en-un pour une collaboration comptable fluide, intelligente et efficace. Ce manuel a pour but de vous guider à travers les fonctionnalités de l'application, que vous soyez un client, un comptable ou un administrateur.

Notre mission est de simplifier la collecte et le traitement des pièces comptables en utilisant une intelligence artificielle avancée pour automatiser les tâches répétitives, vous permettant de vous concentrer sur ce qui compte vraiment : le conseil et la stratégie.

---

## 2. Pour les Clients

### 2.1. Démarrage Rapide

1.  **Connexion** : Utilisez l'adresse email et le mot de passe fournis par votre cabinet comptable pour vous connecter.
2.  **Tableau de Bord** : À la connexion, vous accédez à votre tableau de bord qui vous donne une vue d'ensemble rapide de vos documents (total, en attente, approuvés).
3.  **Téléversement** : La tâche principale est de nous transmettre vos pièces comptables.

### 2.2. Téléverser des Documents

Il existe deux manières simples de téléverser vos documents :

*   **Page "Mes Documents"** : Naviguez vers la page "Mes Documents". Vous y trouverez une grande zone où vous pouvez soit glisser-déposer vos fichiers (PDF, JPG, PNG), soit cliquer pour les parcourir sur votre ordinateur.
*   **Ajout Rapide** : Pour un gain de temps maximal, utilisez l'icône **`+`** dans l'en-tête de l'application. Une fenêtre s'ouvrira, vous permettant de déposer des fichiers depuis n'importe quelle page de l'application.

Une fois téléversés, nos systèmes IA prennent le relais pour traiter automatiquement vos documents et les préparer pour votre comptable.

### 2.3. Suivre le Statut de vos Documents

Dans la page "Mes Documents", chaque document possède un statut :
*   **En attente**: Le document est téléversé mais pas encore traité.
*   **En traitement**: Notre IA analyse le document.
*   **En examen**: Votre comptable vérifie les informations extraites.
*   **Approuvé**: Le document est validé et intégré à votre comptabilité.
*   **Erreur**: Un problème est survenu lors du traitement.

### 2.4. Communiquer sur un Document

Cliquez sur un document dans la liste pour ouvrir le panneau de détails. Vous pouvez y voir un aperçu, les données validées (si approuvé) et, surtout, utiliser l'onglet **Commentaires** pour poser des questions ou donner des précisions à votre comptable.

### 2.5. Consulter vos Analyses

La page "Mon Analyse" vous offre des graphiques simples pour visualiser vos postes de dépenses, vos fournisseurs principaux et l'évolution de vos charges au fil du temps.

### 2.6. Gérer vos Factures et Paramètres

*   **Mes Factures** : Consultez l'historique des factures de votre cabinet comptable et réglez celles en attente.
*   **Paramètres** : Mettez à jour votre nom, changez votre mot de passe et ajustez vos préférences de notification.

---

## 3. Pour les Comptables et Administrateurs

### 3.1. Le Tableau de Bord

Le tableau de bord comptable est votre centre de commandement. Il vous donne une vue d'ensemble de l'activité de tous vos clients :
*   Statistiques clés (nombre de clients actifs, documents téléversés aujourd'hui, etc.).
*   Graphique de l'activité récente par client.
*   Fil des dernières activités sur l'ensemble des dossiers.

### 3.2. Gestion des Clients

La page "Gestion des clients" vous permet de :
*   Créer de nouveaux dossiers clients.
*   Modifier les informations d'un client existant.
*   **Attribuer un comptable** à un dossier spécifique pour une meilleure répartition du travail.
*   Ouvrir un dossier client pour travailler dessus.

### 3.3. Traitement des Documents

C'est le cœur de votre travail sur la plateforme.

1.  **Sélectionner un Client** : Utilisez le sélecteur de client en haut de la barre latérale pour choisir le dossier sur lequel vous voulez travailler.
2.  **Vue des Documents** : La page "Documents du client" affiche toutes les pièces téléversées pour ce client.
3.  **Traitement IA** : Les documents téléversés sont automatiquement traités par l'IA, qui reconnaît leur type (facture, reçu...) et en extrait les données (fournisseur, dates, montants, TVA...).
4.  **Validation** : Votre rôle est de vérifier et de valider les données extraites par l'IA.
    *   Cliquez sur un document "Prêt pour examen".
    *   L'interface affiche l'image du document à côté du formulaire de données.
    *   Corrigez si nécessaire et cliquez sur **Approuver**.
    *   Utilisez les onglets "Commentaires" et "Historique" pour plus de contexte.

### 3.4. Fonctionnalités Avancées de l'IA

*   **Recherche Intelligente** : Utilisez la barre de recherche avec des phrases en langage naturel (ex: "factures de Free Mobile de plus de 50€ en mars"). Cliquez sur l'icône de baguette magique pour que l'IA traduise votre demande en filtres précis.
*   **Rapprochement Bancaire Automatique** : Lors du traitement d'un relevé bancaire, l'IA cherche automatiquement dans les autres documents du client pour trouver les factures et reçus correspondants à chaque ligne de dépense, les liant automatiquement.
*   **Validation par l'IA et Auto-Approbation** : Dans les `Paramètres > Automatisation`, vous pouvez configurer l'application pour qu'elle approuve automatiquement les documents si l'IA est suffisamment certaine de la qualité de son extraction, vous faisant gagner un temps précieux.

### 3.5. Analyse Détaillée & TVA

La page "Analyse Détaillée" est un puissant outil de reporting par client.
*   **Vue Globale ou Spécifique** : Si aucun client n'est sélectionné, la page affiche les données consolidées de tous vos clients.
*   **Personnalisation** : Utilisez le bouton "Personnaliser" pour choisir les graphiques que vous souhaitez afficher.
*   **Analyse de TVA** : L'onglet "Analyse TVA" pré-calcule la TVA déductible pour la période, sur la base des documents approuvés, simplifiant ainsi la préparation des déclarations.

---

## 4. Pour les Administrateurs (Super-Admin)

En plus de toutes les fonctionnalités comptables, le rôle Administrateur a accès à des vues de pilotage pour l'ensemble de la plateforme.

### 4.1. Gestion des Cabinets

La page "Gestion des Cabinets" est le point d'entrée pour une utilisation en mode SaaS. Elle vous permet de :
*   Voir la liste de tous les cabinets inscrits sur la plateforme.
*   Superviser leur activité (nombre de clients, de documents...).
*   Ajouter de nouveaux cabinets.

### 4.2. Rapports & Performance

Cette page vous donne une vue d'ensemble de la santé financière et opérationnelle de **votre propre cabinet** (ou de la plateforme SaaS).
*   Suivez le chiffre d'affaires, les factures en attente.
*   Analysez la performance mensuelle.
*   Identifiez vos clients les plus importants.
*   Personnalisez la période d'analyse (mois, 6 mois, année).

---

## 5. Support et Paramètres

La page "Aide & Support", accessible à tous, contient une FAQ détaillée et des moyens de contacter le support.

Les pages **Paramètres** vous permettent de gérer votre profil, votre sécurité, et, pour les comptables/admins, de configurer les puissantes options d'automatisation de l'IA.
