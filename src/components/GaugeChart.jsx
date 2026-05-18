import { useMemo } from 'react';

/**
 * GaugeChart — Semicircular speedometer.
 *
 * ViewBox: 0 0 400 260
 * Center:  cx=200, cy=230
 * Radius:  R=175
 * Arc:     LEFT(25,230) → UP(200,55) → RIGHT(375,230)
 *
 * All 6 ticks (0, 20, 40, 60, 80, 100%) use identical
 * tick-bar + label style for perfect visual consistency.
 */

const PHASE_COLOR = {
  IDLE:       '#3d4f7c',
  CONNECTING: '#f59e0b',
  PING:       '#38bdf8',
  DOWNLOAD:   '#00d4ff',
  UPLOAD:     '#818cf8',
  DONE:       '#10b981',
  ERROR:      '#ef4444',
};

const GaugeChart = ({
  speedMbps    = 0,
  maxMbps      = 100,
  phase        = 'IDLE',
  displayValue = '0.00',
  displayUnit  = 'Mbps',
}) => {
  const W = 400, H = 260;
  const cx = 200, cy = 230, R = 175;

  const arcLen = useMemo(() => Math.PI * R, []);

  const ratio = useMemo(() => {
    if (!speedMbps || maxMbps <= 0) return 0;
    return Math.min(1, Math.max(0, speedMbps / maxMbps));
  }, [speedMbps, maxMbps]);

  const phaseColor = PHASE_COLOR[phase] || '#3d4f7c';

  // Arc endpoints
  const lx = cx - R, ly = cy;
  const rx = cx + R, ry = cy;
  const trackPath = `M${lx},${ly} A${R},${R} 0 1 1 ${rx},${ry}`;

  // Needle — angle from π (left, 0%) to 0 (right, 100%)
  const needleAngle = Math.PI - ratio * Math.PI;
  const needleR = R - 22;
  const needleTipX = cx + needleR * Math.cos(needleAngle);
  const needleTipY = cy - needleR * Math.sin(needleAngle);

  // ALL 6 ticks: 0%, 20%, 40%, 60%, 80%, 100% — identical style
  const allTicks = useMemo(() => {
    return [0, 0.2, 0.4, 0.6, 0.8, 1.0].map(t => {
      const ang = Math.PI - t * Math.PI;
      const cos = Math.cos(ang);
      const sin = Math.sin(ang);
      return {
        inner: { x: cx + (R - 8)  * cos, y: cy - (R - 8)  * sin },
        outer: { x: cx + (R + 6)  * cos, y: cy - (R + 6)  * sin },
        label: { x: cx + (R + 24) * cos, y: cy - (R + 24) * sin },
        value: Math.round(maxMbps * t),
      };
    });
  }, [maxMbps]);

  return (
    <div className="gauge-wrap" role="img" aria-label={`Speed: ${displayValue} ${displayUnit}`}>
      <svg viewBox={`0 0 ${W} ${H}`} className="gauge-svg" aria-hidden="true">
        <defs>
          <linearGradient id="g-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#00d4ff" />
            <stop offset="55%"  stopColor="#818cf8" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <filter id="g-glow" x="-15%" y="-15%" width="130%" height="130%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="n-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="g-ambient" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor={phaseColor} stopOpacity="0.12" />
            <stop offset="100%" stopColor={phaseColor} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient glow */}
        <ellipse cx={cx} cy={cy} rx={R + 40} ry={R + 40} fill="url(#g-ambient)" />

        {/* Track arc */}
        <path d={trackPath} fill="none"
          stroke="rgba(255,255,255,0.07)" strokeWidth={20} strokeLinecap="round" />

        {/* Filled arc */}
        <path d={trackPath} fill="none"
          stroke="url(#g-grad)" strokeWidth={20} strokeLinecap="round"
          strokeDasharray={arcLen}
          strokeDashoffset={arcLen * (1 - ratio)}
          filter="url(#g-glow)"
          style={{ transition: 'stroke-dashoffset 0.15s cubic-bezier(0.4,0,0.2,1)' }}
        />

        {/* ── ALL 6 tick marks + labels (uniform style) ── */}
        {allTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={t.inner.x} y1={t.inner.y}
              x2={t.outer.x} y2={t.outer.y}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <text
              x={t.label.x}
              y={t.label.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10"
              fill="rgba(255,255,255,0.3)"
              fontFamily="'JetBrains Mono',monospace"
              fontWeight="500"
            >
              {t.value}
            </text>
          </g>
        ))}

        {/* ── Needle ── */}
        {phase !== 'IDLE' && (
          <>
            <line
              x1={cx} y1={cy}
              x2={needleTipX} y2={needleTipY}
              stroke={phaseColor} strokeWidth="3" strokeLinecap="round"
              filter="url(#n-glow)"
              style={{ transition: 'x2 0.15s ease, y2 0.15s ease, stroke 0.3s ease' }}
            />
            <circle cx={cx} cy={cy} r={16}
              fill="rgba(255,255,255,0.04)"
              stroke="rgba(255,255,255,0.08)" strokeWidth="1"
            />
            <circle cx={cx} cy={cy} r={7}
              fill={phaseColor} filter="url(#n-glow)"
              style={{ transition: 'fill 0.3s ease' }}
            />
          </>
        )}

        {/* Idle hub */}
        {phase === 'IDLE' && (
          <circle cx={cx} cy={cy} r={10}
            fill="rgba(255,255,255,0.05)"
            stroke="rgba(255,255,255,0.1)" strokeWidth="1"
          />
        )}

        {/* Speed value */}
        <text x={cx} y={cy - 80} textAnchor="middle"
          fontSize="62" fontWeight="800"
          fontFamily="'JetBrains Mono',monospace"
          fill="white" letterSpacing="-3"
        >{displayValue}</text>

        {/* Unit label */}
        <text x={cx} y={cy - 44} textAnchor="middle"
          fontSize="14" fontWeight="700"
          fontFamily="'Inter',sans-serif"
          fill={phaseColor}
          style={{ transition: 'fill 0.3s ease' }}
        >{displayUnit}</text>

        {/* Phase label */}
        <text x={cx} y={cy - 24} textAnchor="middle"
          fontSize="9" fontWeight="600"
          fontFamily="'Inter',sans-serif"
          fill="rgba(255,255,255,0.22)" letterSpacing="3"
        >{phase === 'IDLE' ? 'READY' : phase === 'DONE' ? 'COMPLETE' : phase}</text>
      </svg>
    </div>
  );
};

export default GaugeChart;
