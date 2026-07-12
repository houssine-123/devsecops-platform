# Runbooks — Procédures de résolution des alertes

> Chaque alerte Prometheus pointe (via son annotation `runbook_url`) vers la section
> correspondante ci-dessous. C'est une pratique SRE standard : l'ingénieur d'astreinte
> reçoit l'alerte **avec le lien direct** vers la marche à suivre.

---

## HostCriticalMemory

**Signification** : la machine hôte (le PC qui héberge toute la plateforme) dépasse 92 % de mémoire depuis 10 minutes. Risque d'instabilité de Docker/Kubernetes.

**Diagnostic**
```bash
docker stats --no-stream          # quels conteneurs consomment le plus
kubectl top pods -A               # pods les plus gourmands
```

**Remédiation**
1. Identifier le conteneur/pod fautif.
2. Redémarrer le service concerné ou augmenter la RAM allouée à Docker Desktop.
3. Si c'est SonarQube (gourmand), l'arrêter s'il n'est pas utilisé : `docker stop devsecops-sonarqube`.

---

## HostHighCPU

**Signification** : CPU de la machine hôte > 90 % depuis 10 minutes.

**Diagnostic** : `docker stats --no-stream` pour repérer le conteneur en boucle.
**Remédiation** : redémarrer le conteneur fautif ; vérifier qu'aucun build/scan n'est bloqué.

---

## ServerDown

**Signification** : un serveur supervisé (conteneur node-exporter déployé) ne répond plus au scrape Prometheus depuis 2 minutes.

**Diagnostic**
```bash
docker ps -a | grep devsecops-server      # le conteneur tourne-t-il ?
curl http://<ip-serveur>:9100/metrics      # node-exporter répond-il ?
```

**Remédiation**
1. Si le conteneur est arrêté : `docker start <nom>` ou le redéployer via l'interface.
2. Si le serveur est réellement supprimé : retirer sa cible dans `monitoring/prometheus/dynamic/`.

---

## ServerHighCPU / ServerHighMemory

**Signification** : un serveur supervisé dépasse 80 % CPU (ou 85 % RAM) depuis 5 minutes.

**Diagnostic** : consulter le dashboard Grafana du serveur ; identifier le processus.
**Remédiation** : redimensionner le serveur, répartir la charge, ou investiguer une fuite mémoire.

---

## DatabaseDown

**Signification** : PostgreSQL ne répond plus.

**Diagnostic**
```bash
kubectl get pods -n devsecops-platform -l app=postgres
kubectl logs -n devsecops-platform -l app=postgres --tail 50
```

**Remédiation** : redémarrer le pod (`kubectl rollout restart deployment/postgres-deployment -n devsecops-platform`) ; vérifier le PVC et la connectivité réseau.

---

## BackupFailed / BackupNotRunning

**Signification** : le backup nocturne de la base a échoué, ou aucun backup réussi depuis 24 h.

**Diagnostic**
```bash
kubectl get cronjob -n devsecops-platform postgres-backup
kubectl get jobs -n devsecops-platform | grep backup
kubectl logs -n devsecops-platform job/<dernier-job-backup>
```

**Remédiation** : déclencher un backup manuel, vérifier l'espace disque du PVC et les identifiants de la base.

---

## Sécurité runtime (Falco)

Les alertes Falco (lecture de fichier sensible, shell dans un conteneur…) arrivent dans Slack via Falcosidekick. **Toute alerte Falco est à traiter comme un incident de sécurité potentiel** :
1. Identifier le conteneur/pod concerné (présent dans l'alerte).
2. Vérifier s'il s'agit d'une action légitime (maintenance) ou d'une intrusion.
3. En cas de doute : isoler le pod (NetworkPolicy), capturer les logs, redéployer une image saine.

---

## Silences AlertManager (couper les alertes pendant une maintenance)

Pendant une maintenance planifiée, on ne veut pas être spammé d'alertes attendues.
AlertManager fournit nativement les **silences** : une règle temporaire qui masque
les alertes correspondantes.

**Via l'interface web** : http://localhost:9094 → onglet **Silences** → **New Silence**
- Définir un matcher (ex : `severity="warning"` ou `alertname="HostHighCPU"`)
- Choisir la durée (ex : 2 h)
- Ajouter un commentaire (ex : « maintenance planifiée »)

**Via l'API** :
```bash
curl -X POST http://localhost:9094/api/v2/silences -H "Content-Type: application/json" -d '{
  "matchers": [{"name": "alertname", "value": "HostHighCPU", "isRegex": false}],
  "startsAt": "2026-01-01T10:00:00Z",
  "endsAt":   "2026-01-01T12:00:00Z",
  "createdBy": "ops",
  "comment": "Maintenance planifiee"
}'
```

Les alertes silencées ne déclenchent ni email, ni Slack, ni webhook, mais restent
visibles (barrées) dans l'UI d'AlertManager. Le silence expire automatiquement.
