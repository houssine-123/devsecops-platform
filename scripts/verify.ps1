#!/bin/bash
# ============================================================================
# Verification script pour Windows (PowerShell)
# ============================================================================

# Save as: scripts/verify.ps1
# Run: .\scripts\verify.ps1

Write-Host "=============================================="
Write-Host "  DevSecOps Infrastructure Verification"
Write-Host "=============================================="
Write-Host ""

function Check-Tool {
    param(
        [string]$Command,
        [string]$DisplayName,
        [string]$VersionParam = ""
    )
    
    try {
        $version = & "$Command" $VersionParam.Split() 2>&1 | Select-Object -First 1
        Write-Host "✓ $DisplayName : $version" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "✗ $DisplayName : NOT INSTALLED" -ForegroundColor Red
        return $false
    }
}

# Core Tools
Write-Host "Core Tools:" -ForegroundColor Yellow
Check-Tool "docker" "Docker" "--version"
Check-Tool "git" "Git" "--version"
Check-Tool "kubectl" "kubectl" "version --client --short"

# Kubernetes
Write-Host ""
Write-Host "Kubernetes Tools:" -ForegroundColor Yellow
Check-Tool "minikube" "Minikube" "version"
Check-Tool "helm" "Helm" "version --short"

# Development Tools
Write-Host ""
Write-Host "Development Tools:" -ForegroundColor Yellow
Check-Tool "node" "Node.js" "--version"
Check-Tool "python" "Python" "--version"

# Kubernetes cluster status
Write-Host ""
Write-Host "Kubernetes Cluster:" -ForegroundColor Yellow
try {
    kubectl cluster-info *> $null
    Write-Host "✓ Kubernetes cluster is accessible" -ForegroundColor Green
    kubectl get nodes --no-headers | ForEach-Object { Write-Host "    - $_" }
} catch {
    Write-Host "⚠ Kubernetes cluster not accessible" -ForegroundColor Yellow
    Write-Host "  Try: minikube start --driver=docker" -ForegroundColor Yellow
}

# Docker
Write-Host ""
Write-Host "Docker Status:" -ForegroundColor Yellow
try {
    $running = (docker ps -q | Measure-Object -Line).Lines
    Write-Host "✓ Docker daemon is running" -ForegroundColor Green
    Write-Host "  Containers running: $running"
} catch {
    Write-Host "✗ Docker daemon is NOT running" -ForegroundColor Red
}

# Environment file
Write-Host ""
Write-Host "Project Setup:" -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✓ .env file exists" -ForegroundColor Green
} else {
    Write-Host "⚠ .env file not found" -ForegroundColor Yellow
    Write-Host "  Create with: copy .env.example .env" -ForegroundColor Yellow
}

if (Test-Path ".git") {
    Write-Host "✓ Git repository initialized" -ForegroundColor Green
} else {
    Write-Host "⚠ Git repository not initialized" -ForegroundColor Yellow
    Write-Host "  Initialize with: git init" -ForegroundColor Yellow
}

# Docker Compose
Write-Host ""
Write-Host "Docker Compose:" -ForegroundColor Yellow
try {
    docker-compose config *> $null
    Write-Host "✓ docker-compose.yml is valid" -ForegroundColor Green
} catch {
    Write-Host "✗ docker-compose.yml has issues" -ForegroundColor Red
}

Write-Host ""
Write-Host "=============================================="
Write-Host "Verification complete!"
Write-Host "=============================================="
