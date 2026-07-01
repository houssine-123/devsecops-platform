# Phase 4: Kubernetes Deployment Script (PowerShell)
# Usage: .\deploy-k8s.ps1

param(
    [switch]$SkipWait,
    [switch]$Clean
)

Write-Host "🚀 Phase 4: Déploiement Kubernetes - DevSecOps Platform" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green

# Check if kubectl is available
if (!(Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Host "❌ kubectl is not installed. Please install kubectl first." -ForegroundColor Red
    exit 1
}

# Check if cluster is accessible
try {
    kubectl cluster-info | Out-Null
} catch {
    Write-Host "❌ Cannot connect to Kubernetes cluster. Please ensure your cluster is running and kubectl is configured." -ForegroundColor Red
    exit 1
}

Write-Host "🔍 Checking cluster status..." -ForegroundColor Yellow
kubectl cluster-info
Write-Host ""

if ($Clean) {
    Write-Host "🧹 Cleaning up previous deployment..." -ForegroundColor Yellow
    kubectl delete namespace devsecops-platform --ignore-not-found=true
    Start-Sleep -Seconds 5
    Write-Host "✅ Cleanup completed" -ForegroundColor Green
    exit 0
}

# Apply manifests in order
Write-Host "📦 Applying Kubernetes manifests..." -ForegroundColor Cyan

# 1. Namespace
Write-Host "Creating namespace..." -ForegroundColor Yellow
kubectl apply -f manifests/namespace.yaml
Write-Host "✅ Namespace created" -ForegroundColor Green

# 2. ConfigMaps and Secrets
Write-Host "Creating ConfigMaps and Secrets..." -ForegroundColor Yellow
kubectl apply -f manifests/configmap.yaml
kubectl apply -f manifests/secret.yaml
Write-Host "✅ ConfigMaps and Secrets created" -ForegroundColor Green

# 3. Persistent Volume Claim
Write-Host "Creating Persistent Volume Claim..." -ForegroundColor Yellow
kubectl apply -f manifests/pvc.yaml
Write-Host "✅ PVC created" -ForegroundColor Green

# 4. PostgreSQL
Write-Host "Deploying PostgreSQL..." -ForegroundColor Yellow
kubectl apply -f manifests/postgres-deployment.yaml
kubectl apply -f manifests/postgres-service.yaml
Write-Host "✅ PostgreSQL deployed" -ForegroundColor Green

if (!$SkipWait) {
    # Wait for PostgreSQL to be ready
    Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
    kubectl wait --for=condition=available --timeout=300s deployment/postgres-deployment -n devsecops-platform
    kubectl wait --for=condition=ready pod -l app=postgres --timeout=300s -n devsecops-platform
    Write-Host "✅ PostgreSQL is ready" -ForegroundColor Green
}

# 5. Backend
Write-Host "Deploying Backend..." -ForegroundColor Yellow
kubectl apply -f manifests/backend-deployment.yaml
kubectl apply -f manifests/backend-service.yaml
Write-Host "✅ Backend deployed" -ForegroundColor Green

if (!$SkipWait) {
    # Wait for Backend to be ready
    Write-Host "⏳ Waiting for Backend to be ready..." -ForegroundColor Yellow
    kubectl wait --for=condition=available --timeout=300s deployment/backend-deployment -n devsecops-platform
    kubectl wait --for=condition=ready pod -l app=backend --timeout=300s -n devsecops-platform
    Write-Host "✅ Backend is ready" -ForegroundColor Green
}

# 6. Frontend
Write-Host "Deploying Frontend..." -ForegroundColor Yellow
kubectl apply -f manifests/frontend-deployment.yaml
kubectl apply -f manifests/frontend-service.yaml
Write-Host "✅ Frontend deployed" -ForegroundColor Green

if (!$SkipWait) {
    # Wait for Frontend to be ready
    Write-Host "⏳ Waiting for Frontend to be ready..." -ForegroundColor Yellow
    kubectl wait --for=condition=available --timeout=300s deployment/frontend-deployment -n devsecops-platform
    kubectl wait --for=condition=ready pod -l app=frontend --timeout=300s -n devsecops-platform
    Write-Host "✅ Frontend is ready" -ForegroundColor Green
}

# 7. Ingress
Write-Host "Creating Ingress..." -ForegroundColor Yellow
kubectl apply -f manifests/ingress.yaml
Write-Host "✅ Ingress created" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Show status
Write-Host "📊 Deployment Status:" -ForegroundColor Cyan
kubectl get all -n devsecops-platform

Write-Host ""
Write-Host "🌐 Access URLs:" -ForegroundColor Cyan
Write-Host "Frontend: http://devsecops.local (add to C:\Windows\System32\drivers\etc\hosts: 127.0.0.1 devsecops.local)" -ForegroundColor White
Write-Host "Backend API: http://devsecops.local/api" -ForegroundColor White

$lbIP = kubectl get svc frontend-service -n devsecops-platform -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>$null
if ($lbIP) {
    Write-Host "LoadBalancer IP: $lbIP" -ForegroundColor White
}

Write-Host ""
Write-Host "🔍 Useful commands:" -ForegroundColor Cyan
Write-Host "View logs: kubectl logs -f deployment/backend-deployment -n devsecops-platform" -ForegroundColor White
Write-Host "Scale backend: kubectl scale deployment backend-deployment --replicas=3 -n devsecops-platform" -ForegroundColor White
Write-Host "Check health: kubectl get pods -n devsecops-platform" -ForegroundColor White
Write-Host "Clean up: .\deploy-k8s.ps1 -Clean" -ForegroundColor White

Write-Host ""
Write-Host "✅ Phase 4: Kubernetes deployment completed!" -ForegroundColor Green