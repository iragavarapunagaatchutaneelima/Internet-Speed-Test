# OrbitSpeed — Code Walkthrough (Beginner-Friendly)

This document explains every important source file in simple English.

---

## 0. What Is This Project?

OrbitSpeed is a **web app** that measures your internet speed from your browser.

It has **two modes**:

| Mode | Stack | Run Command |
|---|---|---|
| **SPA mode** | React + Vite (frontend only) | `npm run dev` |
| **Flask mode** | Python Flask + SQLite (full-stack) | `python app.py` |

It measures three things:
- **Ping** — how long a tiny request takes to return (milliseconds)
- **Download speed** — how fast bytes arrive at your browser (Mbps)
- **Upload speed** — how fast your browser sends bytes to a server (Mbps)

It talks to public endpoints:
- `https://speed.cloudflare.com` — download, upload, ping
- `https://ipapi.co/json/` — ISP + city + country + IP
- `https://httpbin.org/post` — upload fallback (SPA mode only)

---

## 1. Folder Map

```
Internet-Speed-Test/
├── src/                  ← All React frontend code
│   ├── components/       ← UI building blocks (gauge, cards, history…)
│   ├── hooks/            ← Logic helpers (useSpeedTest, useHistory)
│   ├── utils/            ← Speed engine + formatters + quality definitions
│   ├── styles/           ← CSS design tokens (colors, spacing, etc.)
│   ├── App.jsx           ← Main layout: wires hooks → components
│   ├── index.css         ← All component styles
│   └── main.jsx          ← React entry point
├── app.py                ← Flask web server + all REST API routes
├── database.py           ← SQLite helpers (save/get/clear history)
├── speed_utils.py        ← Python: quality score, streaming support, IP lookup
├── templates/index.html  ← Jinja2 page served by Flask
├── public/manifest.json  ← PWA "install as app" config
├── index.html            ← Vite HTML entry (SPA mode)
├── vite.config.js        ← Vite build config
├── vercel.json           ← Vercel: SPA rewrites + cache + security headers
└── Dockerfile            ← Multi-stage: Node build → Nginx serve
```

---

## 2. The Test Phases (State Machine)

The app goes through phases in order:

```
IDLE → CONNECTING → PING → DOWNLOAD → UPLOAD → DONE
                                              ↘ ERROR (if something fails)
```

The user can click **Stop** at any time → returns to `IDLE`.

---

## 3. File: `index.html` (HTML Entry — SPA Mode)

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OrbitSpeed — Internet Speed Test</title>
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; ..." />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

Line by line:
- `<!doctype html>` — tells the browser this is modern HTML5.
- `<meta charset="UTF-8">` — character encoding.
- `<meta name="viewport">` — makes layout correct on mobile.
- `<title>` — browser tab text.
- `Content-Security-Policy` — security rule: restricts which domains scripts, fonts, and API calls can come from.
- `<div id="root">` — the empty box where React draws the whole app.
- `<script type="module" src="/src/main.jsx">` — loads the React app.

---

## 4. File: `src/main.jsx` (React Entry Point)

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

Line by line:
- `StrictMode` — React helper that warns about bad patterns in development only.
- `createRoot` — modern React 18+ way to start rendering.
- `import './index.css'` — loads all styles.
- `document.getElementById('root')` — finds the `<div id="root">` in `index.html`.
- `.render(<App />)` — draws the whole application inside that div.

---

## 5. File: `src/App.jsx` (Main Layout)

This file:
1. Calls `useSpeedTest()` to get test state and control functions.
2. Calls `useHistory()` to get saved results.
3. Renders all components in the right layout.

### Key code snippets

```js
const {
  phase, ping, download, upload,
  currentSpeed, connectionInfo, error,
  isTesting, startTest, stopTest, reset
} = useSpeedTest();
```
> Picks out state values and functions from the speed test hook.

```js
const [unit, setUnit] = useState('mbps');
```
> Tracks which unit the user selected (Mbps, MB/s, or KB/s).

```js
useEffect(() => {
  if (phase === 'DONE' && download !== null && upload !== null) {
    addResult({ ping, download, upload, isp: connectionInfo?.isp || '' });
  }
}, [phase, ping, download, upload, connectionInfo, addResult]);
```
> When the test finishes (phase = DONE), save the result to history.

```js
const maxMbps = useMemo(() => {
  const top = Math.max(download || 0, upload || 0, currentSpeed || 0);
  if (top > 400) return 1000;
  if (top > 200) return 500;
  if (top > 80)  return 200;
  return 100;
}, [download, upload, currentSpeed]);
```
> Picks a smart maximum for the gauge scale so the needle never goes off-screen.

---

## 6. File: `src/hooks/useSpeedTest.js` (The Brain)

This is the most important file. It controls all test phases.

### State variables

```js
const [phase, setPhase]               = useState('IDLE');
const [ping, setPing]                 = useState(null);
const [download, setDownload]         = useState(null);
const [upload, setUpload]             = useState(null);
const [currentSpeed, setCurrentSpeed] = useState(null);
const [connectionInfo, setConnectionInfo] = useState(null);
const [error, setError]               = useState(null);
```
> Each `useState` holds one piece of data. `null` means "not measured yet".

### Refs (values that don't cause re-renders)

```js
const abortRef      = useRef(false);   // "has the user clicked Stop?"
const testRunning   = useRef(false);   // "is a test already running?"
const controllerRef = useRef(null);    // AbortController for cancelling fetch
```

### `startTest()` — simplified flow

```js
// 1. Guard: don't start if already running
if (testRunning.current) return;
testRunning.current = true;
abortRef.current = false;

// 2. Create a fresh AbortController
controllerRef.current = new AbortController();
const { signal } = controllerRef.current;

// 3. Clear previous results
setPhase('CONNECTING'); setPing(null); setDownload(null); ...

// 4. Fetch ISP info
const [connInfo] = await Promise.all([fetchConnectionInfo(signal)]);
setConnectionInfo(connInfo);

// 5. Measure ping
setPhase('PING');
const pingResult = await measurePing(signal);
setPing(pingResult);

// 6. Measure download
setPhase('DOWNLOAD');
const dlResult = await measureDownload((live) => {
  setCurrentSpeed(live);
  setDownload(live);
}, signal);
setDownload(dlResult);

// 7. Measure upload
setPhase('UPLOAD');
const ulResult = await measureUpload((live) => setCurrentSpeed(live), signal);
setUpload(ulResult);
setPhase('DONE');
```

### `stopTest()`

```js
abortRef.current = true;
controllerRef.current?.abort();  // cancels all pending fetch/XHR
setPhase('IDLE');
```

---

## 7. File: `src/utils/speedtest.js` (Network Engine)

### `measurePing(signal)`

```
- Send HEAD request to Cloudflare ping endpoint
- Record time with performance.now() before and after
- Repeat 5 times
- Return the median value (ignores outliers)
```

**Why median?** A single slow sample (e.g. OS update running in background) can inflate an average by 50+ ms. Median stays stable.

### `measureDownload(onProgress, signal)`

```
Stage 1 — Warm-up:
  - Fetch 1 MB (1 stream) to fill TCP congestion window
  - Result discarded

Stage 2 — Main measurement:
  - Fetch 10 MB × 3 parallel streams simultaneously
  - Read each response with getReader() → count bytes as they arrive
  - Update progress at most every 100 ms (prevents UI jank)
  - Final Mbps = (total bytes × 8) / elapsed seconds / 1,000,000
```

**Why 3 streams?** Some networks cap single-connection speeds. Parallel streams better saturate fast connections.

### `measureUpload(onProgress, signal)`

```
- Generate 5 MB random payload with crypto.getRandomValues()
- Use XMLHttpRequest (XHR) — gives upload.onprogress events
- POST to Cloudflare /__up (or httpbin.org as fallback)
- If abort signal fires → call xhr.abort()
```

**Why XHR instead of fetch?** The browser's `fetch` API does not expose upload progress events. XHR does.

### `fetchConnectionInfo(signal)`

```
- Check localStorage cache (valid for 6 hours)
- If fresh: return cached data
- If stale: fetch https://ipapi.co/json/
- On error: return { isp: 'Unknown', city: '', country: '' }
- Never crash the test — ISP info is "nice to have"
```

---

## 8. File: `src/utils/formatters.js`

### `formatSpeed(speedMbps, unit)`

| Unit | Formula | Example (50 Mbps) |
|---|---|---|
| `mbps` | `speedMbps` | `50.00 Mbps` |
| `mbs` | `speedMbps / 8` | `6.25 MB/s` |
| `kbs` | `(speedMbps × 1000) / 8` | `6250 KB/s` |

### `calculateQualityScore(download, upload, ping)`

```
dl_score   = min(100, download / 100 × 100)   // 100 Mbps = full
ul_score   = min(100, upload / 50 × 100)       // 50 Mbps = full
ping_score = max(0, 100 - ping / 2)            // 200 ms = 0

composite  = dl_score × 0.40 + ul_score × 0.30 + ping_score × 0.30

Grade:  A+ ≥ 95 · A ≥ 85 · B ≥ 70 · C ≥ 55 · D ≥ 40 · F < 40
```

### `getPingColor(ping)`

| Ping | Colour | Label |
|---|---|---|
| < 20 ms | Green | Excellent |
| < 50 ms | Blue | Good |
| < 100 ms | Orange | Fair |
| ≥ 100 ms | Red | Poor |

---

## 9. File: `src/utils/quality.js`

Defines `STREAMING_PLATFORMS` — an array of objects:

```js
{
  id: 'netflix',
  name: 'Netflix',
  icon: '🎬',
  tiers: [
    { label: '4K Ultra HD', required: 25 },
    { label: '1080p HD',    required: 5  },
    { label: '720p SD',     required: 3  },
  ]
}
```

`getBestQuality(platform, downloadMbps)`:
- Finds the first tier where `downloadMbps >= required`.
- Returns that tier label (e.g., `"4K Ultra HD"`) or `"Not Supported"`.

---

## 10. File: `src/hooks/useHistory.js`

```js
// On startup: read existing history from localStorage
const [history, setHistory] = useState(() => {
  try {
    return JSON.parse(localStorage.getItem('orbitspeed-history')) || [];
  } catch { return []; }
});

// Whenever history changes: save it back
useEffect(() => {
  localStorage.setItem('orbitspeed-history', JSON.stringify(history));
}, [history]);
```

- `addResult(result)` — prepends the new result (newest first), trims to 50 entries.
- `clearHistory()` — resets to `[]`.
- `try/catch` prevents crashes in private browsing mode where `localStorage` may be blocked.

---

## 11. File: `src/components/GaugeChart.jsx` (SVG Speedometer)

The gauge is drawn with SVG math:

```
ratio       = clamp(speedMbps / maxMbps, 0, 1)
arcLength   = π × radius               (semicircle)
dashOffset  = arcLength × (1 - ratio)  (how much arc is "empty")
needleAngle = 180° × ratio − 90°       (needle from left to right)
```

- The gray track arc is always full.
- The colored arc uses `stroke-dashoffset` to reveal only the `ratio` portion.
- The needle is a `<line>` element rotated with CSS transform.
- `useMemo` caches the arc length and tick mark positions — only recalculates when radius or maxMbps changes.

---

## 12. File: `src/components/StatCard.jsx`

Shows one metric card. States it handles:

| State | What user sees |
|---|---|
| `loading=true` | Animated skeleton placeholder |
| `value` present | Number + unit label |
| `sublabel` present | Small colored quality text below (e.g., "Excellent") |

---

## 13. File: `src/components/TestButton.jsx`

Shows a different button based on the current phase:

| Phase | Button shown | Click action |
|---|---|---|
| `IDLE` | "Start Speed Test" | `startTest()` |
| `CONNECTING` | "Connecting…" (disabled) + Stop | `stopTest()` |
| `PING` | "Testing Ping…" (disabled) + Stop | `stopTest()` |
| `DOWNLOAD` | "Measuring Download…" + Stop | `stopTest()` |
| `UPLOAD` | "Measuring Upload…" + Stop | `stopTest()` |
| `DONE` | "Run Again" + Reset | `startTest()` / `reset()` |
| `ERROR` | "Retry Test" | `reset()` + `startTest()` |

---

## 14. File: `src/components/ErrorBoundary.jsx`

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div className="error-fallback">
        <h2>Something went wrong.</h2>
        <button onClick={() => window.location.reload()}>Reload App</button>
      </div>;
    }
    return this.props.children;
  }
}
```

- Wraps the entire app.
- If any child component throws a JavaScript error during render, this catches it.
- Shows a friendly "Reload App" button instead of a blank white screen.
- Must be a **class component** — React Error Boundaries only work with class lifecycle methods.

---

## 15. File: `app.py` (Flask Backend)

### App setup

```python
app = Flask(__name__)
init_db()   # creates speed_history.db and the table if they don't exist
```

### Download route — key logic

```python
@app.route("/api/test/download")
def api_download():
    total = int(request.args.get("bytes", 10_000_000))
    total = max(1, min(total, 100_000_000))  # clamp: 1 B – 100 MB

    def _generate():
        sent = 0
        while sent < total:
            size = min(65_536, total - sent)  # 64 KB chunks
            yield os.urandom(size)            # cryptographically random bytes
            sent += size

    return Response(stream_with_context(_generate()),
                    content_type="application/octet-stream")
```

- `os.urandom()` generates random bytes — incompressible, so ISPs can't cheat.
- `stream_with_context` keeps the Flask request context alive during streaming.
- `65_536` (64 KB) per chunk balances throughput vs. memory usage.

### Upload route

```python
@app.route("/api/test/upload", methods=["POST", "OPTIONS"])
def api_upload():
    if request.method == "OPTIONS":      # CORS preflight
        resp = Response("", status=204)
        resp.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        return resp
    data = request.get_data()
    return jsonify({"received": len(data), "ok": True})
```

- CORS `OPTIONS` preflight is handled explicitly.
- The raw bytes are read and counted, then discarded.

### IP info route

```python
@app.route("/api/info")
def api_info():
    client_ip = _get_client_ip()   # reads X-Forwarded-For header
    data = fetch_ip_info(client_ip)
    return _cors(jsonify(data))
```

- `_get_client_ip()` reads `X-Forwarded-For` for proxy/Vercel environments.
- `fetch_ip_info()` (in `speed_utils.py`) caches results per IP for 6 hours.

---

## 16. File: `database.py` (SQLite Layer)

Three functions:

| Function | What it does |
|---|---|
| `init_db()` | Creates `speed_history.db` and the `speed_history` table if they don't exist |
| `save_result(ping, download, upload, isp, city, country, ip)` | Inserts one row with the current UTC timestamp |
| `get_history(limit=50)` | Returns rows ordered newest-first as a list of dicts |
| `clear_history()` | `DELETE FROM speed_history` |

Table schema:

| Column | Type | Notes |
|---|---|---|
| `id` | `INTEGER PRIMARY KEY AUTOINCREMENT` | Auto row ID |
| `timestamp` | `TEXT` | ISO 8601 UTC |
| `ping` | `REAL` | ms |
| `download` | `REAL` | Mbps |
| `upload` | `REAL` | Mbps |
| `isp` | `TEXT` | ISP name |
| `city` | `TEXT` | Approx city |
| `country` | `TEXT` | Country name |
| `ip` | `TEXT` | Client public IP |

---

## 17. File: `speed_utils.py` (Python Logic)

### `calculate_quality(download, upload, ping)`

Converts raw numbers into a letter grade using weighted scoring.
See Section 8 of the Project Report for the full formula.

### `get_streaming_support(download_mbps)`

Returns a list of streaming platforms with the best supported quality tier for each, based on `download_mbps`.

### `fetch_ip_info(client_ip)`

- Checks an in-memory `dict` cache (key = IP, value = `(data, timestamp)`).
- If cached and < 6 hours old: returns cached data.
- Otherwise: `GET https://ipapi.co/json/?ip={client_ip}`, caches the result.
- On error: returns `{ "isp": "Unknown", "city": "", "country": "", "ip": client_ip }`.

---

## 18. Build and Tooling Files

### `package.json` — npm scripts

| Script | What it runs |
|---|---|
| `npm run dev` | `vite` — starts dev server with HMR at `localhost:5173` |
| `npm run build` | `vite build` — compiles to `dist/` |
| `npm run preview` | `vite preview` — serves `dist/` locally |
| `npm run lint` | `eslint .` — checks all `.js` / `.jsx` files |

### `vite.config.js`

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({ plugins: [react()] })
```

Tells Vite to use the React plugin (enables JSX transformation and React Fast Refresh HMR).

### `vercel.json`

- **Rewrites:** all URL paths → `index.html` so React Router works correctly.
- **Cache headers:** `max-age=31536000, immutable` on hashed JS/CSS assets.
- **Security headers:** `X-Frame-Options: DENY`, `HSTS`, `Permissions-Policy`.

### `Dockerfile` — Two-Stage Build

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

- Stage 1 compiles the React app.
- Stage 2 copies only the `dist/` output into a tiny Nginx image.
- Nginx serves the SPA with a fallback rule: any unknown path returns `index.html`.

### `.github/workflows/deploy.yml` — CI Pipeline

Steps:
1. Checkout code
2. Install Node dependencies (`npm ci`)
3. Run linter (`npm run lint`)
4. Run build (`npm run build`)
5. *(Optional, commented out)* Deploy to Vercel

### `public/manifest.json` — PWA Manifest

Lets the browser offer "Install as App":
- Sets app name, short name, theme color, and background color.
- Points to icons for the home screen.
- Sets `"display": "standalone"` so the installed app has no browser chrome.

---

## 19. CSS Architecture (`src/index.css` + `design-tokens.css`)

### Design tokens (CSS custom properties)

All visual values are defined once in `src/styles/design-tokens.css`:

```css
:root {
  --bg-canvas:      #08090f;   /* deep space dark background */
  --accent-cyan:    #00d4ff;   /* primary highlight color */
  --accent-violet:  #7c3aed;   /* secondary gradient color */
  --glass-bg:       rgba(255,255,255,.03);
  --glass-blur:     blur(20px);
  --space-1: 4px; --space-2: 8px; /* ... up to --space-8 */
  --text-sm: 0.875rem; /* ... up to --text-4xl */
}
```

**To retheme the entire app:** change only these token values. All components read from them.

### Responsive breakpoints in `index.css`

| Breakpoint | Target |
|---|---|
| `max-width: 480px` | Small phones (360 × 640) |
| `max-width: 768px` | Tablets and large phones |
| `min-width: 1400px` | Large desktops |
| `min-width: 1920px` | Ultra-wide / TV screens |

---

## 20. Where to Learn Next (Beginner Path)

If you are new to web development, study these topics in this order:

1. **HTML** — `index.html` structure and meta tags
2. **CSS** — `src/index.css` selectors, flexbox, grid, custom properties
3. **JavaScript** — `src/utils/speedtest.js` for `fetch`, `async/await`, `getReader()`
4. **React basics** — `src/main.jsx` and `src/App.jsx` for JSX and component structure
5. **React hooks** — `useState`, `useEffect`, `useMemo` in `src/App.jsx`
6. **Custom hooks** — `src/hooks/useSpeedTest.js` for state machines
7. **Python Flask** — `app.py` for routing, `Response`, `stream_with_context`
8. **SQLite** — `database.py` for `sqlite3`, `CREATE TABLE`, `INSERT`, `SELECT`

---

*OrbitSpeed v1.0.0 · May 2026*
