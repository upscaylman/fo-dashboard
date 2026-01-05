#!/bin/bash

# Script pour sauvegarder les workflows et données n8n
# Usage: ./scripts/backup.sh
# Les backups sont stockés dans le dossier backups/ avec une date

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}💾 Sauvegarde des workflows et données n8n...${NC}"

# Répertoires
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR/.."
BACKUP_DIR="$PROJECT_DIR/backups"
WORKFLOWS_DIR="$PROJECT_DIR/workflows"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="n8n_backup_$TIMESTAMP"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

# Créer le dossier de backup s'il n'existe pas
mkdir -p "$BACKUP_DIR"

# Vérifier si Docker est en cours d'exécution
if ! docker info > /dev/null 2>&1; then
    echo "⚠️  Docker n'est pas en cours d'exécution"
    echo "   Sauvegarde des fichiers locaux uniquement..."
    DOCKER_AVAILABLE=false
else
    DOCKER_AVAILABLE=true
fi

echo -e "${BLUE}📦 Création de l'archive de sauvegarde...${NC}"

# Créer un répertoire temporaire pour la sauvegarde
TEMP_BACKUP=$(mktemp -d)
mkdir -p "$TEMP_BACKUP/workflows"
mkdir -p "$TEMP_BACKUP/templates"

# Exporter les workflows
echo "   📝 Export des workflows..."
if [ -d "$WORKFLOWS_DIR/dev" ]; then
    cp -r "$WORKFLOWS_DIR/dev" "$TEMP_BACKUP/workflows/"
fi
if [ -d "$WORKFLOWS_DIR/export" ]; then
    cp -r "$WORKFLOWS_DIR/export" "$TEMP_BACKUP/workflows/"
fi

# Copier les templates
echo "   📄 Copie des templates..."
if [ -d "$PROJECT_DIR/templates" ]; then
    cp -r "$PROJECT_DIR/templates" "$TEMP_BACKUP/"
fi

# Sauvegarder le volume Docker n8n_data si disponible
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "   🐳 Sauvegarde du volume Docker n8n_data..."
    cd "$SCRIPT_DIR/../docker"
    
    # Vérifier si le conteneur existe
    if docker ps -a | grep -q n8n-local; then
        # Créer un backup du volume
        docker run --rm \
            -v n8n-automate_n8n_data:/data \
            -v "$TEMP_BACKUP:/backup" \
            alpine tar czf /backup/n8n_data_backup.tar.gz -C /data .
        echo "   ✅ Volume Docker sauvegardé"
    else
        echo "   ⚠️  Conteneur n8n-local non trouvé, saut de la sauvegarde du volume"
    fi
fi

# Créer l'archive finale
echo "   📦 Compression de l'archive..."
cd "$TEMP_BACKUP"
tar czf "$BACKUP_PATH.tar.gz" .

# Nettoyer le répertoire temporaire
rm -rf "$TEMP_BACKUP"

# Calculer la taille du backup
BACKUP_SIZE=$(du -h "$BACKUP_PATH.tar.gz" | cut -f1)

echo -e "${GREEN}✅ Sauvegarde créée avec succès!${NC}"
echo ""
echo "📋 Détails:"
echo "   - Fichier: $BACKUP_PATH.tar.gz"
echo "   - Taille: $BACKUP_SIZE"
echo ""

# Nettoyer les anciennes sauvegardes (plus de 30 jours)
echo -e "${YELLOW}🧹 Nettoyage des anciennes sauvegardes (plus de 30 jours)...${NC}"
find "$BACKUP_DIR" -name "n8n_backup_*.tar.gz" -type f -mtime +30 -delete
CLEANED_COUNT=$(find "$BACKUP_DIR" -name "n8n_backup_*.tar.gz" -type f | wc -l)
echo "   ✅ $CLEANED_COUNT backup(s) conservé(s)"

echo ""
echo "💡 Pour restaurer un backup, voir docs/MIGRATION.md"

