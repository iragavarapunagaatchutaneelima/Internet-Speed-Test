/**
 * OrbitSpeed — Speed Test API Client
 *
 * All network measurements are performed against the Python Flask backend.
 * This file contains ONLY API calls — zero UI logic.
 *
 * Endpoints called:
 *   GET  /api/test/ping           — latency measurement
 *   GET  /api/test/download       — Python streams random bytes
 *   POST /api/test/upload         — Python receives bytes
 *   GET  /api/info                — ISP / geo (fetched server-side)
 *   GET  /api/quality             — grade computed by Python
 *   GET  /api/streaming           — streaming support computed by Python
 *   GET  /api/history             — SQLite history
 *   POST /api/history             — save result to SQLite
 *   DELETE /api/history           — clear SQLite history
 */

'use strict';

/* ── Ping ─────────────────────────────────────────────────────────────────
   Calls /api/test/ping three times and returns the median RTT in ms.
   The Python endpoint responds in microseconds (minimal overhead).
──────────────────────────────────────────────────────────────────────────── */
async function measurePing(signal) {
  const samples = [];
  for (let i = 0; i < 3; i++) {
    const t0 = performance.now();
    try {
      await fetch('/api/test/ping', { cache: 'no-store', signal });
    } catch {
      return 0;
    }
    samples.push(Math.round(performance.now() - t0));
    await new Promise(r => setTimeout(r, 80));
  }
  samples.sort((a, b) => a - b);
  return samples[Math.floor(samples.length / 2)];
}

/* ── Download ─────────────────────────────────────────────────────────────
   Fetches a large block of random bytes from the Python server.
   Progress is tracked via the ReadableStream API for live Mbps updates.
──────────────────────────────────────────────────────────────────────────── */
async function measureDownload(onProgress, signal) {
  // Two passes: 1 MB warm-up, then 10 MB main measurement
  const PASSES = [
    { bytes: 1_000_000,  label: 'warm-up' },
    { bytes: 10_000_000, label: 'main'    },
  ];

  let finalMbps = 0;
  let cumulativeBytes = 0;
  let lastReport = performance.now();
  const overallStart = performance.now();

  for (const { bytes } of PASSES) {
    const url = `/api/test/download?bytes=${bytes}`;
    try {
      const resp = await fetch(url, { cache: 'no-store', signal });
      if (!resp.body) continue;
      const reader = resp.body.getReader();
      let passBytes = 0;
      const passStart = performance.now();

      while (true) {
        if (signal?.aborted) return 0;
        const { done, value } = await reader.read();
        if (done) break;
        passBytes      += value.length;
        cumulativeBytes += value.length;

        const now = performance.now();
        if (now - lastReport > 100) {
          lastReport = now;
          const elapsed = (now - overallStart) / 1000;
          if (elapsed > 0.3) {
            const liveMbps = (cumulativeBytes * 8) / (elapsed * 1_000_000);
            onProgress(liveMbps);
          }
        }
      }

      const sec = (performance.now() - passStart) / 1000;
      if (sec > 0) finalMbps = (passBytes * 8) / (sec * 1_000_000);
    } catch (err) {
      if (err?.name !== 'AbortError') console.error('Download error:', err);
      return 0;
    }
  }
  return parseFloat(finalMbps.toFixed(2));
}

/* ── Upload ───────────────────────────────────────────────────────────────
   Generates random bytes in JS, POSTs them to /api/test/upload.
   Uses XHR (not fetch) to get upload-progress events for live Mbps.
──────────────────────────────────────────────────────────────────────────── */
function measureUpload(onProgress, signal) {
  return new Promise((resolve) => {
    const UPLOAD_BYTES = 5_000_000; // 5 MB
    // Generate random payload using crypto API
    const data = new Uint8Array(UPLOAD_BYTES);
    const chunkSize = 65_536;
    for (let off = 0; off < UPLOAD_BYTES; off += chunkSize) {
      crypto.getRandomValues(data.subarray(off, Math.min(off + chunkSize, UPLOAD_BYTES)));
    }

    const xhr   = new XMLHttpRequest();
    const start = performance.now();

    // Abort support
    const abortHandler = () => { try { xhr.abort(); } catch { /* ignore */ } };
    if (signal) signal.addEventListener('abort', abortHandler, { once: true });

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const elapsed = (performance.now() - start) / 1000;
        if (elapsed > 0.2) {
          onProgress((e.loaded * 8) / (elapsed * 1_000_000));
        }
      }
    };

    const cleanup = () => {
      if (signal) signal.removeEventListener('abort', abortHandler);
    };

    xhr.onload = () => {
      cleanup();
      const sec = (performance.now() - start) / 1000;
      resolve(parseFloat(((UPLOAD_BYTES * 8) / (sec * 1_000_000)).toFixed(2)));
    };
    xhr.onerror   = () => { cleanup(); resolve(0); };
    xhr.ontimeout = () => { cleanup(); resolve(0); };
    xhr.onabort   = () => { cleanup(); resolve(0); };

    xhr.timeout = 25_000;
    xhr.open('POST', '/api/test/upload', true);
    xhr.send(data);
  });
}

/* ── ISP / Geo Info ───────────────────────────────────────────────────────
   Python fetches this server-side (with caching) and returns clean JSON.
──────────────────────────────────────────────────────────────────────────── */
async function fetchInfo(signal) {
  try {
    const resp = await fetch('/api/info', { cache: 'no-store', signal });
    if (!resp.ok) throw new Error('Info fetch failed');
    return await resp.json();
  } catch {
    return { isp: 'Unknown ISP', city: '', country: '', ip: '', flag: null };
  }
}

/* ── Quality score ────────────────────────────────────────────────────────
   Python calculates this; JS just fetches and renders it.
──────────────────────────────────────────────────────────────────────────── */
async function fetchQuality(download, upload, ping) {
  try {
    const resp = await fetch(
      `/api/quality?download=${download}&upload=${upload}&ping=${ping}`
    );
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

/* ── Streaming support ────────────────────────────────────────────────────
   Python evaluates platform tiers; JS renders the cards.
──────────────────────────────────────────────────────────────────────────── */
async function fetchStreaming(download) {
  try {
    const resp = await fetch(`/api/streaming?download=${download}`);
    if (!resp.ok) return [];
    return await resp.json();
  } catch {
    return [];
  }
}

/* ── History CRUD ─────────────────────────────────────────────────────────
   All history lives in Python's SQLite DB — not localStorage.
──────────────────────────────────────────────────────────────────────────── */
async function loadHistory() {
  try {
    const resp = await fetch('/api/history');
    if (!resp.ok) return [];
    return await resp.json();
  } catch {
    return [];
  }
}

async function saveResult(result) {
  try {
    await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    });
  } catch (err) {
    console.warn('Failed to save result:', err);
  }
}

async function clearHistory() {
  try {
    await fetch('/api/history', { method: 'DELETE' });
  } catch (err) {
    console.warn('Failed to clear history:', err);
  }
}

// Expose all functions globally for main.js
window.SpeedTest = {
  measurePing,
  measureDownload,
  measureUpload,
  fetchInfo,
  fetchQuality,
  fetchStreaming,
  loadHistory,
  saveResult,
  clearHistory,
};
