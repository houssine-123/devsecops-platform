#!/bin/bash

# Phase 4: Kubernetes Deployment Script
# Usage: ./deploy-k8s.sh

set -e

echo "🚀 Phase 4: Déploiement Kubernetes - DevSecOps Platform"
echo "======================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if cluster is accessible
if ! kubectl cluster-info &> /dev/null; then
    print_error "Cannot connect to Kubernetes cluster. Please ensure your cluster is running and kubectl is configured."
    exit 1
fi

echo "🔍 Checking cluster status..."
kubectl cluster-info
echo ""

# Apply manifests in order
echo "📦 Applying Kubernetes manifests..."

# 1. Namespace
echo "Creating namespace..."
kubectl apply -f manifests/namespace.yaml
print_status "Namespace created"

# 2. ConfigMaps and Secrets
echo "Creating ConfigMaps and Secrets..."
kubectl apply -f manifests/configmap.yaml
kubectl apply -f manifests/secret.yaml
print_status "ConfigMaps and Secrets created"

# 3. Persistent Volume Claim
echo "Creating Persistent Volume Claim..."
kubectl apply -f manifests/pvc.yaml
print_status "PVC created"

# 4. PostgreSQL
echo "Deploying PostgreSQL..."
kubectl apply -f manifests/postgres-deployment.yaml
kubectl apply -f manifests/postgres-service.yaml
print_status "PostgreSQL deployed"

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/postgres-deployment -n devsecops-platform
kubectl wait --for=condition=ready pod -l app=postgres --timeout=300s -n devsecops-platform
print_status "PostgreSQL is ready"

# 5. Backend
echo "Deploying Backend..."
kubectl apply -f manifests/backend-deployment.yaml
kubectl apply -f manifests/backend-service.yaml
print_status "Backend deployed"

# Wait for Backend to be ready
echo "⏳ Waiting for Backend to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/backend-deployment -n devsecops-platform
kubectl wait --for=condition=ready pod -l app=backend --timeout=300s -n devsecops-platform
print_status "Backend is ready"

# 6. Frontend
echo "Deploying Frontend..."
kubectl apply -f manifests/frontend-deployment.yaml
kubectl apply -f manifests/frontend-service.yaml
print_status "Frontend deployed"

# Wait for Frontend to be ready
echo "⏳ Waiting for Frontend to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/frontend-deployment -n devsecops-platform
kubectl wait --for=condition=ready pod -l app=frontend --timeout=300s -n devsecops-platform
print_status "Frontend is ready"

# 7. Ingress
echo "Creating Ingress..."
kubectl apply -f manifests/ingress.yaml
print_status "Ingress created"

echo ""
echo "🎉 Deployment completed successfully!"
echo "====================================="

# Show status
echo "📊 Deployment Status:"
kubectl get all -n devsecops-platform

echo ""
echo "🌐 Access URLs:"
echo "Frontend: http://devsecops.local (add to /etc/hosts: 127.0.0.1 devsecops.local)"
echo "Backend API: http://devsecops.local/api"
echo "LoadBalancer IP: $(kubectl get svc frontend-service -n devsecops-platform -o jsonpath='{.status.loadBalancer.ingress[0].ip}')"

echo ""
echo "🔍 Useful commands:"
echo "View logs: kubectl logs -f deployment/backend-deployment -n devsecops-platform"
echo "Scale backend: kubectl scale deployment backend-deployment --replicas=3 -n devsecops-platform"
echo "Check health: kubectl get pods -n devsecops-platform"
echo "Clean up: kubectl delete namespace devsecops-platform"

echo ""
print_status "Phase 4: Kubernetes deployment completed!"