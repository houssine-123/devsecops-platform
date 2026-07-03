/**
 * ============================================================
 * Client Prometheus — métriques réelles pour l'application
 * ============================================================
 * Interroge l'API HTTP de Prometheus pour que l'application
 * affiche de vraies mesures (hôte, serveurs déployés, cibles)
 * sans avoir à ouvrir l'UI Prometheus.
 */

const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://prometheus:9090';
const QUERY_TIMEOUT_MS = 5000;

async function promFetch(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), QUERY_TIMEOUT_MS);
  try {
    const res = await fetch(`${PROMETHEUS_URL}${path}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`Prometheus HTTP ${res.status}`);
    const body = await res.json();
    if (body.status !== 'success') throw new Error(`Prometheus: ${body.error || 'unknown error'}`);
    return body.data;
  } finally {
    clearTimeout(timer);
  }
}

const instantQuery = (promql) =>
  promFetch(`/api/v1/query?query=${encodeURIComponent(promql)}`);

const rangeQuery = (promql, minutes, stepSeconds) => {
  const end = Math.floor(Date.now() / 1000);
  const start = end - minutes * 60;
  return promFetch(
    `/api/v1/query_range?query=${encodeURIComponent(promql)}&start=${start}&end=${end}&step=${stepSeconds}`
  );
};

const firstValue = (data) => {
  const result = data?.result?.[0];
  return result ? Number(result.value[1]) : null;
};

// ── Vue d'ensemble de l'hôte (node-exporter) ─────────────────────────────────
async function getHostOverview() {
  const [cpu, memory, disk, up] = await Promise.all([
    instantQuery('100 - (avg(rate(node_cpu_seconds_total{job="node-exporter",mode="idle"}[2m])) * 100)'),
    instantQuery('100 * (1 - (node_memory_MemAvailable_bytes{job="node-exporter"} / node_memory_MemTotal_bytes{job="node-exporter"}))'),
    // mountpoint="/" absent sous WSL2 : repli sur l'ensemble des filesystems
    instantQuery('max(100 * (1 - node_filesystem_avail_bytes{job="node-exporter",mountpoint="/"} / node_filesystem_size_bytes{job="node-exporter",mountpoint="/"})) or max(100 * (1 - node_filesystem_avail_bytes{job="node-exporter"} / node_filesystem_size_bytes{job="node-exporter"}))'),
    instantQuery('count(up == 1) / count(up)'),
  ]);
  return {
    cpu: firstValue(cpu),
    memory: firstValue(memory),
    disk: firstValue(disk),
    targetsUpRatio: firstValue(up),
  };
}

// ── Débit de requêtes du backend (métrique applicative) ──────────────────────
async function getBackendRequestRate() {
  const data = await instantQuery('sum(rate(app_requests_total[2m]))');
  return firstValue(data);
}

// ── Historique CPU/RAM de l'hôte pour les sparklines ─────────────────────────
async function getHostHistory(minutes = 30, stepSeconds = 60) {
  const [cpu, memory] = await Promise.all([
    rangeQuery('100 - (avg(rate(node_cpu_seconds_total{job="node-exporter",mode="idle"}[2m])) * 100)', minutes, stepSeconds),
    rangeQuery('100 * (1 - (node_memory_MemAvailable_bytes{job="node-exporter"} / node_memory_MemTotal_bytes{job="node-exporter"}))', minutes, stepSeconds),
  ]);
  const toSeries = (data) =>
    (data?.result?.[0]?.values || []).map(([ts, v]) => [ts, Math.round(Number(v) * 10) / 10]);
  return { cpu: toSeries(cpu), memory: toSeries(memory) };
}

// ── État des cibles de scrape (équivalent page "Targets") ────────────────────
async function getTargets() {
  const data = await promFetch('/api/v1/targets?state=active');
  return (data?.activeTargets || []).map((t) => ({
    job: t.labels.job,
    instance: t.labels.instance,
    serverName: t.labels.server_name || null,
    health: t.health,
    lastScrape: t.lastScrape,
  }));
}

// ── Métriques réelles des serveurs auto-déployés (job dynamic-servers) ───────
// Les cibles portent le label server_id écrit par l'auto-deploy : on peut donc
// associer chaque conteneur node-exporter à sa ligne en base.
async function getDynamicServerMetrics() {
  const [cpu, memory, disk] = await Promise.all([
    instantQuery('100 - (avg by (server_id) (rate(node_cpu_seconds_total{job="dynamic-servers",mode="idle"}[2m])) * 100)'),
    instantQuery('100 * (1 - (avg by (server_id) (node_memory_MemAvailable_bytes{job="dynamic-servers"}) / avg by (server_id) (node_memory_MemTotal_bytes{job="dynamic-servers"})))'),
    instantQuery('max by (server_id) (100 * (1 - node_filesystem_avail_bytes{job="dynamic-servers",mountpoint="/"} / node_filesystem_size_bytes{job="dynamic-servers",mountpoint="/"})) or max by (server_id) (100 * (1 - node_filesystem_avail_bytes{job="dynamic-servers"} / node_filesystem_size_bytes{job="dynamic-servers"}))'),
  ]);

  const metrics = {};
  const collect = (data, key) => {
    for (const item of data?.result || []) {
      const id = item.metric.server_id;
      if (!id) continue;
      metrics[id] = metrics[id] || {};
      metrics[id][key] = Math.round(Number(item.value[1]) * 10) / 10;
    }
  };
  collect(cpu, 'cpu');
  collect(memory, 'memory');
  collect(disk, 'disk');
  return metrics;
}

module.exports = {
  getHostOverview,
  getBackendRequestRate,
  getHostHistory,
  getTargets,
  getDynamicServerMetrics,
};
