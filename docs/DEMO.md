# 🎬 Script de démonstration — Soutenance PFE (10 minutes)

## ✅ Checklist — 30 minutes AVANT la soutenance

```powershell
# 1. Docker Desktop démarré + Kubernetes vert (icône baleine → Kubernetes running)

# 2. Toute la stack Compose est up (17 conteneurs)
docker compose up -d
docker ps --format "{{.Names}} {{.Status}}" | findstr devsecops

# 3. Tous les pods Kubernetes sont Running
kubectl get pods -n devsecops-platform
kubectl get pods -n argocd

# 4. L'entrée hosts existe (sinon PowerShell ADMIN) :
#    Add-Content C:\Windows\System32\drivers\etc\hosts "127.0.0.1 devsecops.local"

# 5. Tester CHAQUE URL dans le navigateur (onglets pré-ouverts, dans cet ordre) :
#    Onglet 1 : https://devsecops.local          (accepter le certificat AVANT la démo)
#    Onglet 2 : http://localhost:8090            (Jenkins, déjà connecté)
#    Onglet 3 : http://localhost:30088           (ArgoCD, déjà connecté)
#    Onglet 4 : http://localhost:9000            (SonarQube, déjà connecté)
#    Onglet 5 : http://localhost:4001            (Grafana, dashboard ouvert)
#    Onglet 6 : https://github.com/houssine-123/devsecops-platform (historique commits)

# 6. Un terminal ouvert sur C:\Users\User\Desktop\pfe

# 7. Slack ouvert sur #alerts + Gmail ouvert (pour montrer les alertes)

# 8. PLAN B : captures d'écran du build #19 vert + vidéo de secours enregistrées
```

⚠️ **Identifiants à avoir sous la main** (ne sont PAS dans ce dépôt) : Jenkins, ArgoCD, SonarQube, Grafana.

---

## 🎯 Fil conducteur (à annoncer en intro)

> « Je vais faire une seule action — modifier une ligne de code et la pousser sur git.
> Vous allez voir le code être compilé, analysé, scanné, publié et déployé en production
> Kubernetes **sans aucune intervention humaine**, avec la sécurité vérifiée à chaque étape. »

---

## ⏱ Déroulé minute par minute

### Minute 0–1 — Architecture (onglet GitHub)

- Montrer le **diagramme d'architecture** du README.
- Phrase clé : « Git est la **source de vérité unique** : le pipeline CI committe les versions
  d'images dans git, et ArgoCD fait converger le cluster vers cet état. C'est le principe GitOps. »

### Minute 1–2 — L'application en production (onglet 1)

- Ouvrir **https://devsecops.local** → montrer le cadenas/certificat (cert-manager).
- Taper `http://devsecops.local` → montrer la **redirection automatique vers HTTPS** (308).
- Montrer rapidement l'app : liste des serveurs supervisés, formulaire de déploiement.

### Minute 2–3 — Déclencher le pipeline (terminal + onglet 2)

```powershell
cd C:\Users\User\Desktop\pfe
# Modification visible : changer un texte dans le frontend, ex. le titre
# (préparer la ligne à l'avance dans app/frontend/src/App.jsx ou index.html)
git add .
git commit -m "Demo soutenance: mise a jour du titre"
git push
```

- Aller sur **Jenkins → devsecops-pipeline → Build Now** (le webhook n'étant pas exposé
  publiquement, on déclenche manuellement).
- Ouvrir la vue **Stage View** : les 13 étapes apparaissent et se colorent en vert une à une.

### Minute 3–5 — Pendant que le pipeline tourne (onglets 4 puis 2)

Le build prend ~3,5 min : c'est le moment de commenter chaque étape en direct.

- **SonarQube** (onglet 4) : montrer le projet `devsecops-pfe`, les métriques, et dire :
  « Le Quality Gate est **bloquant** — si la qualité échoue, le déploiement n'a pas lieu. »
- **Jenkins logs** : cliquer sur l'étape *Trivy - Image Scan* → montrer le tableau des CVE :
  « Trivy a détecté 15 vulnérabilités HIGH réelles avec leurs correctifs — preuve que le
  scan fonctionne. En production on bloquerait sur CRITICAL. »
- Montrer l'étape **Update Manifests (GitOps)** : « Le pipeline vient de committer le nouveau
  tag d'image dans git — regardez le commit "Jenkins CI" sur GitHub » (onglet 6, rafraîchir).

### Minute 5–7 — Le déploiement GitOps (onglet 3 + terminal)

- **ArgoCD** : ouvrir l'application `devsecops-platform` → montrer l'arbre de ressources,
  le statut qui passe par *Progressing* → *Synced + Healthy*.
- Dans le terminal, montrer les pods en train de rouler :

```powershell
kubectl get pods -n devsecops-platform -w
# (Ctrl+C après avoir vu les nouveaux pods Running)
kubectl get deploy backend-deployment -n devsecops-platform -o jsonpath="{.spec.template.spec.containers[0].image}"
```

- Phrase clé : « Le tag de l'image correspond exactement au numéro de build Jenkins et au
  commit git : **traçabilité complète** du code source jusqu'au conteneur en production. »
- Rafraîchir **https://devsecops.local** → la modification du titre est visible. 🎯

### Minute 7–9 — Supervision et alerting (onglet 5 + app)

- **Grafana** : dashboard système (CPU/RAM/disque) + métriques applicatives.
- **Fonctionnalité originale** : dans l'app, déployer un serveur via le formulaire →
  il apparaît automatiquement comme cible Prometheus (`dynamic-servers`) :

```powershell
# Montrer la cible auto-enregistrée
Invoke-RestMethod http://localhost:9091/api/v1/targets | ConvertTo-Json -Depth 3 | Select-String "dynamic"
```

- **Alerte test** → email + Slack en direct :

```powershell
$body = '[{"labels":{"alertname":"DemoSoutenance","severity":"critical"},"annotations":{"summary":"Alerte de demonstration","description":"Test en direct devant le jury"}}]'
Invoke-RestMethod -Uri "http://localhost:9094/api/v2/alerts" -Method POST -Body $body -ContentType "application/json"
```

- Montrer la notification qui arrive dans **Slack #alerts** (~10 s) et l'**email**.

### Minute 9–10 — Sécurité & conclusion

- Backup automatique : `kubectl get cronjob -n devsecops-platform` (02:00 quotidien, rétention 7 j).
- Vault : `http://localhost:8200` (gestion des secrets).
- Conclusion : « Chaque exigence du cahier des charges est couverte, testée, et démontrable —
  le tableau de conformité est dans le README avec les preuves. »

---

## 🛟 Plan B — si quelque chose casse

| Panne | Réaction |
|---|---|
| **Pas d'Internet** (git push / docker push échouent) | Montrer le **build #19 dans l'historique Jenkins** (100 % vert, logs complets), les commits "Jenkins CI" déjà sur GitHub, et dérouler le reste de la démo (ArgoCD, Grafana, alertes) qui fonctionne **entièrement en local** |
| Le pipeline échoue à une étape | Ouvrir le log de l'étape, **expliquer le diagnostic** (le jury apprécie la maîtrise du debug), puis basculer sur build #19 |
| ArgoCD lent à synchroniser | Forcer : bouton **SYNC** dans l'UI, ou `kubectl -n argocd annotate application devsecops-platform argocd.argoproj.io/refresh=normal --overwrite` |
| Slack/Email n'arrive pas | Montrer l'alerte active dans AlertManager : `http://localhost:9094` |
| Écran figé / navigateur crash | Captures d'écran + vidéo de secours préparées la veille |

---

## ❓ Questions probables du jury — réponses courtes

**« Pourquoi GitOps plutôt qu'un `kubectl apply` depuis Jenkins ? »**
Git devient la source de vérité auditable : tout changement du cluster est un commit (qui, quoi, quand). ArgoCD corrige aussi automatiquement toute dérive manuelle (selfHeal) — je l'ai constaté : une modification `kubectl` directe est annulée en secondes.

**« Que se passe-t-il si Trivy trouve une vulnérabilité critique ? »**
Actuellement le scan est rapporté (rapports JSON archivés) sans bloquer, pour la démo. En production, on ajoute `--exit-code 1 --severity CRITICAL` : le pipeline échoue et l'image n'est jamais publiée.

**« Pourquoi le certificat est-il auto-signé ? »**
Let's Encrypt exige un domaine public résolvable pour la validation ACME ; `devsecops.local` est local. Les ClusterIssuers Let's Encrypt (staging + prod) sont déjà configurés — il suffit d'un vrai domaine pour basculer.

**« Comment sont gérés les secrets ? »**
Trois niveaux : Vault pour les secrets applicatifs, le credentials store Jenkins pour le pipeline (Docker Hub, GitHub, ArgoCD, kubeconfig), et les fichiers sensibles gitignorés (le push protection de GitHub a d'ailleurs bloqué un secret pendant le développement — preuve que la chaîne fonctionne).

**« Quelle est la durée d'un déploiement complet ? »**
~3,5 minutes du `git push` aux pods en production (build #19 mesuré), grâce au cache : layers Docker, base Trivy (1,1 Go pré-téléchargée), `npm ci` avec lockfiles.

**« Zero-downtime ? »**
Oui : RollingUpdate Kubernetes — les anciens pods ne s'arrêtent que quand les nouveaux passent les readiness probes. Constaté pendant le développement : quand une nouvelle image crashait, les anciens pods continuaient de servir.

---

## 📊 Chiffres à retenir

| Métrique | Valeur |
|---|---|
| Durée du pipeline complet | ~3,5 min |
| Étapes du pipeline | 13 (7 exigées par le cahier des charges) |
| Conteneurs Docker Compose | 17 |
| Pods Kubernetes | ~15 (2 replicas front + back) |
| CVE HIGH détectées par Trivy | 15 (avec versions corrigées identifiées) |
| Exporters Prometheus | 5 + cibles dynamiques |
| Canaux d'alerte | 3 (webhook, email, Slack) |
| Fréquence des backups | Quotidienne (02:00), rétention 7 jours |
