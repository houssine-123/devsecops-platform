# 🚀 Phase 2 - Application Multi-tiers (Node.js + React)

## 📌 Vue d'ensemble

Phase 2 du projet DevSecOps: Création d'une application complète avec:
- **Backend**: API REST Node.js + Express
- **Frontend**: SPA React + Vite
- **Database**: PostgreSQL 14
- **Orchestration**: Docker Compose

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    UTILISATEUR (Navigateur)                 │
│                    http://localhost:3000                    │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP Requests
                        ▼
┌─────────────────────────────────────────────────────────────┐
│          FRONTEND (React + Nginx)                           │
│          Port 3000                                          │
│  ├─ App.jsx (Composant principal)                           │
│  ├─ api.js (Client HTTP)                                   │
│  └─ CSS Styles                                             │
└───────────────────────┬─────────────────────────────────────┘
                        │ REST API
                        ▼
┌─────────────────────────────────────────────────────────────┐
│          BACKEND (Node.js + Express)                        │
│          Port 5000                                          │
│  Endpoints:                                                 │
│  ├─ GET    /api/health    (Health Check)                   │
│  ├─ GET    /api/users     (Lister users)                   │
│  ├─ POST   /api/users     (Créer user)                     │
│  ├─ GET    /api/users/:id (User spécifique)               │
│  ├─ PUT    /api/users/:id (Modifier user)                 │
│  └─ DELETE /api/users/:id (Supprimer user)                │
└───────────────────────┬─────────────────────────────────────┘
                        │ SQL Queries
                        ▼
┌─────────────────────────────────────────────────────────────┐
│          DATABASE (PostgreSQL)                              │
│          Port 5432                                          │
│  ├─ postgres user (admin)                                  │
│  ├─ appdb database                                         │
│  └─ users table                                            │
└─────────────────────────────────────────────────────────────┘

MONITORING (Prometheus, Grafana, AlertManager)
├─ Prometheus  : 9090
├─ Grafana     : 4000 (login: admin/admin123)
├─ AlertManager: 9093
└─ NodeExporter: 9100
```

## 🎯 Objectifs Phase 2

- ✅ Backend API fonctionnel
- ✅ Frontend React avec UI responsive
- ✅ Communication Frontend ↔ Backend
- ✅ Dockerfile pour chaque service
- ✅ docker-compose.yml complet
- ⏳ Tests localement (MAINTENANT)
- ⏳ Phase 3: Optimisations & Déploiement Kubernetes

## 📂 Structure du projet

```
pfe/
├── app/
│   ├── backend/
│   │   ├── package.json          ← Dépendances
│   │   ├── server.js             ← Point d'entrée API
│   │   ├── .env                  ← Variables d'env
│   │   └── Dockerfile            ← Image Docker
│   │
│   ├── frontend/
│   │   ├── package.json          ← Dépendances React
│   │   ├── index.html            ← HTML racine
│   │   ├── vite.config.js        ← Config Vite
│   │   ├── nginx.conf            ← Config serveur
│   │   ├── Dockerfile            ← Image Docker
│   │   └── src/
│   │       ├── main.jsx          ← Point d'entrée React
│   │       ├── App.jsx           ← Composant principal
│   │       ├── App.css           ← Styles
│   │       └── api.js            ← Client HTTP
│   │
│   └── database/
│       └── init.sql              ← Initialisation DB
│
├── docker-compose.yml            ← Orchestration complète
├── monitoring/
│   ├── prometheus/
│   │   ├── prometheus.yml
│   │   └── rules.yml
│   ├── grafana/
│   │   └── provisioning/
│   └── alertmanager/
│       └── alertmanager.yml
│
└── docs/
    └── PHASE_2_README.md         ← Ce fichier
```

## 🚀 **DÉMARRAGE PHASE 2**

### Étape 1: Installer les dépendances (OPTIONNEL - Docker fait ça automatiquement)

```bash
# Backend
cd app/backend
npm install

# Frontend
cd ../frontend
npm install
```

### Étape 2: Démarrer tous les services avec Docker Compose

```bash
# À partir du répertoire racine (pfe/)
docker-compose up -d
```

**Explication du `-d`:** "detached mode" = services tournent en arrière-plan

### Étape 3: Vérifier que tous les services sont prêts

```bash
# Voir les logs
docker-compose logs -f

# Vérifier l'état des containers
docker ps

# Vérifier la santé des services
docker-compose ps
```

Attendre que les services passent en **"healthy"** (cela peut prendre 30-60 secondes).

## 🌐 **Accéder à l'application**

Une fois tous les services UP:

| Service | URL | Credential |
|---------|-----|-----------|
| **Frontend** | http://localhost:3000 | - |
| **Backend** | http://localhost:5000/api/health | - |
| **Prometheus** | http://localhost:9090 | - |
| **Grafana** | http://localhost:4000 | admin / admin123 |
| **Adminer (DB)** | http://localhost:8080 | - |

### Test Frontend:

1. Ouvrir http://localhost:3000
2. Vous devez voir:
   - ✓ Status: "Connected" (vert)
   - ✓ Liste des utilisateurs existants
   - ✓ Formulaire pour créer un user

### Créer un utilisateur:

```
Formulaire:
- Nom: "John Doe"
- Email: "john@example.com"
Cliquer: "Ajouter"
→ L'utilisateur aparaît dans la table
```

### Test Backend directement:

```bash
# Health check
curl http://localhost:5000/api/health

# Récupérer les users (JSON)
curl http://localhost:5000/api/users

# Créer un user
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane","email":"jane@example.com"}'

# Récupérer un user spécifique
curl http://localhost:5000/api/users/1

# Modifier un user
curl -X PUT http://localhost:5000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"John Updated"}'

# Supprimer un user
curl -X DELETE http://localhost:5000/api/users/1
```

## 🐛 **Debugging & Logs**

### Voir les logs d'un service:

```bash
# Backend
docker-compose logs -f backend

# Frontend
docker-compose logs -f frontend

# PostgreSQL
docker-compose logs -f postgres
```

### Entrer dans un container:

```bash
# Shell dans le backend
docker exec -it devsecops-backend sh

# Shell dans le frontend
docker exec -it devsecops-frontend sh

# Shell dans PostgreSQL
docker exec -it devsecops-postgres psql -U postgres -d appdb
```

### Voir les variables d'environnement du backend:

```bash
docker inspect devsecops-backend | grep -A 20 "Env"
```

## ⚠️ **Problèmes courants**

### ❌ Port 3000 déjà utilisé

```bash
# Solution 1: Arrêter le service qui l'utilise
lsof -i :3000

# Solution 2: Utiliser un port différent
docker-compose -f docker-compose.yml -e FRONTEND_PORT=3001 up
```

### ❌ Backend n'arrive pas à se connecter à Postgres

```bash
# Vérifier que Postgres est healthy
docker-compose ps

# Voir les logs
docker-compose logs postgres

# Restart
docker-compose restart postgres
```

### ❌ Frontend ne peut pas joindre le backend

```bash
# Vérifier que le backend répond
curl http://localhost:5000/api/health

# Vérifier CORS dans server.js (déjà configuré)
# Vérifier la variable VITE_API_URL dans frontend/.env
```

## 🛑 **Arrêter les services**

```bash
# Arrêter tous les services (gardent les données)
docker-compose stop

# Supprimer les containers (garder les volumes)
docker-compose down

# Supprimer TOUT (containers + volumes + données)
docker-compose down -v
```

## 📊 **Monitoring Phase 2**

### Prometheus:
- Scrape les metrics du backend toutes les 15 secondes
- Explore: http://localhost:9090/graph
- Requête: `app_uptime_seconds` → voir l'uptime du backend

### Grafana:
- Login: admin / admin123
- Ajouter Prometheus comme source de données
- Créer des dashboards avec les métriques du backend

### Métriques disponibles (dans /api/metrics):
```
app_uptime_seconds     → Uptime en secondes
app_requests_total     → Nombre total de requêtes
app_errors_total       → Nombre total d'erreurs
app_users_total        → Nombre de users
```

## 🔄 **Workflow Phase 2**

```
1. Développer localement:
   ├─ Modifier backend → docker-compose restart backend
   ├─ Modifier frontend → npm run dev (ou docker rebuild)
   └─ Tester dans le navigateur

2. Commit du code:
   git add .
   git commit -m "Phase 2: Backend + Frontend basics"
   git push

3. Prochaine étape (Phase 3):
   ├─ Optimisations
   ├─ Déploiement Kubernetes local
   └─ Tests d'intégration
```

## ✅ Phase 2 Checklist

- [ ] Backend démarre sans erreur
- [ ] Frontend accessible sur http://localhost:3000
- [ ] Créer un user via le formulaire
- [ ] Lister les users
- [ ] Modifier un user
- [ ] Supprimer un user
- [ ] Vérifier les logs (pas d'erreurs)
- [ ] Backend répond à /api/health
- [ ] Prometheus scrape les metrics
- [ ] Adminer peut accéder à la DB
- [ ] Commit du code à Git

## 📚 Ressources

- Node.js: https://nodejs.org/docs/
- Express.js: https://expressjs.com/
- React: https://react.dev/
- Vite: https://vitejs.dev/
- Docker: https://docs.docker.com/
- PostgreSQL: https://www.postgresql.org/docs/

---

**Phase 2 Status**: 🚀 PRÊTE À DÉMARRER
**Prochaine étape**: Phase 3 - Déploiement Kubernetes
