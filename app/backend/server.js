/**
 * ============================================================
 * Backend Server - Monitoring & Infrastructure Management
 * ============================================================
 *
 * EXPLICATION:
 * Ce serveur expose un backend Express simple pour la phase 2.
 * Il gère des données en mémoire pour:
 * - Serveurs / nœuds
 * - Services / applications
 * - Alertes
 *
 * Il fournit également des endpoints de santé, de ready check et de métriques
 * pour permettre une intégration facile avec Prometheus / Grafana.
 */

const express = require('express');
const cors = require('cors');
const db = require('./db');
const vault = require('./vault');
const prometheus = require('./prometheus');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const execAsync = promisify(exec);

const PROM_TARGETS_DIR = '/app/prometheus-targets';
require('dotenv').config();

// ============================================================
// INITIALISATION
// ============================================================

const app = express();
const PORT = process.env.APP_PORT || 5000;

// Ne pas divulguer la technologie du serveur (hotspot SonarQube)
app.disable('x-powered-by');

app.use(cors());
app.use(express.json());

let appStartTime = Date.now();
let totalRequests = 0;
let totalErrors = 0;
let totalAlertmanagerNotifications = 0;
const recentAlertmanagerNotifications = [];
const requestMetrics = new Map();
const durationBuckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

// ============================================================
// INITIALISATION BASE DE DONNÉES
// ============================================================

let dbInitialized = false;

const createAlert = async ({ title, severity, description, entityType, entityId }) => {
  return await db.createAlert({ title, severity, description, entityType, entityId });
};

const createSystemAlert = async ({ title, severity, description, entityType, entityId }) => {
  return await createAlert({ title, severity, description, entityType, entityId });
};

const escapeLabelValue = (value) => String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');

const labelsToString = (labels) => Object.entries(labels)
  .map(([key, value]) => `${key}="${escapeLabelValue(value)}"`)
  .join(',');

const getRequestRoute = (req) => {
  if (req.route?.path) return `${req.baseUrl || ''}${req.route.path}`;
  return req.path || 'unknown';
};

const getRequestMetric = (method, route, status) => {
  const key = `${method} ${route} ${status}`;
  if (!requestMetrics.has(key)) {
    requestMetrics.set(key, {
      method,
      route,
      status,
      count: 0,
      sum: 0,
      buckets: Object.fromEntries(durationBuckets.map((bucket) => [bucket, 0])),
    });
  }
  return requestMetrics.get(key);
};

const observeRequest = (method, route, status, durationSeconds) => {
  const metric = getRequestMetric(method, route, status);
  metric.count += 1;
  metric.sum += durationSeconds;
  durationBuckets.forEach((bucket) => {
    if (durationSeconds <= bucket) {
      metric.buckets[bucket] += 1;
    }
  });
};

const requestInstrumentation = (req, res, next) => {
  const start = process.hrtime.bigint();
  totalRequests += 1;

  res.on('finish', () => {
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
    observeRequest(req.method, getRequestRoute(req), String(res.statusCode), durationSeconds);
  });

  next();
};

app.use(requestInstrumentation);

// ============================================================
// ENDPOINTS GLOBAUX
// ============================================================

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'up',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - appStartTime) / 1000),
  });
});

app.get('/api/ready', (req, res) => {
  if (!dbInitialized) {
    return res.status(503).json({
      status: 'not ready',
      message: 'Database not initialized',
      timestamp: new Date().toISOString(),
    });
  }

  res.status(200).json({
    status: 'ready',
    database: 'connected',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/dashboard', async (req, res) => {
  try {
    const stats = await db.getDashboardStats();
    res.status(200).json(stats);
  } catch (err) {
    totalErrors++;
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

app.post('/api/alertmanager/webhook', (req, res) => {
  const payload = req.body || {};
  const alerts = Array.isArray(payload.alerts) ? payload.alerts : [];

  totalAlertmanagerNotifications += alerts.length;

  alerts.forEach((alert) => {
    recentAlertmanagerNotifications.unshift({
      status: alert.status,
      labels: alert.labels || {},
      annotations: alert.annotations || {},
      startsAt: alert.startsAt,
      endsAt: alert.endsAt,
      receivedAt: new Date().toISOString(),
    });
  });

  recentAlertmanagerNotifications.splice(50);

  res.status(202).json({
    message: 'Alertmanager notification received',
    alerts: alerts.length,
  });
});

app.get('/api/alertmanager/notifications', (req, res) => {
  res.status(200).json({
    total: totalAlertmanagerNotifications,
    notifications: recentAlertmanagerNotifications,
  });
});

app.get('/api/metrics', async (req, res) => {
  try {
    const uptime = Math.floor((Date.now() - appStartTime) / 1000);
    const stats = await db.getDashboardStats();
    const databaseReady = dbInitialized ? 1 : 0;
    const httpMetrics = [];

    requestMetrics.forEach((metric) => {
      const baseLabels = {
        method: metric.method,
        route: metric.route,
        status: metric.status,
      };

      httpMetrics.push(`app_http_requests_total{${labelsToString(baseLabels)}} ${metric.count}`);

      let cumulative = 0;
      durationBuckets.forEach((bucket) => {
        cumulative = metric.buckets[bucket];
        httpMetrics.push(`app_http_request_duration_seconds_bucket{${labelsToString({ ...baseLabels, le: bucket })}} ${cumulative}`);
      });
      httpMetrics.push(`app_http_request_duration_seconds_bucket{${labelsToString({ ...baseLabels, le: '+Inf' })}} ${metric.count}`);
      httpMetrics.push(`app_http_request_duration_seconds_sum{${labelsToString(baseLabels)}} ${metric.sum.toFixed(6)}`);
      httpMetrics.push(`app_http_request_duration_seconds_count{${labelsToString(baseLabels)}} ${metric.count}`);
    });

    const metrics = `
# HELP app_uptime_seconds Application uptime in seconds
# TYPE app_uptime_seconds gauge
app_uptime_seconds ${uptime}

# HELP app_requests_total Total number of requests
# TYPE app_requests_total counter
app_requests_total ${totalRequests}

# HELP app_errors_total Total number of errors
# TYPE app_errors_total counter
app_errors_total ${totalErrors}

# HELP app_alertmanager_notifications_total Total alerts received from Alertmanager webhook
# TYPE app_alertmanager_notifications_total counter
app_alertmanager_notifications_total ${totalAlertmanagerNotifications}

# HELP app_http_requests_total Total HTTP requests by method, route and status
# TYPE app_http_requests_total counter
${httpMetrics.filter((line) => line.startsWith('app_http_requests_total')).join('\n')}

# HELP app_http_request_duration_seconds HTTP request duration in seconds
# TYPE app_http_request_duration_seconds histogram
${httpMetrics.filter((line) => line.startsWith('app_http_request_duration_seconds')).join('\n')}

# HELP app_database_ready Database readiness status
# TYPE app_database_ready gauge
app_database_ready ${databaseReady}

# HELP app_servers_total Total number of servers
# TYPE app_servers_total gauge
app_servers_total ${stats.servers}

# HELP app_services_total Total number of services
# TYPE app_services_total gauge
app_services_total ${stats.services}

# HELP app_alerts_total Total number of alerts
# TYPE app_alerts_total gauge
app_alerts_total ${stats.alerts}

# HELP app_alerts_new_total Total number of new alerts
# TYPE app_alerts_new_total gauge
app_alerts_new_total ${stats.alertStatus.new}

# HELP app_servers_degraded_total Total number of degraded servers
# TYPE app_servers_degraded_total gauge
app_servers_degraded_total ${stats.serverStatus.degraded}
`;
    res.type('text/plain');
    res.send(metrics);
  } catch (err) {
    totalErrors++;
    res.status(500).type('text/plain').send('# Failed to generate metrics\n');
  }
});

// ============================================================
// SUPERVISION TEMPS RÉEL (données Prometheus)
// ============================================================

app.get('/api/monitoring/overview', async (req, res) => {
  try {
    const [host, requestRate, targets] = await Promise.all([
      prometheus.getHostOverview(),
      prometheus.getBackendRequestRate().catch(() => null),
      prometheus.getTargets().catch(() => []),
    ]);
    res.status(200).json({
      host,
      requestRate,
      targets,
      targetsUp: targets.filter((t) => t.health === 'up').length,
      targetsTotal: targets.length,
      source: 'prometheus',
    });
  } catch (err) {
    totalErrors++;
    res.status(503).json({ error: 'Prometheus unreachable', message: err.message });
  }
});

app.get('/api/monitoring/history', async (req, res) => {
  try {
    const minutes = Math.min(360, Math.max(5, parseInt(req.query.minutes, 10) || 30));
    const history = await prometheus.getHostHistory(minutes);
    res.status(200).json(history);
  } catch (err) {
    totalErrors++;
    res.status(503).json({ error: 'Prometheus unreachable', message: err.message });
  }
});

// ============================================================
// SERVEURS / NŒUDS
// ============================================================

app.get('/api/servers', async (req, res) => {
  try {
    const servers = await db.getServers();

    // Remplace les valeurs simulées par les vraies métriques Prometheus
    // pour les serveurs auto-déployés (associés via le label server_id).
    let realMetrics = {};
    try {
      realMetrics = await prometheus.getDynamicServerMetrics();
    } catch {
      // Prometheus indisponible : on garde les valeurs en base
    }

    const enriched = servers.map((server) => {
      const real = realMetrics[server.id];
      if (real) {
        return {
          ...server,
          cpu: real.cpu ?? server.cpu,
          memory: real.memory ?? server.memory,
          disk: real.disk ?? server.disk,
          metricsSource: 'prometheus',
        };
      }
      return { ...server, metricsSource: 'simulated' };
    });

    res.status(200).json({ count: enriched.length, servers: enriched });
  } catch (err) {
    totalErrors++;
    res.status(500).json({ error: 'Failed to fetch servers' });
  }
});

app.get('/api/servers/:id', async (req, res) => {
  try {
    const server = await db.getServerById(req.params.id);
    if (!server) {
      totalErrors++;
      return res.status(404).json({ error: 'Server not found' });
    }
    res.status(200).json(server);
  } catch (err) {
    totalErrors++;
    res.status(500).json({ error: 'Failed to fetch server' });
  }
});

app.post('/api/servers', async (req, res) => {
  try {
    const { name, ip, location, status, tags } = req.body;
    if (!name || !ip || !location) {
      totalErrors++;
      return res.status(400).json({ error: 'name, ip and location are required' });
    }

    const server = await db.createServer({ name, ip, location, status, tags });
    res.status(201).json({ message: 'Server created', server });
  } catch (err) {
    if (err.code === '23505') { // Unique constraint violation
      res.status(409).json({ error: 'Server name already exists' });
    } else {
      totalErrors++;
      res.status(500).json({ error: 'Failed to create server' });
    }
  }
});

app.put('/api/servers/:id', async (req, res) => {
  try {
    const server = await db.updateServer(req.params.id, req.body);
    if (!server) {
      totalErrors++;
      return res.status(404).json({ error: 'Server not found' });
    }
    res.status(200).json({ message: 'Server updated', server });
  } catch (err) {
    totalErrors++;
    res.status(500).json({ error: 'Failed to update server' });
  }
});

app.delete('/api/servers/:id', async (req, res) => {
  try {
    const server = await db.deleteServer(req.params.id);
    if (!server) {
      totalErrors++;
      return res.status(404).json({ error: 'Server not found' });
    }

    // Remove Prometheus file_sd target
    try {
      const targetFile = path.join(PROM_TARGETS_DIR, `${server.id}.json`);
      if (fs.existsSync(targetFile)) {
        fs.unlinkSync(targetFile);
        console.log(`Prometheus target removed: ${targetFile}`);
      }
    } catch (e) {
      console.warn('Could not remove Prometheus target file:', e.message);
    }

    // If this was an auto-deployed Docker container, stop and remove it
    const isAutoDeployed = Array.isArray(server.tags) && server.tags.includes('auto-deployed');
    if (isAutoDeployed) {
      const containerName = `devsecops-server-${server.name.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`;
      try {
        await execAsync(`docker rm -f ${containerName}`, { timeout: 10000 });
        console.log(`Container removed: ${containerName}`);
      } catch (e) {
        console.warn(`Could not remove container ${containerName}:`, e.message);
      }
    }

    res.status(200).json({ message: 'Server deleted', server });
  } catch (err) {
    totalErrors++;
    res.status(500).json({ error: 'Failed to delete server' });
  }
});

// ============================================================================
// AUTO-PROVISION SERVERS (Vagrant + Ansible)
// ============================================================================

app.post('/api/servers/auto-provision', async (req, res) => {
  try {
    const { name, location = 'virtualbox' } = req.body;

    if (!name) {
      totalErrors++;
      return res.status(400).json({ error: 'name is required' });
    }

    // WSL only exists on the Windows host — it cannot be called from inside a
    // Linux Docker container. Detect this early and return a clear error.
    const runningInDocker = fs.existsSync('/.dockerenv');
    if (runningInDocker) {
      return res.status(400).json({
        error: 'Auto-provision unavailable inside Docker',
        message: 'WSL (Windows Subsystem for Linux) cannot be invoked from inside a Linux container.',
        solution: 'Use POST /api/servers/auto-deploy for Docker-based deployment instead.',
      });
    }

    const vmName = `devsecops-${name.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`;

    console.log(`🚀 Starting auto-provisioning for: ${vmName}...`);

    // 1. Call WSL provisioning script
    console.log(`📦 Launching provisioning script via WSL...`);
    const provisionCmd = `wsl bash ./scripts/provision-server.sh ${vmName}`;
    const { stdout } = await execAsync(provisionCmd, { timeout: 600000 });

    const vmIP = stdout.trim().split('\n').pop();

    // Regex ancrée et bornée : pas de backtracking possible (hotspot SonarQube)
    if (!vmIP || !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(vmIP)) {
      throw new Error(`Failed to get valid IP from provisioning. Output: ${stdout}`);
    }

    console.log(`✅ VM IP: ${vmIP}`);

    // 2. Wait for Node Exporter to be ready
    console.log(`⏳ Waiting for Node Exporter on ${vmIP}:9100...`);
    let isReady = false;
    for (let i = 0; i < 20; i++) {
      try {
        const checkCmd = `curl -s http://${vmIP}:9100/metrics 2>/dev/null | head -1`;
        const { stdout: metricsOutput } = await execAsync(checkCmd);
        if (metricsOutput.includes('HELP')) {
          isReady = true;
          break;
        }
      } catch (e) {
        // Retry
      }
      await new Promise(r => setTimeout(r, 3000));
    }

    if (!isReady) {
      console.warn('⚠️ Node Exporter not responding yet, proceeding anyway...');
    }

    console.log(`✅ Node Exporter ready!`);

    // 3. Register server in database
    console.log(`📝 Registering server in database...`);
    const server = await db.createServer({
      name: name,
      ip: vmIP,
      location: location,
      status: 'online',
      tags: ['vagrant', 'auto-provisioned']
    });

    console.log(`✅ Server registered: ${server.id}`);

    // 4. Response
    res.status(201).json({
      message: 'Server provisioned successfully',
      server: server,
      vm: {
        name: vmName,
        ip: vmIP,
        status: 'running',
        nodeExporterPort: 9100,
        provisioingTime: '~5-10 minutes'
      }
    });

  } catch (err) {
    totalErrors++;
    console.error('❌ Auto-provision error:', err.message);
    res.status(500).json({ error: 'Failed to auto-provision server: ' + err.message });
  }
});

// ============================================================================
// AUTO-DEPLOY SERVERS (Docker containers)
// ============================================================================

app.post('/api/servers/auto-deploy', async (req, res) => {
  try {
    const { name, location = 'docker' } = req.body;

    if (!name) {
      totalErrors++;
      return res.status(400).json({ error: 'name is required' });
    }

    // ⚠️  CHECK DOCKER SOCKET ACCESS
    const dockerSocketPath = '/var/run/docker.sock';
    const hasDockerSocket = fs.existsSync(dockerSocketPath);
    
    if (!hasDockerSocket) {
      totalErrors++;
      return res.status(400).json({
        error: 'Auto-deploy unavailable: Docker socket not accessible',
        message: 'This feature requires Docker socket (/var/run/docker.sock) which is not mounted or accessible',
        details: 'This typically happens when running on Windows Docker Desktop',
        solution: 'Deploy to a Linux VM (Ubuntu 22.04) with Docker installed',
        instructions: [
          '1. Create a Linux VM (VirtualBox, Hyper-V, or Cloud VM)',
          '2. SSH into the VM and run: sudo bash scripts/install-vm.sh',
          '3. Clone your project and run docker compose up -d',
          '4. Use Remote SSH in VS Code to connect and manage the VM',
          '5. The auto-deploy endpoint will work perfectly on Linux'
        ].join('\n'),
        workaround: 'You can still manually create servers using POST /api/servers'
      });
    }

    const containerName = `devsecops-server-${name.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`;

    // Resolve the compose network dynamically so it works regardless of project name
    let dockerNetwork = 'pfe_devsecops-network';
    try {
      const { stdout: netOut } = await execAsync(
        "docker inspect devsecops-backend --format='{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'",
        { timeout: 5000 }
      );
      const nets = netOut.trim().replace(/'/g, '').split(/\s+/).filter(Boolean);
      const composeNet = nets.find(n => n.includes('devsecops'));
      if (composeNet) dockerNetwork = composeNet;
    } catch (_) { /* keep default */ }

    // 1. Create & start a node-exporter container as the simulated server
    console.log(`Creating Docker container: ${containerName} on network ${dockerNetwork}...`);
    const createCmd = `docker run -d --name ${containerName} --network ${dockerNetwork} prom/node-exporter:latest`;
    const { stdout: containerId } = await execAsync(createCmd);
    const cId = containerId.trim();
    console.log(`Container created: ${cId}`);

    // 2. Wait for container to get IP
    let containerIP = null;
    let attempts = 0;
    while (!containerIP && attempts < 15) {
      await new Promise(r => setTimeout(r, 500));
      try {
        const inspectCmd = `docker inspect ${cId} --format "{{index .NetworkSettings.Networks \\"${dockerNetwork}\\" \\"IPAddress\\"}}"`;
        const { stdout } = await execAsync(inspectCmd);
        containerIP = stdout.trim().replace(/'/g, '');
        if (containerIP) break;
      } catch (e) {
        // Retry
      }
      attempts++;
    }

    if (!containerIP) {
      throw new Error('Failed to get container IP after 15 attempts');
    }

    console.log(`Container IP: ${containerIP}`);

    // 3. Register server in database
    const server = await db.createServer({
      name: name,
      ip: containerIP,
      location: location,
      status: 'online',
      tags: ['docker', 'auto-deployed']
    });

    console.log(`Server registered: ${server.id}`);

    // 4. Register Prometheus file_sd target so Prometheus scrapes it automatically
    try {
      fs.mkdirSync(PROM_TARGETS_DIR, { recursive: true });
      const targetFile = path.join(PROM_TARGETS_DIR, `${server.id}.json`);
      fs.writeFileSync(targetFile, JSON.stringify([{
        targets: [`${containerIP}:9100`],
        labels: {
          job: 'dynamic-servers',
          server_name: server.name,
          server_id: server.id,
          container: containerName,
        },
      }], null, 2));
      console.log(`Prometheus target registered: ${targetFile}`);
    } catch (e) {
      console.warn('Could not write Prometheus target file:', e.message);
    }

    // 5. Response with server info
    res.status(201).json({
      message: 'Server deployed successfully',
      server: server,
      container: {
        id: cId.substring(0, 12),
        name: containerName,
        ip: containerIP,
        port: 9100,
      },
      prometheus: {
        target: `${containerIP}:9100`,
        job: 'dynamic-servers',
        note: 'Prometheus will start scraping within 10 seconds',
      },
    });

  } catch (err) {
    totalErrors++;
    console.error('Auto-deploy error:', err.message);
    res.status(500).json({ error: 'Failed to auto-deploy server: ' + err.message });
  }
});

app.post('/api/servers/:id/healthcheck', async (req, res) => {
  try {
    const server = await db.getServerById(req.params.id);
    if (!server) {
      totalErrors++;
      return res.status(404).json({ error: 'Server not found' });
    }

    // Simulate health check with random variations
    const cpu = Math.min(100, Math.max(5, server.cpu + (Math.random() * 10 - 5)));
    const memory = Math.min(100, Math.max(5, server.memory + (Math.random() * 10 - 5)));
    const disk = Math.min(100, Math.max(5, server.disk + (Math.random() * 5 - 2)));

    let status = 'online';
    if (memory > 85 || cpu > 90) {
      status = 'degraded';
      await createSystemAlert({
        title: `High load on ${server.name}`,
        severity: 'critical',
        description: `Surveillance automatique: CPU=${Math.round(cpu)}%, MEM=${Math.round(memory)}%.`,
        entityType: 'server',
        entityId: server.id,
      });
    }

    const updatedServer = await db.updateServerHealth(req.params.id, { cpu, memory, disk, status });
    res.status(200).json({ message: 'Health check executed', server: updatedServer });
  } catch (err) {
    totalErrors++;
    res.status(500).json({ error: 'Failed to run health check' });
  }
});

app.post('/api/servers/:id/simulate-failure', async (req, res) => {
  try {
    const server = await db.getServerById(req.params.id);
    if (!server) {
      totalErrors++;
      return res.status(404).json({ error: 'Server not found' });
    }

    const updatedServer = await db.updateServerHealth(req.params.id, {
      cpu: 92,
      memory: 95,
      disk: server.disk,
      status: 'degraded'
    });

    await createSystemAlert({
      title: `Failure simulated on ${server.name}`,
      severity: 'critical',
      description: 'Test de scénario d\'alerte pour le monitoring de l\'infrastructure.',
      entityType: 'server',
      entityId: server.id,
    });

    res.status(200).json({ message: 'Failure simulated', server: updatedServer });
  } catch (err) {
    totalErrors++;
    res.status(500).json({ error: 'Failed to simulate failure' });
  }
});

// ============================================================
// SERVICES / APPLICATIONS
// ============================================================

app.get('/api/services', async (req, res) => {
  try {
    const services = await db.getServices();
    res.status(200).json({ count: services.length, services });
  } catch (err) {
    totalErrors++;
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

app.get('/api/services/:id', async (req, res) => {
  try {
    const service = await db.getServiceById(req.params.id);
    if (!service) {
      totalErrors++;
      return res.status(404).json({ error: 'Service not found' });
    }
    res.status(200).json(service);
  } catch (err) {
    totalErrors++;
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

app.post('/api/services', async (req, res) => {
  try {
    const { name, type, runningOn, status, owner } = req.body;
    if (!name || !type || !runningOn) {
      totalErrors++;
      return res.status(400).json({ error: 'name, type and runningOn are required' });
    }

    const targetServer = await db.getServerById(runningOn);
    if (!targetServer) {
      totalErrors++;
      return res.status(400).json({ error: 'The target server must exist' });
    }

    const service = await db.createService({ name, type, runningOn, status, owner });
    res.status(201).json({ message: 'Service created', service });
  } catch (err) {
    if (err.code === '23505') { // Unique constraint violation
      res.status(409).json({ error: 'Service name already exists' });
    } else {
      totalErrors++;
      res.status(500).json({ error: 'Failed to create service' });
    }
  }
});

app.put('/api/services/:id', async (req, res) => {
  try {
    const service = await db.updateService(req.params.id, req.body);
    if (!service) {
      totalErrors++;
      return res.status(404).json({ error: 'Service not found' });
    }
    res.status(200).json({ message: 'Service updated', service });
  } catch (err) {
    totalErrors++;
    res.status(500).json({ error: 'Failed to update service' });
  }
});

app.delete('/api/services/:id', async (req, res) => {
  try {
    const service = await db.deleteService(req.params.id);
    if (!service) {
      totalErrors++;
      return res.status(404).json({ error: 'Service not found' });
    }
    res.status(200).json({ message: 'Service deleted', service });
  } catch (err) {
    totalErrors++;
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// ============================================================
// ALERTES
// ============================================================

app.get('/api/alerts', async (req, res) => {
  try {
    const alerts = await db.getAlerts();
    res.status(200).json({ count: alerts.length, alerts });
  } catch (err) {
    totalErrors++;
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

app.get('/api/alerts/:id', async (req, res) => {
  try {
    const alert = await db.getAlertById(req.params.id);
    if (!alert) {
      totalErrors++;
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.status(200).json(alert);
  } catch (err) {
    totalErrors++;
    res.status(500).json({ error: 'Failed to fetch alert' });
  }
});

app.post('/api/alerts', async (req, res) => {
  try {
    const { title, severity, description, entityType, entityId } = req.body;
    if (!title || !severity || !entityType || !entityId) {
      totalErrors++;
      return res.status(400).json({ error: 'title, severity, entityType and entityId are required' });
    }

    const alert = await db.createAlert({ title, severity, description, entityType, entityId });
    res.status(201).json({ message: 'Alert created', alert });
  } catch (err) {
    totalErrors++;
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

app.put('/api/alerts/:id', async (req, res) => {
  try {
    const alert = await db.updateAlert(req.params.id, req.body);
    if (!alert) {
      totalErrors++;
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.status(200).json({ message: 'Alert updated', alert });
  } catch (err) {
    totalErrors++;
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

app.delete('/api/alerts/:id', async (req, res) => {
  try {
    const alert = await db.deleteAlert(req.params.id);
    if (!alert) {
      totalErrors++;
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.status(200).json({ message: 'Alert deleted', alert });
  } catch (err) {
    totalErrors++;
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

// ============================================================
// GESTION DES ERREURS
// ============================================================

app.use((req, res) => {
  totalErrors += 1;
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
  });
});

app.use((err, req, res, next) => {
  totalErrors += 1;
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

// ============================================================
// DÉMARRAGE DU SERVEUR
// ============================================================

// Initialisation de la base de données
async function startServer() {
  try {
    console.log('🔐 Chargement des secrets depuis Vault...');
    const dbConfig = await vault.loadDatabaseConfig();
    db.configureDatabase(dbConfig);

    console.log('🔄 Initialisation de la base de données...');
    await db.initDatabase();
    dbInitialized = true;
    console.log('✅ Base de données initialisée avec succès');

    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════╗
║   Backend - Monitoring & Infrastructure Management     ║
╠════════════════════════════════════════════════════════╣
║ Port: ${PORT}                                           ║
║ Environment: ${process.env.APP_ENV || 'development'}                 ║
║ Database: PostgreSQL (initialized)                     ║
║ Time: ${new Date().toISOString()}                         ║
╠════════════════════════════════════════════════════════╣
║ Endpoints disponibles:                                   ║
║ ✓ GET  /api/health                                       ║
║ ✓ GET  /api/ready                                        ║
║ ✓ GET  /api/metrics                                      ║
║ ✓ GET  /api/dashboard                                    ║
║ ✓ GET  /api/servers                                      ║
║ ✓ POST /api/servers                                     ║
║ ✓ PUT  /api/servers/:id                                  ║
║ ✓ POST /api/servers/:id/healthcheck                     ║
║ ✓ GET  /api/services                                     ║
║ ✓ POST /api/services                                    ║
║ ✓ GET  /api/alerts                                       ║
║ ✓ POST /api/alerts                                      ║
╚════════════════════════════════════════════════════════╝
      `);
    });
  } catch (err) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', err);
    console.error('Stack trace:', err.stack);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
