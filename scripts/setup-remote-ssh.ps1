# Script pour configurer VS Code Remote SSH sur Windows
# Exécutez dans PowerShell

Write-Host "================================" -ForegroundColor Blue
Write-Host "Configuration VS Code Remote SSH" -ForegroundColor Blue
Write-Host "================================" -ForegroundColor Blue
Write-Host ""

# Étape 1: Installer l'extension Remote SSH
Write-Host "Étape 1: Installation de l'extension Remote SSH..." -ForegroundColor Yellow
code --install-extension ms-vscode-remote.remote-ssh
code --install-extension ms-vscode-remote.vscode-remote-extensionpack
Write-Host "✅ Extension Remote SSH installée" -ForegroundColor Green
Write-Host ""

# Étape 2: Créer le dossier .ssh s'il n'existe pas
Write-Host "Étape 2: Configuration du dossier SSH..." -ForegroundColor Yellow
$sshDir = "$env:USERPROFILE\.ssh"
if (-not (Test-Path $sshDir)) {
    New-Item -ItemType Directory -Force -Path $sshDir | Out-Null
    Write-Host "✅ Dossier .ssh créé" -ForegroundColor Green
} else {
    Write-Host "✅ Dossier .ssh existe déjà" -ForegroundColor Green
}
Write-Host ""

# Étape 3: Informations pour configurer la connexion SSH
Write-Host "Étape 3: Configuration de la connexion SSH" -ForegroundColor Yellow
Write-Host ""
Write-Host "Vous devez editer le fichier SSH config :"
Write-Host ""
Write-Host "  1. Appuyez sur Ctrl+Shift+P dans VS Code"
Write-Host "  2. Tapez: Remote-SSH: Open Configuration File"
Write-Host "  3. Sélectionnez le fichier config à éditer"
Write-Host ""
Write-Host "Ajoutez cette configuration:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Host pfe-vm" -ForegroundColor Cyan
Write-Host "    HostName <IP_DE_LA_VM>" -ForegroundColor Cyan
Write-Host "    User ubuntu" -ForegroundColor Cyan
Write-Host "    Port 22" -ForegroundColor Cyan
Write-Host ""
Write-Host "Remplacez <IP_DE_LA_VM> par l'IP réelle (ex: 192.168.1.100)" -ForegroundColor Yellow
Write-Host ""

# Étape 4: Tester la connexion
Write-Host "Étape 4: Test de connexion SSH" -ForegroundColor Yellow
Write-Host ""

$vmIP = Read-Host "Entrez l'IP de votre VM (ex: 192.168.1.100)"
$vmUser = Read-Host "Entrez le nom d'utilisateur (défaut: ubuntu)" 
if ([string]::IsNullOrEmpty($vmUser)) { $vmUser = "ubuntu" }

Write-Host ""
Write-Host "Test de connexion à ssh://$vmUser@$vmIP ..." -ForegroundColor Cyan

try {
    # Tester la connexion
    $testConnection = @{
        'ErrorAction' = 'Stop'
    }
    
    # Essayer une connexion SSH simple
    $sshTest = ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no "$vmUser@$vmIP" "echo OK" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Connexion SSH réussie !" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Connexion SSH a échoué. Vérifiez l'IP et les identifiants." -ForegroundColor Yellow
        Write-Host "Détails: $sshTest" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Erreur lors du test SSH: $_" -ForegroundColor Red
    Write-Host "Vérifiez que:" -ForegroundColor Yellow
    Write-Host "  1. L'IP est correcte"
    Write-Host "  2. La VM est en cours d'exécution"
    Write-Host "  3. OpenSSH est installé sur la VM"
}

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "Configuration terminée !" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines étapes:" -ForegroundColor Yellow
Write-Host "1. Ouvrez VS Code"
Write-Host "2. Appuyez sur Ctrl+Shift+P"
Write-Host "3. Tapez: Remote-SSH: Connect to Host"
Write-Host "4. Sélectionnez pfe-vm"
Write-Host ""
Write-Host "📖 Pour le guide complet, consultez: docs/REMOTE_SSH_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
