# Système d'Automatisation de Documents avec n8n

Plateforme d'automatisation complète pour la génération de documents Word personnalisés avec validation humaine avant envoi.

## 🚀 Fonctionnalités

- **Formulaire web** pour saisie des données
- **Génération IA** de contenu avec Ollama/LM Studio (modèle Gemma2)
- **Templates Word** dynamiques via Docxtemplater
- **Validation humaine** avec prévisualisation avant envoi
- **Envoi automatique** par email (Outlook API/SMTP)

## 🏗️ Architecture

- **n8n**: Orchestration des workflows
- **Docker Compose**: Conteneurisation (PostgreSQL, Ollama, n8n)
- **PowerShell**: Serveur proxy CORS (port 3000)
- **Docxtemplater**: Remplissage des templates .docx
- **Tailwind CSS**: Interface utilisateur moderne

## 📋 Workflow

1. Formulaire HTML → Webhook n8n
2. Préparation données + génération IA optionnelle
3. Remplissage template Word
4. Prévisualisation HTML pour validation
5. Envoi email avec pièce jointe Word

## 📁 Structure

```
templates/form/     → Formulaire web + serveur proxy
templates/word/     → Templates .docx
workflows/dev/      → Définitions n8n (gpt_generator.json)
docker/            → Configuration Docker Compose
scripts/           → Utilitaires (start, stop, logs, backup)
```

## 🚀 Installation

### Prérequis
- Docker Desktop
- PowerShell (Windows) ou Bash (Linux/Mac)

### Démarrage rapide

**Windows:**
```bash
.\start.bat
```

**Linux/Mac:**
```bash
./scripts/start.sh
```

### Accès
- **Formulaire**: http://localhost:3000
- **n8n Interface**: http://localhost:5678

## 📝 Configuration

1. Importez le workflow depuis `workflows/dev/gpt_generator.json` dans n8n
2. Configurez vos credentials SMTP dans n8n
3. Ajustez les templates Word dans `templates/word/`
4. Personnalisez les variables dans `templates/config/variables.json`

## 🌐 Exposition Publique (Production)

### Option 1 : Cloudflare Tunnel (Recommandé pour débutants)
- ✅ Pas besoin d'ouvrir de ports
- ✅ HTTPS automatique
- ✅ Gratuit
- 📖 Voir [docs/CONFIGURER_CLOUDFLARE_TUNNEL.md](docs/CONFIGURER_CLOUDFLARE_TUNNEL.md)
- 🚀 Script d'aide : `scripts/setup-cloudflare-tunnel.ps1`

### Option 2 : Caddy (Reverse Proxy)
- ✅ Certificats Let's Encrypt automatiques
- ✅ Rate limiting intégré
- 📖 Voir `docker/Caddyfile` et `docs/MIGRATION.md`

## 🔧 Variables disponibles

### Variables communes
- `{civilite}`, `{nom}`, `{adresse}`, `{cp}`
- `{statut}`, `{batiment}`
- `{email_destinataire}`, `{nom_exp}`, `{statut_exp}`
- `{date}`, `{date_complete}`, `{heure}`

### Variables template 'principal'
- `{objet}`, `{texte_ia}`, `{number}`
- `{civilite_replace}`, `{nom_replace}`, `{nom_destinataire}`

## 📄 Licence

MIT
