# 🚀 DÉMARRAGE RAPIDE - VS Code Remote SSH + Docker

**Durée estimée : 15-20 minutes**

---

## ⚡ 3 étapes pour être opérationnel

### Étape 1: Préparer votre PC (5 min)

```powershell
# Ouvrez PowerShell et exécutez :
cd C:\Users\User\Desktop\pfe
.\scripts\setup-remote-ssh.ps1
```

**Qu'il faut faire** :
- ✅ L'extension Remote SSH s'installe
- ✅ Créez/éditez le fichier SSH config
- ✅ Ajoutez votre VM :

```ssh
Host pfe-vm
    HostName 192.168.1.100    # Remplacez par votre IP
    User ubuntu
    Port 22
```

---

### Étape 2: Préparer votre VM (10 min)

**Créez une VM** (VirtualBox/Hyper-V/Azure) avec Ubuntu 22.04

**Puis exécutez** (sur la VM) :
```bash
# Téléchargez le script
curl -O https://<votre-repo>/raw/main/scripts/install-vm.sh

# Exécutez-le
sudo bash install-vm.sh

# Attendez la fin...
```

**Qu'il se passe** :
- ✅ Docker installé
- ✅ Docker Compose installé
- ✅ Firewall configuré
- ✅ Ports ouverts (3000, 5000, 4000, 9090, 9093, etc.)

---

### Étape 3: Connecter VS Code à la VM (2 min)

**Dans VS Code** :

1. **Ctrl+Shift+P** → `Remote-SSH: Connect to Host`
2. Sélectionnez `pfe-vm`
3. Entrez votre mot de passe (si demandé)
4. Attendez que VS Code se reconnecte

**Indicateur en bas à gauche** :
- ❌ Avant : `>< SSH`
- ✅ Après : `SSH: pfe-vm`

---

## 🎮 Démarrer le projet

**Une fois connecté à la VM via SSH** :

### Option 1: Avec VS Code Tasks (recommandé)

```
Terminal → Lancer une tâche (Ctrl+Shift+B)
Sélectionnez: 🐳 Docker Compose: Démarrer
Appuyez sur Entrée
Attendez 30 secondes...
```

### Option 2: Avec le terminal

```bash
docker compose up -d
```

---

## 🌐 Accéder aux services

Une fois démarré, ouvrez dans votre navigateur :

| Service | URL | Compte |
|---------|-----|--------|
| **Frontend** | `http://192.168.1.100:3000` | Aucun |
| **Backend** | `http://192.168.1.100:5000/api/health` | Aucun |
| **Grafana** | `http://192.168.1.100:4000` | `admin` / `password` |
| **Prometheus** | `http://192.168.1.100:9090` | Aucun |
| **Alertmanager** | `http://192.168.1.100:9093` | Aucun |
| **Adminer (DB)** | `http://192.168.1.100:8080` | PostgreSQL |

**Remplacez `192.168.1.100` par votre IP réelle**

---

## 🧪 Lancer les tests

```
Ctrl+Shift+B → Sélectionnez: 🧪 Tests: Lancer tests
```

Résultat :
```
PASS  app/backend/tests/health.test.js
PASS  app/backend/tests/servers.test.js

Test Suites: 2 passed, 2 total
Tests:       3 passed, 3 total
```

---

## 🛑 Arrêter le projet

```
Ctrl+Shift+B → Sélectionnez: 🛑 Docker Compose: Arrêter
```

Ou en terminal :
```bash
docker compose down
```

---

## 📝 Modifier les fichiers

Quand vous éditez un fichier dans VS Code (via SSH) :
- **Automatiquement synchronisé** sur la VM
- **Docker rélit** le fichier au prochain redémarrage

**Exemple** :
```
Vous modifiez: app/backend/server.js
   ↓ (automatique)
Le fichier est synchronisé sur la VM via SSH
   ↓
Docker Compose relit le fichier
   ↓
Changements appliqués au prochain lancement
```

---

## 🔧 Autres tâches utiles

```
Ctrl+Shift+B pour voir toutes les tâches :

🐳 Docker Compose
├── Démarrer
├── Arrêter
├── Redémarrer
└── Logs (temps réel)

🧪 Tests
├── Lancer tests
└── Couverture de code

📊 Services (ouvrir dans navigateur)
├── Frontend :3000
├── Prometheus :9090
├── Grafana :4000
├── Alertmanager :9093
└── Admin DB :8080

🔧 Backend
├── Health check (/api/health)
└── Tests curl

📋 npm install
├── Backend
└── Frontend
```

---

## 💡 Astuces

### Astuce 1: Créer un raccourci clavier

Ouvrez `.vscode/settings.json` et ajoutez :
```json
{
  "keybindings": [
    {
      "key": "ctrl+alt+d",
      "command": "workbench.action.tasks.runTask",
      "args": "🐳 Docker Compose: Démarrer"
    }
  ]
}
```

Maintenant : **Ctrl+Alt+D** démarre Docker Compose !

### Astuce 2: Debugger le code

1. Ouvrez `app/backend/server.js`
2. Cliquez sur une ligne (ex: ligne 50)
3. Un point rouge apparaît (breakpoint)
4. **F5** ou **Ctrl+Shift+D** → Sélectionnez "Backend Node.js"
5. Créez une requête : `curl http://192.168.1.100:5000/api/health`
6. L'exécution s'arrête au breakpoint !

### Astuce 3: Voir les logs en temps réel

```
Ctrl+Shift+B → Sélectionnez: 📊 Docker Compose: Logs
```

Vous verrez tous les logs de tous les services :
```
frontend-service | ready on http://localhost:3000
backend-service  | listening on port 5000
postgres-db      | database ready to accept connections
grafana          | preparing dashboard...
```

### Astuce 4: Tester l'API rapidement

```
Ctrl+Shift+B → Sélectionnez: 🔧 Backend Health: GET /api/health
```

Résultat s'affiche dans le terminal :
```json
{
  "status": "up",
  "timestamp": "2026-06-18T...",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

---

## ❓ FAQ

### Q: "Connection refused"
**R:** Vérifiez que la VM est en marche et que l'IP est correcte
```bash
ping 192.168.1.100
ssh ubuntu@192.168.1.100
```

### Q: "Permission denied"
**R:** Vérifiez le fichier SSH config et les identifiants
```bash
ssh -v ubuntu@192.168.1.100  # -v pour déboguer
```

### Q: "Docker command not found"
**R:** Vérifiez que Docker est installé
```bash
docker --version
docker ps
```

### Q: "Port 3000 already in use"
**R:** Le port est occupé par un autre service
```bash
# Voir quel service occupe le port
sudo lsof -i :3000

# Ou tuer le processus
sudo kill -9 <PID>
```

### Q: Comment voir la couverture des tests ?
**R:** Utilisez la tâche de couverture
```
Ctrl+Shift+B → 📈 Tests: Couverture de code
```

---

## ✅ Checklist final

- [ ] VM créée (Ubuntu 22.04)
- [ ] IP de la VM notée (ex: 192.168.1.100)
- [ ] Script `setup-remote-ssh.ps1` exécuté
- [ ] SSH config édité avec votre IP
- [ ] Connexion SSH testée
- [ ] Remote SSH connecté (SSH: pfe-vm en bas à gauche)
- [ ] Docker Compose démarré
- [ ] Services accessibles dans navigateur
- [ ] Tests lancés avec succès

**Tous les checkmarks ✅ ? Bravo ! Vous êtes opérationnel ! 🎉**

---

**Prêt à tester ? Commencez par étape 1 ! 🚀**
