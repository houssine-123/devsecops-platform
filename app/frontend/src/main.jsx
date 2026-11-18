import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Login from './components/Login';
import { getCurrentUser, getToken, logout } from './api';

/**
 * ============================================================
 * Point d'entrée React (main.jsx)
 * ============================================================
 * 
 * EXPLICATION:
 * C'est le fichier qui démarre React
 * Il monte le composant App dans le DOM (HTML)
 * 
 * Processus:
 * 1. index.html charge ce main.jsx
 * 2. main.jsx démarre React
 * 3. React affiche le composant App
 */

// Garde d'authentification : sans jeton valide, seul l'écran de connexion
// est affiché. Un 401 de l'API (jeton expiré) déclenche "auth:logout".
function AuthGate() {
  const [user, setUser] = React.useState(() => (getToken() ? getCurrentUser() : null));

  React.useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  if (!user) return <Login onSuccess={setUser} />;
  return <App user={user} onLogout={logout} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthGate />
  </React.StrictMode>,
);
