#!/bin/bash
# ============================================================================
# Setup Script pour Linux/macOS
# Install dependencies et init du projet
# ============================================================================

set -e

echo "================================================"
echo "  DevSecOps Project - Linux/macOS Setup"
echo "================================================"

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
else
    echo "❌ Unsupported OS"
    exit 1
fi

echo "Detected OS: $OS"

# ============================================================================
# SECTION 1: Update system packages
# ============================================================================
echo ""
echo "Step 1/6: Updating system packages..."
if [ "$OS" == "linux" ]; then
    sudo apt update && sudo apt upgrade -y
elif [ "$OS" == "macos" ]; then
    brew update && brew upgrade
fi

# ============================================================================
# SECTION 2: Install Docker
# ============================================================================
echo ""
echo "Step 2/6: Checking Docker..."
if command -v docker &> /dev/null; then
    echo "✓ Docker already installed: $(docker --version)"
else
    echo "Installing Docker..."
    if [ "$OS" == "linux" ]; then
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        rm get-docker.sh
        sudo usermod -aG docker $USER
    elif [ "$OS" == "macos" ]; then
        brew install --cask docker
    fi
    echo "✓ Docker installed"
fi

# ============================================================================
# SECTION 3: Install Git
# ============================================================================
echo ""
echo "Step 3/6: Checking Git..."
if command -v git &> /dev/null; then
    echo "✓ Git already installed: $(git --version)"
else
    echo "Installing Git..."
    if [ "$OS" == "linux" ]; then
        sudo apt install git -y
    elif [ "$OS" == "macos" ]; then
        brew install git
    fi
    echo "✓ Git installed"
fi

# ============================================================================
# SECTION 4: Install Kubernetes Tools (Minikube, kubectl, Helm)
# ============================================================================
echo ""
echo "Step 4/6: Checking Kubernetes Tools..."

# Minikube
if command -v minikube &> /dev/null; then
    echo "✓ Minikube already installed: $(minikube version)"
else
    echo "Installing Minikube..."
    if [ "$OS" == "linux" ]; then
        curl -LO https://github.com/kubernetes/minikube/releases/latest/download/minikube-linux-amd64
        sudo install minikube-linux-amd64 /usr/local/bin/minikube
        rm minikube-linux-amd64
    elif [ "$OS" == "macos" ]; then
        brew install minikube
    fi
    echo "✓ Minikube installed"
fi

# kubectl
if command -v kubectl &> /dev/null; then
    echo "✓ kubectl already installed: $(kubectl version --client --short)"
else
    echo "Installing kubectl..."
    if [ "$OS" == "linux" ]; then
        curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
        sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
        rm kubectl
    elif [ "$OS" == "macos" ]; then
        brew install kubectl
    fi
    echo "✓ kubectl installed"
fi

# Helm
if command -v helm &> /dev/null; then
    echo "✓ Helm already installed: $(helm version --short)"
else
    echo "Installing Helm..."
    if [ "$OS" == "linux" ]; then
        curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
    elif [ "$OS" == "macos" ]; then
        brew install helm
    fi
    echo "✓ Helm installed"
fi

# ============================================================================
# SECTION 5: Install Node.js (optionnel)
# ============================================================================
echo ""
echo "Step 5/6: Checking Node.js..."
if command -v node &> /dev/null; then
    echo "✓ Node.js already installed: $(node -v)"
else
    echo "Installing Node.js..."
    if [ "$OS" == "linux" ]; then
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        sudo apt install nodejs -y
    elif [ "$OS" == "macos" ]; then
        brew install node
    fi
    echo "✓ Node.js installed"
fi

# ============================================================================
# SECTION 6: Setup environment file
# ============================================================================
echo ""
echo "Step 6/6: Setting up environment..."
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"
ENV_EXAMPLE="$PROJECT_DIR/.env.example"

if [ ! -f "$ENV_FILE" ]; then
    if [ -f "$ENV_EXAMPLE" ]; then
        cp "$ENV_EXAMPLE" "$ENV_FILE"
        echo "✓ Created .env from template (REMEMBER TO UPDATE VALUES!)"
    else
        echo "⚠ Warning: .env.example not found"
    fi
else
    echo "✓ .env already exists"
fi

# ============================================================================
# SECTION 7: Initialize Git
# ============================================================================
echo ""
echo "Initializing Git repository..."
if [ -d "$PROJECT_DIR/.git" ]; then
    echo "✓ Git repository already initialized"
else
    cd "$PROJECT_DIR"
    git init
    git config user.name "DevSecOps Engineer"
    git config user.email "engineer@devsecops.local"
    git add .
    git commit -m "Initial commit: Project structure and configuration"
    echo "✓ Git repository initialized"
fi

# ============================================================================
# VERIFICATION
# ============================================================================
echo ""
echo "================================================"
echo "  Verification"
echo "================================================"
echo "Checking installed tools..."

check_tool() {
    if command -v "$1" &> /dev/null; then
        echo "✓ $1: $($2)"
    else
        echo "✗ $1: Not found"
    fi
}

check_tool "docker" "docker --version"
check_tool "git" "git --version"
check_tool "kubectl" "kubectl version --client --short"
check_tool "minikube" "minikube version"
check_tool "helm" "helm version --short"
check_tool "node" "node -v"

# ============================================================================
# NEXT STEPS
# ============================================================================
echo ""
echo "================================================"
echo "  Next Steps"
echo "================================================"
cat << 'EOF'
1. Edit .env file with your configuration:
   - Replace DOCKER_PASSWORD with your Docker token
   - Set database credentials
   - Configure Slack/Email alerts

2. Start Minikube:
   minikube start --driver=docker

3. Verify Kubernetes cluster:
   kubectl get nodes

4. Test docker-compose locally:
   docker-compose up -d

5. Next Phase: Create the multi-tier application (Phase 2)

Documentation: docs/ARCHITECTURE.md
EOF
echo "================================================"
echo "✓ Setup complete! Happy coding! 🚀"
echo "================================================"
