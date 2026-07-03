/**
 * ============================================================
 * Database Module - PostgreSQL Connection
 * ============================================================
 * Gestion de la connexion PostgreSQL et requêtes
 */

const { Pool } = require('pg');

// Pool créé paresseusement : configureDatabase() (secrets Vault) au démarrage,
// sinon repli automatique sur les variables d'environnement au premier query().
let pool = null;

function buildPool(config = {}) {
  const p = new Pool({
    host: config.host || process.env.DB_HOST || 'localhost',
    port: config.port || process.env.DB_PORT || 5432,
    user: config.user || process.env.DB_USER || 'postgres',
    password: config.password || process.env.DB_PASSWORD || 'changeme',
    database: config.database || process.env.DB_NAME || 'appdb',
    max: 20, // Nombre max de connexions
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  p.on('connect', () => {
    console.log('✅ Connected to PostgreSQL');
  });

  p.on('error', (err) => {
    console.error('❌ PostgreSQL connection error:', err);
  });

  return p;
}

/**
 * Configure le pool avec des credentials externes (ex: Vault).
 * Doit être appelé avant initDatabase().
 */
function configureDatabase(config) {
  if (pool) {
    console.warn('⚠️  Database pool already configured — ignoring reconfiguration');
    return;
  }
  pool = buildPool(config);
  console.log(`✅ Database pool configured (credentials source: ${config.source || 'explicit'})`);
}

function getPool() {
  if (!pool) {
    pool = buildPool();
    console.log('✅ Database pool configured (credentials source: env)');
  }
  return pool;
}

const toNumber = (value) => (value === null || value === undefined ? 0 : Number(value));

const mapServer = (row) => row && ({
  id: row.id,
  name: row.name,
  ip: row.ip,
  location: row.location,
  status: row.status,
  cpu: toNumber(row.cpu),
  memory: toNumber(row.memory),
  disk: toNumber(row.disk),
  lastHealthCheck: row.last_health_check,
  tags: row.tags || [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapService = (row) => row && ({
  id: row.id,
  name: row.name,
  type: row.type,
  runningOn: row.running_on,
  status: row.status,
  owner: row.owner,
  lastDeployment: row.last_deployment,
  serverName: row.server_name,
  serverIp: row.server_ip,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapAlert = (row) => row && ({
  id: row.id,
  title: row.title,
  severity: row.severity,
  description: row.description,
  status: row.status,
  entityType: row.entity_type,
  entityId: row.entity_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const buildUpdateQuery = (updates, columnMap) => {
  const fields = [];
  const values = [];

  Object.entries(columnMap).forEach(([apiField, dbColumn]) => {
    if (updates[apiField] !== undefined) {
      values.push(updates[apiField]);
      fields.push(`${dbColumn} = $${values.length}`);
    }
  });

  return { fields, values };
};

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

/**
 * Exécute une requête SQL
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await getPool().query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('Query error:', err);
    throw err;
  }
}

/**
 * Initialise la base de données
 */
async function initDatabase() {
  try {
    console.log('🔄 Initializing database...');

    // Vérifier la connexion
    await query('SELECT NOW()');
    await query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

    // Créer les tables si elles n'existent pas
    await query(`
      CREATE TABLE IF NOT EXISTS servers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL UNIQUE,
        ip VARCHAR(45) NOT NULL,
        location VARCHAR(100) NOT NULL,
        status VARCHAR(20) DEFAULT 'online' CHECK (status IN ('online', 'degraded', 'offline')),
        cpu DECIMAL(5,2) DEFAULT 0,
        memory DECIMAL(5,2) DEFAULT 0,
        disk DECIMAL(5,2) DEFAULT 0,
        last_health_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        tags TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL UNIQUE,
        type VARCHAR(100) NOT NULL,
        running_on UUID REFERENCES servers(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'stopped', 'degraded')),
        owner VARCHAR(255) NOT NULL,
        last_deployment TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        severity VARCHAR(20) DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
        description TEXT,
        status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'resolved')),
        entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('server', 'service')),
        entity_id UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    console.log('✅ Database initialized successfully');
  } catch (err) {
    console.error('❌ Database initialization failed:', err);
    throw err;
  }
}

// ============================================================
// FONCTIONS SERVEURS
// ============================================================

async function getServers() {
  const result = await query('SELECT * FROM servers ORDER BY created_at DESC');
  return result.rows.map(mapServer);
}

async function getServerById(id) {
  const result = await query('SELECT * FROM servers WHERE id = $1', [id]);
  return mapServer(result.rows[0]);
}

async function createServer(serverData) {
  const { name, ip, location, status = 'online', tags = [] } = serverData;
  const result = await query(
    'INSERT INTO servers (name, ip, location, status, tags) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [name, ip, location, status, tags]
  );
  return mapServer(result.rows[0]);
}

async function updateServer(id, updates) {
  const { fields, values } = buildUpdateQuery(updates, {
    name: 'name',
    ip: 'ip',
    location: 'location',
    status: 'status',
    tags: 'tags',
  });

  if (fields.length === 0) return null;

  values.push(id);
  const result = await query(
    `UPDATE servers SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
    values
  );
  return mapServer(result.rows[0]);
}

async function deleteServer(id) {
  const result = await query('DELETE FROM servers WHERE id = $1 RETURNING *', [id]);
  return mapServer(result.rows[0]);
}

async function updateServerHealth(id, healthData) {
  const { cpu, memory, disk, status } = healthData;
  const result = await query(
    'UPDATE servers SET cpu = $1, memory = $2, disk = $3, status = $4, last_health_check = NOW(), updated_at = NOW() WHERE id = $5 RETURNING *',
    [cpu, memory, disk, status, id]
  );
  return mapServer(result.rows[0]);
}

// ============================================================
// FONCTIONS SERVICES
// ============================================================

async function getServices() {
  const result = await query(`
    SELECT s.*, srv.name as server_name, srv.ip as server_ip
    FROM services s
    LEFT JOIN servers srv ON s.running_on = srv.id
    ORDER BY s.created_at DESC
  `);
  return result.rows.map(mapService);
}

async function getServiceById(id) {
  const result = await query(`
    SELECT s.*, srv.name as server_name, srv.ip as server_ip
    FROM services s
    LEFT JOIN servers srv ON s.running_on = srv.id
    WHERE s.id = $1
  `, [id]);
  return mapService(result.rows[0]);
}

async function createService(serviceData) {
  const { name, type, runningOn, status = 'running', owner = 'Ops Team' } = serviceData;
  const result = await query(
    'INSERT INTO services (name, type, running_on, status, owner) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [name, type, runningOn, status, owner]
  );
  return mapService(result.rows[0]);
}

async function updateService(id, updates) {
  const { fields, values } = buildUpdateQuery(updates, {
    name: 'name',
    type: 'type',
    runningOn: 'running_on',
    status: 'status',
    owner: 'owner',
  });

  if (fields.length === 0) return null;

  values.push(id);
  const result = await query(
    `UPDATE services SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
    values
  );
  return mapService(result.rows[0]);
}

async function deleteService(id) {
  const result = await query('DELETE FROM services WHERE id = $1 RETURNING *', [id]);
  return mapService(result.rows[0]);
}

// ============================================================
// FONCTIONS ALERTES
// ============================================================

async function getAlerts() {
  const result = await query('SELECT * FROM alerts ORDER BY created_at DESC');
  return result.rows.map(mapAlert);
}

async function getAlertById(id) {
  const result = await query('SELECT * FROM alerts WHERE id = $1', [id]);
  return mapAlert(result.rows[0]);
}

async function createAlert(alertData) {
  const { title, severity = 'warning', description, status = 'new', entityType, entityId } = alertData;
  const result = await query(
    'INSERT INTO alerts (title, severity, description, status, entity_type, entity_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [title, severity, description, status, entityType, entityId]
  );
  return mapAlert(result.rows[0]);
}

async function updateAlert(id, updates) {
  const { fields, values } = buildUpdateQuery(updates, {
    title: 'title',
    severity: 'severity',
    description: 'description',
    status: 'status',
    entityType: 'entity_type',
    entityId: 'entity_id',
  });

  if (fields.length === 0) return null;

  values.push(id);
  const result = await query(
    `UPDATE alerts SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
    values
  );
  return mapAlert(result.rows[0]);
}

async function deleteAlert(id) {
  const result = await query('DELETE FROM alerts WHERE id = $1 RETURNING *', [id]);
  return mapAlert(result.rows[0]);
}

// ============================================================
// FONCTIONS STATISTIQUES
// ============================================================

async function getDashboardStats() {
  const serverStats = await query(`
    SELECT status, COUNT(*) as count
    FROM servers
    GROUP BY status
  `);

  const alertStats = await query(`
    SELECT status, COUNT(*) as count
    FROM alerts
    GROUP BY status
  `);

  const serversCount = await query('SELECT COUNT(*) as count FROM servers');
  const servicesCount = await query('SELECT COUNT(*) as count FROM services');
  const alertsCount = await query('SELECT COUNT(*) as count FROM alerts');

  const serverStatus = serverStats.rows.reduce((acc, row) => {
    acc[row.status] = parseInt(row.count);
    return acc;
  }, { online: 0, degraded: 0, offline: 0 });

  const alertStatus = alertStats.rows.reduce((acc, row) => {
    acc[row.status] = parseInt(row.count);
    return acc;
  }, { new: 0, acknowledged: 0, resolved: 0 });

  return {
    servers: parseInt(serversCount.rows[0].count),
    services: parseInt(servicesCount.rows[0].count),
    alerts: parseInt(alertsCount.rows[0].count),
    serverStatus,
    alertStatus,
  };
}

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  query,
  configureDatabase,
  initDatabase,
  getServers,
  getServerById,
  createServer,
  updateServer,
  deleteServer,
  updateServerHealth,
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getAlerts,
  getAlertById,
  createAlert,
  updateAlert,
  deleteAlert,
  getDashboardStats,
};
