# 🎥 Script de tournage — Vidéo de démonstration (soutenance)

Durée cible : **8 à 12 minutes**. L'objectif : montrer la chaîne DevSecOps de bout en bout,
puis les fonctions demandées par l'encadrant (auto-scaling, self-healing) et la sécurité runtime.

---

## PARTIE 0 — Préparation (30 min avant, NE PAS filmer)

### 0.1 — Démarrer toute la plateforme
```powershell
# Docker Desktop doit être lancé et Kubernetes vert (icône baleine)
cd C:\Users\User\Desktop\pfe
docker compose up -d
# Attendre 3 minutes que tout démarre, puis vérifier :
kubectl get pods -n devsecops-platform
kubectl get pods -n falco
```
Tous les pods doivent être `Running`. Si un pod n'est pas prêt, attendez.

### 0.2 — Résoudre le domaine (PowerShell ADMINISTRATEUR, une seule fois)
```powershell
Add-Content C:\Windows\System32\drivers\etc\hosts "127.0.0.1 devsecops.local"
```

### 0.3 — Pré-ouvrir les onglets du navigateur, DÉJÀ CONNECTÉS, dans cet ordre :
| Onglet | URL | Identifiants |
|---|---|---|
| 1 | https://devsecops.local | (accepter le certificat une fois) |
| 2 | http://localhost:8090 (Jenkins) | admin / admin |
| 3 | http://localhost:30088 (ArgoCD) | admin / DevSecOps2026 |
| 4 | http://localhost:9000 (SonarQube) | admin / DevSecOps2026 |
| 5 | http://localhost:4001 (Grafana) | admin / DevSecOps2026 |
| 6 | Slack, canal #alerts | — |
| 7 | Gmail (boîte de réception) | — |

### 0.4 — Ouvrir deux terminaux PowerShell côte à côte
- Terminal A : pour les commandes `kubectl`
- Terminal B : pour le `git push` / la charge

### 0.5 — Préparer la modification de code à l'avance
Ouvrez `app\frontend\src\App.jsx`, repérez la ligne du sous-titre (~ligne 253) :
```jsx
<p className="subtitle">Supervision d'infrastructure · nœuds & alertes</p>
```
Vous la modifierez EN DIRECT pendant la démo (voir étape 2).

### 0.6 — Outil d'enregistrement
- **Windows** : `Windows + G` (Xbox Game Bar) → bouton Enregistrer. Simple, intégré.
- **Meilleur** : **OBS Studio** (gratuit) — permet de filmer l'écran + webcam + son. Recommandé si vous voulez vous filmer en train de commenter.
- Enregistrez en **1080p**. Fermez les applications inutiles (notifications, etc.).

---

## PARTIE 1 — Introduction (1 min) 🎬

**À l'écran** : onglet 1, l'application en **https://devsecops.local**

**À dire** :
> « Voici la plateforme DevSecOps que j'ai réalisée. L'application est déployée sur Kubernetes,
> servie en HTTPS — vous voyez le cadenas. C'est une application trois tiers : frontend React,
> backend Node.js, base PostgreSQL. Je vais vous montrer comment une simple modification de code
> arrive automatiquement en production, en passant par tous les contrôles de sécurité. »

- Montrez la barre d'adresse (le `https://`), faites défiler l'app : le dashboard, la supervision
  temps réel, les serveurs, les alertes.
- **Pointez le pied de page** : « Build #XX » — retenez ce numéro, il va changer à la fin.

---

## PARTIE 2 — Déclencher le pipeline (1 min) 🎬

**À l'écran** : votre éditeur de code + Terminal B

**Action** — modifiez le sous-titre dans `App.jsx`, par exemple :
```jsx
<p className="subtitle">Supervision d'infrastructure · démonstration soutenance</p>
```

**À dire** :
> « Je modifie une ligne dans le frontend, et je la pousse sur Git. C'est la seule action manuelle
> de toute la chaîne. »

**Commande** (Terminal B) :
```powershell
cd C:\Users\User\Desktop\pfe
git add app/frontend/src/App.jsx
git commit -m "Demo soutenance : modification du sous-titre"
git push
```

- Puis onglet 2 (Jenkins) → job **devsecops-pipeline** → **Build Now**.
  *(Le webhook n'étant pas exposé publiquement, on déclenche manuellement.)*

---

## PARTIE 3 — Pendant que le pipeline tourne (2-3 min) 🎬

Le build prend ~4 min : c'est le moment de commenter la chaîne.

**Onglet 2 (Jenkins), vue Stage View** :
> « Le pipeline enchaîne 14 étapes. Vous voyez les tests unitaires, l'analyse SonarQube,
> les scans de sécurité — Trivy, Gitleaks, Checkov — qui s'exécutent un par un. »

- Cliquez sur une étape terminée (ex. **Trivy - Image Scan**) → montrez les logs :
  > « Ici Trivy a scanné l'image et détecté les vulnérabilités. La politique bloque les CRITICAL. »

**Onglet 4 (SonarQube)** :
> « SonarQube analyse la qualité du code. Le Quality Gate est bloquant : si la qualité échoue,
> le déploiement n'a pas lieu. »
- Montrez le projet `devsecops-pfe`, les métriques, le gate vert.

---

## PARTIE 4 — Le GitOps et le déploiement (2 min) 🎬

**À dire** :
> « Point clé : le pipeline ne déploie jamais directement. Il inscrit la nouvelle version dans
> les manifestes Git — regardez, il y a un commit "Jenkins CI" — et c'est ArgoCD qui déploie. »

- Onglet GitHub (ou `git log` dans Terminal A) : montrez le commit automatique du pipeline.
- **Onglet 3 (ArgoCD)** → application **devsecops-platform** :
  > « ArgoCD compare en permanence le cluster à Git. Il synchronise, les pods se remplacent
  > progressivement. Statut : Synced et Healthy. »
- Montrez l'arbre des ressources qui passe en vert.

**Terminal A** — montrez les pods qui roulent :
```powershell
kubectl get pods -n devsecops-platform -l app=frontend
```

**Onglet 1** — rafraîchissez **https://devsecops.local** (Ctrl+F5) :
> « Et voilà : ma modification est en production, et le numéro de build en pied de page a changé. »
🎯 **C'est le moment fort** : le sous-titre modifié + le nouveau Build #.

---

## PARTIE 5 — Sécurité runtime : Falco → Slack (1-2 min) 🎬

**À dire** :
> « Au-delà du pipeline, la sécurité continue en production. Falco surveille les conteneurs.
> Je simule une intrusion : je lis le fichier des mots de passe depuis un conteneur. »

**Terminal A** :
```powershell
kubectl exec -n devsecops-platform deploy/backend-deployment -- sh -c "cat /etc/shadow"
```

- **Onglet 6 (Slack #alerts)** — attendez ~10 s, puis montrez l'alerte qui arrive :
  > « Falco a détecté la lecture de /etc/shadow et l'a signalée dans Slack en temps réel,
  > avec le conteneur et la commande exacts. »

---

## PARTIE 6 — Auto-scaling (2 min) 🎬 — *ce que l'encadrant a demandé*

**À dire** :
> « L'encadrant m'a demandé qu'on puisse créer des serveurs automatiquement. En Kubernetes,
> c'est l'auto-scaling : je génère de la charge, et le cluster crée des instances tout seul. »

**Terminal A** — montrez l'état initial :
```powershell
kubectl get hpa -n devsecops-platform
kubectl get pods -n devsecops-platform -l app=backend
```
(2 répliques)

**Terminal B** — injectez de la charge CPU dans le backend :
```powershell
$pods = kubectl get pods -n devsecops-platform -l app=backend -o jsonpath='{.items[*].metadata.name}'
foreach ($p in $pods.Split(' ')) { kubectl exec -n devsecops-platform $p -- sh -c "nohup node -e 'while(true){Math.sqrt(Math.random())}' >/dev/null 2>&1 &" }
```

**Terminal A** — surveillez le scaling (laissez tourner ~2 min) :
```powershell
kubectl get hpa -n devsecops-platform -w
```
> « Le CPU dépasse 50 %, et Kubernetes crée automatiquement de nouvelles instances : 2, 4, 8… »

- Montrez `kubectl get pods -n devsecops-platform -l app=backend` : les nouvelles instances.

**Arrêter la charge** (pour la suite) :
```powershell
foreach ($p in (kubectl get pods -n devsecops-platform -l app=backend -o jsonpath='{.items[*].metadata.name}').Split(' ')) { kubectl exec -n devsecops-platform $p -- sh -c "pkill node 2>/dev/null" 2>$null }
```

---

## PARTIE 7 — Self-healing (1 min) 🎬 — *ce que l'encadrant a demandé*

**À dire** :
> « Deuxième demande : qu'un serveur qui crash redémarre tout seul. Je supprime brutalement
> un pod du backend. »

**Terminal A** :
```powershell
# afficher les pods, puis en supprimer un
kubectl get pods -n devsecops-platform -l app=backend
kubectl delete pod <NOM-D-UN-POD-BACKEND> -n devsecops-platform
# observer la recréation
kubectl get pods -n devsecops-platform -l app=backend
```
> « Kubernetes détecte la disparition et recrée immédiatement un pod pour maintenir le nombre
> désiré. Le service n'a jamais été interrompu grâce aux répliques. »

---

## PARTIE 8 — Observabilité (1 min) 🎬

**Onglet 5 (Grafana)** :
> « Tout est supervisé. Voici les tableaux de bord Grafana : trafic, latence, ressources,
> et un tableau dédié aux alertes. »
- Montrez le dashboard **Application** ou **DevSecOps - Alertes** avec les courbes.

**(Optionnel) Alerte email** — simulez une panne depuis l'app :
- Onglet 1 → tableau serveurs → bouton **Simuler panne** sur un serveur
- Onglet 7 (Gmail) : montrez l'email d'alerte qui arrive.

---

## PARTIE 9 — Conclusion (30 s) 🎬

**À dire** :
> « En résumé : une modification de code déclenche une chaîne entièrement automatisée —
> qualité, sécurité à chaque couche, déploiement GitOps, et supervision continue. La plateforme
> se met à l'échelle et se répare toute seule. Chaque étape est tracée dans Git et réversible. »

---

## ✅ Checklist finale avant de valider la vidéo
- [ ] Le HTTPS est visible (cadenas / https:// dans la barre)
- [ ] Le pipeline apparaît vert de bout en bout
- [ ] La modification est visible en prod + nouveau numéro de build
- [ ] L'alerte Falco apparaît dans Slack
- [ ] Le scaling 2 → plusieurs est filmé
- [ ] La recréation du pod (self-healing) est filmée
- [ ] Le son est audible, l'écran lisible (1080p)

## 💡 Conseils de tournage
- **Enregistrez par segments** : vous n'êtes pas obligé de tout filmer d'un coup. Filmez chaque
  partie séparément et assemblez (l'attente du pipeline peut être coupée au montage).
- **Coupez les temps morts** : accélérez ou coupez l'attente du build de 4 min.
- **Parlez lentement et clairement** : c'est une soutenance, pas une course.
- **Refaites une prise** si vous vous trompez — c'est une vidéo, pas du direct.
- Gardez cette vidéo comme **plan B** même si vous faites la démo en direct le jour J.
