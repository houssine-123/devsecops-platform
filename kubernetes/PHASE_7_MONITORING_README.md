# Phase 7 : Monitoring Kubernetes (Prometheus + Grafana)

## Objectif
Déployer un stack de monitoring Kubernetes pour :
- infrastructure CPU/RAM/disque
- Kubernetes pods & noeuds
- application requests, erreurs, latence
- sécurité via alerting et dashboards

## Composants déployés

- `Prometheus` : collecte des métriques
- `Grafana` : dashboards et visualisation
- `kube-state-metrics` : métriques Kubernetes
- `node-exporter` : métriques système par noeud
- `Alertmanager` : routage d'alertes

## Fichiers de manifestes

Tous les manifests se trouvent dans : `kubernetes/manifests/monitoring/`

- `prometheus-configmap.yaml`
- `prometheus-deployment.yaml`
- `prometheus-service.yaml`
- `grafana-secret.yaml`
- `grafana-datasource-configmap.yaml`
- `grafana-provisioning-configmap.yaml`
- `grafana-dashboard-configmap.yaml`
- `grafana-deployment.yaml`
- `grafana-service.yaml`
- `kube-state-metrics-deployment.yaml`
- `kube-state-metrics-service.yaml`
- `node-exporter-daemonset.yaml`
- `node-exporter-service.yaml`
- `alertmanager-configmap.yaml`
- `alertmanager-deployment.yaml`
- `alertmanager-service.yaml`

## Déploiement

### Linux / macOS
```bash
cd kubernetes
chmod +x deploy-monitoring-k8s.sh
./deploy-monitoring-k8s.sh
```

### Windows PowerShell
```powershell
# Si vous êtes déjà dans le dossier kubernetes :
.\deploy-monitoring-k8s.ps1

# Si vous êtes dans le dépôt racine :
cd kubernetes
.\deploy-monitoring-k8s.ps1
```

### Vérification
```bash
kubectl get pods -n devsecops-platform
kubectl get svc -n devsecops-platform
kubectl get daemonset -n devsecops-platform
```

## Accès

- Prometheus : `http://<LOADBALANCER_IP>:9090`
- Grafana : `http://<LOADBALANCER_IP>:4000`
- Alertmanager : `http://<LOADBALANCER_IP>:9093`

Dans Docker Desktop local, `LoadBalancer` peut résoudre sur `localhost`.

## Dashboards provisionnés

- `DevSecOps Monitoring`
  - Node CPU
  - Node Memory
  - Backend request rate
  - Backend error count
  - Pod restarts

## Notes de sécurité

- `grafana-secret.yaml` contient un mot de passe admin par défaut (`admin123`). Changez-le avant la production.
- `Alertmanager` utilise des variables d'environnement pour Slack et SMTP mais peut fonctionner sans elles en local.
- `node-exporter` utilise des volumes `hostPath`; vérifiez les permissions sur les clusters managés.

## Conseils K8s

- Pour utiliser des ressources plus légères en dev, réduisez les `replicas` et les `requests/limits`.
- Ajoutez un `Ingress` si vous souhaitez exposer Grafana/Prometheus via un nom de domaine.
- Pour la sécurité, activez l'auth via `Grafana` OIDC/LDAP quand vous passez en production.

## Phase 8 : Alertes & Incidents

- La configuration d'escalade et de pages est décrite dans `kubernetes/PHASE_8_ALERTS_INCIDENTS.md`.
- Mettez à jour `kubernetes/manifests/monitoring/alertmanager-secret.yaml` avant déploiement pour activer Slack/Email/Webhook.
