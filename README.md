# ⚡ OrbitSpeed — Internet Speed Test

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-00d4ff?style=for-the-badge&labelColor=08090f)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&labelColor=08090f)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&labelColor=08090f)
![Flask](https://img.shields.io/badge/Flask-3.0+-000000?style=for-the-badge&logo=flask&labelColor=08090f)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&labelColor=08090f)
![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge&labelColor=08090f)

**A premium, full-stack internet speed test application.**  
Dual-mode architecture: standalone React SPA *or* Python Flask backend with SQLite history.  
Powered by Cloudflare Edge for accurate real-world measurements.

[🌐 Live Demo](https://internet-speed-test-gold.vercel.app/) · [🐛 Report Bug](https://github.com/iragavarapunagaatchutaneelima/Internet-Speed-Test/issues) · [💡 Request Feature](https://github.com/iragavarapunagaatchutaneelima/Internet-Speed-Test/issues)

</div>

---

## 🌟 Overview

**OrbitSpeed** is more than just a speed test — it is a **real-time connectivity dashboard** built for accuracy, beauty, and performance. It ships with two independent runtime modes:

| Mode | Stack | Storage | Best For |
|---|---|---|---|
| **Frontend-only (SPA)** | React 19 + Vite 8 | `localStorage` | Static hosting on Vercel / Netlify / CDN |
| **Full-stack (Flask)** | Python Flask 3 + SQLite | Server-side SQLite DB | Self-hosted servers, persistent multi-user history |

Both modes share the same polished UI and use Cloudflare's globally distributed edge network for measurement accuracy.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎯 **Accurate Multi-Stream Download** | 3 parallel 10 MB streams via Cloudflare Edge saturate fast connections for precise Mbps readings |
| 📡 **ISP & Location Detection** | Automatically detects ISP name, city, country, and public IP — with 6-hour caching to respect rate limits |
| 📊 **Real-Time Speedometer** | Premium SVG semicircular gauge with GPU-accelerated `stroke-dashoffset` animation and dynamic auto-scaling |
| ⚡ **Ping Measurement** | 5-sample median ping using `HEAD` requests, with colour-coded quality labels (Excellent / Good / Fair / Poor) |
| 🔄 **Universal Unit Conversion** | Instantly toggle between **Mbps**, **MB/s**, and **KB/s** — scales across the dial, stat cards, and history |
| 🖱️ **Interactive Post-Test Gauge** | Click Download or Upload stat cards after a test to toggle the speedometer focus between each metric |
| 🎬 **Streaming Quality Estimator** | Platform-specific support check for Netflix, YouTube, Video Calls, and Cloud Gaming |
| 🏆 **Connection Grade (A–F)** | Weighted quality score: Download 40% + Upload 30% + Ping 30% |
| 📜 **Persistent Test History** | SPA stores results in `localStorage`; Flask mode stores them in SQLite via server-side API |
| 📱 **Fully Responsive Design** | Pixel-perfect from 360 px mobile to 1920 px+ ultra-wide with TV-optimised typography scaling |
| 🔒 **Security Hardened** | CSP, `X-Frame-Options`, `X-XSS-Protection`, HSTS, and `Permissions-Policy` applied — 0 `npm audit` vulnerabilities |
| 🌐 **PWA Ready** | Installable as a native desktop or mobile app via the browser's "Add to Home Screen" |
| ⏹️ **Cancellable Tests** | Stop a test mid-stream — `AbortController` and `xhr.abort()` ensure clean, immediate cancellation |
| 🐳 **Docker Deployment** | Multi-stage Dockerfile (Node 20 → Nginx) serves the built SPA with gzip and SPA routing |

---

## 🛠️ Tech Stack

### Frontend

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | React 19 + Vite 8 | Ultra-fast SPA with Hot Module Replacement |
| **Styling** | Vanilla CSS + CSS Custom Properties | Scalable design system, zero runtime overhead |
| **Typography** | Inter + JetBrains Mono (Google Fonts) | Premium UI font + monospaced numerical data |
| **Icons** | Lucide React | Consistent, tree-shakeable icon library |
| **Speed Engine** | Cloudflare `speed.cloudflare.com` | Accurate edge-based download / upload / ping |
| **IP Detection** | `ipapi.co` — client-side (SPA) or server-side (Flask) | ISP + geolocation lookup |
| **Visualisation** | Custom SVG | Zero-dependency animated speedometer gauge |

### Backend (Flask mode only)

| Layer | Technology | Purpose |
|---|---|---|
| **Web Framework** | Flask ≥ 3.0 | REST API + Jinja2 template serving |
| **Database** | SQLite via Python `sqlite3` | Persistent test history storage |
| **Download Streaming** | `os.urandom()` + `stream_with_context` | Streams cryptographically random bytes to client |
| **Upload Measurement** | Raw `request.get_data()` | Receives bytes and returns confirmed byte count |
| **Geo Lookup** | `ipapi.co` — server-side with in-memory cache | Per-client ISP / city / country lookup |

### DevOps

| Tool | Purpose |
|---|---|
| **GitHub Actions** | Automated lint + build CI pipeline on every push |
| **Vercel** | Static SPA deployment with global edge CDN |
| **Docker + Nginx** | Containerised self-hosted deployment (Node 20 build → Nginx serve) |

---

## 📁 Project Structure

```
Internet-Speed-Test/
├── .github/
│   └── workflows/
│       └── deploy.yml            # CI: lint → build → optional Vercel deploy
│
├── public/
│   └── manifest.json             # PWA manifest (icons, theme, display mode)
│
├── src/                          # React frontend source
│   ├── components/
│   │   ├── ErrorBoundary.jsx     # Crash recovery — friendly fallback UI
│   │   ├── Navbar.jsx            # Top navigation bar
│   │   ├── GaugeChart.jsx        # SVG semicircle speedometer with needle
│   │   ├── StatCard.jsx          # Metric display card (ping / download / upload)
│   │   ├── TestButton.jsx        # Animated Start / Stop / Reset CTA button
│   │   ├── UnitToggle.jsx        # Mbps / MB/s / KB/s unit switcher
│   │   ├── StreamingGrid.jsx     # Platform streaming quality grid
│   │   ├── QualityScore.jsx      # A–F grade ring with weighted score
│   │   └── HistoryPanel.jsx      # Collapsible test results history list
│   ├── hooks/
│   │   ├── useSpeedTest.js       # State machine — orchestrates all test phases
│   │   └── useHistory.js         # localStorage persistence for test history
│   ├── utils/
│   │   ├── speedtest.js          # Network engine: ping / download / upload
│   │   ├── formatters.js         # Unit conversion, quality score, ping colour
│   │   └── quality.js            # Streaming platform requirement definitions
│   ├── styles/
│   │   └── design-tokens.css     # 60+ CSS custom properties (the design system)
│   ├── App.jsx                   # Root layout: wires hooks → components → UI
│   ├── index.css                 # Global styles + all component CSS
│   └── main.jsx                  # React DOM entry point
│
├── templates/
│   └── index.html                # Jinja2 template served by Flask
│
├── static/                       # Flask static assets
│
├── app.py                        # Flask application — all REST API routes
├── database.py                   # SQLite helpers: init_db / save_result / get_history
├── speed_utils.py                # Python: quality score, streaming support, IP lookup
├── requirements.txt              # Python deps: Flask>=3.0.0, requests>=2.31.0
│
├── index.html                    # Vite HTML entry point (SPA mode)
├── vite.config.js                # Vite build configuration
├── eslint.config.js              # ESLint rules for .js / .jsx
├── package.json                  # npm scripts and dependency manifest
├── Dockerfile                    # Multi-stage: node:20-alpine build → nginx:stable-alpine serve
├── vercel.json                   # Vercel SPA rewrites + cache headers + security headers
└── docs/
    ├── PROJECT_REPORT.md         # Full technical / academic project report
    └── CODE_WALKTHROUGH_LINE_BY_LINE.md  # Beginner-friendly code explanation
```

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 18+ | Required for the React / Vite frontend |
| npm | 9+ | Bundled with Node.js |
| Python | 3.10+ | Required **only** for Flask backend mode |
| pip | latest | Required only for Flask backend mode |

---

### ▶ Mode 1 — Frontend-Only SPA (React + Vite)

The simplest way to run OrbitSpeed. No Python required.

```bash
# 1. Clone the repository
git clone https://github.com/iragavarapunagaatchutaneelima/Internet-Speed-Test.git
cd Internet-Speed-Test

# 2. Install npm dependencies
npm install

# 3. Start the development server
npm run dev
# → Open http://localhost:5173
```

> **Note:** In SPA mode, test history is stored in your browser's `localStorage` and the ISP lookup is fetched client-side directly from `ipapi.co`.

---

### ▶ Mode 2 — Full-Stack Flask Backend

Run with a Python backend that owns the download/upload endpoints and persists history in SQLite.

```bash
# Clone the repository (skip if already done)
git clone https://github.com/iragavarapunagaatchutaneelima/Internet-Speed-Test.git
cd Internet-Speed-Test

# Install Python dependencies
pip install -r requirements.txt

# Start the Flask server
python app.py
# → Open http://localhost:5000
```

**Flask REST API endpoints:**

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Renders the main SPA page via Jinja2 |
| `GET` | `/api/test/ping` | Ultra-low-latency RTT echo (`{ ts, ok }`) |
| `GET` | `/api/test/download?bytes=N` | Streams N random bytes (default 10 MB, max 100 MB) |
| `POST` | `/api/test/upload` | Receives raw bytes; returns `{ received, ok }` |
| `GET` | `/api/info` | Returns ISP / city / country / IP (6-hour server-side cache) |
| `GET` | `/api/quality?download=&upload=&ping=` | Returns weighted letter-grade quality score |
| `GET` | `/api/streaming?download=` | Returns streaming platform support tiers |
| `GET` | `/api/history` | Returns up to 50 most recent results from SQLite |
| `POST` | `/api/history` | Saves one completed test result to SQLite |
| `DELETE` | `/api/history` | Clears all history from SQLite |

---

### 🔨 Production Build (SPA Mode)

```bash
npm run build    # Compiles and optimises → dist/
npm run preview  # Serves dist/ locally for final check
```

---

## 📜 Available Scripts

| Script | Command | Description |
|---|---|---|
| Dev server | `npm run dev` | Start Vite dev server with HMR at `localhost:5173` |
| Production build | `npm run build` | Compile + optimise → `dist/` |
| Preview build | `npm run preview` | Serve `dist/` locally |
| Lint | `npm run lint` | Run ESLint on all `.js` / `.jsx` files |
| Flask server | `python app.py` | Start full-stack backend at `localhost:5000` |

---

## 🐳 Docker Deployment

The `Dockerfile` uses a **two-stage build**:
1. **Stage 1 (`node:20-alpine`)** — installs dependencies and compiles the Vite production bundle.
2. **Stage 2 (`nginx:stable-alpine`)** — copies `dist/` and serves it with gzip compression and SPA routing (`try_files`).

```bash
# Build the Docker image
docker build -t orbitspeed .

# Run on port 80
docker run -p 80:80 orbitspeed

# Run on a custom host port
docker run -p 3000:80 orbitspeed
```

---

## ☁️ Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

The included `vercel.json` configures:
- **SPA routing rewrites** — all URL paths resolve to `index.html`
- **Long-term asset caching** — `Cache-Control: public, max-age=31536000, immutable` for hashed assets
- **Security headers** — `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection`, `Referrer-Policy`, `Strict-Transport-Security`, and `Permissions-Policy`

**Scaling considerations (10 k+ concurrent users):**
- Static assets are served by Vercel's global CDN — scales automatically.
- Each browser performs measurements directly against Cloudflare / `ipapi.co`.
- The main bottleneck under high load is the **`ipapi.co` free-tier rate limit** (~30 k req/month per server IP).
- **Mitigation:** proxy the ISP lookup through your own Flask endpoint or a Vercel Edge Function, and use a paid `ipapi.co` API key.

---

## 🎨 Design System

OrbitSpeed's entire visual language is defined as CSS custom properties in `src/styles/design-tokens.css`. Components reference tokens like `var(--accent-cyan)` — retheme the app by editing only that one file.

### Core Design Principles

| Principle | How It Is Implemented |
|---|---|
| **Data Clarity** | `JetBrains Mono` for all numbers; colour-coded quality indicators |
| **Cinematic Motion** | `cubic-bezier` easing on transitions; pure CSS `stroke-dashoffset` gauge animation |
| **Progressive Disclosure** | Stats, grade ring, and streaming grid only render once measurement data exists |
| **Zero Clutter** | Deep-space `#08090f` background; `backdrop-filter: blur(20px)` glassmorphism panels |

### Key Design Tokens

| Token | Value | Usage |
|---|---|---|
| `--bg-canvas` | `#08090f` | Deep space page background |
| `--accent-cyan` | `#00d4ff` | Primary accent — gauge fill, highlights |
| `--accent-violet` | `#7c3aed` | Secondary gradient, grade ring |
| `--glass-bg` | `rgba(255,255,255,.03)` | Glassmorphism panel surface |
| `--glass-blur` | `blur(20px)` | Backdrop blur for panels |

---

## ⚡ Performance

| Metric | Target |
|---|---|
| Lighthouse Score | 95+ |
| First Contentful Paint | < 1.2 s |
| Largest Contentful Paint | < 2.0 s |
| Cumulative Layout Shift | < 0.05 |
| JS Bundle (gzipped) | ~68 KB |
| CSS Bundle (gzipped) | ~5 KB |

**Key optimisations:**
- **Upload payload** — `crypto.getRandomValues()` generates random bytes off the main thread (GPU-accelerated)
- **Download** — 3 parallel fetch streams better saturate connections above ~100 Mbps
- **Ping** — 5-sample median using `HEAD` requests; median discards outlier spikes
- **Progress throttling** — gauge updates capped at 100 ms intervals to prevent React re-render jank
- **Fonts** — Google Fonts loaded with `display=swap` to eliminate render-blocking
- **SVG gauge** — animated with CSS `stroke-dashoffset` only — zero JavaScript animation loops

---

## 🔒 Security

| Control | Detail |
|---|---|
| **Content Security Policy** | Restricts `script-src`, `style-src`, `font-src`, `img-src`, and `connect-src` to known safe origins |
| **X-Frame-Options** | `DENY` — prevents the app from being embedded in any iframe (anti-clickjacking) |
| **X-Content-Type-Options** | `nosniff` — prevents MIME-type sniffing attacks |
| **X-XSS-Protection** | `1; mode=block` — enables browser's built-in XSS filter |
| **HSTS** | `max-age=63072000; includeSubDomains; preload` — enforces HTTPS for 2 years |
| **Permissions-Policy** | Disables camera, microphone, geolocation, payment, and USB APIs |
| **0 npm vulnerabilities** | Confirmed clean via `npm audit` |
| **No PII transmitted** | Measurements are point-to-point with Cloudflare; no data stored without explicit user action |

---

## 🧪 Test Cases

| # | Scenario | Expected Result |
|---|---|---|
| 1 | **Happy path** — full test | Completes CONNECTING → PING → DOWNLOAD → UPLOAD → DONE; all metrics displayed |
| 2 | **Stop during download** | Returns to IDLE cleanly; gauge resets to zero; no errors thrown |
| 3 | **Stop during upload** | XHR aborted immediately; UI returns to IDLE |
| 4 | **Network offline** | Reaches `ERROR` phase; descriptive message shown; Retry button appears |
| 5 | **`ipapi.co` blocked** | Ping / download / upload still complete; ISP field shows "Unknown" |
| 6 | **History persistence** | Run test → refresh page → results still visible in history panel |
| 7 | **Unit toggle** | Switch Mbps → MB/s → KB/s: all values and gauge ticks rescale correctly |
| 8 | **Mobile (360 × 640)** | Stats stack vertically; no horizontal scroll; gauge scales down |
| 9 | **Ultra-wide (≥ 1920 px)** | Typography scales up; content remains centred; no stretched layouts |

---

## 🗺️ Roadmap

- [ ] WebSocket-based real-time jitter measurement
- [ ] Historical line-chart visualisation over time
- [ ] Multiple test-server region selection
- [ ] Shareable result cards (PNG export)
- [ ] Dark / Light theme toggle
- [ ] Electron desktop app wrapper
- [ ] Optional authentication with cloud-synced history (Clerk / Auth0)
- [ ] Accessibility audit — WCAG 2.1 AA (keyboard navigation, reduced-motion, high-contrast)

---


## 📚 Documentation

| Document | Description |
|---|---|
| [`docs/PROJECT_REPORT.md`](./docs/PROJECT_REPORT.md) | Full academic / technical report: abstract → architecture → methodology → test cases → conclusion |
| [`docs/CODE_WALKTHROUGH_LINE_BY_LINE.md`](./docs/CODE_WALKTHROUGH_LINE_BY_LINE.md) | Beginner-friendly line-by-line explanation of every source file |

---

## 👩‍💻 Author

**Developed by Neelima**  
Built with ❤️ using React, Vite, Python Flask, and Cloudflare Edge Networks.

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

---

<div align="center">
  <sub>⚡ OrbitSpeed · Full-Stack Internet Speed Test · React 19 + Flask 3 + Cloudflare Edge · 2026</sub>
</div>
