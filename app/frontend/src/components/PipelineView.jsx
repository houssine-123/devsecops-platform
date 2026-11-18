import React, { useCallback, useEffect, useState } from 'react';
import { getPipeline } from '../api';
import './PipelineView.css';

const REFRESH_MS = 15000;

const STATUS_LABELS = {
  SUCCESS: 'Réussie',
  FAILED: 'Échouée',
  IN_PROGRESS: 'En cours',
  SKIPPED: 'Non exécutée',
  NOT_EXECUTED: 'Non exécutée',
  ABORTED: 'Interrompue',
  UNSTABLE: 'Instable',
  PAUSED_PENDING_INPUT: 'En attente',
};

const statusClass = (status) => `pl-${String(status || 'unknown').toLowerCase()}`;

const formatDuration = (ms) => {
  if (!ms) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} s`;
  return `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`;
};

const formatDate = (iso) => (iso ? new Date(iso).toLocaleString('fr-FR') : '—');

/**
 * Onglet CI/CD : état réel des dernières exécutions du pipeline Jenkins,
 * lu par le backend et rafraîchi automatiquement.
 */
export default function PipelineView() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(async () => {
    try {
      const result = await getPipeline();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.response?.data || { error: 'unavailable' });
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  if (error && !data) {
    return (
      <section className="panel insight-panel">
        <span className="eyebrow">Jenkins + GitOps</span>
        <h2>Pipeline de livraison</h2>
        <p className="pl-message">
          Jenkins n'est pas joignable depuis cet environnement. L'état du pipeline se consulte directement dans Jenkins.
        </p>
        {error.jenkinsUrl && (
          <a className="pl-link" href={error.jenkinsUrl} target="_blank" rel="noreferrer">Ouvrir Jenkins</a>
        )}
      </section>
    );
  }

  if (!data) {
    return (
      <section className="panel insight-panel">
        <h2>Pipeline de livraison</h2>
        <p className="pl-message">Chargement de l'état du pipeline…</p>
      </section>
    );
  }

  const runs = data.runs || [];
  const current = runs.find((r) => r.id === selectedId) || runs[0];

  return (
    <section className="panel insight-panel pl-panel">
      <div className="pl-header">
        <div>
          <span className="eyebrow">Jenkins + GitOps · temps réel</span>
          <h2>Pipeline de livraison</h2>
        </div>
        <a className="pl-link" href={data.jenkinsUrl} target="_blank" rel="noreferrer">Ouvrir dans Jenkins</a>
      </div>

      {!current ? (
        <p className="pl-message">Aucune exécution du pipeline pour le moment.</p>
      ) : (
        <>
          <div className="pl-summary">
            <span className={`pl-badge ${statusClass(current.status)}`}>
              {STATUS_LABELS[current.status] || current.status}
            </span>
            <strong>Exécution {current.name}</strong>
            <small>Démarrée le {formatDate(current.startedAt)} · durée {formatDuration(current.durationMs)}</small>
          </div>

          <ol className="pl-stages">
            {current.stages.map((stage, index) => (
              <li key={stage.name} className={`pl-stage ${statusClass(stage.status)}`}>
                <span className="pl-index">{index + 1}</span>
                <span className="pl-name">{stage.name}</span>
                <span className="pl-state">{STATUS_LABELS[stage.status] || stage.status}</span>
                <span className="pl-time">
                  {['SKIPPED', 'NOT_EXECUTED'].includes(stage.status) ? '—' : formatDuration(stage.durationMs)}
                </span>
              </li>
            ))}
          </ol>

          <h3 className="pl-subtitle">Dernières exécutions</h3>
          <div className="pl-history">
            {runs.map((run) => (
              <button
                type="button"
                key={run.id}
                className={`pl-run ${run.id === current.id ? 'active' : ''}`}
                onClick={() => setSelectedId(run.id)}
              >
                <span className={`pl-dot ${statusClass(run.status)}`} />
                <strong>{run.name}</strong>
                <small>{STATUS_LABELS[run.status] || run.status}</small>
                <span className="pl-bar">
                  {run.stages.map((s) => (
                    <span key={s.name} className={`pl-seg ${statusClass(s.status)}`} title={`${s.name} : ${STATUS_LABELS[s.status] || s.status}`} />
                  ))}
                </span>
              </button>
            ))}
          </div>
          <small className="pl-refresh">
            Mis à jour {new Date(data.fetchedAt).toLocaleTimeString('fr-FR')} · actualisation toutes les 15 s
          </small>
        </>
      )}
    </section>
  );
}
