# 📁 Organisation des fichiers

Ce document décrit l'organisation des fichiers du projet.

## 📂 Structure des dossiers

### 📄 Racine du projet

**Scripts de démarrage/arrêt :**
- `start.bat` / `start.ps1` - Démarre Docker et le serveur de formulaire
- `stop.bat` / `stop.ps1` - Arrête tous les services
- `README.md` - Documentation principale
- `QUICK_START.md` - Guide de démarrage rapide

### 📚 `docs/` - Documentation

Tous les fichiers Markdown de documentation :
- `ACTIVER_WEBHOOK.md` - Guide pour activer le webhook dans n8n
- `VERIFIER_WEBHOOK.md` - Guide de vérification et dépannage du webhook
- `INSTALLATION.md` - Guide d'installation
- `CONFIGURER_*.md` - Guides de configuration (Credentials, Outlook, Ollama, etc.)
- `TROUBLESHOOTING.md` - Guide de résolution des problèmes
- ... (autres fichiers de documentation)

### 🔧 `scripts/` - Scripts utilitaires

Scripts PowerShell et Shell pour les opérations courantes :
- `check-webhook.ps1` - Vérifie si le webhook est accessible dans n8n
- `test-proxy.ps1` - Teste le proxy CORS et les webhooks
- `backup.sh` - Script de sauvegarde (Linux/Mac)
- `logs.sh` - Affiche les logs Docker
- `start.sh` / `stop.sh` - Scripts de démarrage/arrêt (Linux/Mac)
- `README.md` - Documentation des scripts

### 🐳 `docker/` - Configuration Docker

- `docker-compose.yml` - Configuration principale Docker Compose
- `docker-compose-local.yml` - Configuration locale (développement)
- `docker-compose-prod.yml` - Configuration production
- `env.example` - Exemple de fichier d'environnement
- `Caddyfile` - Configuration du reverse proxy (production)

### 📋 `templates/` - Templates

**`templates/form/`** - Formulaire HTML
- `form.html` - Formulaire principal
- `form.js` - Composant React (optionnel)
- `index.html` - Page d'accueil alternative
- `serve-form-background.ps1` - Serveur HTTP en arrière-plan (utilisé par start.bat)
- `serve-form.ps1` - Serveur HTTP interactif (standalone)
- `serve-form.bat` - Lanceur batch pour le serveur
- `README.md` - Documentation du formulaire

**`templates/word/`** - Templates Word
- `template_principal.docx` - Template principal DocxTemplater
- `README.md` - Documentation des templates

### 🔄 `workflows/` - Workflows n8n

- `workflows/dev/` - Workflows de développement
  - `gpt_generator.json` - Workflow principal avec webhook
  - `generateur.json` - Autre workflow
  - `Générateur Document avec Validation (Ollama).json` - Workflow avec Ollama
- `workflows/export/` - Exports de workflows

### 📦 `migration/` - Scripts de migration

- `deploy-to-vps.sh` - Script de déploiement vers VPS
- `export-for-vps.sh` - Script d'export pour VPS

## 📝 Règles d'organisation

1. **Documentation (.md)** → `docs/`
2. **Scripts utilitaires (.ps1, .sh)** → `scripts/`
3. **Scripts de démarrage/arrêt** → Racine (`start.bat`, `stop.bat`, etc.)
4. **Configuration Docker** → `docker/`
5. **Templates et formulaires** → `templates/`
6. **Workflows n8n** → `workflows/`

## 🔍 Trouver un fichier

- **Documentation** : Cherchez dans `docs/`
- **Scripts** : Cherchez dans `scripts/` ou à la racine
- **Configuration Docker** : Cherchez dans `docker/`
- **Templates** : Cherchez dans `templates/`

