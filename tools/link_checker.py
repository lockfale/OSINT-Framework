#!/usr/bin/env python3
"""
Dead link checker for arf.json.
Extracts all URLs, checks HTTP status, and reports dead/redirected/slow links.
"""

import json
import re
import sys
import time
import urllib.request
import urllib.error
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from typing import Optional
import ssl

TIMEOUT = 30
MAX_WORKERS = 20
SLOW_THRESHOLD = 10  # seconds

# Skip these domains known to block bots or require auth
SKIP_DOMAINS = set()

# User agent to avoid some bot blocks
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; OSINT-Framework-LinkChecker/1.0; +https://osintframework.com)"
}


@dataclass
class LinkResult:
    url: str
    status: Optional[int] = None
    final_url: Optional[str] = None
    elapsed: float = 0.0
    error: Optional[str] = None

    @property
    def is_dead(self):
        if self.error and "404" not in str(self.error):
            return True
        return self.status is not None and self.status >= 400

    @property
    def is_redirect(self):
        return self.final_url and self.final_url != self.url

    @property
    def is_slow(self):
        return self.elapsed >= SLOW_THRESHOLD


def check_url(url: str) -> LinkResult:
    result = LinkResult(url=url)
    start = time.time()
    try:
        # Build request with headers
        req = urllib.request.Request(url, headers=HEADERS)
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        with urllib.request.urlopen(req, timeout=TIMEOUT, context=ctx) as resp:
            result.status = resp.status
            result.final_url = resp.url
    except urllib.error.HTTPError as e:
        result.status = e.code
        result.error = str(e)
    except urllib.error.URLError as e:
        result.error = str(e.reason)
    except Exception as e:
        result.error = str(e)
    finally:
        result.elapsed = time.time() - start
    return result


def extract_urls(json_path: str) -> list[str]:
    with open(json_path) as f:
        raw = f.read()
    urls = re.findall(r'https?://[^\s"\'<>]+', raw)
    # Clean trailing punctuation
    cleaned = []
    for u in urls:
        u = u.rstrip(".,;:)'\"")
        cleaned.append(u)
    return sorted(set(cleaned))


def main():
    json_path = "public/arf.json"
    urls = extract_urls(json_path)
    total = len(urls)
    print(f"Checking {total} unique URLs (timeout={TIMEOUT}s, workers={MAX_WORKERS})...\n")

    results = []
    completed = 0

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_url = {executor.submit(check_url, url): url for url in urls}
        for future in as_completed(future_to_url):
            result = future.result()
            results.append(result)
            completed += 1
            if completed % 50 == 0:
                print(f"  Progress: {completed}/{total}", flush=True)

    # Sort results by URL for consistent output
    results.sort(key=lambda r: r.url)

    dead = [r for r in results if r.is_dead]
    redirected = [r for r in results if r.is_redirect and not r.is_dead]
    slow = [r for r in results if r.is_slow and not r.is_dead]
    ok = [r for r in results if not r.is_dead and not r.is_slow]

    print("\n" + "=" * 70)
    print(f"LINK AUDIT REPORT")
    print("=" * 70)
    print(f"Total URLs checked : {total}")
    print(f"OK                 : {len(ok)}")
    print(f"Dead (errors/404+) : {len(dead)}")
    print(f"Redirected         : {len(redirected)}")
    print(f"Slow (>{SLOW_THRESHOLD}s)        : {len(slow)}")
    print()

    if dead:
        print("=" * 70)
        print(f"DEAD LINKS ({len(dead)})")
        print("=" * 70)
        for r in dead:
            status_str = f"HTTP {r.status}" if r.status else f"ERROR: {r.error}"
            print(f"  [{status_str}] {r.url}")
        print()

    if redirected:
        print("=" * 70)
        print(f"REDIRECTED LINKS ({len(redirected)})")
        print("=" * 70)
        for r in redirected:
            print(f"  [HTTP {r.status}] {r.url}")
            print(f"    -> {r.final_url}")
        print()

    if slow:
        print("=" * 70)
        print(f"SLOW LINKS (>{SLOW_THRESHOLD}s) ({len(slow)})")
        print("=" * 70)
        for r in slow:
            print(f"  [{r.elapsed:.1f}s] {r.url}")
        print()

    # Write JSON report
    report = {
        "summary": {
            "total": total,
            "ok": len(ok),
            "dead": len(dead),
            "redirected": len(redirected),
            "slow": len(slow),
        },
        "dead": [{"url": r.url, "status": r.status, "error": r.error} for r in dead],
        "redirected": [{"url": r.url, "status": r.status, "final_url": r.final_url} for r in redirected],
        "slow": [{"url": r.url, "elapsed": round(r.elapsed, 2)} for r in slow],
    }

    report_path = "tools/link_audit_report.json"
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)
    print(f"Full report written to: {report_path}")

    return len(dead)


if __name__ == "__main__":
    sys.exit(main())
