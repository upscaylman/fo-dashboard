# Guide d'Installation Complète

Guide pas à pas pour installer et configurer le système d'automatisation de documents n8n.

## 📋 Prérequis

### Matériel requis
- **RAM** : Minimum 4 GB (8 GB recommandé)
- **Disque** : 10 GB d'espace libre minimum
- **Processeur** : Processeur moderne (2 cores minimum)

### Logiciels requis
- **Docker Desktop** : Version 4.0 ou supérieure
  - Téléchargement : https://www.docker.com/products/docker-desktop
  - Disponible pour Windows, macOS et Linux
  
- **Git** (optionnel) : Pour cloner le dépôt
  - Téléchargement : https://git-scm.com/downloads

### Systèmes d'exploitation supportés
- Windows 10/11 (64-bit)
- macOS 11+ (Apple Silicon ou Intel)
- Linux (Ubuntu 20.04+, Debian 11+, etc.)

## 🔧 Installation Étape par Étape

### Étape 1 : Installer Docker Desktop

1. Téléchargez Docker Desktop depuis le site officiel
2. Lancez le fichier d'installation
3. Suivez l'assistant d'installation
4. Redémarrez votre ordinateur si demandé
5. Ouvrez Docker Desktop et attendez qu'il soit démarré (icône Docker dans la barre des tâches)

**Vérification** : Ouvrez un terminal et exécutez :
```bash
docker --version
docker-compose --version
```

Vous devriez voir les versions installées.

### Étape 2 : Cloner ou télécharger le projet

**Option A - Avec Git :**
```bash
git clone <url-du-depot>
cd n8n-automate
```

**Option B - Téléchargement ZIP :**
1. Téléchargez le projet en ZIP
2. Extrayez-le dans un dossier (ex: `C:\Users\VotreNom\n8n-automate`)
3. Ouvrez un terminal dans ce dossier

### Étape 3 : Configurer les variables d'environnement

1. Allez dans le dossier `docker/`
2. Copiez le fichier `.env.example` vers `.env` :
   ```bash
   cd docker
   cp .env.example .env
   ```

3. Ouvrez le fichier `.env` avec un éditeur de texte :
   - Sur Windows : Bloc-notes ou Notepad++
   - Sur macOS : TextEdit
   - Sur Linux : nano ou gedit

4. Modifiez les valeurs si nécessaire (les valeurs par défaut fonctionnent pour le développement local) :
   ```env
   N8N_HOST=localhost
   N8N_PORT=5678
   N8N_PROTOCOL=http
   ```

5. Sauvegardez le fichier

### Étape 4 : Rendre les scripts exécutables (Linux/macOS uniquement)

```bash
cd scripts
chmod +x *.sh
cd ..
```

**Note Windows** : Les scripts `.sh` nécessitent Git Bash ou WSL. Vous pouvez aussi utiliser PowerShell (voir section alternative).

### Étape 5 : Démarrer n8n

**Avec le script (recommandé) :**
```bash
./scripts/start.sh
```

**Ou manuellement :**
```bash
cd docker
docker-compose up -d
```

Attendez quelques secondes que Docker télécharge l'image n8n et démarre le conteneur.

### Étape 6 : Vérifier le démarrage

Vérifiez que le conteneur fonctionne :
```bash
docker ps
```

Vous devriez voir un conteneur nommé `n8n-local` avec le statut "Up".

### Étape 7 : Accéder à l'interface n8n

1. Ouvrez votre navigateur web
2. Allez à l'adresse : **http://localhost:5678**
3. Vous devriez voir la page d'accueil de n8n

Si c'est la première utilisation, n8n vous demandera de créer un compte administrateur.

## 🔐 Configuration Initiale de n8n

### Création du compte administrateur

1. Sur la page d'accueil, remplissez :
   - **Email** : Votre adresse email
   - **Prénom** : Votre prénom
   - **Nom** : Votre nom
   - **Mot de passe** : Un mot de passe sécurisé (minimum 8 caractères)
   
2. Cliquez sur "Créer un compte"

### Configuration des credentials

Une fois connecté, vous devez configurer plusieurs credentials pour utiliser le workflow :

#### 1. Microsoft Outlook (pour l'envoi d'emails)

1. Allez dans **Settings** → **Credentials**
2. Cliquez sur "Add Credential"
3. Sélectionnez "Microsoft Outlook OAuth2 API"
4. Suivez les instructions pour connecter votre compte Outlook
5. Sauvegardez le credential avec le nom "Microsoft Outlook"

#### 2. SMTP (pour les emails de validation - optionnel)

Si vous préférez utiliser SMTP au lieu d'Outlook pour les emails de validation :

1. Créez un nouveau credential "SMTP"
2. Remplissez :
   - **Host** : smtp.gmail.com (ou votre serveur SMTP)
   - **Port** : 587
   - **User** : votre email
   - **Password** : votre mot de passe d'application
   - **Secure** : false (ou true pour SSL)

#### 3. LM Studio / Ollama (pour l'IA)

1. Démarrez LM Studio ou Ollama sur votre machine
2. Dans n8n, créez un credential "LM Studio API"
3. Configurez :
   - **Base URL** : http://localhost:1234 (LM Studio) ou http://localhost:11434 (Ollama)
   - **API Key** : (laissez vide si non requis)

## 📦 Installation des Nodes Communautaires

Le workflow utilise des nodes communautaires qui doivent être installés :

### Node Docxtemplater

1. Dans n8n, allez dans **Settings** → **Community Nodes**
2. Cliquez sur "Install a community node"
3. Entrez : `n8n-nodes-docxtemplater`
4. Cliquez sur "Install"
5. Redémarrez n8n (via le script `./scripts/stop.sh` puis `./scripts/start.sh`)

### Node LangChain (pour l'IA)

1. Même procédure avec : `@n8n/n8n-nodes-langchain`

## 📄 Import du Workflow

1. Dans n8n, allez dans **Workflows**
2. Cliquez sur "Import from File"
3. Sélectionnez le fichier `workflows/dev/generateur_document.json`
4. Le workflow sera importé avec tous ses nœuds

### Configuration du workflow importé

Après l'import, vous devrez :

1. **Configurer les credentials** :
   - Cliquez sur chaque nœud qui a un cadenas 🔒
   - Connectez les credentials créés précédemment

2. **Vérifier les chemins** :
   - Le nœud "Charger Template" doit pointer vers `/templates/word/template_principal.docx`
   - Vérifiez que le fichier template existe dans `templates/word/`

3. **Configurer les variables d'environnement** :
   - Si nécessaire, ajoutez `EMAIL_VALIDATION` dans le fichier `.env` pour l'email de validation

## 🧪 Test du Système

### Test 1 : Accès au formulaire

1. Dans n8n, activez le workflow "Générateur Document avec Validation"
2. Le workflow expose un webhook. Notez l'URL du webhook (ex: `http://localhost:5678/webhook/generate-document`)
3. Ouvrez cette URL dans votre navigateur
4. Vous devriez voir le formulaire

### Test 2 : Génération d'un document de test

1. Remplissez le formulaire avec des données de test
2. Soumettez le formulaire
3. Vérifiez les logs de n8n pour voir si tout fonctionne :
   ```bash
   ./scripts/logs.sh
   ```

### Test 3 : Vérification des templates

1. Vérifiez que le template Word existe dans `templates/word/template_principal.docx`
2. Si non, créez un template de test (voir `templates/word/README.md`)

## 🔧 Configuration Avancée

### Personnaliser le port

Si le port 5678 est déjà utilisé :

1. Modifiez `docker/.env` :
   ```env
   N8N_PORT=5679
   ```
2. Modifiez `docker/docker-compose.yml` :
   ```yaml
   ports:
     - "5679:5678"
   ```
3. Redémarrez : `./scripts/restart.sh` (ou stop puis start)

### Activer l'authentification basique

Pour protéger n8n avec un mot de passe :

1. Modifiez `docker/.env` :
   ```env
   N8N_BASIC_AUTH_ACTIVE=true
   N8N_BASIC_AUTH_USER=admin
   N8N_BASIC_AUTH_PASSWORD=votre_mot_de_passe
   ```
2. Redémarrez n8n

### Configurer la timezone

Par défaut, la timezone est `Europe/Paris`. Pour changer :

1. Modifiez `docker/.env` :
   ```env
   GENERIC_TIMEZONE=America/New_York
   ```
2. Redémarrez n8n

## ✅ Vérification Finale

Vérifiez que tout fonctionne :

```bash
# Vérifier Docker
docker ps | grep n8n

# Vérifier les logs
./scripts/logs.sh

# Vérifier l'accès web
# Ouvrir http://localhost:5678
```

## 🆘 Problèmes Courants

Si vous rencontrez des problèmes, consultez :
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** : Guide de résolution des problèmes
- Les logs : `./scripts/logs.sh`
- La documentation n8n : https://docs.n8n.io

## 📚 Prochaines Étapes

Une fois l'installation terminée :

1. Lisez **[UTILISATION.md](UTILISATION.md)** pour apprendre à utiliser le système
2. Créez votre premier template Word (voir `templates/word/README.md`)
3. Configurez les credentials nécessaires
4. Testez le workflow avec des données réelles

## 🔗 Liens Utiles

- [Documentation n8n](https://docs.n8n.io)
- [Docker Desktop Documentation](https://docs.docker.com/desktop/)
- [Docxtemplater Documentation](https://docxtemplater.readthedocs.io/)
- [LM Studio](https://lmstudio.ai/)
- [Ollama](https://ollama.ai/)

---

**Félicitations !** 🎉 Votre système d'automatisation est maintenant installé et prêt à être utilisé.

