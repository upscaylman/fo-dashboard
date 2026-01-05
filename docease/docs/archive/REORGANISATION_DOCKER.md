# 🔄 Réorganisation des Fichiers Docker Compose

## 📋 Changements Effectués

### Nouvelle Organisation

**Avant :**
- `docker-compose.yml` → Développement (SQLite)
- `docker-compose-prod.yml` → Production (PostgreSQL)

**Après :**
- **`docker-compose.yml`** → **Production** (PostgreSQL + Caddy) ⭐
- `docker-compose.dev.yml` → Développement (SQLite + Ollama)

## 🎯 Pourquoi ce Changement ?

1. **Sécurité** : Le fichier principal (`docker-compose.yml`) est maintenant la configuration de production, plus sécurisée
2. **Bonnes pratiques** : Production = référence principale
3. **Clarté** : Moins de risque d'utiliser accidentellement la config dev en prod
4. **Explicite** : Le développement nécessite maintenant `-f docker-compose.dev.yml`

## 📝 Impact sur les Scripts

### Scripts Mis à Jour

- ✅ `start.ps1` → Utilise maintenant `docker-compose.dev.yml`
- ✅ `start.bat` → Utilise maintenant `docker-compose.dev.yml`
- ✅ `scripts/start.sh` → Utilise maintenant `docker-compose.dev.yml`

### Commandes Manuelles

**Développement :**
```bash
cd docker
docker compose -f docker-compose.dev.yml up -d
```

**Production :**
```bash
cd docker
docker compose up -d  # Plus besoin de -f !
```

## 🔄 Migration

### Si vous aviez des conteneurs en cours

1. **Arrêter les anciens conteneurs :**
   ```bash
   cd docker
   docker compose down
   docker compose -f docker-compose-prod.yml down  # Si existe
   ```

2. **Démarrer avec la nouvelle configuration :**
   ```bash
   # Développement
   docker compose -f docker-compose.dev.yml up -d
   
   # Production
   docker compose up -d
   ```

### Fichiers Obsolètes

Les fichiers suivants peuvent être supprimés (optionnel) :
- `docker-compose-prod.yml` (remplacé par `docker-compose.yml`)
- `docker-compose-local.yml` (remplacé par `docker-compose.dev.yml`)

## ✅ Vérification

Pour vérifier que tout fonctionne :

```bash
# Voir les conteneurs actifs
docker ps

# Devrait afficher :
# - n8n-local (développement)
# - ollama (développement)
# OU
# - n8n-prod (production)
# - n8n-postgres (production)
# - n8n-caddy (production)
```

## 📚 Documentation

- Voir `docker/README.md` pour plus de détails
- Voir `docs/SECURITE_PERFORMANCE_PRODUCTION.md` pour la configuration production

