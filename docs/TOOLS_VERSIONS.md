# 🛠️ Versions des outils - Configuration

## Outils recommandés

### Core Infrastructure

| Outil | Version | Rôle |
|-------|---------|------|
| **Kubernetes** | 1.28+ | Orchestration conteneurs |
| **Docker** | 24.0+ | Containerization |
| **Git** | 2.40+ | Version control |
| **Minikube** | 1.32+ | K8s local |
| **kubectl** | 1.28+ | K8s CLI |

### CI/CD

| Outil | Version | Rôle |
|-------|---------|------|
| **Jenkins** | 2.387+ | Pipeline orchestration |
| **Git** | 2.40+ | Code repository |
| **Nextflow** (opt) | 23.10+ | Scientific workflows |

### Security

| Outil | Version | Rôle |
|-------|---------|------|
| **Trivy** | 0.46+ | Image vulnerability scan |
| **SonarQube** | 10.1+ | Code quality analysis |
| **Vault** | 1.15+ | Secrets management |
| **Falco** (opt) | 0.36+ | Runtime security |

### Monitoring & Logging

| Outil | Version | Rôle |
|-------|---------|------|
| **Prometheus** | 2.48+ | Metrics collection |
| **Grafana** | 10.2+ | Visualization |
| **Alertmanager** | 0.26+ | Alert management |
| **Node Exporter** | 1.7+ | System metrics |
| **k8s-prometheus-adapter** | 0.11+ | K8s metrics |
| **Loki** (opt) | 2.9+ | Log aggregation |
| **Promtail** (opt) | 2.9+ | Log shipping |

### GitOps & Deployment

| Outil | Version | Rôle |
|-------|---------|------|
| **Argo CD** | 2.9+ | GitOps deployment |
| **Helm** | 3.13+ | K8s package manager |
| **Kustomize** | 5.2+ | K8s customization |

### Application Stack

| Outil | Version | Type |
|-------|---------|------|
| **Node.js** | 18 LTS / 20 | Backend (JS) |
| **Python** | 3.10+ | Backend (Python) |
| **Java** | 17 / 21 LTS | Backend (Java) |
| **PostgreSQL** | 14+ | Database |
| **Redis** | 7.0+ (opt) | Caching |

---

## Installation rapide

### Windows (PowerShell)

```powershell
# Chocolatey (si non installé)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Docker Desktop (avec K8s)
choco install docker-desktop -y

# Git
choco install git -y

# Minikube
choco install minikube -y

# kubectl
choco install kubernetes-cli -y

# Helm
choco install kubernetes-helm -y

# Node.js (si backend Node)
choco install nodejs -y

# VS Code (optionnel mais recommandé)
choco install vscode -y
```

### macOS (Homebrew)

```bash
# Git
brew install git

# Docker Desktop
brew install --cask docker

# Minikube
brew install minikube

# kubectl
brew install kubectl

# Helm
brew install helm

# Node.js
brew install node
```

### Linux (Ubuntu/Debian)

```bash
# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Minikube
curl -LO https://github.com/kubernetes/minikube/releases/latest/download/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Git
sudo apt update && sudo apt install git -y
```

---

## Versions détaillées pour démarrer

### Minimum viable stack

**Pour Phase 1-3 (dev local) :**
```
✓ Docker 24.0
✓ Docker Compose 2.20
✓ Git 2.40
✓ Node.js 18 LTS (ou Python 3.10)
✓ PostgreSQL 14
```

**Estimer temps d'installation : 30-45 min**

### Full stack (Phase 4+)

**Pour Phase 4-7 (K8s + monitoring) :**
```
✓ Tout du minimum viable
✓ Minikube 1.32 / Docker Desktop K8s
✓ kubectl 1.28
✓ Helm 3.13
✓ Jenkins 2.387 (Docker container)
✓ Prometheus 2.48
✓ Grafana 10.2
✓ Trivy 0.46
✓ Argo CD 2.9
```

**Estimer temps d'installation : 2 heures**

---

## Vérification de l'installation

### Script de vérification

```bash
#!/bin/bash
echo "=== Vérification des outils ==="

# Docker
docker --version && echo "✓ Docker OK" || echo "✗ Docker MANQUANT"

# Docker Compose
docker compose version && echo "✓ Docker Compose OK" || echo "✗ Docker Compose MANQUANT"

# Git
git --version && echo "✓ Git OK" || echo "✗ Git MANQUANT"

# kubectl
kubectl version --client && echo "✓ kubectl OK" || echo "✗ kubectl MANQUANT"

# Minikube
minikube version && echo "✓ Minikube OK" || echo "✗ Minikube MANQUANT"

# Helm
helm version && echo "✓ Helm OK" || echo "✗ Helm MANQUANT"

# Node.js
node --version && echo "✓ Node.js OK" || echo "✗ Node.js MANQUANT"

# Python
python3 --version && echo "✓ Python OK" || echo "✗ Python MANQUANT"

echo "=== Vérification terminée ==="
```

---

## Liens de téléchargement

| Outil | Lien |
|-------|------|
| Docker Desktop | https://www.docker.com/products/docker-desktop |
| Minikube | https://minikube.sigs.k8s.io/docs/start/ |
| kubectl | https://kubernetes.io/docs/tasks/tools/ |
| Helm | https://helm.sh/docs/intro/install/ |
| Git | https://git-scm.com/downloads |
| Jenkins | https://www.jenkins.io/download/ |
| Prometheus | https://prometheus.io/download/ |
| Grafana | https://grafana.com/grafana/download |
| Trivy | https://github.com/aquasecurity/trivy |
| Vault | https://www.vaultproject.io/downloads |

---

## Prochaines étapes

1. ✅ Installer les **outils minimum viable**
2. ✅ Vérifier l'installation avec le script
3. ✅ Initialiser Minikube/K8s Docker Desktop
4. ✅ Tester `docker ps`, `kubectl get nodes`
5. ➡️ Phase 2 : Créer l'application multi-tiers
