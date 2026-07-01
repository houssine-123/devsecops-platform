# 🚀 Guide Complet: VS Code Remote SSH + Docker

Ce guide vous montre comment connecter VS Code à votre VM Linux via SSH et travailler confortablement sur votre projet depuis votre PC.

---

## 📋 Prérequis

- ✅ Une VM Ubuntu 22.04 créée (locale ou cloud)
- ✅ Docker + Docker Compose installés sur la VM (voir `scripts/install-vm.sh`)
- ✅ VS Code installé sur votre PC
- ✅ L'adresse IP de la VM (ou le nom d'hôte)
- ✅ Les identifiants SSH (utilisateur + mot de passe ou clé SSH)

---

## 🛠️ Étape 1: Installer l'extension Remote SSH dans VS Code

### Sur votre PC :

1. **Ouvrez VS Code**
2. **Allez à Extensions** (Ctrl+Shift+X)
3. **Cherchez** `Remote - SSH`
4. **Installez** l'extension officielle Microsoft

![Remote SSH Extension](https://img.icons8.com/color/96/000000/visual-studio-code-2019.png)

---

## 🔐 Étape 2: Configurer la connexion SSH

### Méthode 1: Configuration manuelle (avec mot de passe)

1. **Ouvrez la palette** (Ctrl+Shift+P)
2. **Tapez** `Remote-SSH: Open Configuration File`
3. **Choisissez** le fichier `config` à éditer (ou créez un nouveau)
4. **Ajoutez cette configuration** :

```ssh
Host pfe-vm
    HostName <IP_DE_LA_VM>
    User ubuntu
    Port 22
```

**Remplacez** :
- `<IP_DE_LA_VM>` par l'IP réelle de votre VM (ex: `192.168.1.100` ou `192.0.2.1`)
- `ubuntu` par votre nom d'utilisateur si différent

### Méthode 2: Configuration avec clé SSH (recommandé - plus sécurisé)

1. **Générez une clé SSH** (sur votre PC, si vous n'en avez pas) :

```powershell
ssh-keygen -t rsa -b 4096 -f $env:USERPROFILE\.ssh\id_rsa
```

2. **Copiez la clé publique sur la VM** :

```powershell
scp $env:USERPROFILE\.ssh\id_rsa.pub ubuntu@<IP_VM>:/tmp/
ssh ubuntu@<IP_VM> "cat /tmp/id_rsa.pub >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

3. **Mettez à jour la configuration SSH** :

```ssh
Host pfe-vm
    HostName <IP_DE_LA_VM>
    User ubuntu
    IdentityFile ~/.ssh/id_rsa
    Port 22
```

---

## 🌐 Étape 3: Connecter VS Code à la VM

### Via la palette

1. **Ouvrez la palette** (Ctrl+Shift+P)
2. **Tapez** `Remote-SSH: Connect to Host`
3. **Sélectionnez** `pfe-vm`
4. **Attendez** la connexion (premier connexion = plus long)
5. **Entrez votre mot de passe** si demandé

### Via l'écran de bienvenue

1. **Cliquez sur** `Remote Explorer` dans la barre latérale
2. **Sélectionnez** `SSH Targets`
3. **Double-cliquez** sur `pfe-vm`

### Résultat

Une fois connecté :
- L'indicateur en bas à gauche affiche `SSH: pfe-vm`
- La barre latérale affiche les fichiers **de la VM**
- Vous pouvez explorer le projet

---

## 📁 Étape 4: Ouvrir le projet sur la VM

1. **Fichier → Ouvrir un dossier** (ou Ctrl+K Ctrl+O)
2. **Naviguez à** `/home/ubuntu/pfe` (ou votre chemin)
3. **Sélectionnez**
4. **Attendez** que VS Code charge les fichiers

---

## 💾 Étape 5: Cloner le projet sur la VM

Si le projet n'existe pas encore sur la VM :

1. **Terminal dans VS Code** (Ctrl+`)
2. **Exécutez** :

```bash
cd ~
git clone <URL_DE_VOTRE_REPO> pfe
cd pfe
```

Le terminal s'exécute **sur la VM**, pas sur votre PC !

---

## 🚀 Étape 6: Lancer Docker Compose

Maintenant que vous êtes connecté à la VM via SSH :

### Option 1: Terminal VS Code

**Terminal → Nouveau terminal** (Ctrl+`) et exécutez :

```bash
docker compose up -d
```

Vous verrez les logs s'afficher en temps réel.

### Option 2: Tâches VS Code (plus facile)

**Terminal → Lancer une tâche** (Ctrl+Shift+B) ou via la palette **Tasks: Run Task**

Les tâches disponibles :
- 🐳 **Docker Compose: Démarrer** → `docker compose up -d`
- 🛑 **Docker Compose: Arrêter** → `docker compose down`
- 📊 **Docker Compose: Logs** → Affiche les logs en continu
- 🧪 **Tests: Lancer tests** → Exécute `npm test` sur le backend

Sélectionnez une tâche et appuyez sur Entrée.

---

## 🌐 Étape 7: Accéder aux services

Une fois Docker Compose lancé, vous pouvez accéder aux services via l'IP de la VM :

| Service | URL | Identifiants |
|---------|-----|--------------|
| Frontend | `http://<VM_IP>:3000` | Aucun |
| Backend API | `http://<VM_IP>:5000/api/health` | Aucun |
| Prometheus | `http://<VM_IP>:9090` | Aucun |
| Grafana | `http://<VM_IP>:4000` | `admin` / `password` |
| Alertmanager | `http://<VM_IP>:9093` | Aucun |
| Adminer (DB) | `http://<VM_IP>:8080` | `postgresql` / `postgres:changeme@localhost` |

**Remplacez** `<VM_IP>` par l'adresse IP réelle (ex: `192.168.1.100`)

---

## ✏️ Étape 8: Éditer les fichiers

### Modification automatique

Quand vous modifiez un fichier dans VS Code :

```
Votre PC (VS Code)         VM (SSH)
    ↓
  Fichier modifié
    ↓
  Synchronisé automatiquement via SSH
    ↓
  Docker relit le fichier
```

**Exemple** : Vous modifiez `app/backend/server.js` → la VM le reçoit instantanément → Docker le relit au redémarrage.

### Debugging avec VS Code

1. **Ouvrez le fichier** à déboguer
2. **Cliquez sur la gutter** pour ajouter un breakpoint
3. **Terminal → Exécuter la tâche** `Tests: Lancer tests`
4. **Le debugger** s'arrête aux breakpoints

---

## 🔧 Étape 9: Utiliser les tâches VS Code

### Afficher toutes les tâches

**Terminal → Lancer une tâche** ou **Ctrl+Shift+B**

Disponibles :
- 🐳 Docker Compose (Démarrer/Arrêter/Redémarrer/Logs)
- 🧪 Tests (Lancer/Couverture)
- 📊 Services (Prometheus/Grafana/Alertmanager)
- 🔧 Backend API tests
- 📋 npm install (Frontend/Backend)

### Créer des raccourcis clavier

Ouvrez `keybindings.json` (Préférences → Raccourcis clavier → {} en haut à droite) :

```json
[
  {
    "key": "ctrl+shift+d",
    "command": "workbench.action.tasks.runTask",
    "args": "🐳 Docker Compose: Démarrer"
  },
  {
    "key": "ctrl+shift+s",
    "command": "workbench.action.tasks.runTask",
    "args": "🛑 Docker Compose: Arrêter"
  },
  {
    "key": "ctrl+shift+t",
    "command": "workbench.action.tasks.runTask",
    "args": "🧪 Tests: Lancer tests"
  }
]
```

---

## 🐛 Dépannage

### Erreur: "Permission denied (publickey,password)"

**Solution** : Vérifiez que le mot de passe/clé SSH est correct

```powershell
# Testez la connexion SSH d'abord
ssh ubuntu@<IP_VM>
```

### Erreur: "Could not establish connection"

**Solution** : Vérifiez que la VM est accessible

```powershell
# Testez la connexion ping
ping <IP_VM>

# Ou testez SSH directement
ssh -v ubuntu@<IP_VM>  # -v pour verbose (messages détaillés)
```

### Erreur: "Docker command not found"

**Solution** : Vérifiez que Docker est installé et que l'utilisateur est dans le groupe docker

```bash
# Sur la VM, exécutez
docker ps  # Doit lister les containers

# Si permission denied, exécutez
sudo usermod -aG docker $USER
newgrp docker
```

### Erreur: "Could not authenticate"

**Solution** : Vérifiez le fichier `~/.ssh/config`

```bash
# Vérifiez la syntaxe
cat ~/.ssh/config

# Testez la clé SSH
ssh -i ~/.ssh/id_rsa ubuntu@<IP_VM>
```

---

## 💡 Tips & Astuces

### Astuce 1: Ouvrir VS Code directement sur la VM

```powershell
# Sur votre PC
code --remote ssh-remote/pfe-vm /home/ubuntu/pfe
```

### Astuce 2: Synchroniser avec Git

```bash
# Terminal VS Code (exécuté sur la VM)
git pull origin main
git push origin main
```

### Astuce 3: Installer des extensions sur la VM

Quand connecté via SSH, les extensions s'installent **localement** (VS Code) et **sur la VM** (Remote Server) automatiquement. Certaines extensions nécessitent une version "Remote" :

- Remote Containers
- Remote SSH Server
- Python Remote

### Astuce 4: Paralléliser le travail

Vous pouvez avoir **plusieurs fenêtres VS Code** :
- 1 connectée à la VM via SSH
- 1 sur votre PC pour éditer localement

---

## 🎯 Flux de travail complet

```
1. Ouvrez VS Code sur votre PC
   ↓
2. Connectez-vous à la VM via Remote SSH
   ↓
3. Ouvrez le dossier du projet (Ctrl+K Ctrl+O)
   ↓
4. Terminal → Nouvelle tâche : "🐳 Docker Compose: Démarrer"
   ↓
5. Attendez que tous les services démarrent
   ↓
6. Ouvrez le navigateur et accédez à http://<VM_IP>:3000
   ↓
7. Modifiez les fichiers dans VS Code (synchronisés automatiquement)
   ↓
8. Lancez les tests avec "🧪 Tests: Lancer tests"
   ↓
9. Consultez les logs avec "📊 Docker Compose: Logs"
   ↓
10. Quand terminé: "🛑 Docker Compose: Arrêter"
```

---

## 📚 Ressources supplémentaires

- [Docs VS Code Remote SSH](https://code.visualstudio.com/docs/remote/ssh)
- [SSH Config Reference](https://linux.die.net/man/5/ssh_config)
- [Docker Compose CLI](https://docs.docker.com/compose/reference/)
- [Tâches VS Code](https://code.visualstudio.com/docs/editor/tasks)

---

## ✅ Checklist finale

- [ ] Extension Remote SSH installée
- [ ] Fichier SSH `config` configuré
- [ ] Vous pouvez vous connecter à la VM (`pfe-vm`)
- [ ] Fichier `.vscode/tasks.json` copié
- [ ] Vous pouvez ouvrir le projet sur la VM
- [ ] `docker compose up -d` fonctionne
- [ ] Vous pouvez accéder aux services (3000, 5000, 4000, 9090, 9093)
- [ ] Vous pouvez éditer des fichiers et les voir synchronisés
- [ ] Les tâches VS Code apparaissent

---

**Prêt ? Commencez par l'Étape 1 ! 🚀**
