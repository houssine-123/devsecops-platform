#!/bin/bash
# vault/vault-init.sh
# Initializes Vault (dev mode) with the secrets needed by the application.
# Run AFTER the Vault container is healthy: docker compose up vault -d && sleep 3 && bash vault/vault-init.sh

set -e

export VAULT_ADDR="${VAULT_ADDR:-http://localhost:8200}"
export VAULT_TOKEN="${VAULT_TOKEN:-devsecops-root-token}"

echo "=== Initializing Vault at ${VAULT_ADDR} ==="

# Wait until Vault is ready
until vault status > /dev/null 2>&1; do
  echo "Waiting for Vault to be ready..."
  sleep 2
done

# Enable KV v2 secrets engine
vault secrets enable -path=secret kv-v2 2>/dev/null || echo "KV engine already enabled"

# ── Application secrets ─────────────────────────────────────────────────────
vault kv put secret/data/devsecops \
  DB_USER="${DB_USER:-postgres}" \
  DB_PASSWORD="${DB_PASSWORD:-changeme}" \
  DB_NAME="${DB_NAME:-appdb}" \
  JWT_SECRET="${JWT_SECRET:-supersecretjwttoken_change_in_prod}"

echo "[OK] Application secrets stored at secret/data/devsecops"

# ── Docker Hub credentials ───────────────────────────────────────────────────
vault kv put secret/docker \
  DOCKERHUB_USER="${DOCKERHUB_USER:-houssineguidara12}" \
  DOCKERHUB_PASS="${DOCKERHUB_PASS:-changeme}"

echo "[OK] Docker credentials stored at secret/docker"

# ── Slack webhook ────────────────────────────────────────────────────────────
vault kv put secret/slack \
  WEBHOOK_URL="${SLACK_WEBHOOK_URL:-https://hooks.slack.com/services/CHANGE/ME}"

echo "[OK] Slack webhook stored at secret/slack"

# ── Email / SMTP ─────────────────────────────────────────────────────────────
vault kv put secret/email \
  SMTP_HOST="${SMTP_HOST:-smtp.example.com}" \
  SMTP_PORT="${SMTP_PORT:-587}" \
  SMTP_USER="${SMTP_USER:-alerts@example.com}" \
  SMTP_PASS="${SMTP_PASS:-changeme}"

echo "[OK] SMTP credentials stored at secret/email"

# ── Write policy ─────────────────────────────────────────────────────────────
vault policy write devsecops-policy vault/policies/devsecops-policy.hcl
echo "[OK] Policy 'devsecops-policy' applied"

echo ""
echo "=== Vault initialization complete ==="
echo "Access UI: ${VAULT_ADDR}/ui  (token: ${VAULT_TOKEN})"
echo ""
vault kv list secret/ 2>/dev/null || true
