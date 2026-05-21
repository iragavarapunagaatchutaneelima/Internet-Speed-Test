/* global Gauge, SpeedTest */
/**
 * OrbitSpeed — UI Orchestrator (main.js) — fixed & optimised
 *
 * Bug fixes:
 *  - Renamed inner forEach variable from `btn` to `unitBtn` (was shadowing test button)
 *  - calcMax() now handles very high localhost speeds (up to 5000 Mbps)
 *  - aria-expanded kept in sync on history toggle
 *  - Streaming section cleared on reset
 *  - ISP card shown/hidden properly
 *  - Gauge ARC_LEN now read from Gauge module (single source of truth)
 *  - History rows always re-rendered when panel is open
 *  - Unit labels on stat cards stay in sync after unit switch
 */

'use strict';

/* ── State ─────────────────────────────────────────────────────────────── */
const state = {
  phase:          'IDLE',
  ping:           null,
  download:       null,
  upload:         null,
  currentSpeed:   0,
  unit:           'mbps',
  connectionInfo: null,
  gaugeMetric:    'download',
  controller:     null,
  running:        false,
};

/* ── DOM refs ───────────────────────────────────────────────────────────── */
const $  = (id) => document.getElementById(id);

const testBtn         = $('test-btn');
const testBtnLabel    = $('test-btn-label');
const errorNotice     = $('error-notice');
const ispStrip        = $('isp-strip');
const ispFlag         = $('isp-flag');
const ispName         = $('isp-name');
const ispDot          = $('isp-dot');
const ispLoc          = $('isp-loc');
const ispCard         = $('isp-card');
const ispCardName     = $('isp-card-name');
const ispCardDetail   = $('isp-card-detail');
const statPing        = $('stat-ping');
const pingSubLabel    = $('ping-sublabel');
const pingLoader      = $('ping-loader');
const statDl          = $('stat-dl');
const dlLoader        = $('dl-loader');
const unitDlLabel     = $('unit-dl-label');
const statUl          = $('stat-ul');
const ulLoader        = $('ul-loader');
const unitUlLabel     = $('unit-ul-label');
const ulSubLabel      = $('ul-sublabel');
const dlSubLabel      = $('dl-sublabel');
const qualityWrap     = $('quality-wrap');
const streamingSection= $('streaming-section');
const historyPanel    = $('history-panel');
const historyToggle   = $('history-toggle');
const historyCount    = $('history-count');
const historyChevron  = $('history-chevron');
const historyBody     = $('history-body');
const historyClear    = $('history-clear');
const historyTable    = $('history-table');
const cardDl          = $('card-dl');
const cardUl          = $('card-ul');

/* ── Constants ──────────────────────────────────────────────────────────── */
const UNIT_LABELS = { mbps: 'Mbps', mbs: 'MB/s', kbs: 'KB/s' };

/* ── Helpers ────────────────────────────────────────────────────────────── */
function fmtSpeed(mbps, unit) {
  const u = unit || state.unit;
  if (mbps == null || mbps < 0) return '0.00';
  if (u === 'mbs') return (mbps / 8).toFixed(2);
  if (u === 'kbs') return Math.round((mbps * 1000) / 8).toString();
  return mbps.toFixed(2);
}

function getPingColor(ms) {
  if (ms < 20)  return '#10b981';
  if (ms < 50)  return '#38bdf8';
  if (ms < 100) return '#f59e0b';
  return '#ef4444';
}

function getPingLabel(ms) {
  if (ms < 20)  return 'Excellent';
  if (ms < 50)  return 'Good';
  if (ms < 100) return 'Fair';
  return 'Poor';
}

/** Download speed quality label */
function getDlLabel(mbps) {
  if (mbps >= 500) return 'Blazing Fast';
  if (mbps >= 100) return 'Ultra Fast';
  if (mbps >= 50)  return 'Very Fast';
  if (mbps >= 25)  return 'Fast';
  if (mbps >= 10)  return 'Good';
  if (mbps >= 5)   return 'Average';
  if (mbps >= 1)   return 'Slow';
  return 'Very Slow';
}

/** Upload speed quality label */
function getUlLabel(mbps) {
  if (mbps >= 200) return 'Blazing Fast';
  if (mbps >= 50)  return 'Ultra Fast';
  if (mbps >= 20)  return 'Very Fast';
  if (mbps >= 10)  return 'Fast';
  if (mbps >= 5)   return 'Good';
  if (mbps >= 2)   return 'Average';
  if (mbps >= 0.5) return 'Slow';
  return 'Very Slow';
}

function fmtTimestamp(ts) {
  return new Date(ts * 1000).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// Handles very high loopback speeds gracefully
function calcMax(dl, ul, cur) {
  const top = Math.max(dl || 0, ul || 0, cur || 0);
  if (top > 3000) return 5000;
  if (top > 1500) return 3000;
  if (top > 800)  return 2000;
  if (top > 400)  return 1000;
  if (top > 200)  return 500;
  if (top > 80)   return 200;
  return 100;
}

/* ── Gauge refresh ──────────────────────────────────────────────────────── */
function refreshGauge() {
  const { phase, currentSpeed, download, upload, unit, gaugeMetric } = state;
  const unitLabel = UNIT_LABELS[unit] || 'Mbps';
  const maxMbps   = calcMax(download, upload, currentSpeed);

  const speedMbps = (phase === 'DONE')
    ? (gaugeMetric === 'upload' ? (upload || 0) : (download || 0))
    : (currentSpeed || 0);

  Gauge.updateGauge(speedMbps, maxMbps, phase, fmtSpeed(speedMbps, unit), unitLabel);
  Gauge.renderTicks(maxMbps, unitLabel);
}

/* ── Stat card updates ──────────────────────────────────────────────────── */
function updateStats() {
  const { ping, download, upload, phase } = state;
  const ul = UNIT_LABELS[state.unit] || 'Mbps';

  if (ping !== null) {
    statPing.textContent     = ping;
    statPing.style.color     = getPingColor(ping);
    pingSubLabel.textContent = getPingLabel(ping);
    pingSubLabel.style.color = getPingColor(ping);
  }
  if (download !== null) {
    statDl.textContent       = fmtSpeed(download);
    unitDlLabel.textContent  = ul;
    if (dlSubLabel) {
      dlSubLabel.textContent = getDlLabel(download);
      // colour to match quality
      dlSubLabel.style.color = download >= 25 ? 'var(--green)'
                             : download >= 10 ? 'var(--blue)'
                             : download >= 5  ? 'var(--amber)'
                             : 'var(--red)';
    }
  }
  if (upload !== null) {
    statUl.textContent       = fmtSpeed(upload);
    unitUlLabel.textContent  = ul;
    if (ulSubLabel) {
      ulSubLabel.textContent = getUlLabel(upload);
      ulSubLabel.style.color = upload >= 10 ? 'var(--green)'
                             : upload >= 5  ? 'var(--blue)'
                             : upload >= 2  ? 'var(--amber)'
                             : 'var(--red)';
    }
  }

  // Loaders
  pingLoader.style.display = (phase === 'PING')     ? '' : 'none';
  dlLoader.style.display   = (['CONNECTING','PING'].includes(phase)) ? '' : 'none';
  ulLoader.style.display   = (['CONNECTING','PING','DOWNLOAD'].includes(phase)) ? '' : 'none';

  // Show "Testing..." in sublabels during active phases
  if (['CONNECTING','PING'].includes(phase)) {
    if (pingSubLabel) { pingSubLabel.textContent = 'Measuring…'; pingSubLabel.style.color = 'var(--text-muted)'; }
  }
  if (phase === 'DOWNLOAD' || phase === 'CONNECTING' || phase === 'PING') {
    if (dlSubLabel && download === null) { dlSubLabel.textContent = 'Measuring…'; dlSubLabel.style.color = 'var(--text-muted)'; }
  }
  if (['CONNECTING','PING','DOWNLOAD'].includes(phase)) {
    if (ulSubLabel && upload === null) { ulSubLabel.textContent = 'Waiting…'; ulSubLabel.style.color = 'var(--text-muted)'; }
  }

  // Active card highlight
  cardDl?.classList.toggle('stat-card--active', phase === 'DONE' && state.gaugeMetric === 'download');
  cardUl?.classList.toggle('stat-card--active', phase === 'DONE' && state.gaugeMetric === 'upload');
}

/* ── Button state ───────────────────────────────────────────────────────── */
function updateButton() {
  const { phase } = state;
  testBtn.className = 'test-btn';
  if (['CONNECTING','PING','DOWNLOAD','UPLOAD'].includes(phase)) {
    testBtn.classList.add('test-btn--stop');
    testBtnLabel.textContent = 'Stop';
  } else if (phase === 'DONE' || phase === 'ERROR') {
    testBtn.classList.add('test-btn--reset');
    testBtnLabel.textContent = 'Retest';
  } else {
    testBtn.classList.add('test-btn--start');
    testBtnLabel.textContent = 'Start Test';
  }
}

/* ── ISP strip ──────────────────────────────────────────────────────────── */
function renderIsp(info) {
  if (!info) return;
  state.connectionInfo = info;

  ispStrip.style.display = '';
  ispName.textContent    = info.isp || 'Unknown ISP';

  if (info.flag) {
    ispFlag.src           = info.flag;
    ispFlag.alt           = info.country || '';
    ispFlag.style.display = '';
  } else {
    ispFlag.style.display = 'none';
  }

  if (info.city) {
    ispDot.style.display  = '';
    ispLoc.style.display  = '';
    ispLoc.textContent    = `${info.city}, ${info.country}`;
  } else {
    ispDot.style.display  = 'none';
    ispLoc.style.display  = 'none';
  }
}

/* ── Quality card ───────────────────────────────────────────────────────── */
async function renderQuality(dl, ul, ping) {
  const result = await SpeedTest.fetchQuality(dl, ul, ping);
  if (!result || !qualityWrap) return;

  qualityWrap.style.display = '';
  const ring  = qualityWrap.querySelector('.quality-score__ring');
  const grade = qualityWrap.querySelector('.quality-score__grade');
  const lbl   = qualityWrap.querySelector('.quality-score__label');

  if (ring)  ring.style.setProperty('--ring-color', result.color);
  if (grade) { grade.textContent = result.grade; grade.style.color = result.color; }
  if (lbl)   { lbl.textContent   = result.label; lbl.style.color   = result.color; }

  // Show ISP card below stats
  if (ispCard && state.connectionInfo) {
    ispCard.style.display  = '';
    if (ispCardName)   ispCardName.textContent   = state.connectionInfo.isp || '';
    const parts = [
      state.connectionInfo.ip   ? `IP: ${state.connectionInfo.ip}` : '',
      state.connectionInfo.city ? `${state.connectionInfo.city}, ${state.connectionInfo.country}` : '',
    ].filter(Boolean);
    if (ispCardDetail) ispCardDetail.textContent = parts.join('  ·  ');
  }
}

/* ── Streaming grid ─────────────────────────────────────────────────────── */
async function renderStreaming(dl) {
  if (!streamingSection) return;
  const platforms = await SpeedTest.fetchStreaming(dl);
  if (!platforms.length) return;

  streamingSection.style.display = '';
  const cards = streamingSection.querySelector('.streaming-cards');
  if (!cards) return;
  cards.innerHTML = '';

  platforms.forEach(p => {
    const card = document.createElement('div');
    card.className = `stream-card ${p.supported ? 'stream-card--ok' : 'stream-card--no'}`;
    card.setAttribute('aria-label', `${p.name}: ${p.best}`);
    card.innerHTML = `
      <div class="stream-card__emoji" aria-hidden="true">${p.icon}</div>
      <div class="stream-card__name">${p.name}</div>
      <div class="stream-card__quality ${p.supported ? 'stream-card__quality--ok' : 'stream-card__quality--no'}">${p.best}</div>
      ${p.supported ? '<span class="stream-card__badge" aria-hidden="true">✓</span>' : ''}
    `;
    cards.appendChild(card);
  });
}

/* ── History ────────────────────────────────────────────────────────────── */
let historyOpen = false;

async function refreshHistory() {
  const rows = await SpeedTest.loadHistory();
  if (!historyPanel) return;

  if (!rows.length) {
    historyPanel.style.display = 'none';
    return;
  }

  historyPanel.style.display = '';
  historyCount.textContent   = rows.length;

  if (!historyOpen) return;

  // Clear all rows except header
  const existingRows = historyTable.querySelectorAll('.history-row');
  existingRows.forEach(r => r.remove());

  const ul = UNIT_LABELS[state.unit] || 'Mbps';
  rows.forEach(r => {
    const row = document.createElement('div');
    row.className = 'history-row';
    row.setAttribute('role', 'row');
    row.innerHTML = `
      <span class="h-time">${fmtTimestamp(r.timestamp)}</span>
      <span class="h-dl">${fmtSpeed(r.download)} ${ul}</span>
      <span class="h-ul">${fmtSpeed(r.upload)} ${ul}</span>
      <span class="h-ping">${r.ping ?? '--'} ms</span>
      <span class="h-isp">${r.isp || '—'}</span>
    `;
    historyTable.appendChild(row);
  });
}

/* ── Unit toggle ────────────────────────────────────────────────────────── */
document.querySelectorAll('.unit-btn').forEach(unitBtn => {
  unitBtn.addEventListener('click', () => {
    state.unit = unitBtn.dataset.unit;
    document.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('unit-btn--active'));
    unitBtn.classList.add('unit-btn--active');
    // Refresh all speed displays
    refreshGauge();
    updateStats();
    if (historyOpen) refreshHistory();
  });
});

/* ── Card clicks (gauge metric switch) ──────────────────────────────────── */
cardDl?.addEventListener('click', () => {
  if (state.phase !== 'DONE') return;
  state.gaugeMetric = 'download';
  refreshGauge();
  updateStats();
});
cardUl?.addEventListener('click', () => {
  if (state.phase !== 'DONE') return;
  state.gaugeMetric = 'upload';
  refreshGauge();
  updateStats();
});

/* ── History toggle / clear ─────────────────────────────────────────────── */
historyToggle?.addEventListener('click', () => {
  historyOpen = !historyOpen;
  historyBody.style.display = historyOpen ? '' : 'none';
  historyChevron.classList.toggle('history-chevron--open', historyOpen);
  historyToggle.setAttribute('aria-expanded', historyOpen);
  if (historyOpen) refreshHistory();
});

historyClear?.addEventListener('click', async () => {
  await SpeedTest.clearHistory();
  historyOpen = false;
  historyBody.style.display = 'none';
  historyChevron.classList.remove('history-chevron--open');
  historyToggle?.setAttribute('aria-expanded', 'false');
  await refreshHistory();
});

/* ── Reset helper ───────────────────────────────────────────────────────── */
function resetUI() {
  state.ping = null; state.download = null; state.upload = null;
  state.currentSpeed = 0; state.phase = 'IDLE'; state.gaugeMetric = 'download';

  statPing.textContent  = '—'; statPing.style.color = '';
  statDl.textContent    = '—';
  statUl.textContent    = '—';
  pingSubLabel.textContent = '—'; pingSubLabel.style.color = '';
  if (dlSubLabel) { dlSubLabel.textContent = '—'; dlSubLabel.style.color = ''; }
  if (ulSubLabel) { ulSubLabel.textContent = '—'; ulSubLabel.style.color = ''; }
  errorNotice.style.display = 'none';

  if (qualityWrap)      qualityWrap.style.display      = 'none';
  if (streamingSection) streamingSection.style.display = 'none';
  if (ispCard)          ispCard.style.display          = 'none';

  updateButton();
  refreshGauge();
  updateStats();
}

/* ── Main test button ───────────────────────────────────────────────────── */
testBtn.addEventListener('click', async () => {
  const { phase, running } = state;

  // STOP mid-test
  if (['CONNECTING','PING','DOWNLOAD','UPLOAD'].includes(phase)) {
    state.controller?.abort();
    state.running = false;
    state.phase   = 'IDLE';
    state.currentSpeed = 0;
    updateButton(); refreshGauge(); updateStats();
    return;
  }

  // RESET / retest after completion or error
  if (phase === 'DONE' || phase === 'ERROR') {
    resetUI();
    return;
  }

  // Guard double-start
  if (running) return;

  state.running    = true;
  state.controller = new AbortController();
  const { signal } = state.controller;
  errorNotice.style.display = 'none';
  state.gaugeMetric = 'download';

  try {
    // CONNECTING — fetch ISP info
    state.phase = 'CONNECTING';
    updateButton(); refreshGauge();
    const info = await SpeedTest.fetchInfo(signal);
    if (signal.aborted) return;
    renderIsp(info);

    // PING
    state.phase = 'PING';
    updateButton(); refreshGauge(); updateStats();
    state.ping = await SpeedTest.measurePing(signal);
    if (signal.aborted) return;
    updateStats();

    // DOWNLOAD
    state.phase = 'DOWNLOAD';
    updateButton(); refreshGauge(); updateStats();
    state.download = await SpeedTest.measureDownload((live) => {
      if (!signal.aborted) {
        state.currentSpeed = live;
        state.download     = live;
        refreshGauge();
        updateStats();
      }
    }, signal);
    if (signal.aborted) return;
    state.currentSpeed = 0;
    updateStats();

    // UPLOAD
    state.phase       = 'UPLOAD';
    state.gaugeMetric = 'upload';
    updateButton(); refreshGauge(); updateStats();
    state.upload = await SpeedTest.measureUpload((live) => {
      if (!signal.aborted) {
        state.currentSpeed = live;
        state.upload       = live;
        refreshGauge();
        updateStats();
      }
    }, signal);
    if (signal.aborted) return;
    state.currentSpeed = state.upload;

    // DONE
    state.phase       = 'DONE';
    state.gaugeMetric = 'download';
    updateButton(); refreshGauge(); updateStats();

    // Save to SQLite via Python
    await SpeedTest.saveResult({
      ping:     state.ping,
      download: state.download,
      upload:   state.upload,
      isp:      state.connectionInfo?.isp     || '',
      city:     state.connectionInfo?.city    || '',
      country:  state.connectionInfo?.country || '',
      ip:       state.connectionInfo?.ip      || '',
    });

    // Python-calculated quality & streaming
    await renderQuality(state.download, state.upload, state.ping);
    await renderStreaming(state.download);

    // Reload history (saved to SQLite)
    await refreshHistory();

  } catch (err) {
    if (!signal.aborted) {
      state.phase = 'ERROR';
      errorNotice.textContent   = `⚠ ${err.message || 'An unexpected error occurred'}`;
      errorNotice.style.display = '';
      updateButton();
      refreshGauge();
    }
  } finally {
    state.running = false;
  }
});

/* ── Init ───────────────────────────────────────────────────────────────── */
(async () => {
  Gauge.renderTicks(100, 'Mbps');
  Gauge.updateGauge(0, 100, 'IDLE', '0.00', 'Mbps');
  // Pre-load ISP info in background
  SpeedTest.fetchInfo().then(info => renderIsp(info)).catch(() => {});
  // Load any saved history from SQLite
  await refreshHistory();
})();
