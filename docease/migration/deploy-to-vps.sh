#!/bin/bash

# Script pour déployer automatiquement sur le VPS
# Usage: ./migration/deploy-to-vps.sh
# Configurez les variables VPS_* en haut du script

set -e

# ============================================
# CONFIGURATION VPS - MODIFIEZ CES VALEURS
# ============================================
VPS_USER="root"
VPS_IP="192.168.1.100"  # Remplacez par l'IP de votre VPS
VPS_PATH="/root/n8n-project"
LOCAL_ARCHIVE=""  # Si vide, créera une archive automatiquement

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Déploiement automatique sur VPS...${NC}"

# Vérifier les variables
if [ -z "$VPS_USER" ] || [ -z "$VPS_IP" ]; then
    echo -e "${RED}❌ Erreur: VPS_USER et VPS_IP doivent être configurés${NC}"
    echo "   Modifiez les variables en haut du script deploy-to-vps.sh"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR/.."

# Créer l'archive si nécessaire
if [ -z "$LOCAL_ARCHIVE" ]; then
    echo -e "${YELLOW}📦 Création de l'archive d'export...${NC}"
    "$SCRIPT_DIR/export-for-vps.sh"
    
    # Trouver la dernière archive créée
    LATEST_ARCHIVE=$(ls -t "$SCRIPT_DIR"/n8n_export_vps_*.tar.gz 2>/dev/null | head -1)
    if [ -z "$LATEST_ARCHIVE" ]; then
        echo -e "${RED}❌ Erreur: Impossible de trouver l'archive d'export${NC}"
        exit 1
    fi
    LOCAL_ARCHIVE="$LATEST_ARCHIVE"
fi

if [ ! -f "$LOCAL_ARCHIVE" ]; then
    echo -e "${RED}❌ Erreur: Archive non trouvée: $LOCAL_ARCHIVE${NC}"
    exit 1
fi

ARCHIVE_NAME=$(basename "$LOCAL_ARCHIVE")

echo -e "${BLUE}📤 Transfert de l'archive vers le VPS...${NC}"
echo "   VPS: $VPS_USER@$VPS_IP"
echo "   Chemin: $VPS_PATH"

# Créer le répertoire sur le VPS si nécessaire
ssh "$VPS_USER@$VPS_IP" "mkdir -p $VPS_PATH"

# Transférer l'archive
scp "$LOCAL_ARCHIVE" "$VPS_USER@$VPS_IP:$VPS_PATH/"

echo -e "${GREEN}✅ Archive transférée${NC}"

# Extraire et déployer sur le VPS
echo -e "${BLUE}🔧 Extraction et configuration sur le VPS...${NC}"

ssh "$VPS_USER@$VPS_IP" << EOF
    cd $VPS_PATH
    
    # Extraire l'archive
    echo "📦 Extraction de l'archive..."
    tar xzf $ARCHIVE_NAME
    
    # Vérifier si .env existe, sinon créer depuis .env.example
    if [ ! -f docker/.env ]; then
        echo "📝 Création du fichier .env..."
        if [ -f docker/.env.example ]; then
            cp docker/.env.example docker/.env
            echo "⚠️  IMPORTANT: Modifiez docker/.env avec vos valeurs de production!"
        fi
    fi
    
    # Vérifier si Docker est installé
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker n'est pas installé sur le VPS"
        echo "   Installez Docker avant de continuer"
        exit 1
    fi
    
    # Arrêter les services existants
    echo "🛑 Arrêt des services existants..."
    cd docker
    if [ -f docker-compose-prod.yml ]; then
        docker-compose -f docker-compose-prod.yml down || true
    fi
    
    # Redémarrer les services
    echo "🚀 Démarrage des services..."
    docker-compose -f docker-compose-prod.yml up -d
    
    # Attendre le démarrage
    echo "⏳ Attente du démarrage..."
    sleep 10
    
    # Vérifier le statut
    echo "📊 Statut des conteneurs:"
    docker-compose -f docker-compose-prod.yml ps
EOF

echo ""
echo -e "${GREEN}✅ Déploiement terminé!${NC}"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. Vérifier que n8n est accessible: https://$VPS_IP"
echo "   2. Configurer le fichier .env si nécessaire:"
echo "      ssh $VPS_USER@$VPS_IP 'nano $VPS_PATH/docker/.env'"
echo "   3. Configurer le Caddyfile avec votre domaine:"
echo "      ssh $VPS_USER@$VPS_IP 'nano $VPS_PATH/docker/Caddyfile'"
echo "   4. Redémarrer Caddy après modification:"
echo "      ssh $VPS_USER@$VPS_IP 'cd $VPS_PATH/docker && docker-compose -f docker-compose-prod.yml restart caddy'"
echo "   5. Importer les workflows dans l'interface n8n"
echo ""

