#!/usr/bin/env bash
# Quick verification script to check if your environment is properly set up

echo "=============================================="
echo "  DevSecOps Infrastructure Verification"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_command() {
    local cmd=$1
    local display_name=$2
    local expected=$3
    
    if command -v $cmd &> /dev/null; then
        version=$($1 ${expected} 2>&1 | head -n1)
        echo -e "${GREEN}✓${NC} $display_name: $version"
        return 0
    else
        echo -e "${RED}✗${NC} $display_name: NOT INSTALLED"
        return 1
    fi
}

# Core tools
echo -e "${YELLOW}Core Tools:${NC}"
check_command "docker" "Docker" "--version"
check_command "git" "Git" "--version"
check_command "kubectl" "kubectl" "version --client --short"

# Kubernetes
echo ""
echo -e "${YELLOW}Kubernetes Tools:${NC}"
check_command "minikube" "Minikube" "version"
check_command "helm" "Helm" "version --short"

# Development tools
echo ""
echo -e "${YELLOW}Development Tools:${NC}"
check_command "node" "Node.js" "--version"
check_command "python3" "Python" "--version"

# Kubernetes cluster status
echo ""
echo -e "${YELLOW}Kubernetes Cluster:${NC}"
if kubectl cluster-info &> /dev/null; then
    echo -e "${GREEN}✓${NC} Kubernetes cluster is accessible"
    echo "  Nodes:"
    kubectl get nodes --no-headers | awk '{print "    - " $1 " (" $5 ")"}'
else
    echo -e "${YELLOW}⚠${NC} Kubernetes cluster not accessible"
    echo "  Try: minikube start --driver=docker"
fi

# Docker verification
echo ""
echo -e "${YELLOW}Docker Status:${NC}"
if docker ps &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker daemon is running"
    echo "  Images count: $(docker images -q | wc -l)"
    echo "  Containers running: $(docker ps -q | wc -l)"
else
    echo -e "${RED}✗${NC} Docker daemon is NOT running"
fi

# Environment file
echo ""
echo -e "${YELLOW}Project Setup:${NC}"
if [ -f .env ]; then
    echo -e "${GREEN}✓${NC} .env file exists"
else
    echo -e "${YELLOW}⚠${NC} .env file not found"
    echo "  Create with: cp .env.example .env"
fi

if [ -d .git ]; then
    echo -e "${GREEN}✓${NC} Git repository initialized"
else
    echo -e "${YELLOW}⚠${NC} Git repository not initialized"
    echo "  Initialize with: git init"
fi

# Docker Compose
echo ""
echo -e "${YELLOW}Docker Compose:${NC}"
if docker-compose config &> /dev/null; then
    echo -e "${GREEN}✓${NC} docker-compose.yml is valid"
else
    echo -e "${RED}✗${NC} docker-compose.yml has issues"
fi

echo ""
echo "=============================================="
echo "Verification complete!"
echo "=============================================="
