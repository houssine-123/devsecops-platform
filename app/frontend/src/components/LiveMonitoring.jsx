import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';

const REFRESH_MS = 15000;

// Sparkline SVG sans dépendance externe
function Sparkline({ series, color }) {
  if (!series || series.length < 2) {
    return <div className="sparkline-empty">Pas encore assez de données…</div>;
  }
  const W = 260;
  const H = 56;
  const values = series.map(([, v]) => v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = series
    .map(([, v], i) => {
      const x = (i / (series.length - 1)) * W;
      const y = H - 4 - ((v - min) / span) * (H - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const last = values[values.length - 1];
  return (
    <div className="sparkline">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
        <polygon points={`0,${H} ${points} ${W},${H}`} fill={color} opacity="0.12" />
      </svg>
      <span className="sparkline-last" style={{ color }}>{Math.round(last)}%</span>
    </div>
  );
}

function Gauge({ label, value, icon }) {
  const pct = value === null || value === undefined ? null : Math.round(value);
  const level = pct === null ? 'low' : pct > 85 ? 'high' : pct > 60 ? 'mid' : 'low';
  return (
    <div className="gauge">
      <span className="gauge-icon">{icon}</span>
      <div className="gauge-body">
        <span className="gauge-label">{label}</span>
        <strong className={`gauge-value ${level}`}>{pct === null ? '—' : `${pct}%`}</strong>
        <div className="usage-track">
          <div className={`usage-fill ${level}`} style={{ width: `${pct || 0}%` }} />
        </div>
      </div>
    </div>
  );
}

export default function LiveMonitoring() {
  const [overview, setOverview] = useState(null);
  const [history, setHistory] = useState(null);
  const [unavailable, setUnavailable] = useState(false);

  const load = useCallback(async () => {
    try {
      const [ov, hist] = await Promise.all([
        api.getMonitoringOverview(),
        api.getMonitoringHistory(30),
      ]);
      setOverview(ov);
      setHistory(hist);
      setUnavailable(false);
    } catch {
      setUnavailable(true);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(() => { if (!document.hidden) load(); }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  if (unavailable) {
    return (
      <section className="panel live-monitoring">
        <div className="panel-header"><h2>📡 Supervision temps réel</h2></div>
        <p className="empty-hint">Prometheus est momentanément injoignable — nouvelles tentatives automatiques.</p>
      </section>
    );
  }

  return (
    <section className="panel live-monitoring">
      <div className="panel-header">
        <h2>📡 Supervision temps réel</h2>
        <span className="source-chip">source : Prometheus</span>
      </div>

      <div className="live-grid">
        <div className="live-gauges">
          <Gauge label="CPU hôte" value={overview?.host?.cpu} icon="🧠" />
          <Gauge label="Mémoire hôte" value={overview?.host?.memory} icon="💾" />
          <Gauge label="Disque hôte" value={overview?.host?.disk} icon="🗄️" />
          <div className="gauge">
            <span className="gauge-icon">🎯</span>
            <div className="gauge-body">
              <span className="gauge-label">Cibles de scrape</span>
              <strong className={`gauge-value ${overview && overview.targetsUp === overview.targetsTotal ? 'low' : 'high'}`}>
                {overview ? `${overview.targetsUp}/${overview.targetsTotal} up` : '—'}
              </strong>
              <small className="gauge-sub">
                {overview?.requestRate != null ? `${overview.requestRate.toFixed(2)} req/s sur le backend` : ''}
              </small>
            </div>
          </div>
        </div>

        <div className="live-charts">
          <div className="chart-card">
            <span className="chart-title">CPU — 30 dernières minutes</span>
            <Sparkline series={history?.cpu} color="#3b82f6" />
          </div>
          <div className="chart-card">
            <span className="chart-title">Mémoire — 30 dernières minutes</span>
            <Sparkline series={history?.memory} color="#8b5cf6" />
          </div>
        </div>
      </div>

      {overview?.targets?.length > 0 && (
        <div className="targets-strip">
          {overview.targets.map((t) => (
            <span
              key={`${t.job}-${t.instance}`}
              className={`target-chip ${t.health === 'up' ? 'up' : 'down'}`}
              title={`${t.instance} — dernier scrape : ${t.lastScrape ? new Date(t.lastScrape).toLocaleTimeString() : '?'}`}
            >
              {t.health === 'up' ? '●' : '○'} {t.serverName || t.job}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
