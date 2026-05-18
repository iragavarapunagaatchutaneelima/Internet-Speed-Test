
import { STREAMING_PLATFORMS, getBestQuality } from '../utils/quality';

const StreamingGrid = ({ downloadMbps = 0 }) => (
  <div className="streaming-section" role="region" aria-label="Streaming platform quality">
    <div className="streaming-header">
      <div className="streaming-title">
        <div className="streaming-title-dot" aria-hidden="true"/>
        Streaming Platform Support
      </div>
      <div className="streaming-subtitle">Estimated quality based on your download speed</div>
    </div>
    <div className="streaming-cards">
      {STREAMING_PLATFORMS.map(p => {
        const { label, supported } = getBestQuality(p, downloadMbps);
        return (
          <div
            key={p.id}
            className={`stream-card ${supported ? 'stream-card--ok' : 'stream-card--no'}`}
            aria-label={`${p.name}: ${label}`}
          >
            <div className="stream-card__emoji" aria-hidden="true">{p.icon}</div>
            <div className="stream-card__name">{p.name}</div>
            <div className={`stream-card__quality ${supported ? 'stream-card__quality--ok' : 'stream-card__quality--no'}`}>
              {label}
            </div>
            {supported && <span className="stream-card__badge" aria-hidden="true">✓</span>}
          </div>
        );
      })}
    </div>
  </div>
);

export default StreamingGrid;
