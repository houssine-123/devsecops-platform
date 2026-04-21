# ============================================================================
# QUICK START GUIDE - DevSecOps Project
# ============================================================================

## 🚀 Pour démarrer rapidement

### 1️⃣ INSTALLATION (Première fois seulement)

**Windows :**
```powershell
cd C:\Users\User\Desktop\pfe
.\scripts\setup-windows.ps1
```

**macOS / Linux :**
```bash
cd ~/Desktop/pfe
chmod +x scripts/setup-linux.sh
./scripts/setup-linux.sh
```

### 2️⃣ VÉRIFIER L'INSTALLATION

```bash
# Tester les outils
docker --version
kubectl version --client
helm version --short
minikube status  # ou vérifier Docker Desktop K8s

# Vérifier la configuration
./scripts/verify.sh
```

### 3️⃣ CRÉER LE FICHIER .env

```bash
# Créer depuis le template (par défaut)
cp .env.example .env

# IMPORTANT: Éditer le fichier .env avec vos valeurs réelles
# - DB_PASSWORD
# - DOCKER_PASSWORD
# - GRAFANA_ADMIN_PASSWORD
```

### 4️⃣ DÉMARRER LES SERVICES LOCALEMENT

```bash
# Lancer tous les services
docker-compose up -d

# Attendre 30 secondes pour que les services démarrent
sleep 30

# Vérifier que tout s'est bien lancé
docker-compose ps

# Voir les logs
docker-compose logs -f

# Test d'accès
curl http://localhost:9090      # Prometheus
curl http://localhost:3000      # Grafana (login: admin/admin123)
curl http://localhost:9093      # Alertmanager
```

### 5️⃣ ARRÊTER LES SERVICES

```bash
docker-compose down
```

---

## 📊 Accès aux services

| Service | URL | Notes |
|---------|-----|-------|
| **Prometheus** | http://localhost:9090 | Métriques - pas de login |
| **Grafana** | http://localhost:3000 | Login: admin / admin123 |
| **Alertmanager** | http://localhost:9093 | Gestion des alertes |
| **Backend API** | http://localhost:5000 | Health: /api/health |
| **Frontend** | http://localhost:3000 | React app (si Phase 2 complétée) |
| **Database** | localhost:5432 | PostgreSQL (si Phase 2 complétée) |

---

## ⚡ Commandes utiles

```bash
# Kubernetes
kubectl get pods                    # Voir les pods
kubectl get services               # Voir les services
kubectl logs <pod-name>            # Voir les logs d'un pod
kubectl describe pod <pod-name>    # Détails d'un pod

# Docker
docker ps                          # Services en cours
docker logs <container>            # Logs d'un container
docker-compose restart             # Redémarrer les services

# Git
git status                         # État des changements
git add .                          # Ajouter tous les fichiers
git commit -m "message"            # Faire un commit
git push                           # Pousser vers le serveur
```

---

## 🐛 Troubleshooting rapide

### Erreur: "docker-compose: command not found"
```bash
# Utiliser Docker Compose v2 (inclus dans Docker Desktop)
docker compose up -d
```

### Erreur: "kubectl: connection refused"
```bash
# Démarrer Minikube
minikube start --driver=docker

# OU activer K8s dans Docker Desktop Settings → Kubernetes
```

### Port déjà utilisé (e.g., 3000)
```bash
# Trouver quel process utilise le port
lsof -i :3000          # macOS/Linux
netstat -ano | findstr :3000  # Windows PowerShell

# Changer le port dans docker-compose.yml
# ou kill le process
kill -9 <PID>          # macOS/Linux
taskkill /PID <PID> /F # Windows
```

### Services ne démarrent pas
```bash
# Vérifier les logs
docker-compose logs

# Vérifier la configuration
docker-compose config

# Redémarrer tout
docker-compose down
docker-compose up -d
```

---

## 📚 Documentation complète

- **README.md** - Vue d'ensemble
- **docs/ARCHITECTURE.md** - Architecture technique
- **docs/PHASE_1.md** - Guide Phase 1
- **docs/TOOLS_VERSIONS.md** - Installation des outils

---

## 🎯 Prochaines étapes

1. ✅ Terminer Phase 1 (ce que vous faites maintenant)
2. 📋 Lire [Phase 2: Application multi-tiers](docs/PHASE_2.md) (à créer)
3. 🐳 Phase 3: Conteneurisation Docker
4. ☸️ Phase 4: Déploiement Kubernetes
5. 🔄 Phase 5: Pipeline CI/CD Jenkins
6. 🔐 Phase 6: Sécurité
7. 📊 Phase 7: Monitoring avancé

---

## 💡 Tips

- **Toujours lancer docker-compose comme base** pour tester localement
- **Consulter les logs** si quelque chose ne fonctionne pas
- **Pousser dans Git** après chaque étape complétée
- **Lire la documentation** avant de créer la prochaine phase

---

**Bon courage avec votre projet PFE! 🚀**
