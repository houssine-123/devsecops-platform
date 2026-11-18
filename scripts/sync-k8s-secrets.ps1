# ============================================================================
# Vault -> Kubernetes : synchronise le Secret "app-secrets" depuis Vault
# ============================================================================
# Les secrets ne sont plus versionnés dans Git (kubernetes/manifests/secret.yaml
# a été retiré). Vault (secret/devsecops) est la source de vérité, et ce
# script crée ou met à jour le Secret Kubernetes lu par les pods.
#
# Prérequis : conteneur devsecops-vault démarré et amorcé (seed-vault.ps1),
#             kubectl pointant sur le cluster.
# Usage     : .\scripts\sync-k8s-secrets.ps1
# ============================================================================

$ErrorActionPreference = "Stop"
$VaultToken = if ($env:VAULT_TOKEN) { $env:VAULT_TOKEN } else { "devsecops-root-token" }
$Namespace  = "devsecops-platform"
$SecretName = "app-secrets"

function Get-VaultField([string]$Field) {
    $value = docker exec -e VAULT_TOKEN=$VaultToken devsecops-vault `
        vault kv get "-field=$Field" secret/devsecops
    if ($LASTEXITCODE -ne 0 -or -not $value) {
        throw "Champ '$Field' introuvable dans Vault (lancer d'abord scripts/seed-vault.ps1)"
    }
    return $value.Trim()
}

Write-Host "Lecture des secrets dans Vault (secret/devsecops)..."
$DbUser        = Get-VaultField "DB_USER"
$DbPassword    = Get-VaultField "DB_PASSWORD"
$AdminUsername = Get-VaultField "ADMIN_USERNAME"
$AdminPassword = Get-VaultField "ADMIN_PASSWORD"
$JwtSecret     = Get-VaultField "JWT_SECRET"

# L'ancien Secret était géré par Argo CD. On retire son étiquette de suivi
# pour qu'Argo CD (prune: true) ne le supprime pas maintenant qu'il n'est
# plus dans Git.
$exists = kubectl -n $Namespace get secret $SecretName --ignore-not-found -o name
if ($exists) {
    kubectl -n $Namespace label secret $SecretName app.kubernetes.io/instance- 2>$null | Out-Null
    kubectl -n $Namespace annotate secret $SecretName argocd.argoproj.io/tracking-id- 2>$null | Out-Null
}

Write-Host "Création / mise à jour du Secret $Namespace/$SecretName..."
kubectl -n $Namespace create secret generic $SecretName `
    "--from-literal=DB_USER=$DbUser" `
    "--from-literal=DB_PASSWORD=$DbPassword" `
    "--from-literal=POSTGRES_PASSWORD=$DbPassword" `
    "--from-literal=ADMIN_USERNAME=$AdminUsername" `
    "--from-literal=ADMIN_PASSWORD=$AdminPassword" `
    "--from-literal=JWT_SECRET=$JwtSecret" `
    --dry-run=client -o yaml | kubectl apply -f - | Out-Null

kubectl -n $Namespace label secret $SecretName managed-by=vault-sync --overwrite | Out-Null

# Grafana (Kubernetes) : on conserve le mot de passe existant s'il y en a un,
# sinon on crée le Secret à partir de Vault.
$grafana = kubectl -n $Namespace get secret grafana-secret --ignore-not-found -o name
if ($grafana) {
    kubectl -n $Namespace annotate secret grafana-secret argocd.argoproj.io/tracking-id- 2>$null | Out-Null
    kubectl -n $Namespace label secret grafana-secret app.kubernetes.io/instance- 2>$null | Out-Null
    Write-Host "Secret grafana-secret conservé (détaché d'Argo CD)."
} else {
    $GrafanaPass = Get-VaultField "GRAFANA_ADMIN_PASSWORD"
    kubectl -n $Namespace create secret generic grafana-secret `
        "--from-literal=admin-password=$GrafanaPass" | Out-Null
    Write-Host "Secret grafana-secret créé depuis Vault."
}
kubectl -n $Namespace label secret grafana-secret managed-by=vault-sync --overwrite | Out-Null

Write-Host "Redémarrage du backend pour prise en compte..."
kubectl -n $Namespace rollout restart deployment/backend-deployment | Out-Null
kubectl -n $Namespace rollout status deployment/backend-deployment --timeout=180s

Write-Host "Secret synchronisé depuis Vault."
Write-Host "Note : POSTGRES_PASSWORD n'est lu qu'à la création de la base. Pour changer"
Write-Host "le mot de passe d'une base existante, utiliser ALTER USER dans PostgreSQL."
