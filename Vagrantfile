# Vagrantfile - Auto-provisioning DevSecOps Servers
Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/jammy64"

  # Default provider
  config.vm.provider "virtualbox" do |vb|
    vb.memory = 1024
    vb.cpus = 1
    vb.linked_clone = true
  end

  # Network - Bridged so it's accessible from host
  config.vm.network "public_network", type: "dhcp"

  # SSH config
  config.ssh.insert_key = true

  # Ansible provisioning
  config.vm.provision "ansible_local" do |ansible|
    ansible.playbook = "ansible/provision.yml"
    ansible.install_mode = "pip3"
    ansible.verbose = "v"
  end
end
