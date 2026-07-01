# ============================================================
# Phase 4: Déploiement Kubernetes - README
# ============================================================

## ☸️ Vue d'ensemble

Cette phase couvre le déploiement complet de la plateforme DevSecOps sur Kubernetes avec :

- **Deployments** pour frontend, backend et PostgreSQL
- **Services** (ClusterIP, LoadBalancer)
- **Ingress** pour l'accès HTTP/HTTPS
- **ConfigMaps/Secrets** pour la configuration
- **PersistentVolumes** pour la persistance des données
- **Tests** sur cluster local (Minikube/Docker Desktop)

## 🏗️ Architecture K8s

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Ingress       │────│   Frontend      │────│   Backend       │
│   (Nginx)       │    │   Service       │    │   Service       │
│                 │    │   (LoadBalancer)│    │   (ClusterIP)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   Service       │
                    │   (ClusterIP)   │
                    │   + PVC         │
                    └─────────────────┘
```

## 📁 Structure des manifests

```
kubernetes/
├── manifests/
│   ├── namespace.yaml           # Namespace devsecops-platform
│   ├── configmap.yaml           # Configuration non-sensible
│   ├── secret.yaml              # Données sensibles (mots de passe)
│   ├── pvc.yaml                 # PersistentVolumeClaim pour PostgreSQL
│   ├── postgres-deployment.yaml # Deployment PostgreSQL
│   ├── postgres-service.yaml    # Service PostgreSQL (ClusterIP)
│   ├── backend-deployment.yaml  # Deployment Backend
│   ├── backend-service.yaml     # Service Backend (ClusterIP)
│   ├── frontend-deployment.yaml # Deployment Frontend
│   ├── frontend-service.yaml    # Service Frontend (LoadBalancer)
│   └── ingress.yaml             # Ingress pour accès HTTP
├── deploy-k8s.sh                # Script déploiement (Linux/Mac)
├── deploy-k8s.ps1               # Script déploiement (Windows)
└── README.md                    # Cette documentation
```

## 🚀 Déploiement rapide

### Prérequis

1. **Cluster Kubernetes** (Minikube, Docker Desktop, ou cloud)
   ```bash
   # Minikube
   minikube start

   # Docker Desktop
   # Activer Kubernetes dans Settings > Kubernetes
   ```

2. **kubectl** configuré
   ```bash
   kubectl cluster-info
   ```

3. **Ingress Controller** (optionnel pour l'ingress)
   ```bash
   # Minikube
   minikube addons enable ingress

   # Docker Desktop
   # Automatiquement disponible
   ```

### Déploiement automatique

**Linux/Mac:**
```bash
cd kubernetes
chmod +x deploy-k8s.sh
./deploy-k8s.sh
```

**Windows:**
```powershell
cd kubernetes
.\deploy-k8s.ps1
```

### Déploiement manuel

```bash
cd kubernetes/manifests

# 1. Créer le namespace
kubectl apply -f namespace.yaml

# 2. Configuration
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml

# 3. Stockage persistant
kubectl apply -f pvc.yaml

# 4. Base de données
kubectl apply -f postgres-deployment.yaml
kubectl apply -f postgres-service.yaml

# Attendre que PostgreSQL soit prêt
kubectl wait --for=condition=available deployment/postgres-deployment -n devsecops-platform

# 5. Backend
kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml

# Attendre que le backend soit prêt
kubectl wait --for=condition=available deployment/backend-deployment -n devsecops-platform

# 6. Frontend
kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml

# 7. Ingress
kubectl apply -f ingress.yaml
```

## 🔍 Vérification du déploiement

### Status des ressources
```bash
# Tout voir
kubectl get all -n devsecops-platform

# Pods détaillés
kubectl get pods -n devsecops-platform -o wide

# Services
kubectl get svc -n devsecops-platform

# Ingress
kubectl get ingress -n devsecops-platform
```

### Logs et debugging
```bash
# Logs backend
kubectl logs -f deployment/backend-deployment -n devsecops-platform

# Logs frontend
kubectl logs -f deployment/frontend-deployment -n devsecops-platform

# Logs PostgreSQL
kubectl logs -f deployment/postgres-deployment -n devsecops-platform

# Décrire un pod pour debug
kubectl describe pod <pod-name> -n devsecops-platform
```

### Tests fonctionnels

**Via LoadBalancer:**
```bash
# Obtenir l'IP du LoadBalancer
kubectl get svc frontend-service -n devsecops-platform

# Tester l'application
curl http://<LOADBALANCER_IP>
```

**Via Ingress (avec ingress controller):**
```bash
# Ajouter au fichier hosts
echo "127.0.0.1 devsecops.local" | sudo tee -a /etc/hosts

# Tester
curl http://devsecops.local
curl http://devsecops.local/api/health
```

**Via port-forwarding (pour debug):**
```bash
# Frontend
kubectl port-forward svc/frontend-service 3000:80 -n devsecops-platform

# Backend
kubectl port-forward svc/backend-service 5000:5000 -n devsecops-platform

# PostgreSQL (si besoin)
kubectl port-forward svc/postgres-service 5432:5432 -n devsecops-platform
```

## ⚙️ Configuration

### Variables d'environnement

**ConfigMap (`app-config`):**
```yaml
APP_ENV: production
APP_PORT: "5000"
DB_HOST: postgres-service
DB_PORT: "5432"
DB_NAME: appdb
VITE_API_URL: http://backend-service:5000
```

**Secret (`app-secrets`):**
```yaml
DB_PASSWORD: <base64-encoded>
POSTGRES_PASSWORD: <base64-encoded>
JWT_SECRET: <base64-encoded>
```

### Ressources et scaling

**Scaling des deployments:**
```bash
# Backend
kubectl scale deployment backend-deployment --replicas=3 -n devsecops-platform

# Frontend
kubectl scale deployment frontend-deployment --replicas=5 -n devsecops-platform
```

**Ressources actuelles:**
- **PostgreSQL**: 256Mi-512Mi RAM, 250m-500m CPU
- **Backend**: 128Mi-256Mi RAM, 100m-200m CPU
- **Frontend**: 64Mi-128Mi RAM, 50m-100m CPU

### Stockage persistant

**PVC Configuration:**
```yaml
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: standard
```

## 🌐 Accès à l'application

### URLs d'accès

1. **LoadBalancer** (recommandé):
   ```bash
   kubectl get svc frontend-service -n devsecops-platform
   # EXTERNAL-IP: <IP>
   # URL: http://<EXTERNAL-IP>
   ```

2. **Ingress** (avec controller):
   ```bash
   # Ajouter au /etc/hosts: 127.0.0.1 devsecops.local
   # URL: http://devsecops.local
   # API: http://devsecops.local/api
   ```

3. **Port-forwarding** (développement):
   ```bash
   kubectl port-forward svc/frontend-service 8080:80 -n devsecops-platform
   # URL: http://localhost:8080
   ```

### Endpoints disponibles

- **Frontend**: `/` - Interface utilisateur
- **Backend API**:
  - `/api/health` - Health check
  - `/api/servers` - Gestion serveurs
  - `/api/services` - Gestion services
  - `/api/alerts` - Gestion alertes
  - `/api/dashboard` - Statistiques

## 🧹 Nettoyage

### Supprimer le déploiement
```bash
# Tout supprimer
kubectl delete namespace devsecops-platform

# Ou supprimer sélectivement
kubectl delete -f manifests/ -n devsecops-platform
```

### Script de nettoyage
```bash
# Linux/Mac
./deploy-k8s.sh  # Puis kubectl delete namespace devsecops-platform

# Windows
.\deploy-k8s.ps1 -Clean
```

## 🔧 Dépannage

### Problèmes courants

**Pods en Pending:**
```bash
kubectl describe pod <pod-name> -n devsecops-platform
# Vérifier les events et les ressources
```

**Pods en CrashLoopBackOff:**
```bash
kubectl logs <pod-name> -n devsecops-platform --previous
# Vérifier les logs d'erreur
```

**Service non accessible:**
```bash
kubectl get endpoints -n devsecops-platform
# Vérifier que les pods sont bien ciblés
```

**PVC en Pending:**
```bash
kubectl get pvc -n devsecops-platform
kubectl describe pvc postgres-pvc -n devsecops-platform
# Vérifier la StorageClass disponible
```

### Commandes utiles

```bash
# Voir les événements
kubectl get events -n devsecops-platform --sort-by=.metadata.creationTimestamp

# Debug réseau
kubectl exec -it <pod-name> -n devsecops-platform -- nslookup postgres-service

# Vérifier les variables d'environnement
kubectl exec -it <pod-name> -n devsecops-platform -- env

# Test de connectivité base de données
kubectl exec -it <backend-pod> -n devsecops-platform -- curl postgres-service:5432
```

## 📊 Métriques et monitoring

### Ressources utilisées
```bash
kubectl top pods -n devsecops-platform
kubectl top nodes
```

### Health checks
```bash
# Vérifier les probes
kubectl get pods -n devsecops-platform
# READY: 1/1 = healthy
```

## 🚀 Prochaine phase

Phase 5: Pipeline CI/CD (Jenkins) - Automatisation des déploiements et tests.

## ✅ Checklist Phase 4

- [x] Namespace créé
- [x] ConfigMaps et Secrets configurés
- [x] PVC pour persistance PostgreSQL
- [x] Deployments (PostgreSQL, Backend, Frontend)
- [x] Services (ClusterIP, LoadBalancer)
- [x] Ingress pour accès HTTP
- [x] Scripts de déploiement (Linux/Windows)
- [x] Tests sur cluster local validés
- [x] Documentation complète

**Phase 4 terminée avec succès !** 🎉