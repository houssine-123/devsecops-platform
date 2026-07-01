# Vault Integration (Phase 6)

This document explains how to integrate HashiCorp Vault with the pipeline and Kubernetes.

## Overview

- Jenkins retrieves a `VAULT_TOKEN` (as Jenkins credential `vault-token`) and `VAULT_ADDR` env var.
- The pipeline uses the `vault` CLI to read secrets from a KV path (default `secret/data/devsecops`).
- Secrets are applied in Kubernetes as `Secret` objects (e.g., `app-secrets`, `app-jwt`).
- A dedicated `ServiceAccount` `ci-pipeline` with `Role`/`RoleBinding` is provided in `kubernetes/manifests/rbac.yaml` so CI can run inside cluster if desired.

## Steps

1. Install Vault and create secrets:

```bash
vault kv put secret/devsecops DB_PASSWORD="changeme" JWT_SECRET="random-secret"
```

2. Configure Jenkins credentials:
- `vault-token` (Secret text) — Vault token with read access to the KV path
- `dockerhub-credentials` (username/password)
- `kubeconfig-credentials` (file) — kubeconfig for deployment
- `sonar-token` (Secret text)
- `argocd-credentials` (username/password) optional

3. Apply RBAC in Kubernetes (gives CI ServiceAccount limited privileges):

```bash
kubectl apply -f kubernetes/manifests/rbac.yaml
```

4. Test local sync script:

```bash
export VAULT_ADDR=https://vault.example.com
export VAULT_TOKEN=<token>
export VAULT_SECRET_PATH=secret/data/devsecops
export KUBECONFIG=~/.kube/config
./scripts/vault-sync.sh
```

5. In the `Jenkinsfile`, the stage `Vault: Sync Secrets` will run and create/update k8s secrets using the Vault token and kubeconfig provided as Jenkins credentials.

## Security notes

- Prefer using Vault Agent or Kubernetes auth method for production (reduce long-lived tokens).
- Avoid storing Vault tokens in plain credentials — use short-lived tokens or AppRole/Kubernetes auth.
- Limit RBAC permissions to the minimum required.
