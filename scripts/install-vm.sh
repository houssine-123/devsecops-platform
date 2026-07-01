#!/bin/bash

################################################################################
#                    INSTALLATION AUTOMATIQUE DE LA VM
#                  Installation Docker + Docker Compose
#              Script d'installation complète pour Ubuntu 22.04
################################################################################

set -e  # Arrêter à la première erreur

# Couleurs pour le texte
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️ $1${NC}"
}

# Vérifier si l'utilisateur est root
if [[ $EUID -ne 0 ]]; then
   print_error "Ce script doit être exécuté en tant que root. Utilisez : sudo bash install-vm.sh"
   exit 1
fi

################################################################################
# ÉTAPE 1: Mise à jour du système
################################################################################

print_header "ÉTAPE 1: Mise à jour du système"
apt update
apt install -y ca-certificates curl gnupg lsb-release wget git
print_success "Système mis à jour"

################################################################################
# ÉTAPE 2: Installation de Docker
################################################################################

print_header "ÉTAPE 2: Installation de Docker"

# Ajouter la clé GPG de Docker
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Ajouter le dépôt Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Installer Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

print_success "Docker installé"

################################################################################
# ÉTAPE 3: Configuration de Docker
################################################################################

print_header "ÉTAPE 3: Configuration de Docker"

# Ajouter l'utilisateur courant au groupe docker (si ce script est exécuté avec sudo)
if [ "$SUDO_USER" ]; then
    usermod -aG docker "$SUDO_USER"
    print_success "Utilisateur $SUDO_USER ajouté au groupe docker"
fi

# Démarrer et activer le service Docker
systemctl start docker
systemctl enable docker
print_success "Service Docker activé"

################################################################################
# ÉTAPE 4: Cloner le projet
################################################################################

print_header "ÉTAPE 4: Cloner le projet"

# Si l'utilisateur courant existe, cloner le projet dans son home
if [ "$SUDO_USER" ]; then
    HOME_DIR="/home/$SUDO_USER"
    PROJECT_DIR="$HOME_DIR/pfe"
    
    if [ ! -d "$PROJECT_DIR" ]; then
        print_info "Clonage du projet dans $PROJECT_DIR"
        # À adapter selon votre URL de repo Git
        # cd "$HOME_DIR"
        # git clone <URL_DE_VOTRE_REPO> pfe
        print_info "⚠️  Veuillez cloner le projet manuellement :"
        print_info "cd ~"
        print_info "git clone <URL_DE_VOTRE_REPO> pfe"
    else
        print_success "Le projet existe déjà dans $PROJECT_DIR"
    fi
else
    PROJECT_DIR="/root/pfe"
    print_info "⚠️  Veuillez cloner le projet :"
    print_info "cd /root"
    print_info "git clone <URL_DE_VOTRE_REPO> pfe"
fi

################################################################################
# ÉTAPE 5: Configuration du firewall
################################################################################

print_header "ÉTAPE 5: Configuration du firewall (UFW)"

# Installer et configurer UFW
apt install -y ufw

# Autoriser SSH d'abord (sinon on se bloque nous-même)
ufw allow 22/tcp

# Autoriser les ports nécessaires
print_info "Ouverture des ports ..."
ufw allow 3000/tcp      # Frontend
ufw allow 5000/tcp      # Backend
ufw allow 9090/tcp      # Prometheus
ufw allow 4000/tcp      # Grafana
ufw allow 9093/tcp      # Alertmanager
ufw allow 5432/tcp      # PostgreSQL
ufw allow 8080/tcp      # Adminer
ufw allow 8888/tcp      # Jenkins (optionnel)
ufw allow 50000/tcp     # Jenkins agents (optionnel)

# Activer UFW
echo "y" | ufw enable

print_success "Firewall configuré"

################################################################################
# ÉTAPE 6: Vérifications finales
################################################################################

print_header "ÉTAPE 6: Vérifications finales"

# Vérifier Docker
if docker --version > /dev/null 2>&1; then
    print_success "Docker version: $(docker --version)"
else
    print_error "Docker n'a pas pu être vérifié"
fi

# Vérifier Docker Compose
if docker compose version > /dev/null 2>&1; then
    print_success "Docker Compose version: $(docker compose version)"
else
    print_error "Docker Compose n'a pas pu être vérifié"
fi

################################################################################
# RÉSUMÉ FINAL
################################################################################

print_header "✨ INSTALLATION TERMINÉE ✨"

echo -e "${GREEN}"
echo "Prochaines étapes:"
echo "1. Clonez le projet :"
if [ "$SUDO_USER" ]; then
    echo "   sudo -u $SUDO_USER git clone <URL_REPO> ~/pfe"
    echo "   cd ~/pfe"
else
    echo "   git clone <URL_REPO> /root/pfe"
    echo "   cd /root/pfe"
fi
echo ""
echo "2. Lancez le projet :"
echo "   docker compose up -d"
echo ""
echo "3. Accédez aux services :"
echo "   Frontend        : http://<VM_IP>:3000"
echo "   Backend         : http://<VM_IP>:5000/api/health"
echo "   Prometheus      : http://<VM_IP>:9090"
echo "   Grafana         : http://<VM_IP>:4000 (admin/password)"
echo "   Alertmanager    : http://<VM_IP>:9093"
echo "   Adminer (DB)    : http://<VM_IP>:8080"
echo ""
echo "4. Voir les logs :"
echo "   docker compose logs -f"
echo ""
echo "5. Arrêter les services :"
echo "   docker compose down"
echo -e "${NC}"

print_success "La VM est prête à fonctionner !"
