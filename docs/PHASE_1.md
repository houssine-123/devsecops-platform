# 📋 PHASE 1 - Architecture & Préparation

## ✅ Objectifs de la Phase 1

La **Phase 1** établit les fondations du projet DevSecOps. Tous les éléments créés ici serviront de base pour les phases suivantes.

### Checklist Phase 1

- [x] Structure complète du projet créée
- [x] Documentation d'architecture (ARCHITECTURE.md)
- [x] Versions des outils documentées (TOOLS_VERSIONS.md)
- [x] Configuration d'environnement (.env.example)
- [x] Docker Compose de base
- [x] Scripts d'installation (Windows + Linux)
- [x] Prometheus et Alertmanager configurés
- [ ] **FAIRE MAINTENANT :** Installation de l'environnement
- [ ] **FAIRE MAINTENANT :** Test de l'infrastructure locale

---

## 🚀 À faire MAINTENANT

### Étape 1: Installer l'infrastructure

**Choisissez votre OS :**

#### Windows (PowerShell)
```powershell
# Run as Administrator
cd C:\Users\User\Desktop\pfe
.\scripts\setup-windows.ps1
```

#### macOS/Linux (Bash)
```bash
cd ~/Desktop/pfe
chmod +x scripts/setup-linux.sh
./scripts/setup-linux.sh
```

**⏳ Durée estimée:** 30-45 minutes

---

### Étape 2: Vérifier l'installation

```bash
# Vérifier Docker
docker --version
docker run hello-world

# Vérifier Kubernetes
kubectl version
kubectl cluster-info

# Vérifier Minikube (optionnel)
minikube version
minikube start --driver=docker
minikube status
kubectl get nodes
```

**Résultat attendu:**
```
Docker version 24.x.x
Kubernetes v1.28.x
2 nodes ready (vous + docker-desktop ou minikube)
```

---

### Étape 3: Configuration du fichier .env

**Créer le fichier .env :**

```bash
cp .env.example .env
```

**Éditer .env avec vos valeurs :**

```bash
# Database
DB_USER=postgres
DB_PASSWORD=secure_password_here  # ⚠️ Changer!
DB_NAME=appdb

# Docker Registry
DOCKER_REGISTRY=docker.io
DOCKER_USERNAME=votre_username
DOCKER_PASSWORD=votre_token  # ⚠️ Générer depuis Docker Hub
DOCKER_REGISTRY_URL=votre_username

# Grafana
GRAFANA_ADMIN_PASSWORD=secure_password_here  # ⚠️ Changer!

# Slack (optionnel pour alertes)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Email (optionnel pour alertes)
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
ALERT_EMAIL_TO=devops@company.com
```

---

### Étape 4: Initialiser Git

```bash
# Vérifier que git est initialisé
git status

# Si première fois:
git init
git config user.name "DevSecOps Engineer"
git config user.email "engineer@company.com"
git add .
git commit -m "Initial commit: Phase 1 structure complete"
```

---

### Étape 5: Test simple - Lancer docker-compose

```bash
# Vérifier la syntaxe
docker-compose config

# Lancer les services
docker-compose up -d

# Vérifier le statut
docker-compose ps

# Voir les logs
docker-compose logs -f

# Test d'accès (attendez 30s qu'ils démarrent)
curl http://localhost:9090  # Prometheus
curl http://localhost:3000  # Grafana
curl http://localhost:9093  # Alertmanager
```

**Arrêter les services:**
```bash
docker-compose down
```

---

## 📊 Structure créée

```
projet-devsecops/
├── app/
│   ├── frontend/         # À remplir (Phase 2)
│   ├── backend/          # À remplir (Phase 2)
│   └── database/         # Scripts SQL (Phase 2)
├── docker/               # Dockerfiles (Phase 3)
├── kubernetes/           # K8s manifests (Phase 4)
├── jenkins/              # Pipeline (Phase 5)
├── monitoring/           # ✅ PRÊT
│   ├── prometheus/       # ✅ Config complète
│   ├── grafana/          # À configurer
│   └── alertmanager/     # ✅ Config complète
├── vault/                # Secrets (Phase 6)
├── scripts/              # ✅ Setup scripts
├── docs/                 # Documentation
├── docker-compose.yml    # ✅ Avec monitoring
├── .env.example          # ✅ Template
├── .gitignore            # ✅ Complète
└── README.md             # ✅ Documentation
```

---

## 📚 Documentation importante

| Document | Objectif |
|----------|----------|
| [README.md](../README.md) | Vue d'ensemble du projet |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Architecture technique détaillée |
| [TOOLS_VERSIONS.md](TOOLS_VERSIONS.md) | Versions et installation |
| [PHASE_1.md](PHASE_1.md) | Ce fichier (votre guide Phase 1) |

---

## 🎯 Prochaine étape (Phase 2)

Après avoir terminé la Phase 1:

1. ✅ Environnement installé et vérifié
2. ✅ docker-compose fonctionne
3. ✅ Git configuré

**Phase 2:** Créer l'application multi-tiers
- Frontend simple (React ou HTML/CSS)
- Backend API (Node.js / Python / Java)
- Database (PostgreSQL)

---

## ⚠️ Troubleshooting

### ❌ Docker ne démarre pas
```bash
# Windows: Check Docker Desktop running
# Linux: Check if Docker daemon is running
sudo systemctl status docker

# Si stopped:
sudo systemctl start docker
```

### ❌ kubectl: No connection
```bash
# Vérifier Minikube
minikube start --driver=docker
kubectl config current-context
```

### ❌ Port déjà utilisé
```bash
# Trouver quel process utilise le port
# Windows (PowerShell)
netstat -ano | findstr :3000

# Linux/macOS
lsof -i :3000
```

### ❌ Permission denied (Linux)
```bash
# Ajouter l'utilisateur au groupe docker
sudo usermod -aG docker $USER
newgrp docker
```

---

## 📞 Support

En cas de problème:
1. Consulter la documentation [ARCHITECTURE.md](ARCHITECTURE.md)
2. Vérifier les logs: `docker-compose logs <service>`
3. Re-lancer: `docker-compose down && docker-compose up -d`

---

## ✨ Résumé Phase 1

**Vous avez maintenant:**
- ✅ Infrastructure Docker & Kubernetes prête
- ✅ Monitoring (Prometheus, Grafana) configuré
- ✅ Alerting (Alertmanager) configuré
- ✅ Tous les fichiers de configuration
- ✅ Scripts d'installation automatique
- ✅ Documentation complète

**Prochaine étape:** Phase 2 - Application multi-tiers

---

**Date:** Avril 2026  
**Projet:** DevSecOps PFE - Ingénieur
