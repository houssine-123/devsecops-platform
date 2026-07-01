#!/bin/bash
# Install and configure Argo CD on the Kubernetes cluster

set -e

echo "=== Installing Argo CD ==="

# Create namespace
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -

# Install Argo CD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for Argo CD to be ready
echo "Waiting for Argo CD pods to be ready..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server -n argocd --timeout=120s

# Apply AppProject and Application
kubectl apply -f kubernetes/argocd/project.yaml
kubectl apply -f kubernetes/argocd/application.yaml

# Get initial admin password
echo ""
echo "=== Argo CD Initial Admin Password ==="
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
echo ""

# Port-forward to access UI (run in background)
echo ""
echo "=== Access Argo CD UI ==="
echo "Run: kubectl port-forward svc/argocd-server -n argocd 8443:443"
echo "Then open: https://localhost:8443"
echo "Username: admin"
