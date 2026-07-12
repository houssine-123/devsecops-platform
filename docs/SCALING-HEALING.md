# Auto-scaling & Self-healing — Réponse aux exigences

Deux exigences ont été formulées :

1. **« Ajouter un serveur automatiquement — prendre une instance d'un serveur existant et le créer automatiquement »** → *auto-scaling*
2. **« Quand un serveur crash, il redémarre automatiquement (sur un autre) »** → *self-healing / failover*

Ces deux besoins sont **les fonctions natives de Kubernetes**. Voici comment ils sont satisfaits et démontrables.

---

## Exigence 1 — Auto-scaling (HorizontalPodAutoscaler)

**Mécanisme** : un `Deployment` Kubernetes définit un *template* (le modèle d'un serveur). Le **HorizontalPodAutoscaler** surveille le CPU réel des instances (via `metrics-server`) et **crée automatiquement des instances identiques** clonées depuis ce template quand la charge dépasse un seuil.

**Configuration** (`kubernetes/manifests/hpa.yaml`) :
- Backend : 2 → 10 instances, seuil CPU 50 %
- Frontend : 2 → 6 instances, seuil CPU 60 %

**Démonstration validée** :
```
Charge injectée → CPU 84%/50% → Kubernetes crée automatiquement
2 → 4 → 8 instances (chaque instance = un clone du template)
```

**Commandes de démo** :
```bash
kubectl get hpa -n devsecops-platform          # voir le seuil et le nombre d'instances
kubectl get pods -n devsecops-platform -l app=backend   # voir les instances
# générer de la charge, puis observer le scaling :
watch kubectl get hpa -n devsecops-platform
```

---

## Exigence 2 — Self-healing (auto-guérison)

**Mécanisme** : le contrôleur de `Deployment` maintient en permanence le nombre d'instances désiré. Si une instance crash ou est supprimée, Kubernetes en **recrée une immédiatement**. Dans un cluster multi-nœuds, si un nœud tombe, les instances sont **reprogrammées sur un autre nœud** automatiquement.

**Démonstration validée** :
```
kubectl delete pod backend-xxx  →  Kubernetes recrée un pod en ~7 secondes
```

**Commande de démo** :
```bash
kubectl get pods -n devsecops-platform -l app=backend -w
# dans un autre terminal : kubectl delete pod <un-pod-backend>
# → observer la recréation automatique
```

> **Note (Docker Desktop = 1 nœud)** : le failover « sur un autre nœud » ne peut pas être
> montré littéralement avec un seul nœud, mais le self-healing au niveau des pods est
> identique. En production multi-nœuds, Kubernetes reprogramme sur un nœud sain sans
> aucune action manuelle. Les probes `liveness`/`readiness` complètent ce mécanisme en
> redémarrant les conteneurs bloqués.

---

## Serveurs déployés via l'interface

Les serveurs créés depuis le formulaire « Déploiement automatique » sont des conteneurs
Docker (node-exporter). Ils bénéficient aussi du self-healing au niveau du démon Docker :

```
docker run -d --restart=unless-stopped ...
```

→ si le conteneur crash, Docker le **redémarre automatiquement**. Le nom du serveur et sa
cible Prometheus sont conservés.

---

## Récapitulatif

| Exigence | Mécanisme | État | Démontrable |
|---|---|---|---|
| Créer une instance automatiquement | HPA + Deployment template | ✅ | 2→8 instances sous charge |
| Redémarrage auto en cas de crash (app) | Deployment self-healing | ✅ | delete pod → recréé en 7 s |
| Redémarrage auto (serveurs UI) | Docker `--restart=unless-stopped` | ✅ | crash conteneur → redémarré |
| Reprogrammation sur un autre nœud | Scheduler K8s (multi-nœuds) | ⚙️ | conceptuel (1 nœud en local) |

**Prérequis installé** : `metrics-server` (patché `--kubelet-insecure-tls` pour Docker Desktop).
