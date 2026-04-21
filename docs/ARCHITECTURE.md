# 🏗️ Architecture DevSecOps - Documentation Technique

## 1. Vue d'ensemble globale

```
┌─────────────────────────────────────────────────────────────────┐
│                     FLUX CI/CD & DÉPLOIEMENT                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Git → Jenkins → SonarQube → Trivy → Docker Build → Registry    │
│        ↓                                           ↓             │
│        └─────────────→ Argo CD ────→ Kubernetes ◄─┘             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION MULTI-TIERS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌──────────┐       ┌──────────┐       ┌──────────┐            │
│   │ Frontend │       │ Backend  │       │ Database │            │
│   │ (React)  │◄──────┤ (API)    │◄──────┤(PostgreSQL)           │
│   └──────────┘       └──────────┘       └──────────┘            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   KUBERNETES & ORCHESTRATION                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌────────────────────────────────────────────────────────┐    │
│   │              KUBERNETES CLUSTER                         │    │
│   │ ┌──────────┐  ┌──────────┐  ┌──────────┐              │    │
│   │ │Deployment│  │Deployment│  │Deployment│              │    │
│   │ │Frontend  │  │Backend   │  │Database  │              │    │
│   │ └────┬─────┘  └────┬─────┘  └────┬─────┘              │    │
│   │      │             │             │                     │    │
│   │ ┌────▼─────────────▼─────────────▼─────┐              │    │
│   │ │         Services (ClusterIP)          │              │    │
│   │ └──────────────────┬────────────────────┘              │    │
│   │                    │                                   │    │
│   │ ┌──────────────────▼────────────────────┐              │    │
│   │ │         Ingress (NGINX)                │              │    │
│   │ │   frontend.example.com                 │              │    │
│   │ └────────────────────────────────────────┘              │    │
│   └────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    MONITORING & SUPERVISION                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Node Exporter          Prometheus         Grafana              │
│   (métriques)           (stockage)       (visualisation)        │
│       │                     │                  │                 │
│       └─────────────────────┼──────────────────┘                │
│                             │                                   │
│                      Alertmanager                               │
│                    (Email/Slack/Webhook)                        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      SÉCURITÉ & SECRETS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Trivy (Scan images) → SonarQube → HashiCorp Vault              │
│                       (Qualité)    (Secrets)                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Composants détaillés

### 2.1 CI/CD Pipeline (Jenkins)

**Stages du pipeline :**

```groovy
1. Git Checkout      → Récupération du code
2. Build             → Compilation application
3. Unit Tests        → Tests unitaires
4. SonarQube         → Analyse de code / Couverture
5. Trivy Scan        → Scan vulnérabilités images
6. Docker Build      → Construction images
7. Docker Push       → Push vers registry
8. Argo CD Deploy    → Déploiement K8s automatique
9. Health Checks     → Vérification services
```

### 2.2 Application Multi-tiers

#### Frontend
- **Stack** : React / Vue.js / Angular
- **Port** : 3000
- **Dockerfile** : Multi-stage (build + nginx)

#### Backend
- **Stack** : Node.js / Python / Java
- **Port** : 5000 (ou 8080)
- **Endpoints** : 
  - `GET /api/health` → Health check
  - `GET /api/metrics` → Prometheus metrics
  - `POST /api/users` → CRUD users

#### Database
- **Type** : PostgreSQL / MySQL
- **Port** : 5432 (PostgreSQL)
- **Volumes** : Persistent Storage

### 2.3 Kubernetes Architecture

#### Deployments
```yaml
Frontend Deployment
├── Replicas: 2-3
├── Image: frontend:latest
└── Resources: CPU 100m, RAM 128Mi

Backend Deployment
├── Replicas: 2-3
├── Image: backend:latest
└── Resources: CPU 250m, RAM 256Mi

Database Deployment
├── Replicas: 1
├── Image: postgres:14
└── Persistent Volume: 10Gi
```

#### Services
```yaml
Service Frontend        → ClusterIP:3000
Service Backend         → ClusterIP:5000
Service Database        → ClusterIP:5432
Service Prometheus      → ClusterIP:9090
Service Grafana         → ClusterIP:3000
```

#### Ingress
```yaml
Ingress NGINX
├── app.example.com → Frontend Service
├── api.example.com → Backend Service
└── HTTPS TLS enabled
```

### 2.4 Monitoring Stack

#### Prometheus
- **Role** : Collecte et stockage des métriques
- **Retention** : 15 jours
- **Scrape interval** : 15s
- **Cibles** :
  - Node Exporter (9100)
  - kube-state-metrics (8080)
  - Application metrics (5000/metrics)

#### Grafana
- **Port** : 3000
- **Datasource** : Prometheus
- **Dashboards** :
  - Infrastructure (CPU, RAM, disque)
  - Kubernetes (pods, nodes, PVC)
  - Application (requêtes, latence)
  - Sécurité (scans, vulnérabilités)

#### Alertmanager
- **Règles** :
  - CPU > 80% → Alert Warning
  - RAM > 90% → Alert Critical
  - Service DOWN → Alert Critical
  - Backup FAILED → Alert Critical

### 2.5 Sécurité

#### Trivy
```bash
trivy image <registry>/<image>:<tag>
# Scan automatique dans Jenkins pipeline
```

#### SonarQube
- Analyse qualité code
- Coverage cible : > 80%
- Security hotspots : 0 critique

#### HashiCorp Vault
- Gestion des secrets
- Injection automatique dans K8s
- Rotation des credentials

---

## 3. Flux de déploiement

### 3.1 Flux local (Docker Compose)

```
Git → Local Build → Docker Compose Up
         ↓
    http://localhost:3000 (Frontend)
    http://localhost:5000 (Backend)
    DB accessible en local
```

### 3.2 Flux Kubernetes (Minikube)

```
Git → Jenkins Build → Docker Registry
        ↓
    Argo CD Sync
        ↓
    kubectl apply manifests
        ↓
    Pods running on K8s
        ↓
    kubectl port-forward service/frontend 3000:3000
```

### 3.3 Flux Production (recommandé)

```
Git Commit → Jenkins Pipeline
    ↓
SonarQube (Code Quality)
    ↓
Trivy (Image Scan)
    ↓
Docker Build & Push
    ↓
Argo CD Sync (GitOps)
    ↓
Kubernetes Deployment
    ↓
Prometheus Scrape
    ↓
Grafana Visualize
    ↓
Alertmanager (Anomalies)
```

---

## 4. Gestion des secrets

### Secrets K8s
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
data:
  username: cG9zdGdyZXM=  # base64
  password: Y2hhbmdlbWU=   # base64
```

### Vault Integration
```bash
# Authentification K8s
vault auth enable kubernetes

# Secrets engine
vault secrets enable -path=secret kv
vault kv put secret/db/postgres password=xxxx
```

---

## 5. Alertes et incidents

### Règles Prometheus
```yaml
groups:
  - name: infrastructure
    rules:
      - alert: HighCPUUsage
        expr: node_cpu_usage > 80
        for: 5m
        
      - alert: HighMemoryUsage
        expr: node_memory_usage > 90
        for: 5m
        
      - alert: ServiceDown
        expr: up{job="backend"} == 0
        for: 1m
        
      - alert: BackupFailed
        expr: backup_success == 0
        for: 15m
```

### Notifications
- **Email** : admin@company.com
- **Slack** : #alerts channel
- **Webhook** : Custom integration

---

## 6. Sauvegarde et récupération

### Backup Strategy
- **Fréquence** : Quotidienne à 2h du matin
- **Rétention** : 30 jours
- **Cible** : Stockage externe (S3 ou NFS)

### Test de récupération
- Mensuel pour la DB
- Trimestral pour la stack complète

---

## 7. Métriques clés à surveiller

| Métrique | Seuil Warning | Seuil Critical |
|----------|--------------|----------------|
| CPU Node | 70% | 90% |
| Memory Node | 80% | 95% |
| Disk Space | 75% | 90% |
| Pod Restart Count | > 5/h | > 10/h |
| API Latency | > 500ms | > 2s |
| Error Rate | > 1% | > 5% |
| Container CPU | 500m | 1000m |

---

## 8. Accès et authentification

## RBAC Kubernetes
```yaml
- Role: developer (read deployments, logs)
- Role: operator (manage deployments)
- Role: admin (full access)
```

---

## 9. Scalabilité et haute disponibilité

### HPA (Horizontal Pod Autoscaler)
```yaml
- Target CPU: 70%
- Min Replicas: 2
- Max Replicas: 5
```

### Ressources garanties
```yaml
requests:
  cpu: 100m
  memory: 128Mi
limits:
  cpu: 500m
  memory: 512Mi
```

---

## 10. Version des outils

Voir [TOOLS_VERSIONS.md](TOOLS_VERSIONS.md)
