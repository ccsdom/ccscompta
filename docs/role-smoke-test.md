# Smoke Test Connecte Par Roles

Ce chantier valide le parcours de connexion et les garde-fous d'autorisation pour:

- `admin`
- `accountant`
- `secretary`
- `client`

## 1) Preparation

1. Copier `.env.smoke.example` vers `.env.smoke.local`.
2. Renseigner les emails/mots de passe des comptes de test reels.
3. Charger les variables d'environnement dans votre terminal.

PowerShell:

```powershell
Get-Content .env.smoke.local | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
  $parts = $_ -split '=', 2
  if ($parts.Length -eq 2) {
    [Environment]::SetEnvironmentVariable($parts[0], $parts[1], 'Process')
  }
}
```

## 2) Lancer le smoke test

Choisir les roles a tester:

```powershell
$env:SMOKE_ROLES="admin"
```

Valeurs possibles:

- `admin`
- `accountant`
- `secretary`
- `client`
- `admin,accountant,secretary,client`

Mode headless:

```powershell
npm run smoke:roles
```

Mode visible:

```powershell
npm run smoke:roles:headed
```

## 3) Smoke creation client par cabinet

Ce test est optionnel et cree un vrai client de test depuis l'interface cabinet.
Il valide que la creation passe par le backend et que l'email d'activation est mis en file.

Variables requises:

```powershell
$env:SMOKE_ACCOUNTANT_EMAIL="cabinet@example.com"
$env:SMOKE_ACCOUNTANT_PASSWORD="replace-me"
$env:SMOKE_PROVISION_CLIENT_EMAIL="client-smoke+{timestamp}@example.com"
```

Variables optionnelles:

```powershell
$env:SMOKE_PROVISION_CLIENT_NAME="Client Smoke {timestamp}"
$env:SMOKE_PROVISION_CLIENT_SIRET=""
```

Lancer:

```powershell
npm run smoke:client-provisioning
```

Resultat attendu:

- le comptable se connecte;
- le formulaire nouveau client est rempli;
- le client est cree;
- l'interface confirme `Email d'activation envoye`;
- aucune erreur bloquante Firebase n'apparait.

## 4) Ce qui est verifie

- Connexion reussie pour chaque role.
- Redirection vers la bonne page d'accueil rolee.
- Absence des erreurs bloquantes suivantes:
  - `app/no-options`
  - `Automatic initialization failed`
  - `Missing or insufficient permissions`
- Blocage effectif des routes admin pour `accountant`, `secretary`, `client`.
- Blocage effectif des routes staff pour `client`.

## 5) Resultat attendu

- Tous les tests passent.
- Aucun role non admin ne peut consulter `/dashboard/admin` ou `/dashboard/admin/subscriptions`.
- Aucune exception Firebase critique n'apparait pendant la connexion.

## 6) Diagnostic rapide

- `INVALID_LOGIN_CREDENTIALS`: email ou mot de passe invalide pour le role teste.
- `auth/email-already-exists`: l'email client de provisioning existe deja; utilisez `{timestamp}` ou une nouvelle adresse.
- `Missing or insufficient permissions`: probleme de custom claims, rattachement cabinet/client, ou regles Firestore.
- `app/no-options`: configuration Firebase publique absente du deploiement teste.
