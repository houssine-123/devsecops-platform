import React, { useState } from 'react';
import { login } from '../api';
import './Login.css';

/**
 * Écran de connexion : échange identifiant + mot de passe contre un jeton JWT.
 * Toutes les routes de l'API (hors sondes et métriques) exigent ce jeton.
 */
export default function Login({ onSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await login(username, password);
      onSuccess(user);
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) setError('Identifiant ou mot de passe incorrect.');
      else if (status === 429) setError('Trop de tentatives. Réessayez dans quelques minutes.');
      else if (status === 503) setError("L'authentification n'est pas configurée sur le serveur.");
      else setError('Serveur injoignable. Réessayez plus tard.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleSubmit} noValidate>
        <div className="login-brand">
          <div className="brand-mark">DS</div>
          <div>
            <h1>DevSecOps Platform</h1>
            <p>Connexion requise</p>
          </div>
        </div>

        <label htmlFor="login-username">Identifiant</label>
        <input
          id="login-username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <label htmlFor="login-password">Mot de passe</label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          required
        />

        {error && <p className="login-error" role="alert">{error}</p>}

        <button type="submit" className="login-submit" disabled={loading || !password}>
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </main>
  );
}
