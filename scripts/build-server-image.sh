#!/bin/bash
# Build the devsecops-server Docker image

echo "🐳 Building devsecops-server Docker image..."

docker build -f docker/Dockerfile.server -t devsecops-server:latest .

if [ $? -eq 0 ]; then
    echo "✅ Server image built successfully!"
    docker images | grep devsecops-server
else
    echo "❌ Failed to build server image"
    exit 1
fi
