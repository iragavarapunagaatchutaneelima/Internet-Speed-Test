# OrbitSpeed - Internet Speed Test

A Flask-powered internet speed test dashboard with live ping, download, upload, ISP lookup, quality scoring, streaming support, and SQLite-backed test history.

[Live Demo](https://internet-speed-test-sage.vercel.app/) · [Report Bug](https://github.com/iragavarapunagaatchutaneelima/Internet-Speed-Test/issues)

## Features

| Feature | Details |
|---|---|
| Speed testing | Measures ping, download, and upload through Flask API endpoints |
| ISP detection | Fetches public IP, ISP, city, and country server-side |
| Quality score | Computes a connection grade from download, upload, and ping |
| Streaming support | Estimates suitability for video calls, streaming, and cloud gaming |
| Test history | Stores recent results in SQLite |
| Responsive UI | Serves the same polished interface shown on `localhost:5000` |

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, Flask |
| Frontend | Jinja2 template, static CSS, vanilla JavaScript |
| Storage | SQLite |
| Deployment | Vercel Python serverless |

## Project Structure

```text
Internet-Speed-Test/
├── api/
│   └── index.py              # Vercel Python entry point
├── static/
│   ├── css/style.css         # App styling
│   └── js/                   # Gauge, UI, and speed-test logic
├── templates/
│   └── index.html            # Flask-rendered app page
├── app.py                    # Flask routes and API endpoints
├── database.py               # SQLite history helpers
├── speed_utils.py            # Quality, streaming, and IP helpers
├── requirements.txt          # Python dependencies
├── vercel.json               # Vercel Flask deployment config
└── Dockerfile                # Python container runtime
```

## Run Locally

```bash
pip install -r requirements.txt
python app.py
```

Open [http://localhost:5000](http://localhost:5000).

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Renders the OrbitSpeed dashboard |
| `GET` | `/api/test/ping` | Low-latency ping response |
| `GET` | `/api/test/download?bytes=N` | Streams random bytes for download testing |
| `POST` | `/api/test/upload` | Receives upload test payload |
| `GET` | `/api/info` | Returns ISP and location details |
| `GET` | `/api/quality` | Returns weighted quality grade |
| `GET` | `/api/streaming` | Returns streaming support tiers |
| `GET` | `/api/history` | Lists recent saved results |
| `POST` | `/api/history` | Saves one result |
| `DELETE` | `/api/history` | Clears saved history |

## Deploy

The app is configured for Vercel with `api/index.py` and `vercel.json`.

```bash
npx vercel deploy --prod
```

## Author

Developed by Neelima.

## License

This project is licensed under the MIT License.
