/**
 * ============================================================
 * Vault Module - HashiCorp Vault Secrets Integration
 * ============================================================
 * Charge les secrets applicatifs depuis Vault (KV v2).
 * En cas d'échec (Vault indisponible, token invalide), retombe
 * sur les variables d'environnement pour ne pas bloquer le boot.
 */

const VAULT_ADDR = process.env.VAULT_ADDR || 'http://vault:8200';
const VAULT_TOKEN = process.env.VAULT_TOKEN || '';
// KV v2 : le chemin de lecture est <mount>/data/<path>
const VAULT_SECRET_PATH = process.env.VAULT_SECRET_PATH || 'secret/data/devsecops';
const VAULT_TIMEOUT_MS = 5000;

/**
 * Lit les secrets depuis Vault KV v2.
 * @returns {Promise<object|null>} les paires clé/valeur, ou null si échec
 */
async function readVaultSecrets() {
  if (!VAULT_TOKEN) {
    console.warn('⚠️  VAULT_TOKEN not set — skipping Vault, using env vars');
    return null;
  }

  const url = `${VAULT_ADDR}/v1/${VAULT_SECRET_PATH}`;
  try {
    const response = await fetch(url, {
      headers: { 'X-Vault-Token': VAULT_TOKEN },
      signal: AbortSignal.timeout(VAULT_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.warn(`⚠️  Vault returned HTTP ${response.status} for ${VAULT_SECRET_PATH} — using env vars`);
      return null;
    }

    const body = await response.json();
    // KV v2 imbrique les valeurs sous data.data
    const secrets = body?.data?.data;
    if (!secrets || typeof secrets !== 'object') {
      console.warn('⚠️  Vault response missing data.data — using env vars');
      return null;
    }

    console.log(`🔐 Loaded ${Object.keys(secrets).length} secret(s) from Vault (${VAULT_SECRET_PATH})`);
    return secrets;
  } catch (err) {
    console.warn(`⚠️  Vault unreachable at ${VAULT_ADDR} (${err.message}) — using env vars`);
    return null;
  }
}

/**
 * Construit la configuration base de données :
 * secrets Vault en priorité, variables d'environnement en secours.
 */
async function loadDatabaseConfig() {
  const secrets = (await readVaultSecrets()) || {};

  const config = {
    host: secrets.DB_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(secrets.DB_PORT || process.env.DB_PORT || '5432', 10),
    user: secrets.DB_USER || process.env.DB_USER || 'postgres',
    password: secrets.DB_PASSWORD || process.env.DB_PASSWORD || 'changeme',
    database: secrets.DB_NAME || process.env.DB_NAME || 'appdb',
  };

  config.source = Object.keys(secrets).length > 0 ? 'vault' : 'env';
  return config;
}

module.exports = {
  readVaultSecrets,
  loadDatabaseConfig,
};
