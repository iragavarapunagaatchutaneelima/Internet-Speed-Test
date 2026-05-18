/**
 * Multi-stream, production-grade speed test utilities.
 * Uses Cloudflare speed endpoints with crypto-random upload data.
 */

const CF_BASE = 'https://speed.cloudflare.com';

/**
 * Measure latency (ping) using a HEAD request to avoid body download.
 * Takes 3 samples and returns the median.
 * @returns {Promise<number>} Ping in milliseconds
 */
export const measurePing = async (signal) => {
  const samples = [];
  const attempts = 3;

  for (let i = 0; i < attempts; i++) {
    const start = performance.now();
    try {
      await fetch(`${CF_BASE}/__down?bytes=0`, {
        cache: 'no-store',
        method: 'HEAD',
        signal,
      });
    } catch {
      // Fallback to GET if HEAD fails
      try {
        await fetch(`${CF_BASE}/__down?bytes=0`, { cache: 'no-store', signal });
      } catch {
        return 0;
      }
    }
    samples.push(Math.round(performance.now() - start));
    // Small delay between samples
    await new Promise(r => setTimeout(r, 100));
  }

  // Return median
  samples.sort((a, b) => a - b);
  return samples[Math.floor(samples.length / 2)];
};

/**
 * Measure download speed using parallel streams for accuracy.
 * @param {(mbps: number) => void} onProgress - Live speed callback
 * @returns {Promise<number>} Final download speed in Mbps
 */
export const measureDownload = async (onProgress, signal) => {
  // Stream sizes: start small, then big
  const STREAMS = [
    { bytes: 1_000_000,  streams: 1 },   // 1 MB warm-up
    { bytes: 10_000_000, streams: 3 },   // 3×10 MB main measurement
  ];

  let finalSpeedMbps = 0;
  let lastProgressTime = performance.now();
  let cumulativeBytes = 0;
  const overallStart = performance.now();

  for (const { bytes, streams } of STREAMS) {
    const runStream = async () => {
      const url = `${CF_BASE}/__down?bytes=${bytes}`;
      const start = performance.now();

      try {
        const response = await fetch(url, { cache: 'no-store', signal });
        if (!response.body) return 0;

        const reader = response.body.getReader();
        let received = 0;

        while (true) {
          if (signal?.aborted) return 0;
          const { done, value } = await reader.read();
          if (done) break;

          received += value.length;
          cumulativeBytes += value.length;

          const now = performance.now();
          if (now - lastProgressTime > 100) {
            lastProgressTime = now;
            const elapsed = (now - overallStart) / 1000;
            if (elapsed > 0.2) {
              const liveMbps = (cumulativeBytes * 8) / (elapsed * 1_000_000);
              onProgress(liveMbps);
            }
          }
        }

        const durationSec = (performance.now() - start) / 1000;
        return (received * 8) / (durationSec * 1_000_000);
      } catch (err) {
        if (err?.name !== 'AbortError') {
          console.error('Download stream error:', err);
        }
        return 0;
      }
    };

    const results = await Promise.all(
      Array.from({ length: streams }, () => runStream())
    );

    const validResults = results.filter(s => s > 0);
    if (validResults.length > 0) {
      finalSpeedMbps = validResults.reduce((a, b) => a + b, 0) / validResults.length;
    }
  }

  return parseFloat(finalSpeedMbps.toFixed(2));
};

/**
 * Generate cryptographically random bytes efficiently.
 * Uses crypto.getRandomValues() on chunks to avoid blocking the main thread.
 * @param {number} totalBytes
 * @returns {Uint8Array}
 */
const generateRandomData = (totalBytes) => {
  const data = new Uint8Array(totalBytes);
  const chunkSize = 65536; // Max allowed by getRandomValues
  for (let offset = 0; offset < totalBytes; offset += chunkSize) {
    const chunk = data.subarray(offset, Math.min(offset + chunkSize, totalBytes));
    crypto.getRandomValues(chunk);
  }
  return data;
};

/**
 * Measure upload speed using XHR for progress events.
 * @param {(mbps: number) => void} onProgress - Live speed callback
 * @returns {Promise<number>} Final upload speed in Mbps
 */
export const measureUpload = async (onProgress, signal) => {
  const bytesToUpload = 5_000_000; // 5 MB
  const data = generateRandomData(bytesToUpload);

  // Try Cloudflare first, fall back to httpbin (CORS-safe)
  const endpoints = [
    `${CF_BASE}/__up`,
    'https://httpbin.org/post',
  ];

  for (const url of endpoints) {
    try {
      const result = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const start = performance.now();

        const abortListener = () => {
          try { xhr.abort(); } catch { /* ignore */ }
        };
        if (signal) signal.addEventListener('abort', abortListener, { once: true });

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const elapsed = (performance.now() - start) / 1000;
            if (elapsed > 0.2) {
              const liveMbps = (event.loaded * 8) / (elapsed * 1_000_000);
              onProgress(liveMbps);
            }
          }
        };

        xhr.onload = () => {
          if (signal) signal.removeEventListener('abort', abortListener);
          const durationSec = (performance.now() - start) / 1000;
          resolve(parseFloat(((bytesToUpload * 8) / (durationSec * 1_000_000)).toFixed(2)));
        };

        xhr.onerror = () => {
          if (signal) signal.removeEventListener('abort', abortListener);
          reject(new Error('Upload XHR error'));
        };
        xhr.ontimeout = () => {
          if (signal) signal.removeEventListener('abort', abortListener);
          reject(new Error('Upload timed out'));
        };
        xhr.onabort = () => {
          if (signal) signal.removeEventListener('abort', abortListener);
          reject(Object.assign(new Error('Upload aborted'), { name: 'AbortError' }));
        };

        xhr.timeout = 20000;
        xhr.open('POST', url, true);
        xhr.send(data);
      });

      return result;
    } catch (err) {
      if (err?.name !== 'AbortError') {
        console.warn(`Upload via ${url} failed:`, err.message);
      }
    }
  }

  return 0;
};

/**
 * Fetch ISP and location info via ipapi.co.
 * @returns {Promise<{ isp: string, city: string, country: string, ip: string }>}
 */
export const fetchConnectionInfo = async (signal) => {
  const CACHE_KEY = 'orbitspeed_conninfo_v1';
  const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

  try {
    const cachedRaw = localStorage.getItem(CACHE_KEY);
    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw);
      if (cached?.ts && cached?.data && (Date.now() - cached.ts) < CACHE_TTL_MS) {
        return cached.data;
      }
    }
  } catch {
    // ignore cache read issues
  }

  try {
    const res = await fetch('https://ipapi.co/json/', { cache: 'no-store', signal });
    if (!res.ok) throw new Error('Failed to fetch IP info');
    const data = await res.json();
    const normalized = {
      isp:     data.org || data.asn || 'Unknown ISP',
      city:    data.city || '',
      country: data.country_name || '',
      ip:      data.ip || '',
      flag:    data.country_code ? `https://flagcdn.com/24x18/${data.country_code.toLowerCase()}.png` : null,
    };

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: normalized }));
    } catch {
      // ignore cache write issues
    }

    return normalized;
  } catch (err) {
    console.warn('IP info fetch failed:', err);
    return { isp: 'Unknown ISP', city: '', country: '', ip: '', flag: null };
  }
};
