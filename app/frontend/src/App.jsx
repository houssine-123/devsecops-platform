import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from './api';
import DeployServer from './components/DeployServer';
import LiveMonitoring from './components/LiveMonitoring';
import './App.css';

const REFRESH_INTERVAL_MS = 15000;
const BUILD_NUMBER = import.meta.env.VITE_BUILD_NUMBER || 'dev';

function UsageBar({ label, value }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const level = pct > 85 ? 'high' : pct > 60 ? 'mid' : 'low';
  return (
    <div className="usage" title={`${label}: ${pct}%`}>
      <span className="usage-label">{label}</span>
      <div className="usage-track">
        <div className={`usage-fill ${level}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="usage-value">{pct}%</span>
    </div>
  );
}

// Skeleton de chargement (lignes grisées animées) pour un rendu élégant
function TableSkeleton({ rows = 3, cols = 5 }) {
  return (
    <div className="table-wrap">
      <table className="data-table skeleton-table">
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((__, c) => (
                <td key={c}><span className="skeleton-bar" /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function App() {
  const [backendStatus, setBackendStatus] = useState('checking...');
  const [dashboard, setDashboard] = useState(null);
  const [servers, setServers] = useState([]);
  const [services, setServices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const [newServer, setNewServer] = useState({ name: '', ip: '', location: '', tags: '' });
  const [newService, setNewService] = useState({ name: '', type: 'web application', runningOn: '', owner: '' });

  // ── Toasts (non bloquants, remplacent alert()) ────────────────────────────
  const notify = useCallback((message, type = 'success') => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  }, []);

  const formatTime = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleTimeString();
  };

  const updateAlertCounters = (previousDashboard, previousStatus, nextStatus) => {
    if (!previousDashboard || !previousStatus || !nextStatus || previousStatus === nextStatus) {
      return previousDashboard;
    }
    const current = previousDashboard.alertStatus || {};
    return {
      ...previousDashboard,
      alertStatus: {
        new: current.new || 0,
        acknowledged: current.acknowledged || 0,
        resolved: current.resolved || 0,
        [previousStatus]: Math.max(0, (current[previousStatus] || 0) - 1),
        [nextStatus]: (current[nextStatus] || 0) + 1,
      },
    };
  };

  const fetchAll = useCallback(async () => {
    const [dashboardData, serversData, servicesData, alertsData] = await Promise.all([
      api.getDashboard(),
      api.getServers(),
      api.getServices(),
      api.getAlerts(),
    ]);
    setDashboard(dashboardData);
    setServers(serversData);
    setServices(servicesData);
    setAlerts(alertsData);
    setLastUpdated(new Date());
  }, []);

  // Chargement initial
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await api.checkHealth();
        setBackendStatus('✓ Connected');
        await fetchAll();
      } catch (err) {
        setError(err.message || 'Le backend est inaccessible.');
        setBackendStatus('✗ Disconnected');
      } finally {
        setLoading(false);
      }
    };
    initializeApp();
  }, [fetchAll]);

  // Auto-refresh silencieux : les données restent à jour sans clic
  useEffect(() => {
    const timer = setInterval(async () => {
      if (document.hidden) return;
      try {
        await fetchAll();
        setBackendStatus('✓ Connected');
        setError(null);
      } catch {
        setBackendStatus('✗ Disconnected');
      }
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchAll]);

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchAll();
    } catch (err) {
      setError(err.message || 'Erreur lors du rafraîchissement des données.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateServer = async (event) => {
    event.preventDefault();
    if (!newServer.name || !newServer.ip || !newServer.location) {
      notify('Veuillez remplir tous les champs du serveur.', 'error');
      return;
    }
    try {
      const serverData = {
        name: newServer.name,
        ip: newServer.ip,
        location: newServer.location,
        tags: newServer.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      };
      const createdServer = await api.createServer(serverData);
      setServers((prev) => [createdServer, ...prev]);
      setNewServer({ name: '', ip: '', location: '', tags: '' });
      setDashboard((prev) => prev && { ...prev, servers: prev.servers + 1 });
      notify(`Serveur « ${createdServer.name} » ajouté.`);
    } catch (err) {
      notify('Erreur: ' + err.message, 'error');
    }
  };

  const handleDeleteServer = async (server) => {
    if (!window.confirm(`Supprimer le serveur « ${server.name} » ?\nSon conteneur et sa cible Prometheus seront également retirés.`)) {
      return;
    }
    try {
      await api.deleteServer(server.id);
      setServers((prev) => prev.filter((item) => item.id !== server.id));
      setDashboard((prev) => prev && { ...prev, servers: Math.max(0, prev.servers - 1) });
      notify(`Serveur « ${server.name} » supprimé (monitoring nettoyé).`);
    } catch (err) {
      notify('Erreur: ' + err.message, 'error');
    }
  };

  const handleDeleteService = async (service) => {
    if (!window.confirm(`Retirer le service « ${service.name} » ?`)) return;
    try {
      await api.deleteService(service.id);
      setServices((prev) => prev.filter((item) => item.id !== service.id));
      setDashboard((prev) => prev && { ...prev, services: Math.max(0, prev.services - 1) });
      notify(`Service « ${service.name} » retiré.`);
    } catch (err) {
      notify('Erreur : ' + err.message, 'error');
    }
  };

  const handleCreateService = async (event) => {
    event.preventDefault();
    if (!newService.name || !newService.runningOn) {
      notify('Veuillez choisir un service et un serveur de destination.', 'error');
      return;
    }
    try {
      const serviceData = {
        name: newService.name,
        type: newService.type,
        runningOn: newService.runningOn,
        owner: newService.owner || 'Ops Team',
      };
      const createdService = await api.createService(serviceData);
      setServices((prev) => [createdService, ...prev]);
      setNewService({ name: '', type: 'web application', runningOn: '', owner: '' });
      setDashboard((prev) => prev && { ...prev, services: prev.services + 1 });
      notify(`Service « ${createdService.name} » déployé.`);
    } catch (err) {
      notify('Erreur: ' + err.message, 'error');
    }
  };

  const handleAckAlert = async (alertId) => {
    try {
      const currentAlert = alerts.find((item) => item.id === alertId);
      const updated = await api.updateAlert(alertId, { status: 'acknowledged' });
      setAlerts((prev) => prev.map((item) => (item.id === alertId ? updated : item)));
      setDashboard((prev) => updateAlertCounters(prev, currentAlert?.status, updated.status));
      notify('Alerte prise en compte.');
    } catch (err) {
      notify('Erreur: ' + err.message, 'error');
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      const currentAlert = alerts.find((item) => item.id === alertId);
      const updated = await api.updateAlert(alertId, { status: 'resolved' });
      setAlerts((prev) => prev.map((item) => (item.id === alertId ? updated : item)));
      setDashboard((prev) => updateAlertCounters(prev, currentAlert?.status, updated.status));
      notify('Alerte résolue.');
    } catch (err) {
      notify('Erreur: ' + err.message, 'error');
    }
  };

  const handleHealthCheck = (server) => {
    api.runServerHealthCheck(server.id)
      .then((updated) => {
        setServers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        notify(`Health check de « ${server.name} » : ${updated.status}.`);
      })
      .catch((err) => notify('Erreur: ' + err.message, 'error'));
  };

  const handleSimulateFailure = (server) => {
    api.simulateServerFailure(server.id)
      .then((updated) => {
        setServers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        notify(`Panne simulée sur « ${server.name} » — une alerte va être générée.`, 'warning');
      })
      .catch((err) => notify('Erreur: ' + err.message, 'error'));
  };

  const renderStatusBadge = (status) => <span className={`badge ${status}`}>{status}</span>;
  const renderSeverityBadge = (severity) => <span className={`badge severity-${severity}`}>{severity}</span>;

  return (
    <div className="app">
      {/* Toasts */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>{toast.message}</div>
        ))}
      </div>

      <header className="header">
        <div className="brand">
          <div className="brand-mark">DS</div>
          <div>
            <h1>DevSecOps Platform</h1>
            <p className="subtitle">Supervision d'infrastructure · nœuds, services & alertes</p>
          </div>
        </div>
        <div className="header-side">
          <small className="last-updated">
            {lastUpdated ? `Actualisé ${lastUpdated.toLocaleTimeString()} · auto 15 s` : 'Chargement…'}
          </small>
          <div className={`status ${backendStatus.includes('✓') ? 'connected' : 'disconnected'}`}>
            {backendStatus.includes('✓') ? 'Opérationnel' : 'Hors ligne'}
          </div>
        </div>
      </header>

      <main className="container">
        {error && (
          <div className="error-box">
            {error}
            <small>Vérifiez que le backend est lancé sur http://localhost:5000</small>
          </div>
        )}

        <section className="dashboard-grid">
          <div className="card summary-card">
            <span className="card-title">Serveurs</span>
            <strong>{dashboard?.servers ?? '-'}</strong>
            <small>{dashboard ? `${dashboard.serverStatus?.online || 0} en ligne` : ''}</small>
          </div>
          <div className="card summary-card">
            <span className="card-title">Services</span>
            <strong>{dashboard?.services ?? '-'}</strong>
            <small>{dashboard ? `${dashboard.services} applications surveillées` : ''}</small>
          </div>
          <div className="card summary-card">
            <span className="card-title">Alertes</span>
            <strong>{dashboard?.alerts ?? '-'}</strong>
            <small>{dashboard ? `${dashboard.alertStatus?.new || 0} nouvelles` : ''}</small>
          </div>
          <div className="card summary-card">
            <span className="card-title">Disponibilité</span>
            <strong>{loading ? '…' : 'OK'}</strong>
            <small>Backend & base de données actifs</small>
          </div>
        </section>

        <LiveMonitoring />

        <section className="panel panel-list">
          <div className="panel-header">
            <h2>Serveurs & nœuds<span className="count">{servers.length}</span></h2>
            <button className="btn-small" onClick={refreshData}>Rafraîchir</button>
          </div>
          {loading ? (
            <TableSkeleton rows={3} cols={8} />
          ) : servers.length === 0 ? (
            <p className="empty-hint">Aucun serveur enregistré — déployez-en un ci-dessous.</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>IP</th>
                    <th>État</th>
                    <th>Ressources</th>
                    <th>Localisation</th>
                    <th>Tags</th>
                    <th>Dernier check</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {servers.map((server) => (
                    <tr key={server.id}>
                      <td className="cell-name">{server.name}</td>
                      <td><code>{server.ip}</code></td>
                      <td>{renderStatusBadge(server.status)}</td>
                      <td className="cell-usage">
                        <UsageBar label="CPU" value={server.cpu} />
                        <UsageBar label="RAM" value={server.memory} />
                        <UsageBar label="DSK" value={server.disk} />
                        <span className={`metrics-source ${server.metricsSource === 'prometheus' ? 'real' : 'sim'}`}>
                          {server.metricsSource === 'prometheus' ? 'métriques réelles' : 'données simulées'}
                        </span>
                      </td>
                      <td>{server.location}</td>
                      <td>
                        <div className="tags">
                          {(server.tags || []).map((tag) => (
                            <span key={tag} className={`tag ${tag === 'auto-deployed' ? 'tag-auto' : ''}`}>{tag}</span>
                          ))}
                        </div>
                      </td>
                      <td>{formatTime(server.lastHealthCheck)}</td>
                      <td className="cell-actions">
                        <button className="btn-small" title="Relancer un health check" onClick={() => handleHealthCheck(server)}>Vérifier</button>
                        <button className="btn-small warning" title="Simuler une panne (démo) pour déclencher une alerte" onClick={() => handleSimulateFailure(server)}>Simuler panne</button>
                        <button className="btn-small danger" title="Supprimer le serveur et nettoyer le monitoring" onClick={() => handleDeleteServer(server)}>Supprimer</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="grid-two">
          <div className="panel panel-list">
            <div className="panel-header">
              <h2>Services déployés<span className="count">{services.length}</span></h2>
            </div>
            {loading ? (
              <TableSkeleton rows={2} cols={5} />
            ) : services.length === 0 ? (
              <p className="empty-hint">Aucun service — utilisez le formulaire ci-dessous.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Type</th>
                      <th>Serveur</th>
                      <th>État</th>
                      <th>Équipe</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((service) => (
                      <tr key={service.id}>
                        <td className="cell-name">{service.name}</td>
                        <td>{service.type}</td>
                        <td>{service.serverName || '-'}</td>
                        <td>{renderStatusBadge(service.status)}</td>
                        <td>{service.owner}</td>
                        <td className="cell-actions">
                          <button className="btn-small danger" title="Retirer le service" onClick={() => handleDeleteService(service)}>Retirer</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="panel panel-list">
            <div className="panel-header">
              <h2>Alertes<span className="count">{alerts.length}</span></h2>
            </div>
            {loading ? (
              <TableSkeleton rows={3} cols={4} />
            ) : alerts.length === 0 ? (
              <p className="empty-hint">Aucune alerte active.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Titre</th>
                      <th>Gravité</th>
                      <th>État</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map((alert) => (
                      <tr key={alert.id}>
                        <td>{alert.title}</td>
                        <td>{renderSeverityBadge(alert.severity)}</td>
                        <td>{renderStatusBadge(alert.status)}</td>
                        <td className="cell-actions">
                          {alert.status === 'new' && (
                            <button className="btn-small" title="Prendre en compte" onClick={() => handleAckAlert(alert.id)}>Prendre en compte</button>
                          )}
                          {alert.status !== 'resolved' && (
                            <button className="btn-small success" title="Marquer comme résolue" onClick={() => handleResolveAlert(alert.id)}>Résoudre</button>
                          )}
                          {alert.status === 'resolved' && <span className="muted-dash">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section className="form-section">
          <DeployServer />

          <div className="panel panel-form">
            <h2>Ajouter un serveur (manuel)</h2>
            <p className="form-hint">Enregistrement déclaratif d'un serveur existant.</p>
            <form className="management-form" onSubmit={handleCreateServer}>
              <input
                type="text"
                placeholder="Nom du serveur"
                value={newServer.name}
                onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Adresse IP"
                value={newServer.ip}
                onChange={(e) => setNewServer({ ...newServer, ip: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Localisation"
                value={newServer.location}
                onChange={(e) => setNewServer({ ...newServer, location: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Tags (comma separated)"
                value={newServer.tags}
                onChange={(e) => setNewServer({ ...newServer, tags: e.target.value })}
              />
              <button type="submit" className="btn-submit">Créer le serveur</button>
            </form>
          </div>

          <div className="panel panel-form">
            <h2>Déployer un service</h2>
            <p className="form-hint">Association d'un service applicatif à un serveur supervisé.</p>
            <form className="management-form" onSubmit={handleCreateService}>
              <input
                type="text"
                placeholder="Nom du service"
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                required
              />
              <select
                value={newService.type}
                onChange={(e) => setNewService({ ...newService, type: e.target.value })}
              >
                <option value="web application">Web application</option>
                <option value="database">Database</option>
                <option value="monitoring">Monitoring</option>
                <option value="microservice">Microservice</option>
              </select>
              <select
                value={newService.runningOn}
                onChange={(e) => setNewService({ ...newService, runningOn: e.target.value })}
                required
              >
                <option value="">Sélectionner un serveur</option>
                {servers.map((server) => (
                  <option key={server.id} value={server.id}>
                    {server.name} ({server.ip})
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Équipe propriétaire"
                value={newService.owner}
                onChange={(e) => setNewService({ ...newService, owner: e.target.value })}
              />
              <button type="submit" className="btn-submit">Déployer le service</button>
            </form>
          </div>
        </section>
      </main>

      <footer className="footer">
        <span>Plateforme DevSecOps — PFE 2026</span>
        <span className="build-info">Build <strong>#{BUILD_NUMBER}</strong> · déployé via Jenkins + ArgoCD (GitOps)</span>
      </footer>
    </div>
  );
}

export default App;
