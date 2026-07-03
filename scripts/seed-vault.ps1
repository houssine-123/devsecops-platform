# ============================================================================
# Seed Vault with application secrets (KV v2 at secret/devsecops)
# ============================================================================
# Vault runs in DEV mode (in-memory) — re-run this script after every
# `docker compose up/restart vault`.
# Usage:  .\scripts\seed-vault.ps1
# ============================================================================

$VaultToken = if ($env:VAULT_TOKEN) { $env:VAULT_TOKEN } else { "devsecops-root-token" }
$DbUser     = if ($env:DB_USER)     { $env:DB_USER }     else { "postgres" }
$DbPassword = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "changeme" }
$DbName     = if ($env:DB_NAME)     { $env:DB_NAME }     else { "appdb" }

Write-Host "Seeding Vault (secret/devsecops)..."

docker exec -e VAULT_TOKEN=$VaultToken devsecops-vault vault kv put secret/devsecops `
    DB_HOST=postgres `
    DB_PORT=5432 `
    DB_USER=$DbUser `
    DB_PASSWORD=$DbPassword `
    DB_NAME=$DbName

if ($LASTEXITCODE -eq 0) {
    Write-Host "Vault seeded. Verify with:"
    Write-Host "  docker exec -e VAULT_TOKEN=$VaultToken devsecops-vault vault kv get secret/devsecops"
} else {
    Write-Host "Seeding FAILED — is the vault container running?"
    exit 1
}
