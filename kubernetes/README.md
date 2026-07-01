# Kubernetes Configuration

## Structure
- `manifests/` - Basic K8s objects
  - `namespace.yaml` - Application namespace
  - `configmap.yaml` - Configuration data
  - `secret.yaml` - Sensitive data
  - `frontend-deployment.yaml` - Frontend deployment
  - `backend-deployment.yaml` - Backend deployment
  - `postgres-deployment.yaml` - Database deployment
  - `frontend-service.yaml` - Frontend service
  - `backend-service.yaml` - Backend service
  - `ingress.yaml` - Ingress controller
  - `pvc.yaml` - Persistent volumes

- `monitoring/` - Kubernetes monitoring manifests
  - `prometheus-*` - Prometheus deployment and config
  - `grafana-*` - Grafana deployment, datasource and dashboards
  - `node-exporter-*` - Node Exporter DaemonSet and service
  - `kube-state-metrics-*` - Kubernetes state metrics
  - `alertmanager-*` - Alertmanager deployment and service

- `helm/` - Helm charts (templating)
  - `app-chart/` - Main application chart

- `argocd/` - Argo CD GitOps configuration

## Phase 4 Tasks
- [ ] Create namespace
- [ ] Create ConfigMaps and Secrets
- [ ] Create Deployments
- [ ] Create Services
- [ ] Create Ingress
- [ ] Test: `kubectl apply -f manifests/`
- [ ] Verify: `kubectl get all`

## Basic Deployment Example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: default
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: yourusername/app-backend:latest
        ports:
        - containerPort: 5000
        env:
        - name: DB_HOST
          value: postgres
        - name: DB_PORT
          value: "5432"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 5
```

## Service Communication
- Frontend → Backend: `http://backend:5000`
- Backend → Database: `postgres://postgres:5432/appdb`
