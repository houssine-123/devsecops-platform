# ============================================================
# Phase 3: Conteneurisation Docker - README
# ============================================================

## 📦 Vue d'ensemble

Cette phase couvre la conteneurisation complète de l'application DevSecOps avec Docker, incluant :

- Création des Dockerfiles pour chaque composant
- Tests locaux (build et run)
- Orchestration avec docker-compose
- Push vers registry Docker Hub

## 🏗️ Composants conteneurisés

### Backend (Node.js + Express)
- **Image**: `houssineguidara12/devsecops-backend:latest`
- **Base**: Node.js 20 Alpine
- **Build multi-stage**: Builder + Runtime
- **Features**:
  - PostgreSQL persistence
  - Health checks automatiques
  - API REST complète
  - Métriques Prometheus

### Frontend (React + Nginx)
- **Image**: `houssineguidara12/devsecops-frontend:latest`
- **Base**: Nginx Alpine
- **Build multi-stage**: Node.js builder + Nginx runtime
- **Features**:
  - SPA React optimisée
  - Configuration Nginx personnalisée
  - Health check endpoint
  - Gzip compression

## 🚀 Utilisation locale

### Démarrage complet
```bash
# Construire et démarrer tous les services
docker compose -f docker-compose.yml up -d

# Vérifier l'état
docker compose -f docker-compose.yml ps
```

### Services disponibles
- **Backend API**: http://localhost:5000
- **Frontend**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Adminer**: http://localhost:8080
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:4000
- **Alertmanager**: http://localhost:9093
- **Node Exporter**: http://localhost:9100

### Tests individuels

#### Backend
```bash
# Build
docker build -t pfe-backend:local ./app/backend

# Run avec PostgreSQL
docker run --rm --name backend-test \
  --network devsecops-network \
  -e DB_HOST=postgres \
  -e DB_PORT=5432 \
  -e DB_USER=postgres \
  -e DB_PASSWORD=changeme \
  -e DB_NAME=appdb \
  -p 5001:5000 \
  pfe-backend:local
```

#### Frontend
```bash
# Build
docker build -t pfe-frontend:local ./app/frontend

# Run
docker run --rm --name frontend-test \
  -p 3001:3000 \
  pfe-frontend:local
```

## 📤 Push vers Docker Hub

### Script automatisé
```bash
# Rendre le script exécutable
chmod +x scripts/push-to-dockerhub.sh

# Exécuter le push
./scripts/push-to-dockerhub.sh
```

### Commandes manuelles
```bash
# Tag images
docker tag pfe-backend:latest houssineguidara12/devsecops-backend:latest
docker tag pfe-frontend:latest houssineguidara12/devsecops-frontend:latest

# Push images
docker push houssineguidara12/devsecops-backend:latest
docker push houssineguidara12/devsecops-frontend:latest
```

## 🔍 Validation

### Health checks
```bash
# Backend
curl http://localhost:5000/api/health
curl http://localhost:5000/api/ready

# Frontend
curl http://localhost:3000/health
```

### Tests fonctionnels
```bash
# Créer un serveur de test
curl -X POST http://localhost:5000/api/servers \
  -H "Content-Type: application/json" \
  -d '{"name":"test-server","ip":"192.168.1.100","location":"Test"}'

# Récupérer les serveurs
curl http://localhost:5000/api/servers

# Dashboard
curl http://localhost:5000/api/dashboard
```

## 📊 Métriques Docker

### Tailles des images
```bash
docker images | grep -E "(pfe-|devsecops-)"
```

### Utilisation ressources
```bash
docker stats
```

## 🔧 Configuration

### Variables d'environnement
```bash
# Backend
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=changeme
DB_NAME=appdb
APP_ENV=development
APP_PORT=5000

# Frontend
VITE_API_URL=http://backend:5000
```

### Volumes persistants
- `postgres_data`: Données PostgreSQL
- `prometheus_data`: Métriques Prometheus
- `grafana_data`: Dashboards Grafana
- `alertmanager_data`: Configuration Alertmanager

## 🐳 Dockerfiles détaillés

### Backend Dockerfile
```dockerfile
# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /build
COPY package.json ./
RUN npm install

# Stage 2: Runtime
FROM node:20-alpine
RUN apk add --no-cache curl
WORKDIR /app
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build .
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health
CMD ["npm", "start"]
```

### Frontend Dockerfile
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /build
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /build/dist /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf
EXPOSE 3000
HEALTHCHECK CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1
CMD ["nginx", "-g", "daemon off;"]
```

## 🎯 Résultats Phase 3

✅ **Dockerfiles créés** pour backend et frontend
✅ **Builds locaux** réussis
✅ **Orchestration docker-compose** fonctionnelle
✅ **Images poussées** vers Docker Hub (`houssineguidara12`)
✅ **Tests de santé** validés
✅ **Persistance PostgreSQL** confirmée

## 🚀 Prochaine phase

Phase 4: Déploiement Kubernetes - Orchestration avancée avec k8s, Helm, et déploiement cloud.