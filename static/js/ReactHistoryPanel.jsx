const { useState, useEffect, useCallback } = React;

function ReactHistoryPanel() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [unit, setUnit] = useState('mbps');

  const UNIT_LABELS = { mbps: 'Mbps', mbs: 'MB/s', kbs: 'KB/s' };

  const fmtSpeed = (mbps, currentUnit) => {
    if (mbps == null || mbps < 0) return '0.00';
    if (currentUnit === 'mbs') return (mbps / 8).toFixed(2);
    if (currentUnit === 'kbs') return Math.round((mbps * 1000) / 8).toString();
    return mbps.toFixed(2);
  };

  const fmtTimestamp = (ts) => {
    return new Date(ts * 1000).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const fetchHistory = useCallback(async () => {
    // Uses the existing global SpeedTest client if available
    try {
      let data = [];
      if (window.SpeedTest && window.SpeedTest.loadHistory) {
        data = await window.SpeedTest.loadHistory();
      } else {
        const res = await fetch('/api/history');
        if (res.ok) data = await res.json();
      }
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  }, []);

  const clearHistory = async () => {
    try {
      if (window.SpeedTest && window.SpeedTest.clearHistory) {
        await window.SpeedTest.clearHistory();
      } else {
        await fetch('/api/history', { method: 'DELETE' });
      }
      setHistory([]);
      setHistoryOpen(false);
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  useEffect(() => {
    fetchHistory();

    const handleHistoryUpdated = () => {
      fetchHistory();
    };

    const handleUnitChanged = (e) => {
      if (e.detail) {
        setUnit(e.detail);
      }
    };

    window.addEventListener('historyUpdated', handleHistoryUpdated);
    window.addEventListener('unitChanged', handleUnitChanged);

    // Initial check for active unit
    const activeUnitBtn = document.querySelector('.unit-btn--active');
    if (activeUnitBtn && activeUnitBtn.dataset.unit) {
      setUnit(activeUnitBtn.dataset.unit);
    }

    return () => {
      window.removeEventListener('historyUpdated', handleHistoryUpdated);
      window.removeEventListener('unitChanged', handleUnitChanged);
    };
  }, [fetchHistory]);

  if (history.length === 0) {
    return null;
  }

  const ul = UNIT_LABELS[unit] || 'Mbps';

  return (
    <div className="history-panel">
      <button 
        className="history-toggle"
        aria-expanded={historyOpen}
        onClick={() => setHistoryOpen(!historyOpen)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        Test History
        <span className="history-count">{history.length}</span>
        <span className={`history-chevron ${historyOpen ? 'history-chevron--open' : ''}`} aria-hidden="true">▾</span>
      </button>

      {historyOpen && (
        <div className="history-body">
          <div className="history-actions">
            <button className="history-clear" onClick={clearHistory} aria-label="Clear all history">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
              Clear All
            </button>
          </div>
          <div className="history-table" role="table" aria-label="Speed test history">
            <div className="history-head" role="row">
              <span role="columnheader">Time</span>
              <span role="columnheader">↓ Download</span>
              <span role="columnheader">↑ Upload</span>
              <span role="columnheader">Ping</span>
              <span role="columnheader">ISP</span>
            </div>
            {history.map((r, i) => (
              <div key={i} className="history-row" role="row">
                <span className="h-time">{fmtTimestamp(r.timestamp)}</span>
                <span className="h-dl">{fmtSpeed(r.download, unit)} {ul}</span>
                <span className="h-ul">{fmtSpeed(r.upload, unit)} {ul}</span>
                <span className="h-ping">{r.ping ?? '--'} ms</span>
                <span className="h-isp">{r.isp || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const rootNode = document.getElementById('react-history-root');
if (rootNode) {
  const root = ReactDOM.createRoot(rootNode);
  root.render(<ReactHistoryPanel />);
}
