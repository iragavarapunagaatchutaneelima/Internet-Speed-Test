const StatCard = ({ icon, label, value, unit, loading = false, valueColor, sublabel }) => (
  <div className="stat-card" role="group" aria-label={`${label}: ${value ?? 'pending'} ${unit}`}>
    <div className="stat-card__icon" aria-hidden="true">{icon}</div>
    <div className="stat-card__label">{label}</div>
    {loading
      ? <div className="skeleton skeleton--stat" aria-label="Loading…"/>
      : (
        <div className="stat-card__value" style={valueColor ? { color: valueColor } : {}}>
          {value ?? '--'}
          {value != null && <span className="stat-card__unit">&nbsp;{unit}</span>}
        </div>
      )
    }
    {sublabel && !loading && (
      <span
        className="stat-card__sub"
        style={{
          color: valueColor || 'rgba(255,255,255,.4)',
          background: valueColor ? `${valueColor}18` : 'rgba(255,255,255,.06)',
          border: `1px solid ${valueColor ? `${valueColor}35` : 'rgba(255,255,255,.1)'}`,
        }}
      >{sublabel}</span>
    )}
  </div>
);

export default StatCard;
