import React, { useState, useEffect } from 'react';
import api from './api';
import DeployServer from './components/DeployServer';
import './App.css';

function App() {
  const [backendStatus, setBackendStatus] = useState('checking...');
  const [dashboard, setDashboard] = useState(null);
  const [servers, setServers] = useState([]);
  const [services, setServices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newServer, setNewServer] = useState({
    name: '',
    ip: '',
    location: '',
    tags: '',
  });

  const [newService, setNewService] = useState({
    name: '',
    type: 'web application',
    runningOn: '',
    owner: '',
  });

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

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await api.checkHealth();
        setBackendStatus('✓ Connected');

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
      } catch (err) {
        setError(err.message || 'Le backend est inaccessible.');
        setBackendStatus('✗ Disconnected');
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    setError(null);

    try {
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
    } catch (err) {
      setError(err.message || 'Erreur lors du rafraîchissement des données.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateServer = async (event) => {
    event.preventDefault();

    if (!newServer.name || !newServer.ip || !newServer.location) {
      alert('Veuillez remplir tous les champs du serveur.');
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
      alert('Serveur ajouté avec succès.');
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const handleCreateService = async (event) => {
    event.preventDefault();

    if (!newService.name || !newService.runningOn) {
      alert('Veuillez choisir un service et un serveur de destination.');
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
      alert('Service déployé avec succès.');
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const handleAckAlert = async (alertId) => {
    try {
      const currentAlert = alerts.find((item) => item.id === alertId);
      const updated = await api.updateAlert(alertId, { status: 'acknowledged' });
      setAlerts((prev) => prev.map((item) => (item.id === alertId ? updated : item)));
      setDashboard((prev) => updateAlertCounters(prev, currentAlert?.status, updated.status));
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      const currentAlert = alerts.find((item) => item.id === alertId);
      const updated = await api.updateAlert(alertId, { status: 'resolved' });
      setAlerts((prev) => prev.map((item) => (item.id === alertId ? updated : item)));
      setDashboard((prev) => updateAlertCounters(prev, currentAlert?.status, updated.status));
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const renderStatusBadge = (status) => {
    const classes = ['badge', status].join(' ');
    return <span className={classes}>{status}</span>;
  };

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>📊 Plateforme de Monitoring & Gestion d'Infrastructure</h1>
          <p className="subtitle">Vue synthétique des nœuds, services et alertes pour DevOps/System Engineers.</p>
        </div>
        <div className={`status ${backendStatus.includes('✓') ? 'connected' : 'disconnected'}`}>
          Backend: {backendStatus}
        </div>
      </header>

      <main className="container">
        {error && (
          <div className="error-box">
            ❌ {error}
            <br />
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
            <span className="card-title">Temps de service</span>
            <strong>{loading ? '...' : 'OK'}</strong>
            <small>Backend actif</small>
          </div>
        </section>

        <section className="grid-two">
          <div className="panel panel-list">
            <div className="panel-header">
              <h2>🔧 Serveurs & Nœuds ({servers.length})</h2>
              <button className="btn-small" onClick={refreshData}>Rafraîchir</button>
            </div>
            {loading ? (
              <p>⏳ Chargement des serveurs...</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>IP</th>
                    <th>État</th>
                    <th>Localisation</th>
                    <th>Dernier check</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {servers.map((server) => (
                    <tr key={server.id}>
                      <td>{server.name}</td>
                      <td>{server.ip}</td>
                      <td>{renderStatusBadge(server.status)}</td>
                      <td>{server.location}</td>
                      <td>{formatTime(server.lastHealthCheck)}</td>
                      <td>
                        <button className="btn-small" onClick={() => api.runServerHealthCheck(server.id)
                          .then((updated) => {
                            setServers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
                            refreshData();
                          })
                          .catch((err) => alert('Erreur: ' + err.message))}
                        >
                          Check
                        </button>
                        <button className="btn-small warning" onClick={() => api.simulateServerFailure(server.id)
                          .then((updated) => {
                            setServers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
                            refreshData();
                          })
                          .catch((err) => alert('Erreur: ' + err.message))}
                        >
                          Simuler
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="panel panel-list">
            <div className="panel-header">
              <h2>🚨 Alertes ({alerts.length})</h2>
              <button className="btn-small" onClick={refreshData}>Rafraîchir</button>
            </div>
            {loading ? (
              <p>⏳ Chargement des alertes...</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Titre</th>
                    <th>Gravité</th>
                    <th>État</th>
                    <th>Entité</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert) => (
                    <tr key={alert.id}>
                      <td>{alert.title}</td>
                      <td>{alert.severity}</td>
                      <td>{renderStatusBadge(alert.status)}</td>
                      <td>{alert.entityType}</td>
                      <td>
                        {alert.status === 'new' && (
                          <button className="btn-small" onClick={() => handleAckAlert(alert.id)}>
                            Acknowledge
                          </button>
                        )}
                        {alert.status !== 'resolved' && (
                          <button className="btn-small success" onClick={() => handleResolveAlert(alert.id)}>
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="form-section">
          <DeployServer />

          <div className="panel panel-form">
            <h2>➕ Ajouter un serveur (Manuel)</h2>
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
              <button type="submit" className="btn-submit">
                Créer le serveur
              </button>
            </form>
          </div>

          <div className="panel panel-form">
            <h2>➕ Déployer un service</h2>
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
              <button type="submit" className="btn-submit">
                Déployer le service
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
