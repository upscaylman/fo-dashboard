# Intégration Microsoft 365 — FO Métaux

Guide d'installation des applications **SignEase**, **DocEase** et **TeamEase** dans **Microsoft Teams** et **Outlook**.

---

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Prérequis](#prérequis)
- [Installation dans Microsoft Teams](#installation-dans-microsoft-teams)
- [Installation dans Outlook](#installation-dans-outlook)
- [Structure des fichiers](#structure-des-fichiers)
- [Mise à jour des applications](#mise-à-jour-des-applications)
- [Dépannage](#dépannage)

---

## Vue d'ensemble

| Application | URL de production | Description |
|---|---|---|
| **SignEase** | https://fom-signease.vercel.app | Signature électronique sécurisée |
| **DocEase** | https://fom-docease.vercel.app | Générateur de documents syndicaux |
| **TeamEase** | https://fom-teamease.vercel.app | Dashboard / portail des militants |

Les applications sont des **PWA** (Progressive Web Apps) hébergées sur Vercel. L'intégration Microsoft 365 les encapsule dans un WebView — aucune donnée ne transite par les serveurs Microsoft.

---

## Prérequis

### Pour Teams

- Microsoft Teams Desktop ou Web
- **Option A** : Accès au **Teams Admin Center** (déploiement centralisé pour tous les utilisateurs)
- **Option B** : Autorisation de **sideload** (chargement local d'apps personnalisées)

> ⚠️ Si le sideload est désactivé dans votre organisation, demandez à votre administrateur M365 d'activer l'option dans `Teams Admin Center > Stratégies d'application Teams > Charger des applications personnalisées`.

### Pour Outlook

- Outlook Web (outlook.office.com) ou Outlook Desktop (Microsoft 365)
- Accès aux **compléments** (add-ins)

---

## Installation dans Microsoft Teams

### Étape 1 : Générer les packages .zip

Exécutez le script de build dans PowerShell :

```powershell
cd microsoft365\scripts
.\build-packages.ps1
```

Cela crée 3 fichiers dans `microsoft365\dist\` :
- `signease-teams.zip`
- `docease-teams.zip`
- `teamease-teams.zip`

### Étape 2A : Installation par sideload (utilisateur individuel)

1. Ouvrez **Microsoft Teams**
2. Cliquez sur **Apps** (barre latérale gauche)
3. En bas, cliquez sur **Gérer vos apps**
4. Cliquez sur **Charger une application** → **Charger une application personnalisée**
5. Sélectionnez le fichier `.zip` souhaité (ex: `signease-teams.zip`)
6. Cliquez sur **Ajouter**

L'application apparaît dans votre barre latérale Teams.

### Étape 2B : Déploiement centralisé (administrateur M365)

1. Connectez-vous au **[Teams Admin Center](https://admin.teams.microsoft.com)**
2. Allez dans **Apps Teams** → **Gérer les apps**
3. Cliquez sur **Charger une nouvelle application**
4. Sélectionnez le `.zip`
5. Configurez les **stratégies d'autorisation** pour attribuer l'app aux utilisateurs/groupes souhaités

### Résultat

Chaque application offre :
- **Onglet personnel** : accès direct à la PWA depuis la barre latérale Teams
- **Onglet canal/équipe** : ajout possible de l'app comme onglet dans n'importe quel canal

Pour ajouter en tant qu'onglet dans un canal :
1. Ouvrez le canal souhaité
2. Cliquez sur **+** (ajouter un onglet)
3. Recherchez l'application (SignEase, DocEase ou TeamEase)
4. Cliquez sur **Ajouter**

---

## Installation dans Outlook

### Option A : Outlook Web (recommandé)

1. Ouvrez **[Outlook Web](https://outlook.office.com)**
2. Cliquez sur l'icône ⚙️ (Paramètres) en haut à droite
3. Allez dans **Courrier** → **Compléments** (ou **Gérer les compléments**)
4. Cliquez sur **Mes compléments** → **Ajouter un complément personnalisé** → **Ajouter à partir d'un fichier**
5. Sélectionnez le fichier XML souhaité :
   - `microsoft365\outlook\signease\signease-addin.xml`
   - `microsoft365\outlook\docease\docease-addin.xml`
   - `microsoft365\outlook\teamease\teamease-addin.xml`
6. Confirmez l'installation

### Option B : Déploiement centralisé (administrateur M365)

1. Connectez-vous au **[Centre d'administration Microsoft 365](https://admin.microsoft.com)**
2. Allez dans **Paramètres** → **Compléments intégrés**
3. Cliquez sur **Charger des compléments personnalisés**
4. Pour chaque app, chargez le fichier `.xml` correspondant
5. Attribuez aux utilisateurs/groupes souhaités

### Résultat

Après installation, chaque complément ajoute :
- Un **bouton dans le ruban** lors de la lecture d'un mail
- Un **bouton dans la barre de composition** lors de la rédaction d'un mail
- Cliquer sur le bouton ouvre un **volet latéral** (TaskPane) avec l'application

| Complément | Bouton (lecture) | Bouton (composition) |
|---|---|---|
| **SignEase** | "Ouvrir SignEase" | "Signer un document" |
| **DocEase** | "Ouvrir DocEase" | "Créer un document" |
| **TeamEase** | "Ouvrir TeamEase" | "Dashboard" |

---

## Structure des fichiers

```
microsoft365/
├── README.md                          ← Ce fichier
├── teams/
│   ├── signease/
│   │   ├── manifest.json              ← Manifeste Teams SignEase
│   │   ├── color.png                  ← Icône couleur 192×192
│   │   └── outline.png                ← Icône monochrome 32×32
│   ├── docease/
│   │   ├── manifest.json
│   │   ├── color.png
│   │   └── outline.png
│   └── teamease/
│       ├── manifest.json
│       ├── color.png
│       └── outline.png
├── outlook/
│   ├── signease/
│   │   └── signease-addin.xml         ← Add-in Outlook SignEase
│   ├── docease/
│   │   └── docease-addin.xml
│   └── teamease/
│       └── teamease-addin.xml
├── scripts/
│   └── build-packages.ps1             ← Script de build des .zip Teams
└── dist/                              ← Packages .zip générés (gitignored)
    ├── signease-teams.zip
    ├── docease-teams.zip
    └── teamease-teams.zip
```

---

## Mise à jour des applications

Les applications se mettent à jour **automatiquement** car Teams et Outlook chargent la PWA directement depuis l'URL Vercel. Quand vous déployez une nouvelle version sur Vercel, tous les utilisateurs reçoivent la mise à jour immédiatement — aucune action nécessaire côté Teams/Outlook.

Pour mettre à jour les **métadonnées** de l'app Teams (nom, description, icônes) :
1. Modifiez le `manifest.json` concerné
2. Incrémentez le champ `version`
3. Reconstruisez le .zip avec `build-packages.ps1`
4. Rechargez le .zip dans Teams (Admin Center ou sideload)

---

## Dépannage

### L'app ne se charge pas dans Teams / Outlook

**Cause probable** : les headers HTTP bloquent l'affichage en iframe.

**Vérification** : Ouvrez la console du navigateur (F12) dans Teams Web et cherchez une erreur `Refused to display in a frame`.

**Solution** : Les fichiers `vercel.json` ont été configurés avec le header :
```
Content-Security-Policy: frame-ancestors 'self' https://teams.microsoft.com https://*.microsoft.com https://*.office.com https://*.office365.com https://*.outlook.com
```

Si le problème persiste, vérifiez que le déploiement Vercel est à jour.

### "Sideload non autorisé"

Votre organisation a désactivé le chargement d'apps personnalisées. Demandez à votre administrateur M365 :
1. Teams Admin Center → **Stratégies d'application Teams**
2. Activer **Charger des applications personnalisées**

### Les icônes ne s'affichent pas dans Outlook

Les add-ins Outlook chargent les icônes depuis les URLs Vercel de production (ex: `https://fom-signease.vercel.app/icon-128x128.png`). Vérifiez que ces fichiers sont bien accessibles publiquement.

### Cookies / Authentification

Si votre PWA utilise des cookies d'authentification (Supabase, Firebase), Teams/Outlook peuvent bloquer les cookies tiers. Solutions :
1. **Outlook Web** : Autorisez les cookies tiers pour `*.vercel.app` dans les paramètres du navigateur
2. **Teams Desktop** : L'app utilise son propre moteur Chromium — les cookies fonctionnent normalement
3. **Alternative** : Utilisez l'authentification par token (localStorage) plutôt que par cookie de session

### Page blanche dans le TaskPane Outlook

Le TaskPane Outlook a une largeur limitée (~350px). Si l'app n'est pas responsive, le contenu peut être coupé. Assurez-vous que vos PWA s'adaptent aux petits écrans (responsive design).

---

## Références

- [Documentation Teams Apps](https://learn.microsoft.com/fr-fr/microsoftteams/platform/concepts/build-and-test/apps-package)
- [Documentation Outlook Add-ins](https://learn.microsoft.com/fr-fr/office/dev/add-ins/outlook/)
- [Schéma manifest Teams v1.13](https://developer.microsoft.com/en-us/json-schemas/teams/v1.13/MicrosoftTeams.schema.json)
- [Teams App Validation Tool](https://dev.teams.microsoft.com/appvalidation)
