# Guide de Migration Local → VPS (Production)

Guide complet pour migrer votre installation n8n locale vers un serveur VPS en production.

## 📋 Vue d'Ensemble

Ce guide vous accompagne pour :
- Exporter vos workflows et configurations locales
- Déployer sur un serveur VPS
- Configurer PostgreSQL et HTTPS
- Importer vos workflows
- Tester la migration

## 🎯 Prérequis

### Sur votre machine locale :
- ✅ Le système fonctionne correctement en local
- ✅ Tous les workflows sont testés et fonctionnels
- ✅ Accès SSH au serveur VPS
- ✅ Les fichiers de migration sont disponibles

### Sur le serveur VPS :
- ✅ Ubuntu 20.04+ ou Debian 11+ (recommandé)
- ✅ Accès root ou utilisateur avec sudo
- ✅ Docker et Docker Compose installés
- ✅ Port 80 et 443 ouverts (pour HTTPS)
- ✅ Domaine pointant vers l'IP du VPS (pour HTTPS automatique)

## 📦 Étape 1 : Préparer l'Export Local

### Option A : Script automatique (recommandé)

```bash
# Depuis la racine du projet
./migration/export-for-vps.sh
```

Ce script va :
- Exporter tous les workflows
- Copier les templates Word
- Copier la configuration Docker production
- Créer une archive `.tar.gz` datée

L'archive sera dans `migration/n8n_export_vps_YYYYMMDD_HHMMSS.tar.gz`

### Option B : Export manuel

Si vous préférez faire l'export manuellement :

1. **Exporter les workflows depuis n8n** :
   - Connectez-vous à n8n local : http://localhost:5678
   - Allez dans **Workflows**
   - Pour chaque workflow : ⋮ → **Export** → Sauvegarder dans `workflows/export/`

2. **Copier les fichiers nécessaires** :
   ```bash
   # Templates
   cp -r templates/ migration/temp_export/
   
   # Configuration Docker
   cp docker/docker-compose-prod.yml migration/temp_export/
   cp docker/.env.example migration/temp_export/
   cp docker/Caddyfile migration/temp_export/
   
   # Workflows
   cp -r workflows/export migration/temp_export/workflows/
   ```

3. **Créer l'archive** :
   ```bash
   cd migration/temp_export
   tar czf ../n8n_export_vps_$(date +%Y%m%d_%H%M%S).tar.gz .
   cd ../..
   rm -rf migration/temp_export
   ```

## 🚀 Étape 2 : Préparer le Serveur VPS

### 2.1 Connexion au VPS

```bash
ssh root@VOTRE_IP_VPS
# ou
ssh utilisateur@VOTRE_IP_VPS
```

### 2.2 Installer Docker (si pas déjà installé)

```bash
# Mettre à jour le système
apt update && apt upgrade -y

# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Installer Docker Compose
apt install docker-compose-plugin -y

# Vérifier l'installation
docker --version
docker compose version
```

### 2.3 Créer la structure des dossiers

```bash
mkdir -p /root/n8n-project
cd /root/n8n-project

# Créer les dossiers nécessaires
mkdir -p docker templates/word templates/samples workflows/export data logs
```

## 📤 Étape 3 : Transférer les Fichiers

### Option A : Script automatique

1. **Modifiez le script** `migration/deploy-to-vps.sh` :
   ```bash
   VPS_USER="root"
   VPS_IP="192.168.1.100"  # Remplacez par votre IP
   VPS_PATH="/root/n8n-project"
   ```

2. **Exécutez le script** :
   ```bash
   ./migration/deploy-to-vps.sh
   ```

Le script va automatiquement :
- Créer l'archive
- La transférer sur le VPS
- L'extraire
- Configurer les services

### Option B : Transfert manuel avec SCP

```bash
# Depuis votre machine locale
cd migration

# Trouver la dernière archive
LATEST=$(ls -t n8n_export_vps_*.tar.gz | head -1)

# Transférer
scp $LATEST root@VOTRE_IP_VPS:/root/n8n-project/
```

Puis sur le VPS :

```bash
cd /root/n8n-project
tar xzf n8n_export_vps_*.tar.gz
```

## ⚙️ Étape 4 : Configuration Production

### 4.1 Configuration du fichier .env

```bash
cd /root/n8n-project/docker
cp .env.example .env
nano .env  # ou utilisez vi, vim, etc.
```

**Modifiez ces variables importantes :**

```env
# Configuration n8n
N8N_HOST=votre-domaine.com
N8N_PORT=5678
N8N_PROTOCOL=https
N8N_EDITOR_BASE_URL=https://votre-domaine.com
WEBHOOK_URL=https://votre-domaine.com

# PostgreSQL (IMPORTANT : changez le mot de passe !)
POSTGRES_DB=n8n
POSTGRES_USER=n8n
POSTGRES_PASSWORD=UN_MOT_DE_PASSE_TRES_SECURISE_ICI

# Authentification basique (RECOMMANDÉ)
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=UN_AUTRE_MOT_DE_PASSE_SECURISE

# Configuration générale
GENERIC_TIMEZONE=Europe/Paris
N8N_LOG_LEVEL=info
N8N_DIAGNOSTICS_ENABLED=false
```

**💡 Conseil de sécurité :** Utilisez un générateur de mots de passe fort (minimum 20 caractères, mélange de lettres, chiffres, symboles).

### 4.2 Configuration du Caddyfile (HTTPS automatique)

```bash
cd /root/n8n-project/docker
nano Caddyfile
```

**Remplacez `votre-domaine.com` par votre domaine réel :**

```
votre-domaine.com {
    reverse_proxy n8n:5678
    # ... (le reste de la configuration)
}
```

**Pour obtenir un domaine gratuit :**
- DuckDNS (gratuit, dynamique)
- No-IP (gratuit avec limite)
- Freenom (domaines .tk, .ml, etc.)

### 4.3 Vérifier les templates

```bash
# Vérifier que les templates sont présents
ls -la /root/n8n-project/templates/word/

# Si le template principal n'existe pas, créez-en un ou copiez-le
```

## 🐳 Étape 5 : Démarrer les Services

### 5.1 Premier démarrage

```bash
cd /root/n8n-project/docker
docker compose -f docker-compose-prod.yml up -d
```

### 5.2 Vérifier que tout démarre

```bash
# Voir les logs
docker compose -f docker-compose-prod.yml logs -f

# Vérifier les conteneurs
docker compose -f docker-compose-prod.yml ps
```

Vous devriez voir :
- ✅ `n8n-postgres` : Running
- ✅ `n8n-prod` : Running
- ✅ `n8n-caddy` : Running

### 5.3 Vérifier HTTPS

Attendez 1-2 minutes pour que Caddy obtienne le certificat Let's Encrypt, puis :

```bash
# Vérifier les logs Caddy
docker logs n8n-caddy

# Vous devriez voir un message comme :
# "certificate obtained successfully"
```

## 🔐 Étape 6 : Configuration Initiale n8n

### 6.1 Accéder à l'interface

1. Ouvrez votre navigateur
2. Allez à : `https://votre-domaine.com`
3. Vous devriez voir la page d'accueil n8n

### 6.2 Créer le compte administrateur

1. Remplissez le formulaire d'inscription
2. **Important :** Utilisez un email et mot de passe différents de ceux en local (recommandé)
3. Créez le compte

### 6.3 Configurer les credentials

Configurez les mêmes credentials qu'en local :

1. **Microsoft Outlook** : Pour l'envoi d'emails
2. **SMTP** : Pour les emails de validation (optionnel)
3. **LM Studio / Ollama** : Si vous utilisez une IA locale (nécessite de configurer l'IA sur le VPS ou d'utiliser une API distante)

## 📥 Étape 7 : Importer les Workflows

### 7.1 Importer depuis les fichiers

1. Dans n8n, allez dans **Workflows**
2. Cliquez sur **Import from File**
3. Téléchargez chaque workflow depuis `/root/n8n-project/workflows/export/`

**Ou via l'interface web :**

Si vous avez accès SSH avec port forwarding :

```bash
# Sur votre machine locale
scp workflows/export/*.json root@VOTRE_IP_VPS:/tmp/
```

Puis importez depuis `/tmp/` dans n8n.

### 7.2 Reconfigurer les workflows

Après l'import :

1. **Vérifiez les credentials** :
   - Cliquez sur chaque nœud avec un cadenas 🔒
   - Reconnectez les credentials (Outlook, SMTP, etc.)

2. **Vérifiez les chemins** :
   - Le nœud "Charger Template" doit pointer vers `/templates/word/template_principal.docx`
   - Vérifiez que les templates sont bien présents

3. **Vérifiez les webhooks** :
   - Les URLs de webhooks ont changé (maintenant avec votre domaine)
   - Notez la nouvelle URL du formulaire (ex: `https://votre-domaine.com/webhook/generate-document`)

## ✅ Étape 8 : Tests de Validation

### Test 1 : Vérifier l'accès

```bash
# Vérifier que n8n répond
curl -I https://votre-domaine.com

# Devrait retourner HTTP 200
```

### Test 2 : Test du workflow

1. Accédez à l'URL du formulaire : `https://votre-domaine.com/webhook/generate-document`
2. Remplissez le formulaire avec des données de test
3. Soumettez
4. Vérifiez que l'email de validation arrive
5. Approuvez et vérifiez l'envoi

### Test 3 : Vérifier les logs

```bash
cd /root/n8n-project/docker
docker compose -f docker-compose-prod.yml logs n8n | tail -50
```

## 🔄 Étape 9 : Mettre à Jour les URLs

Après la migration, mettez à jour :

1. **Les liens dans vos documents** : Si vous avez des liens vers le formulaire
2. **Les bookmarks** : Mettez à jour vos favoris
3. **La documentation utilisateur** : Mettez à jour `docs/UTILISATION.md` avec la nouvelle URL

## 🛡️ Sécurité Post-Migration

### Checklist de sécurité

- [ ] Mot de passe PostgreSQL changé et sécurisé
- [ ] Authentification basique n8n activée
- [ ] HTTPS fonctionnel (vérifier le cadenas dans le navigateur)
- [ ] Firewall configuré (ports 80, 443 ouverts, autres fermés)
- [ ] Backups automatiques configurés (voir section suivante)
- [ ] Monitoring configuré (optionnel mais recommandé)

### Configuration du firewall

```bash
# Installer ufw si pas déjà installé
apt install ufw -y

# Autoriser SSH
ufw allow 22/tcp

# Autoriser HTTP et HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Activer le firewall
ufw enable

# Vérifier
ufw status
```

## 💾 Sauvegarde Automatique

Configurez des sauvegardes automatiques :

```bash
# Créer un script de backup
cat > /root/n8n-project/scripts/backup-auto.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/root/n8n-project/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Créer le dossier
mkdir -p $BACKUP_DIR

# Backup des volumes Docker
docker run --rm \
  -v n8n-project_postgres_data:/data \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/postgres_$DATE.tar.gz -C /data .

docker run --rm \
  -v n8n-project_n8n_data:/data \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/n8n_$DATE.tar.gz -C /data .

# Supprimer les backups de plus de 30 jours
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
EOF

chmod +x /root/n8n-project/scripts/backup-auto.sh

# Ajouter au crontab (backup quotidien à 2h du matin)
(crontab -l 2>/dev/null; echo "0 2 * * * /root/n8n-project/scripts/backup-auto.sh") | crontab -
```

## 🆘 Problèmes Courants

### Certificat HTTPS ne fonctionne pas

**Symptôme** : Erreur "Certificate not found" dans les logs Caddy

**Solutions** :
1. Vérifiez que le domaine pointe bien vers l'IP du VPS
2. Vérifiez que les ports 80 et 443 sont ouverts
3. Attendez quelques minutes (Let's Encrypt a des limites de taux)
4. Vérifiez les logs : `docker logs n8n-caddy`

### n8n ne démarre pas

**Symptôme** : Conteneur n8n en erreur

**Solutions** :
1. Vérifiez les logs : `docker compose logs n8n`
2. Vérifiez la connexion PostgreSQL : `docker compose logs postgres`
3. Vérifiez le fichier `.env` (erreurs de syntaxe)

### Workflows ne fonctionnent pas

**Symptôme** : Erreurs dans les workflows après import

**Solutions** :
1. Vérifiez que tous les credentials sont reconnectés
2. Vérifiez les chemins des fichiers (templates)
3. Testez chaque nœud individuellement

## 📚 Ressources

- [Documentation n8n Production](https://docs.n8n.io/hosting/installation/docker/)
- [Documentation Caddy](https://caddyserver.com/docs/)
- [Documentation PostgreSQL Docker](https://hub.docker.com/_/postgres)

## ✅ Checklist Finale

Avant de considérer la migration comme terminée :

- [ ] Tous les workflows importés et fonctionnels
- [ ] Tous les credentials configurés
- [ ] HTTPS fonctionnel avec certificat valide
- [ ] Formulaire accessible via HTTPS
- [ ] Test complet du workflow (formulaire → validation → envoi)
- [ ] Backups automatiques configurés
- [ ] Firewall configuré
- [ ] Documentation mise à jour
- [ ] Utilisateurs informés de la nouvelle URL

---

**Félicitations !** 🎉 Votre système est maintenant en production et accessible via HTTPS.

