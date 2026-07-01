# ============================================================
# Docker Registry Push Script
# ============================================================
# Script pour pousser les images vers Docker Hub
# Utilisateur: houssineguidara12
# ============================================================

#!/bin/bash

# Variables
DOCKER_HUB_USER="houssineguidara12"
BACKEND_IMAGE="devsecops-backend"
FRONTEND_IMAGE="devsecops-frontend"
TAG="latest"

echo "🚀 Pushing images to Docker Hub..."

# Tag images
echo "📝 Tagging images..."
docker tag pfe-backend:latest $DOCKER_HUB_USER/$BACKEND_IMAGE:$TAG
docker tag pfe-frontend:latest $DOCKER_HUB_USER/$FRONTEND_IMAGE:$TAG

# Push backend
echo "📤 Pushing backend image..."
docker push $DOCKER_HUB_USER/$BACKEND_IMAGE:$TAG

# Push frontend
echo "📤 Pushing frontend image..."
docker push $DOCKER_HUB_USER/$FRONTEND_IMAGE:$TAG

echo "✅ All images pushed successfully!"
echo ""
echo "📋 Images available:"
echo "   - $DOCKER_HUB_USER/$BACKEND_IMAGE:$TAG"
echo "   - $DOCKER_HUB_USER/$FRONTEND_IMAGE:$TAG"
echo ""
echo "🔗 Docker Hub URLs:"
echo "   - https://hub.docker.com/r/$DOCKER_HUB_USER/$BACKEND_IMAGE"
echo "   - https://hub.docker.com/r/$DOCKER_HUB_USER/$FRONTEND_IMAGE"