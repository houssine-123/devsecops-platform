param()

Write-Host "🚀 Phase 7: Kubernetes Monitoring Deployment" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green

if (!(Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Host "kubectl is required. Install kubectl and retry." -ForegroundColor Red
    exit 1
}

$namespace = 'devsecops-platform'
$monitoringDir = 'manifests/monitoring'

$resources = @(
    'prometheus-configmap.yaml',
    'prometheus-deployment.yaml',
    'prometheus-service.yaml',
    'alertmanager-secret.yaml',
    'grafana-secret.yaml',
    'grafana-datasource-configmap.yaml',
    'grafana-provisioning-configmap.yaml',
    'grafana-dashboard-configmap.yaml',
    'grafana-deployment.yaml',
    'grafana-service.yaml',
    'kube-state-metrics-deployment.yaml',
    'kube-state-metrics-service.yaml',
    'node-exporter-daemonset.yaml',
    'node-exporter-service.yaml',
    'alertmanager-configmap.yaml',
    'alertmanager-deployment.yaml',
    'alertmanager-service.yaml'
)

foreach ($resource in $resources) {
    Write-Host "Applying $resource..." -ForegroundColor Yellow
    kubectl apply -f "$monitoringDir/$resource"
}

Write-Host "⏳ Waiting for monitoring pods to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=available --timeout=300s deployment/prometheus-deployment -n $namespace
kubectl wait --for=condition=available --timeout=300s deployment/grafana-deployment -n $namespace
kubectl wait --for=condition=available --timeout=300s deployment/kube-state-metrics -n $namespace
kubectl wait --for=condition=ready --timeout=300s daemonset/node-exporter -n $namespace

Write-Host "✅ Monitoring stack deployed successfully." -ForegroundColor Green

$prometheusIP = kubectl get svc prometheus-service -n $namespace -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>$null
$grafanaIP = kubectl get svc grafana-service -n $namespace -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>$null
$alertmanagerIP = kubectl get svc alertmanager-service -n $namespace -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>$null

Write-Host "Endpoints:" -ForegroundColor Cyan
Write-Host "Prometheus: http://$($prometheusIP -or 'localhost'):9090"
Write-Host "Grafana: http://$($grafanaIP -or 'localhost'):3000"
Write-Host "Alertmanager: http://$($alertmanagerIP -or 'localhost'):9093"

Write-Host "Use 'kubectl get pods -n $namespace' to verify pod status." -ForegroundColor Cyan