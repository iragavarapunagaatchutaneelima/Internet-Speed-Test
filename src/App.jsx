import { useState, useMemo, useEffect } from 'react';
import { Download, Upload, Activity, Wifi } from 'lucide-react';

import ErrorBoundary  from './components/ErrorBoundary';
import Navbar         from './components/Navbar';
import GaugeChart     from './components/GaugeChart';
import StatCard       from './components/StatCard';
import TestButton     from './components/TestButton';
import UnitToggle     from './components/UnitToggle';
import StreamingGrid  from './components/StreamingGrid';
import QualityScore   from './components/QualityScore';
import HistoryPanel   from './components/HistoryPanel';

import { useSpeedTest } from './hooks/useSpeedTest';
import { useHistory }   from './hooks/useHistory';
import { formatSpeed, getUnitLabel, getPingColor } from './utils/formatters';

function AppContent() {
  const {
    phase, ping, download, upload,
    currentSpeed, connectionInfo,
    error, isTesting, startTest, stopTest, reset,
  } = useSpeedTest();

  const { history, addResult, clearHistory } = useHistory();
  const [unit, setUnit] = useState('mbps');

  useEffect(() => {
    if (phase === 'DONE' && download !== null && upload !== null) {
      addResult({ ping, download, upload, isp: connectionInfo?.isp || '' });
    }
  }, [phase, ping, download, upload, connectionInfo, addResult]);

  const maxMbps = useMemo(() => {
    const top = Math.max(download || 0, upload || 0, currentSpeed || 0);
    if (top > 400) return 1000;
    if (top > 200) return 500;
    if (top > 80)  return 200;
    return 100;
  }, [download, upload, currentSpeed]);

  const unitLabel    = getUnitLabel(unit);
  const displaySpeed = formatSpeed(currentSpeed, unit);

  const isLoadingDl = isTesting && ['CONNECTING','PING'].includes(phase);
  const isLoadingUl = isTesting && ['CONNECTING','PING','DOWNLOAD'].includes(phase);

  const pingColor = ping !== null ? getPingColor(ping) : undefined;
  const pingLabel = ping !== null
    ? ping < 20 ? 'Excellent' : ping < 50 ? 'Good' : ping < 100 ? 'Fair' : 'Poor'
    : undefined;

  return (
    <div className="app">
      <div className="bg-canvas" aria-hidden="true"/>
      <div className="bg-grid"   aria-hidden="true"/>
      <div className="bg-noise"  aria-hidden="true"/>

      <Navbar/>

      <main className="main" role="main" id="main-content">

        {/* ── Hero ── */}
        <section className="hero-card" aria-label="Speed meter">
          <div className="hero-card__shimmer" aria-hidden="true"/>

          <div className="gauge-wrap">
            <GaugeChart
              speedMbps={currentSpeed}
              maxMbps={maxMbps}
              phase={phase}
              displayValue={displaySpeed}
              displayUnit={unitLabel}
            />
          </div>

          {connectionInfo && (
            <div className="isp-strip" aria-label="Your connection">
              {connectionInfo.flag && (
                <img src={connectionInfo.flag} alt={connectionInfo.country}
                  className="isp-strip__flag" width={22} height={16}/>
              )}
              <span className="isp-strip__isp">{connectionInfo.isp}</span>
              {connectionInfo.city && (
                <>
                  <span className="isp-strip__dot">·</span>
                  <span className="isp-strip__loc">{connectionInfo.city}, {connectionInfo.country}</span>
                </>
              )}
            </div>
          )}

          <UnitToggle unit={unit} onChange={setUnit}/>

          <TestButton phase={phase} isTesting={isTesting} onStart={startTest} onStop={stopTest} onReset={reset}/>

          {phase === 'ERROR' && error && (
            <div className="error-notice" role="alert">⚠️ {error}</div>
          )}
        </section>

        {/* ── Stats ── */}
        <section className="stats-section" aria-label="Test results">
          <div className="stats-grid">
            <StatCard icon={<Activity size={20}/>} label="Ping"
              value={ping !== null ? ping : null} unit="ms"
              loading={isTesting && phase === 'PING'}
              valueColor={pingColor} sublabel={pingLabel}/>

            <StatCard icon={<Download size={20}/>} label="Download"
              value={download !== null ? formatSpeed(download, unit) : null} unit={unitLabel}
              loading={isLoadingDl}/>

            <StatCard icon={<Upload size={20}/>} label="Upload"
              value={upload !== null ? formatSpeed(upload, unit) : null} unit={unitLabel}
              loading={isLoadingUl}/>

            {phase === 'DONE' && (
              <div className="stat-card stat-card--quality">
                <QualityScore download={download} upload={upload} ping={ping}/>
              </div>
            )}
          </div>

          {connectionInfo && phase === 'DONE' && (
            <div className="isp-card">
              <Wifi size={16} className="isp-card__icon" aria-hidden="true"/>
              <div>
                <div className="isp-card__name">{connectionInfo.isp}</div>
                <div className="isp-card__detail">
                  {connectionInfo.ip && `IP: ${connectionInfo.ip}`}
                  {connectionInfo.city && ` · ${connectionInfo.city}, ${connectionInfo.country}`}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── Streaming ── */}
        {(phase === 'DONE' || download !== null) && (
          <StreamingGrid downloadMbps={download || 0}/>
        )}

        {/* ── History ── */}
        <HistoryPanel history={history} onClear={clearHistory} unit={unit} unitLabel={unitLabel}/>

      </main>

      <footer className="footer" role="contentinfo">
        <div className="footer__inner">
          <div className="footer__brand">OrbitSpeed</div>
          <div className="footer__credit">
            Developed by <strong>Neelima</strong>
            <span className="footer__dot">·</span>
            Powered by Cloudflare Edge Networks
          </div>
          <div className="footer__tech">
            ⚡ React · Vite · SVG · CSS · Cloudflare
            <span className="footer__dot">·</span>
            {new Date().getFullYear()}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent/>
    </ErrorBoundary>
  );
}
