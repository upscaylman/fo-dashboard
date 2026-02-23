# 🚀 Démarrage Rapide

Guide ultra-rapide pour démarrer avec le projet.

## ⚡ 3 Commandes pour Démarrer

```bash
# 1. Configurer l'environnement
cd docker
cp env.example .env

# 2. Démarrer n8n
cd ..
./scripts/start.sh

# 3. Accéder à l'interface
# Ouvrir http://localhost:5678 dans votre navigateur
```

## ✅ Vérification de l'Installation

```bash
# Vérifier la structure des dossiers
tree -L 2  # Linux/macOS
# ou
dir /s /b  # Windows PowerShell
Get-ChildItem -Recurse -Directory  # Windows PowerShell moderne

# Vérifier Docker
docker ps

# Voir les logs
./scripts/logs.sh
```

## 📋 Checklist Initiale

Avant de commencer :

- [ ] Docker Desktop installé et démarré
- [ ] Fichier `.env` créé dans `docker/`
- [ ] Conteneur n8n démarré (`docker ps` montre `n8n-local`)
- [ ] Interface accessible sur http://localhost:5678
- [ ] Compte administrateur n8n créé
- [ ] Credentials configurés (Outlook, SMTP, IA)
- [ ] Template Word créé dans `templates/word/template_principal.docx`
- [ ] Workflow importé depuis `workflows/dev/generateur_document.json`

## 🎯 Premier Test

1. Activez le workflow "Générateur Document avec Validation" dans n8n
2. Notez l'URL du webhook (ex: `http://localhost:5678/webhook/generate-document`)
3. Ouvrez cette URL dans votre navigateur
4. Remplissez le formulaire avec des données de test
5. Soumettez et vérifiez que l'email de validation arrive

## 📚 Documentation Complète

- **[README.md](README.md)** : Vue d'ensemble du projet
- **[docs/INSTALLATION.md](docs/INSTALLATION.md)** : Installation détaillée
- **[docs/UTILISATION.md](docs/UTILISATION.md)** : Guide utilisateur simple
- **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** : Résolution des problèmes

## 🔧 Commandes Utiles

```bash
# Démarrer
./scripts/start.sh

# Arrêter
./scripts/stop.sh

# Logs
./scripts/logs.sh

# Backup
./scripts/backup.sh
```

## 🆘 Besoin d'Aide ?

1. Consultez `docs/TROUBLESHOOTING.md`
2. Vérifiez les logs : `./scripts/logs.sh`
3. Vérifiez que Docker fonctionne : `docker ps`

---

**C'est tout !** Bonne utilisation ! 🎉

