#!/bin/bash

# ============================================================
# Script de démarrage Phase 2 - QuickStart (Linux/Mac)
# ============================================================

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         Phase 2 - DevSecOps Application Startup           ║"
echo "╚════════════════════════════════════════════════════════════╝"

# Vérifier Docker
echo ""
echo "[1/4] Vérification des prérequis..."

if ! command -v docker &> /dev/null; then
    echo "✗ Docker n'est pas installé!"
    exit 1
fi

echo "✓ Docker: $(docker --version)"

if ! command -v docker-compose &> /dev/null; then
    echo "✗ Docker Compose n'est pas installé!"
    exit 1
fi

echo "✓ Docker Compose: $(docker-compose --version)"

# Créer les .env files
echo ""
echo "[2/4] Vérification des fichiers .env..."

mkdir -p app/backend app/frontend

if [ ! -f "app/backend/.env" ]; then
    cat > app/backend/.env << 'EOF'
APP_ENV=development
APP_PORT=5000
APP_NAME=DevSecOps Backend
EOF
    echo "⚠ Création de app/backend/.env"
fi

if [ ! -f "app/frontend/.env" ]; then
    cat > app/frontend/.env << 'EOF'
VITE_API_URL=http://localhost:5000
EOF
    echo "⚠ Création de app/frontend/.env"
fi

if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
DB_USER=postgres
DB_PASSWORD=changeme
DB_NAME=appdb
GRAFANA_ADMIN_PASSWORD=admin123
APP_ENV=development
EOF
    echo "⚠ Création de .env"
fi

echo "✓ Fichiers .env vérifiés"

# Démarrer Docker Compose
echo ""
echo "[3/4] Démarrage des services Docker..."

docker-compose up -d

if [ $? -ne 0 ]; then
    echo "✗ Erreur au démarrage des services"
    docker-compose logs
    exit 1
fi

echo "✓ Services démarrés"

# Attendre le démarrage
echo ""
echo "[4/4] Attente du démarrage complet..."

for i in {1..30}; do
    if curl -s http://localhost:5000/api/health > /dev/null; then
        echo "✓ Backend prêt"
        break
    fi
    echo "  Tentative $i/30..."
    sleep 1
done

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              Phase 2 - DÉMARRAGE RÉUSSI ✓                 ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║ 🌐 Frontend        : http://localhost:3000                 ║"
echo "║ 🔌 Backend API     : http://localhost:5000/api/health     ║"
echo "║ 📊 Prometheus      : http://localhost:9090                 ║"
echo "║ 📈 Grafana         : http://localhost:4000 (admin/admin123)║"
echo "║ 🗄️  Adminer (DB)    : http://localhost:8080                 ║"
echo "║ 🚨 AlertManager    : http://localhost:9093                 ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║ Commandes utiles:                                          ║"
echo "║  docker-compose logs -f          (voir les logs)           ║"
echo "║  docker-compose ps               (état des services)       ║"
echo "║  docker-compose stop             (arrêter les services)    ║"
echo "║  docker-compose down -v          (nettoyer complètement)   ║"
echo "╚════════════════════════════════════════════════════════════╝"

echo ""
echo "📖 Documentation: consulter PHASE_2_README.md"
