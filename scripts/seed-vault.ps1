# ============================================================================
# Seed Vault with application secrets (KV v2 at secret/devsecops)
# ============================================================================
# Vault runs in DEV mode (in-memory) — re-run this script after every
# `docker compose up/restart vault`.
#
# Usage:
#   .\scripts\seed-vault.ps1                         # mot de passe admin généré
#   .\scripts\seed-vault.ps1 -AdminPassword "..."    # mot de passe admin choisi
#   $env:ADMIN_PASSWORD="..."; .\scripts\seed-vault.ps1
#
# Après le seed, redémarrer le backend pour qu'il relise Vault :
#   docker compose restart backend
# ============================================================================

param(
    [string]$AdminPassword = $env:ADMIN_PASSWORD
)

function New-RandomSecret([int]$Bytes) {
    $buffer = New-Object byte[] $Bytes
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($buffer)
    # Base64 "URL-safe" : pas de caractères gênants pour la ligne de commande
    return [Convert]::ToBase64String($buffer).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

$VaultToken    = if ($env:VAULT_TOKEN)    { $env:VAULT_TOKEN }    else { "devsecops-root-token" }
$DbUser        = if ($env:DB_USER)        { $env:DB_USER }        else { "postgres" }
$DbPassword    = if ($env:DB_PASSWORD)    { $env:DB_PASSWORD }    else { "changeme" }
$DbName        = if ($env:DB_NAME)        { $env:DB_NAME }        else { "appdb" }
$AdminUsername = if ($env:ADMIN_USERNAME) { $env:ADMIN_USERNAME } else { "admin" }
$JwtSecret     = if ($env:JWT_SECRET)     { $env:JWT_SECRET }     else { New-RandomSecret 48 }
$GrafanaPass   = if ($env:GRAFANA_ADMIN_PASSWORD) { $env:GRAFANA_ADMIN_PASSWORD } else { New-RandomSecret 12 }

$GeneratedPassword = $false
if (-not $AdminPassword) {
    $AdminPassword = New-RandomSecret 12
    $GeneratedPassword = $true
}

Write-Host "Seeding Vault (secret/devsecops)..."

# kv put remplace l'ensemble du secret : toutes les clés sont réécrites ici
docker exec -e VAULT_TOKEN=$VaultToken devsecops-vault vault kv put secret/devsecops `
    DB_HOST=postgres `
    DB_PORT=5432 `
    DB_USER=$DbUser `
    DB_PASSWORD=$DbPassword `
    DB_NAME=$DbName `
    ADMIN_USERNAME=$AdminUsername `
    ADMIN_PASSWORD=$AdminPassword `
    JWT_SECRET=$JwtSecret `
    GRAFANA_ADMIN_PASSWORD=$GrafanaPass | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "Seeding FAILED — is the vault container running?"
    exit 1
}

Write-Host "Vault seeded. Verify with:"
Write-Host "  docker exec -e VAULT_TOKEN=$VaultToken devsecops-vault vault kv get secret/devsecops"
Write-Host ""
Write-Host "Application login : $AdminUsername"
if ($GeneratedPassword) {
    Write-Host "Mot de passe généré (à noter, il n'est affiché qu'une fois) : $AdminPassword"
}
Write-Host ""
Write-Host "Next: docker compose restart backend"
