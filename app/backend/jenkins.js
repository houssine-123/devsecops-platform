/**
 * ============================================================
 * Jenkins Module - État réel du pipeline CI/CD
 * ============================================================
 * Interroge l'API « Pipeline Stage View » de Jenkins (wfapi) et renvoie
 * les dernières exécutions avec l'état de chaque étape, pour l'onglet
 * CI/CD de l'application.
 *
 * Variables d'environnement :
 *   JENKINS_URL         adresse interne de Jenkins (défaut : http://jenkins:8080)
 *   JENKINS_PUBLIC_URL  adresse ouverte dans le navigateur (défaut : http://localhost:8090)
 *   JENKINS_JOB         nom du job (défaut : devsecops-pipeline)
 *   JENKINS_USER / JENKINS_TOKEN  facultatifs, si Jenkins exige une authentification
 */

const JENKINS_URL = (process.env.JENKINS_URL || 'http://jenkins:8080').replace(/\/$/, '');
const JENKINS_PUBLIC_URL = (process.env.JENKINS_PUBLIC_URL || 'http://localhost:8090').replace(/\/$/, '');
const JENKINS_JOB = process.env.JENKINS_JOB || 'devsecops-pipeline';
const CACHE_TTL_MS = 10000;
const MAX_RUNS = 6;

let cache = { at: 0, data: null };

function authHeaders() {
  const user = process.env.JENKINS_USER;
  const token = process.env.JENKINS_TOKEN;
  if (!user || !token) return {};
  return { Authorization: 'Basic ' + Buffer.from(`${user}:${token}`).toString('base64') };
}

/**
 * Jenkins marque « FAILED » les étapes sautées après un échec, avec une
 * durée nulle. On les distingue pour l'affichage : ce sont des étapes
 * non exécutées, pas des échecs.
 */
function normalizeStages(stages = []) {
  let failureSeen = false;
  return stages
    .filter((s) => !String(s.name).startsWith('Declarative:'))
    .map((s) => {
      let status = s.status;
      if (failureSeen && status === 'FAILED' && (s.durationMillis || 0) < 1000) {
        status = 'SKIPPED';
      }
      if (s.status === 'FAILED' && status === 'FAILED') failureSeen = true;
      return {
        name: s.name,
        status,
        durationMs: s.durationMillis || 0,
      };
    });
}

function normalizeRun(run) {
  return {
    id: Number(run.id),
    name: run.name,
    status: run.status,
    startedAt: run.startTimeMillis ? new Date(run.startTimeMillis).toISOString() : null,
    durationMs: run.durationMillis || 0,
    url: `${JENKINS_PUBLIC_URL}/job/${encodeURIComponent(JENKINS_JOB)}/${run.id}/`,
    stages: normalizeStages(run.stages),
  };
}

async function getPipelineStatus() {
  if (cache.data && Date.now() - cache.at < CACHE_TTL_MS) return cache.data;

  const url = `${JENKINS_URL}/job/${encodeURIComponent(JENKINS_JOB)}/wfapi/runs`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json', ...authHeaders() },
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) {
    throw new Error(`Jenkins a répondu ${response.status}`);
  }

  const runs = await response.json();
  const data = {
    job: JENKINS_JOB,
    jenkinsUrl: `${JENKINS_PUBLIC_URL}/job/${encodeURIComponent(JENKINS_JOB)}/`,
    fetchedAt: new Date().toISOString(),
    runs: (Array.isArray(runs) ? runs : []).slice(0, MAX_RUNS).map(normalizeRun),
  };
  cache = { at: Date.now(), data };
  return data;
}

module.exports = {
  getPipelineStatus,
  normalizeStages,
  JENKINS_PUBLIC_URL,
  JENKINS_JOB,
};
