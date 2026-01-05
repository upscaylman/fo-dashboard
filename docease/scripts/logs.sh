#!/bin/bash

# Script pour afficher les logs de n8n
# Usage: ./scripts/logs.sh [nombre_de_lignes]
# Exemple: ./scripts/logs.sh 100

set -e

# Couleurs pour les messages
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Aller dans le répertoire docker
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../docker"

# Vérifier si Docker est en cours d'exécution
if ! docker info > /dev/null 2>&1; then
    echo "❌ Erreur: Docker n'est pas en cours d'exécution"
    exit 1
fi

# Vérifier si le conteneur existe
if ! docker ps -a | grep -q n8n-local; then
    echo "❌ Erreur: Le conteneur n8n-local n'existe pas"
    echo "   Démarrez n8n avec: ./scripts/start.sh"
    exit 1
fi

# Nombre de lignes à afficher (par défaut: suivre les logs en temps réel)
LINES=${1:-""}

echo -e "${BLUE}📋 Logs de n8n (Ctrl+C pour quitter)${NC}"
echo ""

if [ -z "$LINES" ]; then
    # Suivre les logs en temps réel
    docker-compose logs -f n8n
else
    # Afficher les N dernières lignes
    docker-compose logs --tail=$LINES n8n
fi

