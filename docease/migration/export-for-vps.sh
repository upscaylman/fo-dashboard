#!/bin/bash

# Script pour préparer la migration vers le VPS
# Exporte les workflows, templates et crée une archive
# Usage: ./migration/export-for-vps.sh

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Préparation de la migration vers le VPS...${NC}"

# Répertoires
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR/.."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
EXPORT_NAME="n8n_export_vps_$TIMESTAMP"
EXPORT_PATH="$SCRIPT_DIR/$EXPORT_NAME"

# Créer un répertoire temporaire pour l'export
TEMP_EXPORT=$(mktemp -d)
mkdir -p "$TEMP_EXPORT/workflows"
mkdir -p "$TEMP_EXPORT/templates"
mkdir -p "$TEMP_EXPORT/docker"

echo "📝 Export des workflows..."
if [ -d "$PROJECT_DIR/workflows/dev" ]; then
    cp -r "$PROJECT_DIR/workflows/dev" "$TEMP_EXPORT/workflows/"
fi
if [ -d "$PROJECT_DIR/workflows/export" ]; then
    cp -r "$PROJECT_DIR/workflows/export" "$TEMP_EXPORT/workflows/"
fi

echo "📄 Copie des templates..."
if [ -d "$PROJECT_DIR/templates" ]; then
    cp -r "$PROJECT_DIR/templates" "$TEMP_EXPORT/"
fi

echo "🐳 Copie de la configuration Docker..."
cp "$PROJECT_DIR/docker/docker-compose-prod.yml" "$TEMP_EXPORT/docker/"
cp "$PROJECT_DIR/docker/.env.example" "$TEMP_EXPORT/docker/"
cp "$PROJECT_DIR/docker/Caddyfile" "$TEMP_EXPORT/docker/"

# Créer un fichier README pour l'export
cat > "$TEMP_EXPORT/README_MIGRATION.txt" << EOF
Migration n8n vers VPS
======================

Date d'export: $(date)
Fichiers inclus:
- Workflows (workflows/dev et workflows/export)
- Templates Word
- Configuration Docker production

Instructions de déploiement:
1. Transférer cette archive sur le VPS via SCP:
   scp $EXPORT_NAME.tar.gz user@vps-ip:/root/n8n-project/

2. Sur le VPS, extraire l'archive:
   cd /root/n8n-project
   tar xzf $EXPORT_NAME.tar.gz

3. Configurer le fichier .env dans docker/
   cp docker/.env.example docker/.env
   nano docker/.env  # Modifier les variables

4. Configurer le Caddyfile avec votre domaine
   nano docker/Caddyfile

5. Démarrer les services:
   cd docker
   docker-compose -f docker-compose-prod.yml up -d

6. Importer les workflows dans n8n:
   - Accéder à https://votre-domaine.com
   - Importer les workflows depuis workflows/export/

Voir docs/MIGRATION.md pour plus de détails.
EOF

# Créer l'archive
echo "📦 Création de l'archive..."
cd "$TEMP_EXPORT"
tar czf "$EXPORT_PATH.tar.gz" .

# Nettoyer le répertoire temporaire
rm -rf "$TEMP_EXPORT"

# Calculer la taille de l'export
EXPORT_SIZE=$(du -h "$EXPORT_PATH.tar.gz" | cut -f1)

echo -e "${GREEN}✅ Export créé avec succès!${NC}"
echo ""
echo "📋 Détails:"
echo "   - Fichier: $EXPORT_PATH.tar.gz"
echo "   - Taille: $EXPORT_SIZE"
echo ""
echo "🚀 Prochaines étapes:"
echo "   1. Transférer l'archive sur le VPS:"
echo "      scp $EXPORT_PATH.tar.gz user@vps-ip:/root/n8n-project/"
echo ""
echo "   2. Utiliser le script deploy-to-vps.sh pour un déploiement automatique"
echo "      ou suivre les instructions dans README_MIGRATION.txt"
echo ""
