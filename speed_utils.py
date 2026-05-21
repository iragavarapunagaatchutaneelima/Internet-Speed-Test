"""
OrbitSpeed — Python utility functions.

Handles:
  - Connection quality grade calculation (A+ → F)
  - Streaming platform support evaluation
  - ISP / geolocation fetching (server-side, with in-memory cache)
  - Speed value formatting

All logic that was previously in React components / JS utils is now
centralised and unit-testable in pure Python.
"""

import time
from typing import Optional

try:
    import requests as _requests
    _REQUESTS_AVAILABLE = True
except ImportError:
    _REQUESTS_AVAILABLE = False
    import urllib.request
    import json as _json


# ─── In-memory ISP cache (6-hour TTL) ──────────────────────────────────────
_ISP_CACHE: dict = {}
_ISP_CACHE_TTL = 6 * 60 * 60  # seconds


# ─── Streaming platform definitions ────────────────────────────────────────
STREAMING_PLATFORMS = [
    {
        "id": "netflix",
        "name": "Netflix",
        "icon": "🎬",
        "tiers": [
            {"label": "4K Ultra HD",    "mbps": 25},
            {"label": "1080p Full HD",  "mbps": 5},
            {"label": "720p HD",        "mbps": 3},
            {"label": "SD",             "mbps": 1},
        ],
    },
    {
        "id": "youtube",
        "name": "YouTube",
        "icon": "▶",
        "tiers": [
            {"label": "4K (60fps)",  "mbps": 20},
            {"label": "1080p HD",   "mbps": 5},
            {"label": "720p HD",    "mbps": 2.5},
            {"label": "480p SD",    "mbps": 1.1},
        ],
    },
    {
        "id": "zoom",
        "name": "Video Calls",
        "icon": "📹",
        "tiers": [
            {"label": "HD Group",   "mbps": 3},
            {"label": "720p 1-on-1","mbps": 1.8},
            {"label": "Standard",   "mbps": 0.6},
        ],
    },
    {
        "id": "gaming",
        "name": "Cloud Gaming",
        "icon": "🎮",
        "tiers": [
            {"label": "4K 60fps",       "mbps": 45},
            {"label": "1080p 60fps",    "mbps": 20},
            {"label": "720p 60fps",     "mbps": 10},
            {"label": "Standard",       "mbps": 5},
        ],
    },
]


def calculate_quality(download: float, upload: float, ping: float) -> dict:
    """
    Calculate a letter-grade connection quality score from test results.

    Scoring weights:
      Download : 40%   (excellent threshold = 100 Mbps)
      Upload   : 30%   (excellent threshold = 50 Mbps)
      Ping     : 30%   (lower is better;  excellent < 20 ms)

    Returns a dict: { grade, label, color, score }
    """
    if not any([download, upload, ping]):
        return {"grade": "—", "label": "No Data", "color": "#6b7280", "score": 0}

    dl_score   = min(100.0, (download / 100) * 100)
    ul_score   = min(100.0, (upload   / 50)  * 100)
    ping_score = max(0.0, 100 - (ping / 200) * 100) if ping else 0.0

    weighted = dl_score * 0.4 + ul_score * 0.3 + ping_score * 0.3
    score    = round(weighted)

    if score >= 90:
        return {"grade": "A+", "label": "Excellent",  "color": "#10B981", "score": score}
    if score >= 80:
        return {"grade": "A",  "label": "Great",      "color": "#10B981", "score": score}
    if score >= 70:
        return {"grade": "B",  "label": "Good",       "color": "#38BDF8", "score": score}
    if score >= 55:
        return {"grade": "C",  "label": "Fair",       "color": "#F59E0B", "score": score}
    if score >= 35:
        return {"grade": "D",  "label": "Poor",       "color": "#F97316", "score": score}
    return     {"grade": "F",  "label": "Very Poor",  "color": "#EF4444", "score": score}


def get_streaming_support(download_mbps: float) -> list:
    """
    Evaluate which streaming quality tier is achievable for each platform
    given the measured download speed (Mbps).

    Returns a list of dicts: { id, name, icon, best, supported }
    """
    result = []
    for platform in STREAMING_PLATFORMS:
        best = next(
            (tier for tier in platform["tiers"] if download_mbps >= tier["mbps"]),
            None,
        )
        result.append({
            "id":        platform["id"],
            "name":      platform["name"],
            "icon":      platform["icon"],
            "best":      best["label"] if best else "Not Supported",
            "supported": best is not None,
        })
    return result


def fetch_ip_info(client_ip: Optional[str] = None) -> dict:
    """
    Fetch ISP, city, country, and IP info for a given IP address from ipapi.co.
    Results are cached in-memory for 6 hours to reduce external API calls.
    Falls back to a neutral default dict on any network or parse error.
    """
    cache_key = client_ip or "_self"
    cached = _ISP_CACHE.get(cache_key)
    if cached and (time.time() - cached["ts"]) < _ISP_CACHE_TTL:
        return cached["data"]

    url = (
        f"https://ipapi.co/{client_ip}/json/"
        if client_ip and client_ip not in ("127.0.0.1", "::1")
        else "https://ipapi.co/json/"
    )

    try:
        if _REQUESTS_AVAILABLE:
            resp = _requests.get(url, timeout=6)
            resp.raise_for_status()
            raw = resp.json()
        else:
            with urllib.request.urlopen(url, timeout=6) as r:
                raw = _json.loads(r.read())

        data = {
            "isp":     raw.get("org") or raw.get("asn") or "Unknown ISP",
            "city":    raw.get("city", ""),
            "country": raw.get("country_name", ""),
            "ip":      raw.get("ip", client_ip or ""),
            "flag": (
                f"https://flagcdn.com/24x18/{raw['country_code'].lower()}.png"
                if raw.get("country_code") else None
            ),
        }
    except Exception as exc:
        print(f"[OrbitSpeed] IP info fetch failed: {exc}")
        data = {
            "isp": "Unknown ISP", "city": "", "country": "",
            "ip": client_ip or "", "flag": None,
        }

    _ISP_CACHE[cache_key] = {"ts": time.time(), "data": data}
    return data


def format_speed(mbps: float, unit: str = "mbps") -> str:
    """
    Format a speed value in Mbps to the requested display unit string.
    Units: 'mbps' | 'mbs' (MB/s) | 'kbs' (KB/s)
    """
    if not mbps or mbps < 0:
        return "0.00"
    if unit == "mbs":
        return f"{mbps / 8:.2f}"
    if unit == "kbs":
        return f"{(mbps * 1000) / 8:.0f}"
    return f"{mbps:.2f}"
