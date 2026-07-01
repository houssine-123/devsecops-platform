# ============================================================
# Script de démarrage Phase 2 - QuickStart
# ============================================================
# Usage: ./start-phase2.sh ou powershell.exe -Command .\start-phase2.ps1

# EXPLICATION:
# Ce script automatise le démarrage complet de Phase 2:
# 1. Vérifier que Docker est installé
# 2. Vérifier les .env files
# 3. Démarrer docker-compose
# 4. Afficher les URLs d'accès

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         Phase 2 - DevSecOps Application Startup           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# ============================================================
# Vérifier les prérequis
# ============================================================

Write-Host "`n[1/4] Vérification des prérequis..." -ForegroundColor Yellow

# Vérifier Docker
$docker_installed = docker --version 2>$null
if ($docker_installed) {
    Write-Host "✓ Docker trouvé: $docker_installed" -ForegroundColor Green
} else {
    Write-Host "✗ Docker n'est pas installé!" -ForegroundColor Red
    Write-Host "  Installez Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Red
    exit 1
}

# Vérifier Docker Compose
$compose_installed = docker-compose --version 2>$null
if ($compose_installed) {
    Write-Host "✓ Docker Compose trouvé: $compose_installed" -ForegroundColor Green
} else {
    Write-Host "✗ Docker Compose n'est pas installé!" -ForegroundColor Red
    exit 1
}

# ============================================================
# Créer les fichiers .env s'ils n'existent pas
# ============================================================

Write-Host "`n[2/4] Vérification des fichiers .env..." -ForegroundColor Yellow

if (-not (Test-Path "app/backend/.env")) {
    Write-Host "⚠ Création de app/backend/.env" -ForegroundColor Yellow
    @"
APP_ENV=development
APP_PORT=5000
APP_NAME=DevSecOps Backend
"@ | Out-File "app/backend/.env" -Encoding UTF8
}

if (-not (Test-Path "app/frontend/.env")) {
    Write-Host "⚠ Création de app/frontend/.env" -ForegroundColor Yellow
    @"
VITE_API_URL=http://localhost:5000
"@ | Out-File "app/frontend/.env" -Encoding UTF8
}

if (-not (Test-Path ".env")) {
    Write-Host "⚠ Création de .env" -ForegroundColor Yellow
    @"
# Database
DB_USER=postgres
DB_PASSWORD=changeme
DB_NAME=appdb

# Grafana
GRAFANA_ADMIN_PASSWORD=admin123

# App
APP_ENV=development
"@ | Out-File ".env" -Encoding UTF8
}

Write-Host "✓ Fichiers .env vérifiés" -ForegroundColor Green

# ============================================================
# Démarrer Docker Compose
# ============================================================

Write-Host "`n[3/4] Démarrage des services Docker..." -ForegroundColor Yellow

docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Services démarrés" -ForegroundColor Green
} else {
    Write-Host "✗ Erreur au démarrage des services" -ForegroundColor Red
    docker-compose logs
    exit 1
}

# ============================================================
# Attendre que les services soient prêts
# ============================================================

Write-Host "`n[4/4] Attente du démarrage complet..." -ForegroundColor Yellow

$max_retries = 30
$retry = 0

while ($retry -lt $max_retries) {
    try {
        $backend_health = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($backend_health.StatusCode -eq 200) {
            Write-Host "✓ Backend prêt" -ForegroundColor Green
            break
        }
    } catch {
        $retry++
        Write-Host "  Tentative $retry/$max_retries..." -ForegroundColor Gray
        Start-Sleep -Seconds 1
    }
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              Phase 2 - DÉMARRAGE RÉUSSI ✓                 ║" -ForegroundColor Green
Write-Host "╠════════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║ 🌐 Frontend        : http://localhost:3000                 ║" -ForegroundColor Cyan
Write-Host "║ 🔌 Backend API     : http://localhost:5000/api/health     ║" -ForegroundColor Cyan
Write-Host "║ 📊 Prometheus      : http://localhost:9090                 ║" -ForegroundColor Cyan
Write-Host "║ 📈 Grafana         : http://localhost:4000 (admin/admin123)║" -ForegroundColor Cyan
Write-Host "║ 🗄️  Adminer (DB)    : http://localhost:8080                 ║" -ForegroundColor Cyan
Write-Host "║ 🚨 AlertManager    : http://localhost:9093                 ║" -ForegroundColor Cyan
Write-Host "╠════════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║ Commandes utiles:                                          ║" -ForegroundColor Green
Write-Host "║  docker-compose logs -f          (voir les logs)           ║" -ForegroundColor Green
Write-Host "║  docker-compose ps               (état des services)       ║" -ForegroundColor Green
Write-Host "║  docker-compose stop             (arrêter les services)    ║" -ForegroundColor Green
Write-Host "║  docker-compose down -v          (nettoyer complètement)   ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`n📖 Documentation: consulter PHASE_2_README.md" -ForegroundColor Cyan
