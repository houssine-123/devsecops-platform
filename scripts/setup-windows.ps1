# ============================================================================
# Setup Script pour Windows (PowerShell)
# Install dependencies et init du projet
# ============================================================================

Write-Host "================================================" -ForegroundColor Green
Write-Host "  DevSecOps Project - Windows Setup" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Green

# Check admin rights
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(`
    [Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "ERROR: Please run as Administrator" -ForegroundColor Red
    exit
}

# ============================================================================
# SECTION 1: Install Chocolatey (if not already installed)
# ============================================================================
Write-Host "`nStep 1/6: Checking Chocolatey..." -ForegroundColor Cyan
if ((choco --version) -match "^Chocolatey") {
    Write-Host "✓ Chocolatey already installed" -ForegroundColor Green
} else {
    Write-Host "Installing Chocolatey..." -ForegroundColor Yellow
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
}

# ============================================================================
# SECTION 2: Install Docker Desktop
# ============================================================================
Write-Host "`nStep 2/6: Checking Docker Desktop..." -ForegroundColor Cyan
if ((docker --version) -match "^Docker version") {
    Write-Host "✓ Docker Desktop already installed" -ForegroundColor Green
} else {
    Write-Host "Installing Docker Desktop..." -ForegroundColor Yellow
    choco install docker-desktop -y
    Write-Host "⚠ Docker installed. Please restart your computer." -ForegroundColor Yellow
}

# ============================================================================
# SECTION 3: Install Git
# ============================================================================
Write-Host "`nStep 3/6: Checking Git..." -ForegroundColor Cyan
if ((git --version) -match "^git version") {
    Write-Host "✓ Git already installed" -ForegroundColor Green
} else {
    Write-Host "Installing Git..." -ForegroundColor Yellow
    choco install git -y
}

# ============================================================================
# SECTION 4: Install Kubernetes Tools
# ============================================================================
Write-Host "`nStep 4/6: Checking Kubernetes Tools..." -ForegroundColor Cyan

# Minikube
if ((minikube -v | Select-String "version") -match "v") {
    Write-Host "✓ Minikube already installed" -ForegroundColor Green
} else {
    Write-Host "Installing Minikube..." -ForegroundColor Yellow
    choco install minikube -y
}

# kubectl
if ((kubectl version --client) -match "Client Version") {
    Write-Host "✓ kubectl already installed" -ForegroundColor Green
} else {
    Write-Host "Installing kubectl..." -ForegroundColor Yellow
    choco install kubernetes-cli -y
}

# Helm
if ((helm version) -match "version") {
    Write-Host "✓ Helm already installed" -ForegroundColor Green
} else {
    Write-Host "Installing Helm..." -ForegroundColor Yellow
    choco install kubernetes-helm -y
}

# ============================================================================
# SECTION 5: Install Node.js (optionnel)
# ============================================================================
Write-Host "`nStep 5/6: Checking Node.js..." -ForegroundColor Cyan
if ((node -v) -match "v") {
    Write-Host "✓ Node.js already installed: $(node -v)" -ForegroundColor Green
} else {
    Write-Host "Installing Node.js..." -ForegroundColor Yellow
    choco install nodejs -y
    Write-Host "✓ Node.js installed" -ForegroundColor Green
}

# ============================================================================
# SECTION 6: Create .env file from template
# ============================================================================
Write-Host "`nStep 6/6: Setting up environment..." -ForegroundColor Cyan
$projectDir = Get-Location
$envFile = Join-Path $projectDir ".env"
$envExample = Join-Path $projectDir ".env.example"

if (-not (Test-Path $envFile)) {
    if (Test-Path $envExample) {
        Copy-Item $envExample $envFile
        Write-Host "✓ Created .env from template (REMEMBER TO UPDATE VALUES!)" -ForegroundColor Yellow
    } else {
        Write-Host "⚠ Warning: .env.example not found" -ForegroundColor Yellow
    }
} else {
    Write-Host "✓ .env already exists" -ForegroundColor Green
}

# ============================================================================
# SECTION 7: Initialize Git
# ============================================================================
Write-Host "`nInitializing Git repository..." -ForegroundColor Cyan
if (Test-Path (Join-Path $projectDir ".git")) {
    Write-Host "✓ Git repository already initialized" -ForegroundColor Green
} else {
    git init
    git config user.name "DevSecOps Engineer"
    git config user.email "engineer@devsecops.local"
    git add .
    git commit -m "Initial commit: Project structure and configuration"
    Write-Host "✓ Git repository initialized" -ForegroundColor Green
}

# ============================================================================
# VERIFICATION
# ============================================================================
Write-Host "`n================================================" -ForegroundColor Green
Write-Host "  Verification" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Green

Write-Host "Checking installed tools..." -ForegroundColor Cyan
$tools = @{
    "Docker" = "docker --version"
    "Git" = "git --version"
    "kubectl" = "kubectl version --client --short"
    "Minikube" = "minikube version"
    "Helm" = "helm version --short"
    "Node.js" = "node -v"
}

foreach ($tool in $tools.GetEnumerator()) {
    try {
        $version = Invoke-Expression $tool.Value 2>&1 | Select-Object -First 1
        Write-Host "✓ $($tool.Name): $version" -ForegroundColor Green
    } catch {
        Write-Host "✗ $($tool.Name): Not found" -ForegroundColor Red
    }
}

# ============================================================================
# NEXT STEPS
# ============================================================================
Write-Host "`n================================================" -ForegroundColor Green
Write-Host "  Next Steps" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Green

Write-Host @"
1. Edit .env file with your configuration:
   - Replace DOCKER_PASSWORD with your Docker token
   - Set database credentials
   - Configure Slack/Email alerts

2. Start Minikube or enable Docker Desktop K8s:
   minikube start --driver=docker
   OR enable in Docker Desktop Settings → Kubernetes

3. Verify Kubernetes cluster:
   kubectl get nodes

4. Test docker-compose locally:
   docker-compose up -d

5. Next Phase: Create the multi-tier application (Phase 2)

Documentation: docs/ARCHITECTURE.md
"@ -ForegroundColor Yellow

Write-Host "================================================" -ForegroundColor Green
Write-Host "✓ Setup complete! Happy coding! 🚀" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
