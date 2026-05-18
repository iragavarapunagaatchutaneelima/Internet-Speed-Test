

const UNITS = [
  { key: 'mbps', label: 'Mbps' },
  { key: 'mbs',  label: 'MB/s' },
  { key: 'kbs',  label: 'KB/s' },
];

const UnitToggle = ({ unit, onChange }) => (
  <div className="unit-toggle" role="group" aria-label="Speed unit">
    {UNITS.map(({ key, label }) => (
      <button
        key={key}
        id={`unit-${key}`}
        className={`unit-toggle__btn ${unit === key ? 'unit-toggle__btn--active' : ''}`}
        onClick={() => onChange(key)}
        aria-pressed={unit === key}
      >{label}</button>
    ))}
  </div>
);

export default UnitToggle;
