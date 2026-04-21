# Checklist - Infrastructure & Outils

## ✅ Prérequis d'installation

### Windows
- [ ] Windows 10/11 Pro / Enterprise (pour Hyper-V ou WSL2)
- [ ] Administrator access
- [ ] Compte Docker Hub
- [ ] Internet connection (4GB+ bandwidth)

### macOS
- [ ] macOS 10.13+ (Intel ou Apple Silicon)
- [ ] Homebrew installé
- [ ] Compte Docker Hub
- [ ] Internet connection

### Linux (Ubuntu/Debian)
- [ ] Ubuntu 18.04+
- [ ] sudo access
- [ ] Compte Docker Hub
- [ ] Internet connection

---

## 📦 Installation complète (Check off as you go)

### 1️⃣ CORE TOOLS

- [ ] **Docker**: `docker --version`
  - Expected: Docker version 24.x.x or higher
  - Time: 10 min
  
- [ ] **Git**: `git --version`
  - Expected: git version 2.40 or higher
  - Time: 5 min

- [ ] **kubectl**: `kubectl version --client --short`
  - Expected: v1.28 or higher
  - Time: 5 min

- [ ] **Minikube or K8s Docker Desktop**: 
  - [ ] Minikube: `minikube status`
  - [ ] OR Docker Desktop K8s enabled
  - Expected: Running / Docker Desktop Kubernetes enabled
  - Time: 15 min (Minikube) / Already in Docker Desktop

### 2️⃣ KUBERNETES TOOLS

- [ ] **Helm**: `helm version --short`
  - Expected: v3.13 or higher
  - Time: 5 min

- [ ] **Kustomize** (optional): `kustomize version`
  - Time: 5 min

### 3️⃣ DEVELOPMENT TOOLS

Choose ONE of the following for backend development:

- [ ] **Node.js 18 LTS**: `node --version` AND `npm --version`
  - Expected: v18.x.x AND npm 9.x.x
  - Time: 10 min
  
- [ ] **Python 3.10+**: `python3 --version`
  - Expected: Python 3.10 or higher
  - Time: 10 min
  
- [ ] **Java 17/21**: `java -version`
  - Expected: Java 17 or 21
  - Time: 15 min

### 4️⃣ OPTIONAL TOOLS (For later phases)

- [ ] **Jenkins** (Phase 5): Will be containerized
- [ ] **SonarQube** (Phase 6): Will be containerized
- [ ] **Trivy** (Phase 6): Can be installed now or later
- [ ] **Vault** (Phase 6): Will be containerized

---

## 🔍 Verification Script

### Windows (Run in PowerShell as Admin)

```powershell
# Run this script to verify installation
Write-Host "=== INFRASTRUCTURE VERIFICATION ===" -ForegroundColor Green

$tools = @{
    "Docker" = "docker --version"
    "Git" = "git --version"
    "kubectl" = "kubectl version --client --short"
    "Node.js" = "node --version"
    "Minikube" = "minikube version"
    "Helm" = "helm version --short"
}

foreach ($tool in $tools.GetEnumerator()) {
    try {
        $version = Invoke-Expression $tool.Value 2>&1 | Select-Object -First 1
        Write-Host "✓ $($tool.Name): $version" -ForegroundColor Green
    } catch {
        Write-Host "✗ $($tool.Name): NOT INSTALLED" -ForegroundColor Red
    }
}

# Check Kubernetes cluster
Write-Host "`n=== KUBERNETES CLUSTER ===" -ForegroundColor Green
try {
    kubectl get nodes
} catch {
    Write-Host "✗ Kubernetes cluster not accessible" -ForegroundColor Yellow
    Write-Host "  → Start Minikube: minikube start --driver=docker" -ForegroundColor Yellow
    Write-Host "  → OR enable in Docker Desktop Settings → Kubernetes" -ForegroundColor Yellow
}
```

### Linux/macOS (Run in Terminal)

```bash
#!/bin/bash
echo "=== INFRASTRUCTURE VERIFICATION ==="

verify_tool() {
    if command -v $1 &> /dev/null; then
        version=$($2 2>&1 | head -n1)
        echo "✓ $1: $version"
    else
        echo "✗ $1: NOT INSTALLED"
    fi
}

verify_tool "docker" "docker --version"
verify_tool "git" "git --version"
verify_tool "kubectl" "kubectl version --client --short"
verify_tool "node" "node --version"
verify_tool "minikube" "minikube version"
verify_tool "helm" "helm version --short"

echo -e "\n=== KUBERNETES CLUSTER ==="
kubectl get nodes 2>/dev/null || echo "✗ Kubernetes cluster not accessible"
```

---

## 📋 Setup Checklist

### Initial Setup
- [ ] Directory structure created: ✅
- [ ] .gitignore configured: ✅
- [ ] .env.example created: ✅
- [ ] Git initialized
- [ ] First commit made

### Docker & Kubernetes
- [ ] Docker installed and running
- [ ] Docker Compose verified: `docker-compose version`
- [ ] Kubernetes cluster accessible: `kubectl cluster-info`
- [ ] Kubectl configured: `kubectl config current-context`

### Development Environment
- [ ] Preferred language installed (Node/Python/Java)
- [ ] npm/pip/Maven available
- [ ] .env file created from .env.example: ✅
- [ ] .env file configured with your values

### Monitoring Stack (Local Test)
- [ ] `docker-compose up -d` successful
- [ ] Prometheus accessible: http://localhost:9090
- [ ] Grafana accessible: http://localhost:3000 (admin / admin123)
- [ ] Alertmanager accessible: http://localhost:9093

### Git Repository
- [ ] Git user configured
- [ ] Initial commit created
- [ ] Remote repository (GitHub/GitLab) created
- [ ] Remote pushed: `git push origin main`

---

## ⚡ Total Setup Time

| Component | Time |
|-----------|------|
| Script execution | 30-45 min |
| Docker pulling images | 10-15 min |
| Verification | 5 min |
| Configuration | 10 min |
| **TOTAL** | **60-75 minutes** |

---

## 🎯 Next Steps After Setup

1. Run the verification commands above
2. Ensure all tools show version numbers
3. Test basic functionality:
   ```bash
   kubectl get pods
   docker ps
   helm list
   ```
4. Fix any issues (see Troubleshooting in PHASE_1.md)
5. Ready for **Phase 2: Application Development**

---

## 📞 Issues?

Check [PHASE_1.md](PHASE_1.md#troubleshooting) for troubleshooting guide.

---

## 🎓 Example of Completed Setup

After everything is installed and verified, you should be able to:

```bash
# Check all versions
$ docker --version
Docker version 24.0.5, build 24.0.5

$ kubectl version --client --short
Client Version: v1.28.0

$ minikube status
minikube
type: Control Plane
host: Running
kubelet: Running
apiserver: Running
kubeconfig: Configured

$ helm version --short
v3.13.0

$ node --version
v18.18.0
```

✅ **If all of these work, you're ready for Phase 2!**
