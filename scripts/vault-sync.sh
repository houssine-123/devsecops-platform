#!/usr/bin/env bash
# Helper script to sync secrets from Vault to Kubernetes
# Usage: VAULT_ADDR=https://vault.example.com VAULT_TOKEN=... VAULT_SECRET_PATH=secret/data/devsecops ./scripts/vault-sync.sh

set -euo pipefail

VAULT_ADDR=${VAULT_ADDR:-https://vault.example.com}
VAULT_SECRET_PATH=${VAULT_SECRET_PATH:-secret/data/devsecops}
KUBE_NAMESPACE=${KUBE_NAMESPACE:-devsecops-platform}

if ! command -v vault >/dev/null 2>&1; then
  echo "vault CLI not found. Please install it."
  exit 1
fi

if ! command -v kubectl >/dev/null 2>&1; then
  echo "kubectl CLI not found. Please install it."
  exit 1
fi

echo "Fetching DB_PASSWORD from $VAULT_SECRET_PATH"
DB_PASSWORD=$(vault kv get -field=DB_PASSWORD "$VAULT_SECRET_PATH")

echo "Applying k8s secret 'app-secrets' in namespace $KUBE_NAMESPACE"
kubectl -n "$KUBE_NAMESPACE" create secret generic app-secrets --from-literal=DB_PASSWORD="$DB_PASSWORD" --dry-run=client -o yaml | kubectl apply -f -

echo "Fetching JWT_SECRET"
JWT_SECRET=$(vault kv get -field=JWT_SECRET "$VAULT_SECRET_PATH")
kubectl -n "$KUBE_NAMESPACE" create secret generic app-jwt --from-literal=JWT_SECRET="$JWT_SECRET" --dry-run=client -o yaml | kubectl apply -f -

echo "Secrets synced successfully."
