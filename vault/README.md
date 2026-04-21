# HashiCorp Vault - Secrets Management

## Purpose
Centralized secrets management for:
- Database credentials
- API keys
- TLS certificates
- SSH keys
- Encryption keys

## Structure
- `config/` - Vault configuration
- `policies/` - RBAC policies
- `init/` - Initialization script

## Phase 6 Setup

### Docker Compose for Vault
```yaml
services:
  vault:
    image: vault:latest
    ports:
      - "8200:8200"
    environment:
      VAULT_DEV_ROOT_TOKEN_ID: myroot
      VAULT_DEV_LISTEN_ADDRESS: 0.0.0.0:8200
    cap_add:
      - IPC_LOCK
```

### Quick Start
```bash
# Access Vault
export VAULT_ADDR='http://localhost:8200'
export VAULT_TOKEN='myroot'

# Add secret
vault kv put secret/db/postgres password=secret123

# Read secret
vault kv get secret/db/postgres

# Kubernetes auth
vault auth enable kubernetes
vault write auth/kubernetes/config kubernetes_host=https://kubernetes.default
```

## Secrets to Store
- `secret/db/postgres` - Database credentials
- `secret/docker` - Docker registry credentials
- `secret/github` - GitHub tokens
- `secret/slack` - Slack webhooks
- `secret/email` - SMTP credentials

## Kubernetes Integration
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: vault-auth
---
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: vault-secret
provisioner: vault
```

## Phase 6 Tasks
- [ ] Deploy Vault
- [ ] Initialize Vault
- [ ] Configure authentication methods
- [ ] Create policies
- [ ] Integrate with Kubernetes
- [ ] Test secret retrieval
