#!/bin/bash

# Script pour démarrer n8n en mode développement local
# Usage: ./scripts/start.sh

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Démarrage de n8n (développement local)...${NC}"

# Aller dans le répertoire docker
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../docker"

# Vérifier si Docker est en cours d'exécution
if ! docker info > /dev/null 2>&1; then
    echo "❌ Erreur: Docker n'est pas en cours d'exécution"
    echo "   Veuillez démarrer Docker Desktop et réessayer"
    exit 1
fi

# Vérifier si le fichier .env existe
if [ ! -f ".env" ]; then
    echo "⚠️  Le fichier .env n'existe pas"
    echo "   Création d'un fichier .env à partir de .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "   ✅ Fichier .env créé. Veuillez le modifier selon vos besoins."
    else
        echo "   ❌ Le fichier .env.example n'existe pas non plus"
        exit 1
    fi
fi

# Démarrer les services (mode développement par défaut)
echo -e "${BLUE}📦 Démarrage des conteneurs Docker (mode développement)...${NC}"
docker compose up -d

# Attendre quelques secondes pour que n8n démarre
echo -e "${BLUE}⏳ Attente du démarrage de n8n...${NC}"
sleep 5

# Vérifier que le conteneur est en cours d'exécution
if docker ps | grep -q n8n-local; then
    echo -e "${GREEN}✅ n8n démarré avec succès!${NC}"
    echo ""
    echo "📋 Informations:"
    echo "   - Interface: http://localhost:5678"
    echo "   - Documentation: Voir docs/INSTALLATION.md"
    echo ""
    echo "📊 Statut des conteneurs:"
    docker compose ps
    echo ""
    echo "💡 Commandes utiles:"
    echo "   - Voir les logs: ./scripts/logs.sh"
    echo "   - Arrêter n8n: ./scripts/stop.sh"
    echo "   - Statut: docker ps"
else
    echo "❌ Erreur: n8n n'a pas démarré correctement"
    echo "   Consultez les logs avec: ./scripts/logs.sh"
    exit 1
fi

