#!/bin/bash

# Script pour arrêter n8n
# Usage: ./scripts/stop.sh

set -e

# Couleurs pour les messages
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Arrêt de n8n...${NC}"

# Aller dans le répertoire docker
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../docker"

# Vérifier si Docker est en cours d'exécution
if ! docker info > /dev/null 2>&1; then
    echo "⚠️  Docker n'est pas en cours d'exécution"
    exit 0
fi

# Arrêter les services
echo -e "${YELLOW}📦 Arrêt des conteneurs...${NC}"
docker-compose down

echo -e "${GREEN}✅ n8n arrêté avec succès${NC}"
echo ""
echo "💡 Pour redémarrer: ./scripts/start.sh"

