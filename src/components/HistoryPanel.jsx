import { useState } from 'react';
import { Trash2, Clock } from 'lucide-react';
import { formatTimestamp, formatSpeed } from '../utils/formatters';

const HistoryPanel = ({ history = [], onClear, unit = 'mbps', unitLabel = 'Mbps' }) => {
  const [open, setOpen] = useState(false);
  if (!history.length) return null;

  return (
    <div className="history-panel">
      <button
        className="history-toggle"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls="history-body"
      >
        <Clock size={15} aria-hidden="true"/>
        Test History
        <span className="history-count">{history.length}</span>
        <span className={`history-chevron ${open ? 'history-chevron--open' : ''}`} aria-hidden="true">▾</span>
      </button>

      {open && (
        <div id="history-body" className="history-body">
          <div className="history-actions">
            <button className="history-clear" onClick={onClear} aria-label="Clear all history">
              <Trash2 size={13}/> Clear All
            </button>
          </div>
          <div className="history-table" role="table">
            <div className="history-head" role="row">
              <span>Time</span>
              <span>↓ Download</span>
              <span>↑ Upload</span>
              <span>Ping</span>
              <span>ISP</span>
            </div>
            {history.map(e => (
              <div key={e.id} className="history-row" role="row">
                <span className="h-time">{formatTimestamp(e.timestamp)}</span>
                <span className="h-dl">{formatSpeed(e.download, unit)} {unitLabel}</span>
                <span className="h-ul">{formatSpeed(e.upload, unit)} {unitLabel}</span>
                <span className="h-ping">{e.ping ?? '--'} ms</span>
                <span className="h-isp">{e.isp || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPanel;
