import React, { useState } from 'react';

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

  const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleDeploy = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Veuillez entrer un nom de serveur');
      return;
    }

    setLoading(true);
    setError(null);
    setStatus('🚀 Démarrage du déploiement (~10 secondes)...');
    setResult(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/servers/auto-deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          location: formData.location
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du déploiement');
      }

      setStatus('✅ Serveur déployé avec succès!');
      setResult(data);
      setFormData({ name: '', location: 'virtualbox' });

    } catch (err) {
      setError(`❌ Erreur: ${err.message}`);
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel panel-form" style={{ backgroundColor: '#667eea', color: 'white', marginBottom: '20px' }}>
      <h2>🚀 Déploiement Automatique de Serveur</h2>

      <form className="management-form" onSubmit={handleDeploy}>
        <input
          type="text"
          name="name"
          placeholder="Nom du serveur (ex: web-server-1)"
          value={formData.name}
          onChange={handleChange}
          disabled={loading}
          required
          style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
        />

        <select
          name="location"
          value={formData.location}
          onChange={handleChange}
          disabled={loading}
          style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
        >
          <option value="virtualbox" style={{ color: 'black' }}>VirtualBox (Local)</option>
          <option value="cloud" style={{ color: 'black' }}>Cloud (Future)</option>
        </select>

        <button
          type="submit"
          className="btn-submit"
          disabled={loading}
          style={{ backgroundColor: '#ffb700', color: '#333', marginTop: '10px' }}
        >
          {loading ? '⏳ Déploiement en cours...' : '🚀 Déployer le Serveur'}
        </button>
      </form>

      {status && (
        <p style={{ marginTop: '15px', padding: '10px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '4px' }}>
          {status}
        </p>
      )}

      {error && (
        <p style={{ marginTop: '15px', padding: '10px', backgroundColor: 'rgba(255,59,48,0.8)', borderRadius: '4px' }}>
          {error}
        </p>
      )}

      {result && (
        <div style={{ marginTop: '15px', padding: '15px', backgroundColor: 'rgba(76,175,80,0.9)', borderRadius: '4px' }}>
          <h3>✅ Succès!</h3>
          <p><strong>Serveur:</strong> {result.server.name}</p>
          <p><strong>IP:</strong> <code style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '4px' }}>{result.server.ip}</code></p>
          <p><strong>Statut:</strong> {result.server.status}</p>
          {result.container && (
            <p><strong>Container:</strong> <code style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '4px' }}>{result.container.name}</code></p>
          )}
          <p>🔗 Le serveur est maintenant en monitoring!</p>
        </div>
      )}
    </div>
  );
}
