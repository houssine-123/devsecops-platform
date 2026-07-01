import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
