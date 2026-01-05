# 🔍 AUDIT DÉTAILLÉ - SCRIPTS OBSOLÈTES

**Date**: 2025-12-02  
**Objectif**: Identifier les fichiers .bat et scripts PowerShell obsolètes ou redondants

---

## ✅ FICHIERS ACTIFS ET UTILISÉS

### Fichiers .bat à la racine (ACTIFS)

| Fichier | Statut | Utilisation | Dépendances |
|---------|--------|-------------|-------------|
| **start.bat** | ✅ ACTIF | Script principal de démarrage (mode admin) | `scripts/start-ngrok.ps1`, `scripts/start-ngrok-8080.bat`, `templates/form/serve-form-wrapper.ps1` |
| **stop.bat** | ✅ ACTIF | Script principal d'arrêt (mode admin) | Aucune (commandes PowerShell inline) |
| **install-ngrok.bat** | ✅ ACTIF | Installation de ngrok via WinGet | `scripts/install-ngrok.ps1` |
| **setup-ngrok.bat** | ✅ ACTIF | Configuration du token ngrok | `scripts/setup-ngrok.ps1` |

### Fichiers .bat à la racine (OBSOLÈTES)

| Fichier | Statut | Raison | Action recommandée |
|---------|--------|--------|-------------------|
| **start-ngrok.bat** | ⚠️ OBSOLÈTE | Fonctionnalité intégrée dans `start.bat` | SUPPRIMER |
| **stop-ngrok.bat** | ⚠️ OBSOLÈTE | Fonctionnalité intégrée dans `stop.bat` | SUPPRIMER |
| **prepare-production.bat** | ⚠️ OBSOLÈTE | Non utilisé, workflow de production différent | SUPPRIMER |

### Fichiers .ps1 à la racine (OBSOLÈTES)

| Fichier | Statut | Raison | Action recommandée |
|---------|--------|--------|-------------------|
| **start.ps1** | ⚠️ OBSOLÈTE | Remplacé par `start.bat` (plus complet) | SUPPRIMER |
| **stop.ps1** | ⚠️ OBSOLÈTE | Remplacé par `stop.bat` (plus complet) | SUPPRIMER |
| **test-n8n-direct.ps1** | ⚠️ OBSOLÈTE | Script de test ancien, webhook ID obsolète | SUPPRIMER |
| **test-notification.ps1** | ℹ️ UTILITAIRE | Script de test, peut être gardé ou archivé | ARCHIVER |

---

## 📁 SCRIPTS DANS LE DOSSIER `scripts/`

### Scripts PowerShell ACTIFS (utilisés par start.bat/stop.bat)

| Fichier | Statut | Utilisé par | Description |
|---------|--------|-------------|-------------|
| **start-ngrok.ps1** | ✅ ACTIF | `start.bat` | Démarre le tunnel ngrok principal |
| **start-ngrok-8080.bat** | ✅ ACTIF | `start.bat` | Démarre ngrok http 8080 avec surveillance |
| **notify-and-minimize.ps1** | ✅ ACTIF | `start-ngrok-8080.bat` | Affiche notification Windows |
| **install-ngrok.ps1** | ✅ ACTIF | `install-ngrok.bat` | Installation ngrok via WinGet |
| **setup-ngrok.ps1** | ✅ ACTIF | `setup-ngrok.bat` | Configuration token ngrok |
| **stop-ngrok.ps1** | ⚠️ PARTIELLEMENT UTILISÉ | Anciennement `stop.bat` | Peut être supprimé (logique inline dans stop.bat) |

### Scripts PowerShell OBSOLÈTES (créés récemment mais non utilisés)

| Fichier | Statut | Raison | Action recommandée |
|---------|--------|--------|-------------------|
| **start-ngrok-8080-tray.bat** | ❌ OBSOLÈTE | Créé pour system tray mais non utilisé | SUPPRIMER |
| **start-ngrok-8080-tray.ps1** | ❌ OBSOLÈTE | Créé pour system tray mais non utilisé | SUPPRIMER |
| **start-ngrok-8080.ps1** | ❌ OBSOLÈTE | Remplacé par `start-ngrok-8080.bat` | SUPPRIMER |
| **monitor-ngrok.ps1** | ❌ OBSOLÈTE | Logique intégrée dans `start-ngrok-8080.bat` | SUPPRIMER |
| **start-ngrok-powershell.ps1** | ❌ OBSOLÈTE | Ancien script, non utilisé | SUPPRIMER |

### Scripts utilitaires (à conserver ou archiver)

| Fichier | Statut | Description | Action recommandée |
|---------|--------|-------------|-------------------|
| **check-ngrok.ps1** | ℹ️ UTILITAIRE | Vérification status ngrok | CONSERVER |
| **check-ngrok-tunnels.ps1** | ℹ️ UTILITAIRE | Liste les tunnels actifs | CONSERVER |
| **check-n8n-status.ps1** | ℹ️ UTILITAIRE | Vérification status n8n | CONSERVER |
| **check-setup.ps1** | ℹ️ UTILITAIRE | Diagnostic complet | CONSERVER |
| **restart-form-server.ps1** | ℹ️ UTILITAIRE | Redémarrage serveur formulaire | CONSERVER |

### Scripts de configuration (à conserver)

| Fichier | Statut | Description |
|---------|--------|-------------|
| **configure-netlify-env.ps1** | ✅ ACTIF | Configuration Netlify |
| **prepare-production.ps1** | ✅ ACTIF | Préparation production |
| **prepare-production-ngrok.ps1** | ✅ ACTIF | Préparation production avec ngrok |
| **setup-cloudflare-tunnel.ps1** | ✅ ACTIF | Configuration Cloudflare |

---

## 📊 RÉSUMÉ DES ACTIONS

### À SUPPRIMER IMMÉDIATEMENT (11 fichiers)

**Racine:**
1. `start-ngrok.bat` - Intégré dans start.bat
2. `stop-ngrok.bat` - Intégré dans stop.bat
3. `prepare-production.bat` - Non utilisé
4. `start.ps1` - Remplacé par start.bat
5. `stop.ps1` - Remplacé par stop.bat
6. `test-n8n-direct.ps1` - Obsolète

**Scripts:**
7. `scripts/start-ngrok-8080-tray.bat` - Non utilisé (system tray abandonné)
8. `scripts/start-ngrok-8080-tray.ps1` - Non utilisé (system tray abandonné)
9. `scripts/start-ngrok-8080.ps1` - Remplacé par .bat
10. `scripts/monitor-ngrok.ps1` - Logique intégrée ailleurs
11. `scripts/start-ngrok-powershell.ps1` - Ancien, non utilisé

### À ARCHIVER (optionnel - 1 fichier)

1. `test-notification.ps1` - Script de test utile mais non essentiel

### TOTAL
- **Fichiers actifs et nécessaires**: 4 .bat + ~40 scripts utilitaires
- **Fichiers obsolètes à supprimer**: 11
- **Fichiers à archiver**: 1

---

## ✅ VALIDATION

### Dépendances vérifiées pour start.bat:
- ✅ `scripts/start-ngrok.ps1` (existe et utilisé)
- ✅ `scripts/start-ngrok-8080.bat` (existe et utilisé)
- ✅ `scripts/notify-and-minimize.ps1` (existe et utilisé)
- ✅ `templates/form/serve-form-wrapper.ps1` (existe et utilisé)

### Dépendances vérifiées pour stop.bat:
- ✅ Aucune dépendance externe (commandes PowerShell inline)

**Aucun risque de casser le système en supprimant les fichiers listés ci-dessus.**

