#!/bin/bash
# Script de provisioning automatique pour créer une VM avec Node Exporter

set -e

SERVER_NAME=$1
VAGRANT_DIR="/tmp/vagrant-$SERVER_NAME"

echo "🚀 Déploiement automatique: $SERVER_NAME"

# 1. Créer le répertoire Vagrant
mkdir -p "$VAGRANT_DIR"
cd "$VAGRANT_DIR"

# 2. Créer le Vagrantfile
cat > Vagrantfile <<'EOF'
Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/jammy64"

  config.vm.provider "virtualbox" do |vb|
    vb.memory = 1024
    vb.cpus = 1
  end

  config.vm.network "public_network", type: "dhcp"

  config.vm.provision "shell", inline: <<-SHELL
    apt-get update
    apt-get install -y curl wget ca-certificates

    # Créer utilisateur
    useradd -rs /sbin/nologin node_exporter || true

    # Télécharger Node Exporter
    cd /tmp
    wget https://github.com/prometheus/node_exporter/releases/download/v1.7.0/node_exporter-1.7.0.linux-amd64.tar.gz
    tar xzf node_exporter-1.7.0.linux-amd64.tar.gz
    cp node_exporter-1.7.0.linux-amd64/node_exporter /usr/local/bin/
    chmod +x /usr/local/bin/node_exporter

    # Créer systemd service
    cat > /etc/systemd/system/node_exporter.service <<'SERVICE'
[Unit]
Description=Node Exporter
After=network.target

[Service]
Type=simple
User=node_exporter
ExecStart=/usr/local/bin/node_exporter
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
SERVICE

    # Démarrer le service
    systemctl daemon-reload
    systemctl enable node_exporter
    systemctl start node_exporter

    echo "✅ Node Exporter démarré sur port 9100"
  SHELL
end
EOF

echo "📦 Créating VM..."
vagrant up --provider virtualbox 2>&1 | tail -20

# 3. Récupérer l'IP
echo "🔍 Récupération de l'IP..."
VM_IP=$(vagrant ssh -c "hostname -I" 2>/dev/null | awk '{print $1}' | head -1)

if [ -z "$VM_IP" ]; then
  echo "❌ Erreur: Impossible de récupérer l'IP"
  exit 1
fi

echo "✅ VM créée avec l'IP: $VM_IP"
echo "$VM_IP"
