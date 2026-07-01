# Build the devsecops-server Docker image (Windows PowerShell)

Write-Host "🐳 Building devsecops-server Docker image..." -ForegroundColor Cyan

Set-Location "c:\Users\User\Desktop\pfe"

docker build -f docker/Dockerfile.server -t devsecops-server:latest .

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Server image built successfully!" -ForegroundColor Green
    docker images | Select-String "devsecops-server"
} else {
    Write-Host "❌ Failed to build server image" -ForegroundColor Red
    exit 1
}
