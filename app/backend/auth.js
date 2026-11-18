/**
 * ============================================================
 * Auth Module - Authentification par jeton JWT
 * ============================================================
 * - POST /api/auth/login : échange identifiant + mot de passe contre un JWT
 * - requireAuth          : middleware qui protège les routes de l'API
 *
 * Les identifiants administrateur et le secret de signature proviennent de
 * Vault (secret/devsecops) en priorité, puis des variables d'environnement
 * (ADMIN_USERNAME, ADMIN_PASSWORD, JWT_SECRET) en secours.
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const TOKEN_TTL = process.env.JWT_TTL || '8h';
const JWT_ISSUER = 'devsecops-platform';

let config = {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || '',
  jwtSecret: process.env.JWT_SECRET || '',
};
let ephemeralSecret = null;

/**
 * Met à jour la configuration (appelé au démarrage avec les secrets Vault).
 */
function configureAuth({ username, password, jwtSecret } = {}) {
  config = {
    username: username || config.username,
    password: password || config.password,
    jwtSecret: jwtSecret || config.jwtSecret,
  };

  if (!config.password) {
    console.warn('⚠️  ADMIN_PASSWORD absent (Vault et env) — la connexion est désactivée');
  }
  if (!config.jwtSecret) {
    console.warn('⚠️  JWT_SECRET absent — secret éphémère généré (jetons invalidés au redémarrage)');
  }
}

function getSecret() {
  if (config.jwtSecret) return config.jwtSecret;
  if (!ephemeralSecret) ephemeralSecret = crypto.randomBytes(48).toString('hex');
  return ephemeralSecret;
}

/**
 * Comparaison à temps constant : on compare les empreintes SHA-256 pour
 * obtenir deux tampons de même longueur, quelle que soit l'entrée.
 */
function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function isLoginEnabled() {
  return Boolean(config.password);
}

function verifyCredentials(username, password) {
  if (!isLoginEnabled()) return false;
  // Les deux comparaisons sont toujours évaluées (pas de court-circuit)
  const userOk = safeEqual(username || '', config.username);
  const passOk = safeEqual(password || '', config.password);
  return userOk && passOk;
}

function issueToken(username) {
  return jwt.sign({ sub: username, role: 'admin' }, getSecret(), {
    algorithm: 'HS256',
    expiresIn: TOKEN_TTL,
    issuer: JWT_ISSUER,
  });
}

function verifyToken(token) {
  return jwt.verify(token, getSecret(), { algorithms: ['HS256'], issuer: JWT_ISSUER });
}

/**
 * Middleware : exige un en-tête "Authorization: Bearer <jwt>" valide.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    req.user = verifyToken(token);
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = {
  configureAuth,
  isLoginEnabled,
  verifyCredentials,
  issueToken,
  verifyToken,
  requireAuth,
  TOKEN_TTL,
};
