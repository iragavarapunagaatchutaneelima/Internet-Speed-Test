
import { calculateQualityScore } from '../utils/formatters';

const QualityScore = ({ download, upload, ping }) => {
  const result = calculateQualityScore(download, upload, ping);
  if (!result) return null;

  return (
    <div className="quality-score" role="status" aria-label={`Grade ${result.grade}: ${result.label}`}>
      <div className="quality-score__ring" style={{ '--ring-color': result.color }}>
        <span className="quality-score__grade" style={{ color: result.color }}>{result.grade}</span>
      </div>
      <div>
        <div className="quality-score__label" style={{ color: result.color }}>{result.label}</div>
        <div className="quality-score__sub">Connection Quality</div>
      </div>
    </div>
  );
};

export default QualityScore;
