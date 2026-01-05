# Guide de Résolution des Problèmes

Guide complet pour résoudre les problèmes courants du système d'automatisation de documents.

## 🔍 Diagnostic Rapide

Avant de chercher une solution spécifique, effectuez ces vérifications de base :

```bash
# Vérifier que Docker fonctionne
docker ps

# Vérifier les logs de n8n
./scripts/logs.sh

# Vérifier l'état des conteneurs
cd docker && docker-compose ps
```

## 📋 Table des Problèmes

- [n8n ne démarre pas](#n8n-ne-démarre-pas)
- [Le port 5678 est déjà utilisé](#le-port-5678-est-déjà-utilisé)
- [Le formulaire web est inaccessible](#le-formulaire-web-est-inaccessible)
- [L'IA ne génère pas de texte](#lia-ne-génère-pas-de-texte)
- [Le document Word n'est pas généré](#le-document-word-nest-pas-généré)
- [L'email de validation n'arrive pas](#lemail-de-validation-narrive-pas)
- [L'email n'est pas envoyé au destinataire](#lemail-nest-pas-envoyé-au-destinataire)
- [Erreurs de permissions](#erreurs-de-permissions)
- [Erreurs de connexion à la base de données](#erreurs-de-connexion-à-la-base-de-données)
- [Le template Word n'est pas trouvé](#le-template-word-nest-pas-trouvé)
- [Problèmes avec Docker](#problèmes-avec-docker)
- [Problèmes en production VPS](#problèmes-en-production-vps)

---

## n8n ne démarre pas

### Symptômes
- Le conteneur Docker ne démarre pas
- Message d'erreur au démarrage
- `docker ps` ne montre pas `n8n-local`

### Solutions

#### 1. Vérifier Docker Desktop

```bash
# Vérifier que Docker est en cours d'exécution
docker info

# Si erreur : démarrer Docker Desktop manuellement
```

#### 2. Vérifier les logs

```bash
cd docker
docker-compose logs n8n
```

#### 3. Vérifier le fichier .env

```bash
cd docker
cat .env
# Vérifiez qu'il n'y a pas d'erreurs de syntaxe
# Vérifiez que toutes les variables ont des valeurs
```

#### 4. Vérifier les ports

```bash
# Vérifier si le port 5678 est déjà utilisé
netstat -an | grep 5678  # Linux/macOS
netstat -an | findstr 5678  # Windows

# Si utilisé, changer le port dans docker-compose.yml
```

#### 5. Redémarrer proprement

```bash
./scripts/stop.sh
./scripts/start.sh
```

#### 6. Réinstaller l'image n8n

```bash
cd docker
docker-compose down
docker rmi n8nio/n8n:latest
docker-compose up -d
```

---

## Le port 5678 est déjà utilisé

### Symptômes
- Erreur "port already in use" au démarrage
- n8n ne démarre pas

### Solutions

#### Solution 1 : Changer le port (recommandé)

1. Modifiez `docker/docker-compose.yml` :
```yaml
ports:
  - "5679:5678"  # Changez 5678 en 5679 (ou un autre port disponible)
```

2. Modifiez `docker/.env` :
```env
N8N_PORT=5679
N8N_EDITOR_BASE_URL=http://localhost:5679
```

3. Redémarrez :
```bash
./scripts/stop.sh
./scripts/start.sh
```

4. Accédez à : `http://localhost:5679`

#### Solution 2 : Libérer le port

```bash
# Trouver le processus utilisant le port
lsof -i :5678  # macOS/Linux
netstat -ano | findstr :5678  # Windows

# Arrêter le processus (remplacez PID par le numéro trouvé)
kill -9 PID  # macOS/Linux
taskkill /PID PID /F  # Windows
```

---

## Le formulaire web est inaccessible

### Symptômes
- Erreur 404 ou page blanche
- Impossible d'accéder au webhook

### Solutions

#### 1. Vérifier que le workflow est actif

1. Connectez-vous à n8n : http://localhost:5678
2. Allez dans **Workflows**
3. Vérifiez que le workflow "Générateur Document avec Validation" est **actif** (toggle vert)
4. Si inactif, cliquez sur le toggle pour l'activer

#### 2. Vérifier l'URL du webhook

1. Dans n8n, ouvrez le workflow
2. Cliquez sur le nœud "Formulaire Web"
3. Notez l'URL du webhook (ex: `http://localhost:5678/webhook/generate-document`)
4. Testez cette URL dans votre navigateur

#### 3. Vérifier la configuration du nœud Form Trigger

- Le chemin doit être : `generate-document`
- Le nœud doit être connecté au reste du workflow

#### 4. Vérifier les logs

```bash
./scripts/logs.sh
# Cherchez des erreurs liées au webhook
```

---

## L'IA ne génère pas de texte

### Symptômes
- Le workflow s'arrête à l'étape "Génération IA"
- Erreur "Connection refused" ou "Timeout"
- Texte vide dans le document généré

### Solutions

#### 1. Vérifier que LM Studio ou Ollama est démarré

**Pour LM Studio :**
1. Ouvrez LM Studio
2. Assurez-vous qu'un modèle est chargé
3. Vérifiez que le serveur API est démarré (port 1234 par défaut)

**Pour Ollama :**
```bash
# Vérifier qu'Ollama fonctionne
ollama list

# Démarrer Ollama si nécessaire
ollama serve
```

#### 2. Tester la connexion

```bash
# Tester LM Studio
curl http://localhost:1234/v1/models

# Tester Ollama
curl http://localhost:11434/api/tags
```

#### 3. Vérifier la configuration du nœud IA dans n8n

1. Ouvrez le workflow dans n8n
2. Cliquez sur le nœud "Génération IA"
3. Vérifiez :
   - **Base URL** : `http://localhost:1234` (LM Studio) ou `http://localhost:11434` (Ollama)
   - **Model** : Nom correct du modèle
   - **Credentials** : Correctement configurés

#### 4. Alternative : Utiliser une API externe

Si l'IA locale ne fonctionne pas, vous pouvez utiliser :
- OpenAI API (payant)
- Anthropic Claude API (payant)
- Hugging Face (gratuit avec limites)

Configurez le credential correspondant dans n8n.

---

## Le document Word n'est pas généré

### Symptômes
- Erreur dans le workflow
- Document manquant en pièce jointe
- Erreur "Template not found"

### Solutions

#### 1. Vérifier que le template existe

```bash
# Vérifier la présence du template
ls -la templates/word/template_principal.docx

# Si absent, créez un template de test
```

#### 2. Vérifier le chemin dans le workflow

1. Dans n8n, ouvrez le workflow
2. Cliquez sur le nœud "Charger Template"
3. Vérifiez que le chemin est : `/templates/word/template_principal.docx`
4. **Important** : Le chemin doit être absolu depuis la racine du conteneur

#### 3. Vérifier le volume Docker

Dans `docker/docker-compose.yml`, vérifiez :
```yaml
volumes:
  - ./../templates:/templates:ro
```

Le chemin doit être correct relativement au fichier docker-compose.yml.

#### 4. Vérifier les permissions

```bash
# Vérifier les permissions du template
ls -la templates/word/

# Si nécessaire, donner les permissions de lecture
chmod 644 templates/word/template_principal.docx
```

#### 5. Vérifier le nœud Docxtemplater

1. Vérifiez que le nœud "Créer Document" est correctement configuré
2. Vérifiez le mapping des variables
3. Vérifiez que tous les champs obligatoires sont remplis

#### 6. Tester avec un template simple

Créez un template minimal avec juste `{nom_destinataire}` pour tester.

---

## L'email de validation n'arrive pas

### Symptômes
- Pas d'email après soumission du formulaire
- Email non reçu dans les spams

### Solutions

#### 1. Vérifier la configuration SMTP

1. Dans n8n, allez dans **Settings** → **Credentials**
2. Vérifiez la configuration SMTP :
   - **Host** : smtp.gmail.com (ou votre serveur)
   - **Port** : 587
   - **User** : Votre email
   - **Password** : Mot de passe d'application (pas le mot de passe normal pour Gmail)

#### 2. Pour Gmail : Créer un mot de passe d'application

1. Allez sur https://myaccount.google.com/
2. **Sécurité** → **Validation en deux étapes** (doit être activée)
3. **Mots de passe des applications** → Créez un nouveau mot de passe
4. Utilisez ce mot de passe dans n8n (pas votre mot de passe Gmail normal)

#### 3. Vérifier les logs

```bash
./scripts/logs.sh
# Cherchez des erreurs SMTP
```

#### 4. Tester l'envoi d'email directement

1. Dans n8n, créez un workflow de test simple
2. Utilisez le nœud "Send Email"
3. Testez l'envoi vers vous-même

#### 5. Vérifier les spams

- Vérifiez le dossier **Spam** / **Courrier indésirable**
- Ajoutez l'expéditeur à vos contacts

---

## L'email n'est pas envoyé au destinataire

### Symptômes
- Email de validation reçu et approuvé
- Mais le destinataire final ne reçoit pas l'email

### Solutions

#### 1. Vérifier la configuration Outlook

1. Dans n8n, vérifiez le credential "Microsoft Outlook"
2. Vérifiez que l'authentification OAuth2 est valide
3. Si nécessaire, reconnectez le compte Outlook

#### 2. Vérifier les adresses email

1. Vérifiez que l'adresse email dans le formulaire est correcte
2. Vérifiez qu'il n'y a pas d'espaces : `dupont@exemple.com` (pas ` dupont@exemple.com `)
3. Pour plusieurs destinataires, utilisez : `email1@exemple.com, email2@exemple.com`

#### 3. Vérifier les logs

```bash
./scripts/logs.sh | grep -i "outlook\|email\|send"
```

#### 4. Vérifier le workflow après validation

1. Dans n8n, vérifiez l'exécution du workflow
2. Regardez si le nœud "Envoyer via Outlook" s'est exécuté
3. Vérifiez s'il y a des erreurs dans ce nœud

---

## Erreurs de permissions

### Symptômes
- "Permission denied" dans les logs
- Impossible d'écrire/lire des fichiers

### Solutions

#### 1. Vérifier les permissions des dossiers

```bash
# Templates (lecture seule, c'est normal)
chmod 755 templates/
chmod 644 templates/word/*.docx

# Workflows (lecture/écriture)
chmod 755 workflows/
chmod 644 workflows/dev/*.json

# Scripts (exécution)
chmod +x scripts/*.sh
```

#### 2. Vérifier les permissions Docker

Si vous utilisez Linux, vérifiez que votre utilisateur est dans le groupe docker :

```bash
sudo usermod -aG docker $USER
# Déconnexion/reconnexion nécessaire
```

#### 3. Vérifier les volumes Docker

```bash
cd docker
docker-compose down
docker-compose up -d
# Les volumes sont recréés avec les bonnes permissions
```

---

## Erreurs de connexion à la base de données

### Symptômes
- "Cannot connect to database"
- n8n ne démarre pas
- Erreurs SQLite ou PostgreSQL

### Solutions

#### En développement local (SQLite)

#### 1. Vérifier le volume Docker

```bash
# Vérifier le volume n8n_data
docker volume ls | grep n8n

# Si nécessaire, supprimer et recréer
docker volume rm n8n-automate_n8n_data
docker-compose up -d
```

#### 2. Vérifier les permissions du fichier SQLite

Le fichier SQLite est dans le volume Docker, donc les permissions sont gérées automatiquement.

#### En production (PostgreSQL)

#### 1. Vérifier que PostgreSQL démarre

```bash
docker compose logs postgres
# Cherchez des erreurs
```

#### 2. Vérifier la connexion

```bash
docker compose exec postgres psql -U n8n -d n8n
# Si ça fonctionne, tapez \q pour quitter
```

#### 3. Vérifier les variables .env

```bash
cd docker
cat .env | grep POSTGRES
# Vérifiez POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
```

#### 4. Réinitialiser la base de données (DERNIER RECOURS)

```bash
# ATTENTION : Cela supprime toutes les données !
cd docker
docker compose down
docker volume rm n8n-project_postgres_data
docker compose up -d
```

---

## Le template Word n'est pas trouvé

### Symptômes
- Erreur "File not found" ou "Template not found"
- Workflow s'arrête au nœud "Charger Template"

### Solutions

#### 1. Vérifier la structure des dossiers

```bash
# Vérifier que la structure est correcte
tree templates/  # ou ls -R templates/

# Doit ressembler à :
# templates/
# └── word/
#     └── template_principal.docx
```

#### 2. Vérifier le chemin dans Docker

```bash
# Entrer dans le conteneur
docker exec -it n8n-local sh

# Vérifier que le template est accessible
ls -la /templates/word/

# Si absent, le volume n'est pas monté correctement
exit
```

#### 3. Vérifier docker-compose.yml

```yaml
volumes:
  - ./../templates:/templates:ro
```

Le chemin `./../templates` est relatif à `docker/docker-compose.yml`.

#### 4. Redémarrer après ajout de template

```bash
./scripts/stop.sh
./scripts/start.sh
```

---

## Problèmes avec Docker

### Docker ne démarre pas

**Windows :**
1. Ouvrez Docker Desktop manuellement
2. Attendez que l'icône Docker soit verte dans la barre des tâches
3. Vérifiez que WSL2 est installé et à jour

**macOS :**
1. Vérifiez que Docker Desktop est bien installé
2. Ouvrez Docker Desktop depuis Applications
3. Attendez le démarrage complet

**Linux :**
```bash
# Démarrer Docker
sudo systemctl start docker
sudo systemctl enable docker
```

### Erreur "Cannot connect to Docker daemon"

```bash
# Vérifier que Docker fonctionne
docker info

# Si erreur, redémarrer Docker
# Windows/macOS : Redémarrer Docker Desktop
# Linux :
sudo systemctl restart docker
```

### Espace disque insuffisant

```bash
# Nettoyer les images Docker inutilisées
docker system prune -a

# Vérifier l'espace
docker system df
```

---

## Problèmes en production VPS

### HTTPS ne fonctionne pas

#### 1. Vérifier les logs Caddy

```bash
docker logs n8n-caddy
# Cherchez les erreurs de certificat
```

#### 2. Vérifier que le domaine pointe vers le VPS

```bash
# Vérifier le DNS
nslookup votre-domaine.com
# Doit retourner l'IP du VPS
```

#### 3. Vérifier les ports

```bash
# Vérifier que les ports 80 et 443 sont ouverts
sudo ufw status
# ou
netstat -tuln | grep -E ':(80|443)'
```

### Performance lente

#### 1. Vérifier les ressources

```bash
# Utilisation CPU et RAM
htop  # ou top

# Utilisation disque
df -h
```

#### 2. Optimiser PostgreSQL

Ajoutez dans `docker-compose-prod.yml` pour PostgreSQL :

```yaml
environment:
  - POSTGRES_SHARED_BUFFERS=256MB
  - POSTGRES_EFFECTIVE_CACHE_SIZE=1GB
```

### Backups ne fonctionnent pas

#### 1. Vérifier les permissions

```bash
chmod +x /root/n8n-project/scripts/backup-auto.sh
```

#### 2. Vérifier le crontab

```bash
crontab -l
# Vérifiez que la tâche est présente
```

#### 3. Tester manuellement

```bash
/root/n8n-project/scripts/backup-auto.sh
```

---

## 🔧 Commandes Utiles de Diagnostic

```bash
# Voir tous les conteneurs Docker
docker ps -a

# Voir les logs en temps réel
docker compose -f docker/docker-compose.yml logs -f

# Entrer dans le conteneur n8n
docker exec -it n8n-local sh

# Voir l'utilisation des ressources
docker stats

# Nettoyer Docker
docker system prune -a

# Voir les volumes
docker volume ls

# Inspecter un volume
docker volume inspect n8n-automate_n8n_data
```

---

## 📞 Obtenir de l'Aide

Si aucune solution ci-dessus ne fonctionne :

1. **Collectez des informations** :
   ```bash
   # Logs complets
   ./scripts/logs.sh > debug.log
   
   # État des conteneurs
   docker ps -a > containers.txt
   
   # Configuration
   cat docker/.env > config.txt
   ```

2. **Vérifiez la documentation** :
   - [Documentation n8n](https://docs.n8n.io)
   - [Documentation Docker](https://docs.docker.com)

3. **Cherchez sur les forums** :
   - [Forum n8n](https://community.n8n.io)
   - [Stack Overflow](https://stackoverflow.com/questions/tagged/n8n)

4. **Créez un ticket de support** avec :
   - Description du problème
   - Étapes pour reproduire
   - Logs d'erreur
   - Version de Docker, n8n, OS

---

**Note importante :** Avant de supprimer des données ou réinitialiser, faites toujours une sauvegarde !

```bash
./scripts/backup.sh
```

