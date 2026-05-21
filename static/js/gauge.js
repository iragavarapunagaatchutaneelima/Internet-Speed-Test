/**
 * OrbitSpeed — SVG Gauge Animator (fixed)
 *
 * ViewBox: 0 0 440 280   (wider + taller than before to give labels room)
 * Center:  cx=220, cy=240
 * Radius:  R=160
 * Arc:     LEFT(60,240) → TOP(220,80) → RIGHT(380,240)
 */

'use strict';

const PHASE_COLOR = {
  IDLE:       '#3d4f7c',
  CONNECTING: '#f59e0b',
  PING:       '#38bdf8',
  DOWNLOAD:   '#00d4ff',
  UPLOAD:     '#818cf8',
  DONE:       '#10b981',
  ERROR:      '#ef4444',
};

// Geometry — must match the SVG viewBox in index.html
const CX = 220, CY = 240, R = 160;
const ARC_LEN = Math.PI * R; // ≈ 502.65

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * Update every visual element of the gauge.
 */
function updateGauge(speedMbps, maxMbps, phase, displayValue, displayUnit) {
  const ratio = maxMbps > 0 ? clamp(speedMbps / maxMbps, 0, 1) : 0;
  const color = PHASE_COLOR[phase] || PHASE_COLOR.IDLE;

  // ── Filled arc ──
  const fill = document.getElementById('gauge-fill');
  if (fill) fill.style.strokeDashoffset = ARC_LEN * (1 - ratio);

  // ── Needle ──
  const needleGroup = document.getElementById('needle-group');
  const idleHub     = document.getElementById('idle-hub');
  const needleLine  = document.getElementById('needle-line');
  const needleHub   = document.getElementById('needle-hub');

  if (phase === 'IDLE') {
    if (needleGroup) needleGroup.style.display = 'none';
    if (idleHub)     idleHub.style.display     = '';
  } else {
    if (needleGroup) needleGroup.style.display = '';
    if (idleHub)     idleHub.style.display     = 'none';
    const ang  = Math.PI - ratio * Math.PI;
    const nr   = R - 20;
    const tipX = CX + nr * Math.cos(ang);
    const tipY = CY - nr * Math.sin(ang);
    if (needleLine) {
      needleLine.setAttribute('x2', tipX);
      needleLine.setAttribute('y2', tipY);
      needleLine.setAttribute('stroke', color);
    }
    if (needleHub) needleHub.setAttribute('fill', color);
  }

  // ── Ambient glow colour ──
  const ambientStop = document.getElementById('ambient-stop');
  if (ambientStop) ambientStop.setAttribute('stop-color', color);

  // ── Text labels ──
  const valEl   = document.getElementById('gauge-value');
  const unitEl  = document.getElementById('gauge-unit');
  const phaseEl = document.getElementById('gauge-phase');
  if (valEl)   valEl.textContent  = displayValue;
  if (unitEl)  { unitEl.textContent = displayUnit; unitEl.setAttribute('fill', color); }
  if (phaseEl) {
    const labels = {
      IDLE:'READY', CONNECTING:'CONNECTING…', PING:'LATENCY',
      DOWNLOAD:'DOWNLOAD', UPLOAD:'UPLOAD', DONE:'COMPLETE', ERROR:'ERROR',
    };
    phaseEl.textContent = labels[phase] || phase;
  }
}

/**
 * Render 6 tick marks (0 → 100%) into #gauge-ticks.
 * Text-anchor is adjusted for the two horizontal endpoints to avoid clipping.
 */
function renderTicks(maxMbps, displayUnit) {
  const container = document.getElementById('gauge-ticks');
  if (!container) return;
  container.innerHTML = '';

  const TICK_INNER_R = R - 10;
  const TICK_OUTER_R = R + 8;
  const LABEL_R      = R + 26;

  [0, 0.2, 0.4, 0.6, 0.8, 1.0].forEach((t, i) => {
    const ang   = Math.PI - t * Math.PI;   // π → 0 (left to right)
    const cosA  = Math.cos(ang);
    const sinA  = Math.sin(ang);
    const mbps  = maxMbps * t;

    // Format label depending on unit
    let label;
    if (displayUnit === 'MB/s')      label = (mbps / 8).toFixed(mbps === 0 ? 0 : 1);
    else if (displayUnit === 'KB/s') label = Math.round((mbps * 1000) / 8).toString();
    else                             label = Math.round(mbps).toString();

    const ix = CX + TICK_INNER_R * cosA;
    const iy = CY - TICK_INNER_R * sinA;
    const ox = CX + TICK_OUTER_R * cosA;
    const oy = CY - TICK_OUTER_R * sinA;
    const lx = CX + LABEL_R      * cosA;
    const ly = CY - LABEL_R      * sinA;

    // Choose text-anchor so labels don't clip at the left/right edges
    let anchor = 'middle';
    if (t === 0)   anchor = 'start';   // leftmost (0%)  — text goes right
    if (t === 1.0) anchor = 'end';     // rightmost (100%) — text goes left

    // Tick line
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', ix); line.setAttribute('y1', iy);
    line.setAttribute('x2', ox); line.setAttribute('y2', oy);
    line.setAttribute('stroke', 'rgba(255,255,255,0.25)');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-linecap', 'round');
    container.appendChild(line);

    // Tick label
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', lx);
    text.setAttribute('y', ly);
    text.setAttribute('text-anchor', anchor);
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('font-size', '11');
    text.setAttribute('fill', 'rgba(255,255,255,0.35)');
    text.setAttribute('font-family', "'JetBrains Mono',monospace");
    text.setAttribute('font-weight', '500');
    text.textContent = label;
    container.appendChild(text);
  });
}

window.Gauge = { updateGauge, renderTicks, ARC_LEN };
