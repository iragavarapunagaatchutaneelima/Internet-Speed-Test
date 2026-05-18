# ⚡ OrbitSpeed — Internet Speed Test

<div align="center">

![OrbitSpeed Banner](https://img.shields.io/badge/OrbitSpeed-Production%20Grade-00d4ff?style=for-the-badge&labelColor=08090f)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&labelColor=08090f)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&labelColor=08090f)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Edge-F38020?style=for-the-badge&logo=cloudflare&labelColor=08090f)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge&labelColor=08090f)

**A premium, futuristic, enterprise-grade internet speed test built with React and Vite.**  
Powered by Cloudflare Edge Networks for accurate real-world measurements.

[Live Demo](https://internet-speed-test-kohl.vercel.app/) · [Report Bug](https://github.com/iragavarapunagaatchutaneelima/Internet-Speed-Test/issues) · [Request Feature](https://github.com/iragavarapunagaatchutaneelima/Internet-Speed-Test/issues)

</div>

---

## 🌟 Vision

OrbitSpeed was designed to be more than just a speed test tool — it is a **premium real-time connectivity dashboard** that visualises your internet performance with cinematic precision. Inspired by modern enterprise monitoring platforms, it combines accurate measurement science with a futuristic dark UI aesthetic.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎯 **Accurate Multi-Stream Download** | 3 parallel 10 MB streams via Cloudflare Edge for precise measurements on fast connections |
| 📡 **ISP & Location Detection** | Automatically detects your ISP name, city, country, and IP address |
| 📊 **Real-Time Speedometer** | Premium SVG semicircular gauge with smooth GPU-accelerated arc animation |
| ⚡ **Ping Measurement** | 3-sample median ping with visual quality indicator (Excellent / Good / Fair / Poor) |
| 🔄 **Unit Conversion** | Instantly toggle between Mbps, MB/s, and KB/s |
| 🎬 **Streaming Quality Estimator** | Platform-specific quality estimation for Netflix, YouTube, Video Calls, and Cloud Gaming |
| 🏆 **Connection Grade (A–F)** | Weighted quality score based on download (40%), upload (30%), and ping (30%) |
| 📜 **Persistent Test History** | Results saved to localStorage — survives page refreshes |
| 📱 **Fully Responsive** | Pixel-perfect on mobile, tablet, laptop, desktop, and ultra-wide screens |
| 🔒 **Security Hardened** | Content Security Policy, CORS-safe endpoints, zero vulnerabilities |
| 🌐 **PWA Ready** | Installable as a desktop/mobile app via the browser |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | React 19 + Vite 8 | Ultra-fast SPA with HMR |
| **Styling** | Vanilla CSS + Design Tokens | Scalable design system |
| **Typography** | Inter + JetBrains Mono | Premium UI + monospaced data |
| **Icons** | Lucide React | Consistent icon library |
| **Speed Engine** | Cloudflare speed.cloudflare.com | Accurate edge-based measurement |
| **IP Detection** | ipapi.co | ISP + geolocation |
| **Visualisation** | Custom SVG | Zero-dependency speedometer |
| **Deployment** | Vercel / Docker / Nginx | Multi-target production deploy |
| **CI/CD** | GitHub Actions | Automated lint + build pipeline |

---

## 📁 Folder Structure

```
Internet-Speed-Test/
├── .github/
│   └── workflows/deploy.yml     # CI/CD pipeline
├── public/
│   └── manifest.json            # PWA manifest
├── src/
│   ├── components/
│   │   ├── ErrorBoundary.jsx    # Crash recovery UI
│   │   ├── Navbar.jsx           # Top navigation
│   │   ├── GaugeChart.jsx       # SVG speedometer
│   │   ├── StatCard.jsx         # Metric display card
│   │   ├── TestButton.jsx       # Animated CTA
│   │   ├── UnitToggle.jsx       # Mbps/MB/s/KB/s switcher
│   │   ├── StreamingGrid.jsx    # Platform quality grid
│   │   ├── QualityScore.jsx     # A–F grade ring
│   │   └── HistoryPanel.jsx     # Collapsible results history
│   ├── hooks/
│   │   ├── useSpeedTest.js      # All test state + async logic
│   │   └── useHistory.js        # localStorage persistence
│   ├── utils/
│   │   ├── speedtest.js         # Multi-stream download/upload/ping
│   │   ├── formatters.js        # Unit conversion + quality score
│   │   └── quality.js           # Streaming platform requirements
│   ├── styles/
│   │   └── design-tokens.css    # 60+ CSS custom properties
│   ├── App.jsx                  # Root layout orchestrator
│   ├── index.css                # Global styles + component CSS
│   └── main.jsx                 # React entry point
├── index.html                   # HTML shell (SEO + PWA + CSP)
├── Dockerfile                   # Multi-stage Docker build
├── vercel.json                  # Vercel edge config + headers
├── vite.config.js               # Build configuration
└── package.json
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+ and npm 9+
- An internet connection (the app measures your live connection)

### Works on
- Windows / macOS / Linux (Node + npm required)
- Mobile/TV browsers supported as long as they support modern ES modules and `ReadableStream`

### Quick Start (Beginner-friendly)
```bash
npm install
npm run dev
```
Open the printed local URL (typically `http://localhost:5173`).

### Production Build
```bash
npm run build
npm run preview
```

### Notes on accuracy
- Speed results vary by time, Wi‑Fi quality, routing, and device performance.
- ISP/location lookup uses a third-party API (`ipapi.co`) and is cached locally to reduce repeat calls.

### 1. Clone the repository
```bash
git clone https://github.com/iragavarapunagaatchutaneelima/Internet-Speed-Test.git
cd Internet-Speed-Test
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the development server
```bash
npm run dev
# → http://localhost:5173
```

### 4. Build for production
```bash
npm run build
npm run preview   # preview the production build locally
```

---

## 🐳 Docker Deployment

```bash
# Build the container
docker build -t orbitspeed .

# Run on port 80
docker run -p 80:80 orbitspeed

# With custom port
docker run -p 3000:80 orbitspeed
```

---

## ☁️ Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

The included `vercel.json` configures:
- SPA client-side routing rewrites
- Long-term asset cache headers (`max-age=31536000, immutable`)
- Security headers (`X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`)

### Scaling notes (10k+ concurrent users)
- This project builds to static assets, so Vercel/CDN scaling is typically not the bottleneck.
- Each user’s browser runs the measurement directly against third-party endpoints (Cloudflare/ipapi/httpbin).
- If you expect large spikes, consider proxying the ISP lookup behind your own endpoint to avoid `ipapi.co` rate limits (requires a backend/edge function and possibly an API key).

### Authentication (optional)
OrbitSpeed currently runs without accounts. If you want sign-in + cloud-synced history, add an auth provider (e.g., Clerk/Auth0/NextAuth) and store results in a database. Ask before implementing because it affects hosting and data handling.

---

## 📜 Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Build optimised production bundle |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint on all source files |

---

## 🎨 UI/UX Philosophy

OrbitSpeed was designed around three core principles:

1. **Data Clarity** — Every metric is immediately readable at a glance, using `JetBrains Mono` for numerical data and colour-coded quality indicators.
2. **Cinematic Motion** — Animations use `cubic-bezier` easing curves to feel physically accurate and never jarring.
3. **Zero Clutter** — The interface reveals information progressively — stats, quality score, and streaming grid only appear when you have data to show.

### Design Tokens
The entire design system is defined as CSS custom properties in `src/styles/design-tokens.css`, making it trivial to retheme. Key values:
- **Background**: `#08090f` deep space dark
- **Accent Cyan**: `#00d4ff` · **Accent Violet**: `#7c3aed`
- **Glass panels**: `rgba(255,255,255,.03)` + `backdrop-filter: blur(20px)`

---

## ⚡ Performance

| Metric | Target |
|---|---|
| Lighthouse Score | 95+ |
| First Contentful Paint | < 1.2s |
| Largest Contentful Paint | < 2.0s |
| Cumulative Layout Shift | < 0.05 |
| Bundle Size (gzipped) | ~68 KB JS + ~5 KB CSS |

### Optimisations Applied
- **Upload data**: `crypto.getRandomValues()` (GPU-accelerated, non-blocking main thread)
- **Download**: 3 parallel streams for accuracy on high-bandwidth connections
- **Ping**: 3-sample median with `HEAD` requests to minimise overhead
- **Fonts**: Loaded via Google Fonts CDN with `display=swap`
- **SVG gauge**: Pure CSS `stroke-dashoffset` animation — no JavaScript animation loops

---

## 🔒 Security

- **CSP meta tag** restricts scripts, styles, images, and connections to known safe origins
- **Security headers** via `vercel.json`: `X-Frame-Options: DENY`, `X-XSS-Protection`, `Referrer-Policy`
- **0 npm vulnerabilities** (`npm audit` clean)
- **No user data transmitted** — all measurements are point-to-point with Cloudflare

---

## 🗺️ Future Improvements

- [ ] WebSocket-based real-time jitter measurement
- [ ] Historical chart visualisation (line graph over time)
- [ ] Multiple server location selection
- [ ] Sharable result cards (PNG export)
- [ ] Dark/Light theme toggle
- [ ] Electron desktop app wrapper

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 👩‍💻 Credits

**Developed by Neelima**

Built with ❤️ using React, Vite, and Cloudflare Edge Networks.

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">
  <sub>⚡ OrbitSpeed · Built with Cloudflare Edge · 2026</sub>
</div>
