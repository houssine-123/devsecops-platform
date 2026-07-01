# Phase 8 : Alertes & Incidents 🚨

## Objectif
Configurer l'alerte et l'escalade côté Kubernetes / Prometheus / Alertmanager :
- règles CPU > 80%, RAM > 90%, pods down
- routage multi-canal : email, Slack, webhook
- pages d'escalade pour incidents critiques

## Fichiers modifiés

- `kubernetes/manifests/monitoring/alertmanager-configmap.yaml`
- `kubernetes/manifests/monitoring/alertmanager-deployment.yaml`
- `kubernetes/manifests/monitoring/alertmanager-secret.yaml`
- `kubernetes/manifests/monitoring/prometheus-configmap.yaml`
- `kubernetes/deploy-monitoring-k8s.sh`
- `kubernetes/deploy-monitoring-k8s.ps1`

## Alertmanager

- Route `pager` pour les alertes `severity=critical`
- Support Slack via `SLACK_WEBHOOK_URL`
- Support Email via `ALERT_EMAIL_TO`, `ALERT_EMAIL_FROM`, SMTP
- Support Webhook via `WEBHOOK_URL`
- Récepteurs spécialisés pour `infrastructure`, `application`, `kubernetes`
- Règles d'inhibition pour réduire le bruit entre `critical` et `warning`

## Prometheus Rules ajoutées

- `HighCPUUsage` > 80%
- `CriticalCPUUsage` > 95%
- `HighMemoryUsage` > 90%
- `CriticalMemoryUsage` > 95%
- `PodDown` pour pods en phase `Failed` ou `Unknown`

## Déploiement

```bash
cd kubernetes
chmod +x deploy-monitoring-k8s.sh
./deploy-monitoring-k8s.sh
```

ou PowerShell :

```powershell
cd kubernetes
.\deploy-monitoring-k8s.ps1
```

## Configuration

Mettez à jour `kubernetes/manifests/monitoring/alertmanager-secret.yaml` avec vos vraies valeurs Slack/SMTP/Webhook.

## Vérification

- `kubectl get pods -n devsecops-platform`
- `kubectl get svc -n devsecops-platform`
- `kubectl logs deployment/alertmanager-deployment -n devsecops-platform`
- Vérifiez l'onglet `Alerts` dans Prometheus
