#!/bin/bash

# Phase 7: Kubernetes Monitoring Deployment
# Usage: ./deploy-monitoring-k8s.sh

set -e

if ! command -v kubectl >/dev/null 2>&1; then
  echo "kubectl is required. Install kubectl and retry."
  exit 1
fi

NAMESPACE=devsecops-platform
MONITORING_DIR=manifests/monitoring

echo "🚀 Deploying Kubernetes monitoring stack..."

kubectl apply -f ${MONITORING_DIR}/prometheus-configmap.yaml
kubectl apply -f ${MONITORING_DIR}/prometheus-deployment.yaml
kubectl apply -f ${MONITORING_DIR}/prometheus-service.yaml
kubectl apply -f ${MONITORING_DIR}/alertmanager-secret.yaml
kubectl apply -f ${MONITORING_DIR}/grafana-secret.yaml
kubectl apply -f ${MONITORING_DIR}/grafana-datasource-configmap.yaml
kubectl apply -f ${MONITORING_DIR}/grafana-provisioning-configmap.yaml
kubectl apply -f ${MONITORING_DIR}/grafana-dashboard-configmap.yaml
kubectl apply -f ${MONITORING_DIR}/grafana-deployment.yaml
kubectl apply -f ${MONITORING_DIR}/grafana-service.yaml
kubectl apply -f ${MONITORING_DIR}/kube-state-metrics-deployment.yaml
kubectl apply -f ${MONITORING_DIR}/kube-state-metrics-service.yaml
kubectl apply -f ${MONITORING_DIR}/node-exporter-daemonset.yaml
kubectl apply -f ${MONITORING_DIR}/node-exporter-service.yaml
kubectl apply -f ${MONITORING_DIR}/alertmanager-configmap.yaml
kubectl apply -f ${MONITORING_DIR}/alertmanager-deployment.yaml
kubectl apply -f ${MONITORING_DIR}/alertmanager-service.yaml

echo "⏳ Waiting for monitoring pods to become ready..."
kubectl wait --for=condition=available --timeout=300s deployment/prometheus-deployment -n ${NAMESPACE}
kubectl wait --for=condition=available --timeout=300s deployment/grafana-deployment -n ${NAMESPACE}
kubectl wait --for=condition=available --timeout=300s deployment/kube-state-metrics -n ${NAMESPACE}
kubectl wait --for=condition=ready --timeout=300s daemonset/node-exporter -n ${NAMESPACE}
echo "✅ Monitoring stack deployed successfully."

echo "Endpoints:"
echo "Prometheus: http://$(kubectl get svc prometheus-service -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}') : 9090"
echo "Grafana: http://$(kubectl get svc grafana-service -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}') : 3000"
echo "Alertmanager: http://$(kubectl get svc alertmanager-service -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}') : 9093"

echo "Use 'kubectl get pods -n ${NAMESPACE}' to view pod status."