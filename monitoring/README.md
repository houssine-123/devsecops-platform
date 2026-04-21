# Monitoring Stack

## Components

### Prometheus
- **Role:** Metrics collection and storage
- **Port:** 9090
- **Configuration:** `prometheus/prometheus.yml`
- **Rules:** `prometheus/rules.yml`
- **Retention:** 15 days
- **Scrape Interval:** 15 seconds

### Grafana
- **Role:** Visualization and dashboards
- **Port:** 3000
- **Default Login:** admin / admin123
- **Data Source:** Prometheus (http://prometheus:9090)

### Node Exporter
- **Role:** System metrics (CPU, RAM, disk, network)
- **Port:** 9100
- **Metrics:** `node_cpu`, `node_memory`, `node_filesystem`, etc.

### Alertmanager
- **Role:** Alert routing and notifications
- **Port:** 9093
- **Configuration:** `alertmanager/alertmanager.yml`
- **Channels:** Slack, Email, Webhook

## Metrics to Monitor

### System Metrics
- CPU usage
- Memory usage
- Disk usage
- Network I/O
- Process count

### Application Metrics
- HTTP requests
- Error rate
- Response time (latency)
- Database connections
- Cache hits/misses

### Kubernetes Metrics
- Pod count
- Node status
- Deployment replicas
- PVC usage
- Container restarts

### Business Metrics
- User registrations
- API calls
- Failed transactions
- Backup status

## Phase 7 Tasks
- [ ] Verify Prometheus scraping targets
- [ ] Create Grafana dashboards:
  - [ ] Infrastructure dashboard
  - [ ] Application dashboard
  - [ ] Kubernetes dashboard
  - [ ] Security dashboard
- [ ] Configure alert rules
- [ ] Test alerts to Slack/Email
- [ ] Create on-call runbooks

## Access Points

| Service | URL | User | Password |
|---------|-----|------|----------|
| Prometheus | http://localhost:9090 | - | - |
| Grafana | http://localhost:3000 | admin | admin123 |
| Alertmanager | http://localhost:9093 | - | - |

## Example Alert Rules

```yaml
- alert: HighCPUUsage
  expr: node_cpu_usage > 80
  for: 5m
  annotations:
    summary: "High CPU on {{ $labels.instance }}"
    
- alert: ServiceDown
  expr: up{job="backend"} == 0
  for: 1m
  annotations:
    summary: "Backend service is down"
```

## Grafana Dashboard JSON URLs
- Node Exporter Full: https://grafana.com/grafana/dashboards/1860
- Prometheus: https://grafana.com/grafana/dashboards/3662
- Kubernetes: https://grafana.com/grafana/dashboards/7249
