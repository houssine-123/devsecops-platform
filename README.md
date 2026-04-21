# 🚀 Projet DevSecOps PFE - Architecture Complète

## 📋 Vue d'ensemble

Ce projet implémente une **architecture DevSecOps complète** pour le déploiement sécurisé et la supervision d'une application multi-tiers sur Kubernetes.

**Objectifs principaux :**
- ✅ Pipeline CI/CD sécurisé (Jenkins)
- ✅ Conteneurisation Docker
- ✅ Orchestration Kubernetes
- ✅ Monitoring & Alertes (Prometheus, Grafana, Alertmanager)
- ✅ Sécurité (Trivy, SonarQube, Vault)
- ✅ Supervision complète (CPU, RAM, services, backups)

---

## 📁 Structure du projet

```
projet-devsecops/
├── app/                          # Application multi-tiers
│   ├── frontend/                 # Interface utilisateur
│   ├── backend/                  # API REST
│   └── database/                 # Configuration BD
├── docker/                       # Dockerfiles
├── kubernetes/                   # Manifests K8s
│   ├── manifests/                # Deployments, Services, Ingress
│   ├── helm/                     # Charts Helm
│   └── argocd/                   # Config Argo CD
├── jenkins/                      # Pipeline CI/CD
├── monitoring/                   # Stack monitoring
│   ├── prometheus/               # Collecte des métriques
│   ├── grafana/                  # Dashboards
│   └── alertmanager/             # Gestion des alertes
├── vault/                        # Gestion des secrets
├── scripts/                      # Scripts d'installation
└── docs/                         # Documentation
```

---

## 🛠️ Technologies utilisées

| Couche | Outils |
|--------|--------|
| **CI/CD** | Jenkins, Git |
| **Conteneurisation** | Docker, Docker Compose |
| **Orchestration** | Kubernetes, Argo CD |
| **Sécurité** | Trivy, SonarQube, HashiCorp Vault |
| **Monitoring** | Prometheus, Grafana, Alertmanager, Node Exporter |
| **Infrastructure** | Minikube / Docker Desktop K8s |

---

## 🚀 Démarrage rapide

### Prérequis
- Docker Desktop (avec K8s activé) ou Minikube
- Git
- Kubectl configuré
- Node.js / Python / Java (selon vos préférences)

### Installation
```bash
# 1. Cloner le repo
git clone <repo-url>
cd projet-devsecops

# 2. Initialiser git et structure
./scripts/setup.sh

# 3. Lancer l'application en local
docker-compose -f docker-compose.yml up -d

# 4. Vérifier le déploiement
kubectl get pods
```

---

## 📊 Phases du projet

| Phase | Objectif | Durée |
|-------|----------|-------|
| **Phase 1** | Architecture & Préparation | 1-2 sem |
| **Phase 2** | Application multi-tiers | 2 sem |
| **Phase 3** | Conteneurisation Docker | 1 sem |
| **Phase 4** | Déploiement Kubernetes | 2 sem |
| **Phase 5** | Pipeline CI/CD Jenkins | 2 sem |
| **Phase 6** | Sécurité | 1 sem |
| **Phase 7** | Monitoring & Alertes | 2 sem |
| **Phase 8** | Tests & Documentation | 1 sem |

---

## 📚 Documentation

- [Architecture détaillée](docs/ARCHITECTURE.md)
- [Guide d'installation](docs/SETUP.md)
- [Configuration des outils](docs/TOOLS_CONFIG.md)
- [Procédures opérationnelles](docs/OPERATIONS.md)

---

## 👨‍💻 Auteur
Projet PFE - Ingénieur DevSecOps
