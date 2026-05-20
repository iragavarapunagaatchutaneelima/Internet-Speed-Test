# OrbitSpeed — Full Code Walkthrough (Very Simple English)

This document explains the project in **very simple English**, aimed at a beginner who knows only basic programming.

It is written as a **“walkthrough + line-by-line explanation”** of the important source files.

> Notes about strange characters:
> Some files currently contain weird symbols like `â€”`, `âœ“`, `â€¦`.
> That usually happens because the file was saved with a different text encoding at some point.
> The code still runs, but the text may look odd in some places.

---

## 0) Big Picture: What is this project?

OrbitSpeed is a **web app** that runs inside your browser (Chrome/Edge/Safari/Firefox).

What it does:
- It measures **Ping** (how fast a tiny request returns).
- It measures **Download speed** (how fast your browser can download bytes).
- It measures **Upload speed** (how fast your browser can upload bytes).
- It shows the results in a nice UI: a gauge (speedometer), cards, a quality grade, and a history list.

What it is NOT:
- It is **not** a backend server app.
- It does **not** have a database by default.
- It does **not** have login/authentication by default.

How it measures:
- It talks to public endpoints:
  - Cloudflare: `https://speed.cloudflare.com`
  - IP/ISP lookup: `https://ipapi.co/json/`
  - Upload fallback: `https://httpbin.org/post`

Deployment:
- It builds into static files (HTML/CSS/JS).
- Those files can be hosted on Vercel, Netlify, GitHub Pages, Nginx, etc.

---

## 1) Folder Map (what each folder is for)

- `.github/workflows/`  
  GitHub Actions workflow (CI) for lint + build.

- `public/`  
  Static public files copied as-is into the final build.
  Example: `manifest.json`, icons.

- `src/`  
  All real app code:
  - `main.jsx` = entry point (starts React)
  - `App.jsx` = main UI layout
  - `components/` = UI building blocks
  - `hooks/` = reusable “logic helpers”
  - `utils/` = helper functions (formatting, speed-test engine)
  - `index.css` = all styling
  - `styles/design-tokens.css` = CSS variables (colors, spacing, etc.)

- `dist/`  
  The build output (generated). You normally do not edit this by hand.

---

## 2) Frontend vs Backend (simple explanation)

### Frontend (this project HAS this)
Frontend is the part users see in a browser:
- HTML = page structure
- CSS = styling
- JavaScript/React = behavior and UI changes

This project is almost 100% frontend.

### Backend (this project does NOT have this by default)
Backend is usually:
- a server you control
- database
- login sessions
- APIs you own

OrbitSpeed does not ship with a backend. It uses public services instead.

---

## 3) How the app runs (the “life story” of the app)

1. User opens the website.
2. Browser loads `index.html`.
3. `index.html` loads `/src/main.jsx`.
4. `main.jsx` starts React and renders `<App />`.
5. `App.jsx` renders the UI:
   - Navbar, Gauge, Start button, cards, history.
6. User clicks “Start Speed Test”.
7. `useSpeedTest()` starts:
   - fetch connection info
   - ping
   - download
   - upload
8. UI updates as phases change.
9. When done, result is saved in local history (`localStorage`).

---

## 4) APIs used (simple list + what they do)

### 4.1 Cloudflare Speed API (used for measurement)
- Base: `https://speed.cloudflare.com`
- Download: `GET /__down?bytes=...`
  - Example: `/__down?bytes=10000000` means “send me 10 MB of data”.
- Upload: `POST /__up`
  - We send bytes, Cloudflare receives them.

### 4.2 IP/ISP lookup API (used for showing ISP/location)
- `GET https://ipapi.co/json/`
  - Returns ISP/org name, city, country, IP, etc.

### 4.3 Upload fallback API (only used if Cloudflare upload fails)
- `POST https://httpbin.org/post`

Important warning:
- These are **third-party services**. If they rate-limit you or go down, some parts may fail.

---

## 5) Security (what protects the app)

This app includes basic security hardening:
- **Content Security Policy (CSP)** in `index.html` and as headers in `vercel.json`.
  - CSP limits what domains the app can load scripts/requests/images from.
- **X-Frame-Options / frame-ancestors** to prevent clickjacking (being embedded in other pages).
- **HSTS** so browsers prefer HTTPS.
- **Permissions-Policy** to disable camera/microphone/geolocation by default.

---

## 6) Code Walkthrough — Important Files

Below, each file is explained in simple English.

---

## File: `index.html` (HTML shell)

This is the first file your browser sees.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

Line-by-line:
- `<!doctype html>`: tells the browser “this is modern HTML”.
- `<html lang="en">`: root element; language is English.
- `<head>`: metadata for the page (not visible UI).
- `<meta charset="UTF-8" />`: tells browser the character set.
- `<meta name="viewport" ...>`: important for mobile screens so layout is correct.

```html
    <title>OrbitSpeed â€” Internet Speed Test</title>
    <meta name="description" content="..." />
```
- `<title>`: browser tab title.
- `description`: used by search engines and social share previews.

```html
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; ..."/>
```
- This is CSP (security rule):
  - `default-src 'self'`: only allow things from the same website by default.
  - `script-src 'self'`: only scripts from this site.
  - `style-src ... https://fonts.googleapis.com`: allow Google Fonts CSS.
  - `font-src ... https://fonts.gstatic.com`: allow downloading font files.
  - `img-src ... https://flagcdn.com`: allow country flags.
  - `connect-src ...`: allow network requests to the speed test APIs.
  - `frame-ancestors 'none'`: do not allow the app to be embedded as an iframe.

```html
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
```
- `<div id="root">`: where React will “mount” the app.
- `<script type="module" ...>`: loads your React entry file.

---

## File: `src/main.jsx` (React entry point)

```js
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
```
Line-by-line:
- Import `StrictMode`: a React helper that warns about unsafe patterns in development.
- Import `createRoot`: modern React rendering API.
- Import `index.css`: loads all global styles.
- Import `App`: main component.

```js
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```
Line-by-line:
- `document.getElementById('root')`: finds the `<div id="root">` from `index.html`.
- `createRoot(...).render(...)`: tells React to render UI into that div.
- `<StrictMode>`: dev-only checks; does not change the production output.
- `<App />`: your main application UI.

---

## File: `src/App.jsx` (Main UI layout and wiring)

This file:
- creates the page layout (navbar, gauge, stats, footer)
- connects UI to the speed-test logic hook (`useSpeedTest`)
- connects UI to history storage (`useHistory`)

### Imports
```js
import { useState, useMemo, useEffect } from 'react';
import { Download, Upload, Activity, Wifi } from 'lucide-react';
```
- `useState`: stores “changing values” (like selected unit).
- `useMemo`: caches a calculated value (like `maxMbps`) so it is not recomputed too much.
- `useEffect`: run a side-effect after render (like “save history when test is done”).
- `lucide-react`: icon library (download icon, upload icon, etc.)

```js
import ErrorBoundary  from './components/ErrorBoundary';
import Navbar         from './components/Navbar';
import GaugeChart     from './components/GaugeChart';
...
```
- These are UI components. You can think of them like LEGO blocks.

```js
import { useSpeedTest } from './hooks/useSpeedTest';
import { useHistory }   from './hooks/useHistory';
import { formatSpeed, getUnitLabel, getPingColor } from './utils/formatters';
```
- `useSpeedTest`: does the real measurement work and gives state like `phase`, `download`, etc.
- `useHistory`: stores previous results in the browser.
- formatters: help show numbers nicely.

### AppContent component
```js
function AppContent() {
  const { phase, ping, download, upload, currentSpeed, connectionInfo, error, isTesting, startTest, stopTest, reset } = useSpeedTest();
```
Beginner explanation:
- `useSpeedTest()` returns an object with values and functions.
- We “pick” the parts we want using `{ ... }`.

```js
  const { history, addResult, clearHistory } = useHistory();
  const [unit, setUnit] = useState('mbps');
```
- `history`: list of previous tests.
- `addResult`: function to add a new result.
- `clearHistory`: function to clear.
- `unit`: current unit to display (Mbps, MB/s, KB/s)
- `setUnit`: function to change unit.

### Saving history when done
```js
  useEffect(() => {
    if (phase === 'DONE' && download !== null && upload !== null) {
      addResult({ ping, download, upload, isp: connectionInfo?.isp || '' });
    }
  }, [phase, ping, download, upload, connectionInfo, addResult]);
```
Simple explanation:
- `useEffect` runs after React renders.
- If `phase` is `DONE` (meaning speed test finished) and numbers exist:
  - we save the result into history.
- The `[...]` array says: “run again if any of these values change”.

### Choosing the gauge max scale
```js
  const maxMbps = useMemo(() => {
    const top = Math.max(download || 0, upload || 0, currentSpeed || 0);
    if (top > 400) return 1000;
    if (top > 200) return 500;
    if (top > 80)  return 200;
    return 100;
  }, [download, upload, currentSpeed]);
```
Simple explanation:
- This tries to pick a nice max value for the gauge:
  - if your speed is huge, show a bigger scale so the needle still makes sense.
- `useMemo` caches the result unless inputs changed.

### Formatting values
```js
  const unitLabel    = getUnitLabel(unit);
  const displaySpeed = formatSpeed(currentSpeed, unit);
```
- Converts internal Mbps numbers into whichever unit user selected.

### Loading indicators
```js
  const isLoadingDl = isTesting && ['CONNECTING','PING'].includes(phase);
  const isLoadingUl = isTesting && ['CONNECTING','PING','DOWNLOAD'].includes(phase);
```
- While we are still early in the test, download/upload cards show a skeleton.

### Ping label
```js
  const pingColor = ping !== null ? getPingColor(ping) : undefined;
  const pingLabel = ping !== null
    ? ping < 20 ? 'Excellent' : ping < 50 ? 'Good' : ping < 100 ? 'Fair' : 'Poor'
    : undefined;
```
- Choose a color (green/blue/orange/red) based on ping.
- Choose a label string.

### JSX layout
Everything inside `return (...)` is the UI structure.
It is “HTML-like”, but it is JSX (React syntax).

Key pieces:
- Background layers: `.bg-canvas`, `.bg-grid`, `.bg-noise`
- `<Navbar />`: top bar
- Gauge section: `<GaugeChart ... />`
- Unit toggle: `<UnitToggle ... />`
- Button: `<TestButton ... />`
- Stats cards: `<StatCard ... />`
- Streaming grid: `<StreamingGrid ... />`
- History: `<HistoryPanel ... />`
- Footer

### Final export
```js
export default function App() {
  return (
    <ErrorBoundary>
      <AppContent/>
    </ErrorBoundary>
  );
}
```
Simple explanation:
- We wrap the whole app inside `ErrorBoundary`.
- If some unexpected UI error happens, user sees a friendly fallback instead of a white screen.

---

## File: `src/hooks/useSpeedTest.js` (The “brain” / state machine)

This is the most important logic file.

It controls the phases:
`IDLE → CONNECTING → PING → DOWNLOAD → UPLOAD → DONE` (or `ERROR`)

### Imports
```js
import { useState, useCallback, useRef } from 'react';
import { measurePing, measureDownload, measureUpload, fetchConnectionInfo } from '../utils/speedtest';
```
- React hooks:
  - `useState`: store current values
  - `useCallback`: create stable functions (helps performance)
  - `useRef`: store values that do not trigger a re-render
- speedtest utils:
  - these are the real network measurement functions.

### State variables
```js
const [phase, setPhase] = useState('IDLE');
const [ping, setPing] = useState(null);
...
```
Simple explanation:
- Each `useState` creates one piece of state.
- `phase` tells the UI what step we are doing right now.
- `ping/download/upload` store results.
- `currentSpeed` is live speed while testing (for gauge animation).
- `connectionInfo` stores ISP/city/country/ip.
- `error` stores a message if something failed.

### Refs (important)
```js
const abortRef = useRef(false);
const testRunning = useRef(false);
const controllerRef = useRef(null);
```
Simple explanation:
- `useRef` values persist between renders.
- `abortRef.current` is a simple “stop requested?” flag.
- `testRunning.current` prevents starting two tests at once.
- `controllerRef.current` stores an `AbortController` to cancel fetch requests.

### isTesting
```js
const isTesting = ['CONNECTING', 'PING', 'DOWNLOAD', 'UPLOAD'].includes(phase);
```
- True when a test is running.

### startTest()
This function runs the entire test.

Important steps:
1. Do safety checks.
2. Reset state for a fresh test.
3. Fetch connection info.
4. Ping.
5. Download.
6. Upload.
7. Done.

Key lines:
```js
if (testRunning.current) return;
testRunning.current = true;
abortRef.current = false;
controllerRef.current?.abort();
controllerRef.current = new AbortController();
const { signal } = controllerRef.current;
```
- If test is already running, ignore the click.
- Reset abort flag.
- Abort any previous test requests (if any).
- Make a new AbortController for this test.
- `signal` is passed into fetch/XHR to allow cancel.

Then:
```js
setPhase('CONNECTING');
setPing(null);
...
```
- Reset values so UI clears old results.

Then:
```js
const [connInfo] = await Promise.all([fetchConnectionInfo(signal)]);
setConnectionInfo(connInfo);
```
- Fetch ISP info and store it.

Then:
```js
setPhase('PING');
const pingResult = await measurePing(signal);
setPing(pingResult);
```
- Measure ping and store it.

Then:
```js
setPhase('DOWNLOAD');
const dlResult = await measureDownload((live) => { ... }, signal);
setDownload(dlResult);
```
- Measure download.
- During measurement we update:
  - `currentSpeed` (gauge)
  - `download` (card live value)

Then:
```js
setPhase('UPLOAD');
const ulResult = await measureUpload((live) => { ... }, signal);
setUpload(ulResult);
setCurrentSpeed(ulResult);
setPhase('DONE');
```
- Measure upload.
- When done, set phase to DONE.

If error happens:
```js
setError(err.message || 'An unexpected error occurred');
setPhase('ERROR');
```
- UI will show an error message and allow retry.

Finally:
```js
testRunning.current = false;
```
- allow new tests again.

### stopTest()
```js
abortRef.current = true;
controllerRef.current?.abort();
setPhase('IDLE');
```
- Sets abort flag.
- Cancels network requests.
- Returns UI to IDLE.

### reset()
Like stop, but also clears results back to empty.

---

## File: `src/utils/speedtest.js` (Network measurement engine)

This file contains “how to measure ping/download/upload”.

### Constant
```js
const CF_BASE = 'https://speed.cloudflare.com';
```
- Base URL for Cloudflare speed endpoints.

### measurePing(signal)
Goal: measure latency in milliseconds.

Important parts:
- Take 3 samples.
- Use `performance.now()` to measure time.
- Use `HEAD` request first, then fallback to `GET` if needed.
- Return the median sample.

Why median?
- If one ping is weirdly high, median is more stable than average.

### measureDownload(onProgress, signal)
Goal: measure download Mbps.

Important parts:
- Use 2 stages:
  - warm-up (1 MB, 1 stream)
  - main (10 MB, 3 streams)
- For each stream:
  - fetch bytes
  - read the response stream using `getReader()`
  - count bytes
- While downloading:
  - update progress no more than once per 100ms
  - compute live Mbps from total bytes / elapsed time

Why parallel streams?
- Some networks/browsers do not fully use bandwidth on a single request.
- Multiple streams can saturate faster connections better.

Why throttle progress updates?
- Updating UI too often can cause lag/jank.

### measureUpload(onProgress, signal)
Goal: measure upload Mbps.

Important parts:
- Create 5 MB random bytes using crypto.
- Use `XMLHttpRequest` to get `upload.onprogress` events.
- Try Cloudflare upload; if it fails, try httpbin.
- If abort signal triggers, call `xhr.abort()`.

### fetchConnectionInfo(signal)
Goal: show ISP/country/city/IP.

Important parts:
- Cache results in `localStorage` for 6 hours.
  - This reduces calls to ipapi and reduces chance of rate-limits.
- If request fails:
  - return “Unknown ISP” but do not crash the app.

---

## File: `src/utils/formatters.js` (Formatting + quality score)

This file is about:
- converting Mbps to user selected unit
- choosing ping color
- calculating a “grade”
- formatting timestamps

### formatSpeed(speedMbps, unit)
- If speed is missing or negative → show `0.00`.
- If unit is:
  - `mbps`: return Mbps with 2 decimals.
  - `mbs`: convert Mbps → MB/s (`Mbps / 8`)
  - `kbs`: convert Mbps → KB/s (`(Mbps * 1000) / 8`)

### getUnitLabel(unit)
- Converts internal keys to labels shown on UI.

### calculateQualityScore(download, upload, ping)
Simple explanation:
- Convert download/upload/ping into 0–100 “points”.
- Combine them with weights:
  - download 40%
  - upload 30%
  - ping 30%
- Convert to a grade A+ .. F.

### getPingColor(ping)
- Green for very low ping.
- Blue for good.
- Orange for medium.
- Red for high.

### formatTimestamp(date)
- Converts timestamp to a friendly date string for history list.

---

## File: `src/utils/quality.js` (Streaming requirements)

This file contains:
- a list of streaming platforms (Netflix, YouTube, etc.)
- what Mbps is needed for each quality tier

### STREAMING_PLATFORMS
- Each entry has:
  - `id`: internal key
  - `name`: display name
  - `icon`: emoji icon
  - `tiers`: list of requirements (best first)

### getBestQuality(platform, downloadMbps)
- Finds the first tier where `downloadMbps >= required`.
- If found, return “supported”.
- If not found, return “Not Supported”.

---

## File: `src/hooks/useHistory.js` (Saving history in the browser)

This hook:
- reads old history from `localStorage` at startup
- updates localStorage whenever history changes
- provides functions:
  - addResult
  - clearHistory

Key ideas:
- `localStorage` is a browser key-value storage.
- It stores strings only, so we use `JSON.stringify` and `JSON.parse`.
- Try/catch prevents crashes if storage is blocked (some private modes).

---

## File: `src/components/Navbar.jsx`

This is a simple navigation bar.

It returns:
- `<nav>` wrapper with `aria-label` for accessibility.
- “ORBITSPEED” text.

There is no logic here—only UI.

---

## File: `src/components/TestButton.jsx`

This controls:
- Start button
- Stop button (only while testing)
- Reset button (only when done)

Important beginner idea:
- We show/hide buttons based on `phase` and `isTesting`.

The label changes depending on phase:
- CONNECTING → “Connecting…”
- PING → “Testing Ping…”
- DOWNLOAD → “Measuring Download…”
- UPLOAD → “Measuring Upload…”
- DONE → “Run Again”
- ERROR → “Retry Test”

---

## File: `src/components/GaugeChart.jsx`

This renders the semicircle speedometer.

Important ideas (simple):
- SVG is like drawing shapes using math.
- We draw:
  - a track arc (gray background)
  - a filled arc (colored progress)
  - tick marks (0%, 20%, 40%, ...)
  - a needle (line) showing current speed ratio
  - large text showing the number

Key math:
- `ratio = speedMbps / maxMbps` (clamped 0..1)
- Needle angle goes from left (0%) to right (100%).
- `strokeDashoffset` controls how much of the arc is filled.

Why `useMemo`:
- `arcLen` and tick calculations do not need to recalc on every render if inputs did not change.

---

## File: `src/components/StatCard.jsx`

This shows one card like:
- Ping card
- Download card
- Upload card

It can show:
- a skeleton loader while measurement is still happening
- a value + unit when ready
- an optional sublabel (like ping quality “Excellent”)

---

## File: `src/components/QualityScore.jsx`

This shows the grade A/B/C… using:
- `calculateQualityScore(download, upload, ping)`

If there is no result yet, it returns `null` (show nothing).

---

## File: `src/components/StreamingGrid.jsx`

This shows “Streaming Platform Support”.

It takes:
- `downloadMbps`

It loops over `STREAMING_PLATFORMS`:
- for each platform, it picks best quality tier
- it shows “supported” or “not supported”

---

## File: `src/components/HistoryPanel.jsx`

This shows the history list.

Important UI idea:
- It is collapsible:
  - click the header button toggles open/close.

If there is no history:
- it returns `null` (so history section is not shown at all).

History entries show:
- time
- download
- upload
- ping
- ISP

---

## File: `src/components/ErrorBoundary.jsx`

Beginner idea:
- Sometimes React UI can crash due to a bug.
- When that happens, the user sees a blank screen.

ErrorBoundary stops that:
- It catches errors in rendering.
- It shows a friendly fallback UI with a “Reload App” button.

This is a React class component because Error Boundaries are traditionally implemented with classes.

---

## File: `src/index.css` (Main styling)

This file is long because it contains all CSS.

Beginner idea:
- CSS selects elements by class name like `.hero-card`.
- Then it applies styling like colors, spacing, layout, etc.

What the major sections do:
- Global reset: `* { margin:0; padding:0; box-sizing:border-box }`
- Background layers: `.bg-canvas`, `.bg-grid`, `.bg-noise`
- Layout: `.main`, `.hero-card`, grids
- Components styling: navbar, gauge, cards, buttons, history, footer
- Responsive rules:
  - `@media(max-width:768px)` for tablets/phones
  - `@media(max-width:480px)` for very small phones
  - `@media(min-width:1400px)` and `@media(min-width:1920px)` for large screens/TV

If you want, I can generate a second “CSS-only line-by-line” document too, because this one would become extremely long if we literally explain every single CSS line one-by-one.

---

## 7) Build / Tooling Files (simple explanations)

### File: `package.json`
This describes:
- project name
- dependencies (react, lucide)
- scripts:
  - `npm run dev`: start dev server
  - `npm run build`: create production build
  - `npm run preview`: run build locally
  - `npm run lint`: run ESLint checks

### File: `vite.config.js`
This tells Vite:
- use the React plugin
- use default Vite build settings

### File: `eslint.config.js`
This tells ESLint:
- check `*.js` and `*.jsx`
- ignore `dist`
- use recommended rules + React hooks rules

### File: `vercel.json`
This tells Vercel:
- “rewrite everything to index.html” (so SPA routes work)
- add cache headers for assets
- add security headers (CSP, HSTS, etc.)

### File: `Dockerfile`
This provides Docker deployment:
- Stage 1: build with Node
- Stage 2: serve with Nginx
- SPA routing rule in Nginx: unknown paths redirect to `index.html`

### File: `.github/workflows/deploy.yml`
This provides CI:
- checkout code
- install dependencies
- lint
- build
- optional vercel deploy step (commented out)

### File: `public/manifest.json`
This is PWA metadata:
- how the app looks when “installed”
- theme color, icons, etc.

---

## 8) Where to learn next (beginner direction)

If you are new, focus on learning these in this order:
1. Basic HTML (`index.html`)
2. Basic CSS (`src/index.css`)
3. Basic React component structure (`src/App.jsx`)
4. React hooks (`useState`, `useEffect`) in `useSpeedTest`
5. Network requests (`fetch`, `XHR`) in `src/utils/speedtest.js`

---

## 9) “Backend” style scaling question (10k–15k users)

Because the app is static:
- Your hosting (Vercel) serves static files and can handle huge traffic.
- Your users’ browsers do the speed tests.

But:
- The third-party APIs may rate limit:
  - `ipapi.co` especially.
- If you really want enterprise scaling, you should consider:
  - proxying ISP lookup through your own endpoint
  - using a paid provider / API key
  - adding your own upload endpoint (so you control limits)

