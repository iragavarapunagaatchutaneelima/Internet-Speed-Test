"""
OrbitSpeed — Flask Web Application (Main Entry Point)

Routes served:
  GET  /                          Render the main HTML page (Jinja2)
  GET  /api/test/ping             Ultra-low-latency echo for RTT measurement
  GET  /api/test/download?bytes=N Stream N random bytes (download measurement)
  POST /api/test/upload           Receive raw bytes (upload measurement)
  GET  /api/info                  ISP + geolocation (fetched server-side, cached)
  GET  /api/quality               Letter-grade quality score (pure Python)
  GET  /api/streaming             Streaming platform support (pure Python)
  GET  /api/history               Retrieve saved test results from SQLite
  POST /api/history               Save a completed test result to SQLite
  DELETE /api/history             Clear all history from SQLite

Python IS the backend: it generates random bytes for download tests,
receives bytes for upload tests, and owns all business logic.
"""

import os
import time
from datetime import datetime

from flask import (
    Flask, render_template, jsonify,
    request, Response, stream_with_context,
)

from database   import init_db, save_result, get_history, clear_history
from speed_utils import calculate_quality, get_streaming_support, fetch_ip_info

# ── App setup ──────────────────────────────────────────────────────────────
app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False

# Initialise SQLite schema on startup (creates DB file if absent)
init_db()


# ── Helpers ────────────────────────────────────────────────────────────────
def _cors(resp: Response) -> Response:
    resp.headers["Access-Control-Allow-Origin"] = "*"
    return resp


def _get_client_ip() -> str:
    """Extract the real client IP from forwarded headers or REMOTE_ADDR."""
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    else:
        ip = request.remote_addr or ""
    return ip


# ── Page ───────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    """Render the main single-page application template."""
    return render_template("index.html", year=datetime.now().year)


# ── Ping ───────────────────────────────────────────────────────────────────
@app.route("/api/test/ping")
def api_ping():
    """
    Minimal latency-echo endpoint.
    The JS client records the full round-trip time using performance.now()
    and calls this endpoint multiple times, returning the median.
    """
    return _cors(jsonify({"ts": time.time(), "ok": True}))


# ── Download ───────────────────────────────────────────────────────────────
@app.route("/api/test/download")
def api_download():
    """
    Stream N bytes of cryptographically random data to the browser.
    The client measures elapsed time vs bytes received to derive Mbps.

    Query param:
      bytes (int): how many bytes to stream (default 10 MB, max 100 MB)
    """
    try:
        total = int(request.args.get("bytes", 10_000_000))
        total = max(1, min(total, 100_000_000))   # clamp 1 B – 100 MB
    except (ValueError, TypeError):
        total = 10_000_000

    chunk = 65_536  # 64 KB per chunk — balances throughput vs. memory

    def _generate():
        sent = 0
        while sent < total:
            size = min(chunk, total - sent)
            yield os.urandom(size)
            sent += size

    headers = {
        "Content-Type":   "application/octet-stream",
        "Content-Length": str(total),
        "Cache-Control":  "no-store, no-cache",
        "Access-Control-Allow-Origin": "*",
    }
    return Response(
        stream_with_context(_generate()),
        headers=headers,
        status=200,
    )


# ── Upload ─────────────────────────────────────────────────────────────────
@app.route("/api/test/upload", methods=["POST", "OPTIONS"])
def api_upload():
    """
    Receive raw bytes POSTed by the browser for upload measurement.
    The client uses XHR upload-progress events to track live Mbps.
    Returns confirmed byte count so the client can verify integrity.
    """
    if request.method == "OPTIONS":
        resp = Response("", status=204)
        resp.headers["Access-Control-Allow-Origin"]  = "*"
        resp.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
        return resp

    data = request.get_data()
    resp = jsonify({"received": len(data), "ok": True})
    return _cors(resp)


# ── ISP / Geo Info ─────────────────────────────────────────────────────────
@app.route("/api/info")
def api_info():
    """
    Return ISP, city, country, flag URL, and IP for the connecting client.
    Fetched server-side from ipapi.co with a 6-hour in-memory cache.
    """
    client_ip = _get_client_ip()
    data = fetch_ip_info(client_ip)
    return _cors(jsonify(data))


# ── Quality Score ──────────────────────────────────────────────────────────
@app.route("/api/quality")
def api_quality():
    """
    Calculate a letter-grade connection quality score in pure Python.

    Query params:
      download (float): Mbps
      upload   (float): Mbps
      ping     (float): ms
    """
    try:
        dl   = float(request.args.get("download", 0))
        ul   = float(request.args.get("upload",   0))
        ping = float(request.args.get("ping",     0))
    except (ValueError, TypeError):
        return _cors(jsonify({"error": "Invalid parameters"})), 400

    result = calculate_quality(dl, ul, ping)
    return _cors(jsonify(result))


# ── Streaming Support ──────────────────────────────────────────────────────
@app.route("/api/streaming")
def api_streaming():
    """
    Evaluate streaming platform quality tiers in pure Python.

    Query param:
      download (float): measured download speed in Mbps
    """
    try:
        dl = float(request.args.get("download", 0))
    except (ValueError, TypeError):
        return _cors(jsonify({"error": "Invalid parameter"})), 400

    result = get_streaming_support(dl)
    return _cors(jsonify(result))


# ── History — GET ──────────────────────────────────────────────────────────
@app.route("/api/history", methods=["GET"])
def api_history_get():
    """Return up to 50 most recent test results from SQLite."""
    rows = get_history(limit=50)
    return _cors(jsonify(rows))


# ── History — POST ─────────────────────────────────────────────────────────
@app.route("/api/history", methods=["POST"])
def api_history_post():
    """Save a completed test result to SQLite."""
    body = request.get_json(force=True, silent=True) or {}
    save_result(
        ping     = body.get("ping"),
        download = body.get("download"),
        upload   = body.get("upload"),
        isp      = body.get("isp",     ""),
        city     = body.get("city",    ""),
        country  = body.get("country", ""),
        ip       = body.get("ip",      ""),
    )
    return _cors(jsonify({"ok": True})), 201


# ── History — DELETE ───────────────────────────────────────────────────────
@app.route("/api/history", methods=["DELETE"])
def api_history_delete():
    """Clear all test history from SQLite."""
    clear_history()
    return _cors(jsonify({"ok": True}))


# ── Entry Point ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port  = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_ENV", "development") == "development"
    print(f"\n  [OrbitSpeed] Running at http://localhost:{port}")
    print(f"  [OrbitSpeed] History DB: speed_history.db")
    print(f"  [OrbitSpeed] Debug mode: {debug}\n")
    app.run(host="0.0.0.0", port=port, debug=debug, threaded=True)
