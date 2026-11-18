import React, { useState } from 'react';
import { deployServer } from '../api';

export default function DeployServer() {
  const [formData, setFormData] = useState({
    name: '',
    location: 'virtualbox'
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDeploy = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Veuillez entrer un nom de serveur');
      return;
    }

    setLoading(true);
    setError(null);
    setStatus('Déploiement en cours (~10 secondes)…');
    setResult(null);

    try {
      const data = await deployServer(formData.name, formData.location);

      setStatus('');
      setResult(data);
      setFormData({ name: '', location: 'virtualbox' });

    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Erreur lors du déploiement';
      setError(`Erreur : ${message}`);
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel panel-form">
      <h2>Déploiement automatique</h2>
      <p className="form-hint">
        Provisionne un conteneur node-exporter réel, auto-enregistré dans Prometheus.
      </p>

      <form className="management-form" onSubmit={handleDeploy}>
        <input
          type="text"
          name="name"
          placeholder="Nom du serveur (ex : web-server-1)"
          value={formData.name}
          onChange={handleChange}
          disabled={loading}
          required
        />

        <select
          name="location"
          value={formData.location}
          onChange={handleChange}
          disabled={loading}
        >
          <option value="virtualbox">Conteneur local (Docker)</option>
          <option value="cloud">Cloud (à venir)</option>
        </select>

        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? 'Déploiement en cours…' : 'Déployer le serveur'}
        </button>
      </form>

      {status && <p className="deploy-status">{status}</p>}

      {error && (
        <div className="error-box" style={{ marginTop: '12px' }}>
          {error}
        </div>
      )}

      {result && (
        <div className="deploy-result">
          <strong>Serveur déployé avec succès</strong>
          <span>Nom : {result.server.name}</span>
          <span>IP : <code>{result.server.ip}</code></span>
          <span>Statut : {result.server.status}</span>
          {result.container && <span>Conteneur : <code>{result.container.name}</code></span>}
          <span>Le serveur est maintenant supervisé par Prometheus.</span>
        </div>
      )}
    </div>
  );
}
