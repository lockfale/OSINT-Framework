#!/usr/bin/env python3
"""Apply safe redirect URL updates from link_audit_report.json to arf.json (THE-8)."""

import json
import re
from urllib.parse import urlparse
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
REPORT_PATH = SCRIPT_DIR / "link_audit_report.json"
ARF_PATH = SCRIPT_DIR.parent / "public" / "arf.json"

# Parked/spam domain prefixes
PARKED_PREFIXES = ("ww1.", "ww2.", "ww3.", "ww4.", "ww5.", "ww7.", "ww12.", "ww25.", "ww38.")

# Login/auth path indicators
LOGIN_INDICATORS = ("login", "signin", "sign-in", "sign_in", "auth", "sso", "oauth", "cas/login", "saml",
                    "challenge")

# Known paywall/subscription indicators in path
PAYWALL_INDICATORS = ("subscribe", "subscription", "pricing", "plans", "checkout", "purchase", "paywall")

# Specific redirects to skip (manual review needed - destination is wrong/degraded)
MANUAL_SKIP = {
    # Specific tool page -> generic corporate homepage
    "https://academic.microsoft.com/": "redirects to generic microsoft.com homepage",
    # Specific page -> unrelated generic page
    "https://getfirebug.com/downloads/": "Firebug is discontinued, redirect to index is not useful",
    # Mobile redirect
    "https://vk.com/": "redirects to mobile site m.vk.com instead of desktop",
    # thatsthem challenge pages
    "https://thatsthem.com/name-address-search": "redirects to challenge/captcha gate",
    "https://thatsthem.com/reverse-email-lookup": "redirects to challenge/captcha gate",
    # Google News advanced search -> generic homepage
    "https://news.google.com/news/advanced_news_search?": "advanced search removed, redirects to generic homepage",
    # Portswigger duplicate - both URLs go to same place
    "https://portswigger.net/burp/download.html": "same destination as existing /burp entry",
    # secai domain change that needs verification
    "https://secai.ai/research": "subdomain change to i.secai.ai needs verification",
}


def extract_domain(url):
    """Extract the registered domain (without subdomains like www)."""
    parsed = urlparse(url)
    hostname = parsed.hostname or ""
    # Strip www. prefix for comparison
    if hostname.startswith("www."):
        hostname = hostname[4:]
    return hostname


def is_parked_domain(url):
    """Check if URL points to a parked/spam domain."""
    parsed = urlparse(url)
    hostname = parsed.hostname or ""
    return any(hostname.startswith(p) for p in PARKED_PREFIXES)


def is_login_page(url):
    """Check if URL points to a login/auth page."""
    parsed = urlparse(url)
    path = (parsed.path + "?" + parsed.query).lower()
    return any(indicator in path for indicator in LOGIN_INDICATORS)


def is_paywall_page(url):
    """Check if URL points to a paywall/subscription page."""
    parsed = urlparse(url)
    path = parsed.path.lower()
    return any(indicator in path for indicator in PAYWALL_INDICATORS)


def is_generic_homepage_redirect(original_url, final_url):
    """Check if a specific page redirects to a generic homepage on a different path."""
    orig = urlparse(original_url)
    final = urlparse(final_url)

    # Same domain check - if original had a specific path but final is just /
    orig_path = orig.path.rstrip("/")
    final_path = final.path.rstrip("/")

    # Original had a meaningful path, final is root
    if orig_path and len(orig_path) > 1 and (not final_path or final_path == ""):
        # Only flag if they share the same base domain
        orig_domain = extract_domain(original_url)
        final_domain = extract_domain(final_url)
        if orig_domain == final_domain:
            return True
    return False


def is_cross_domain_redirect(original_url, final_url):
    """Check if redirect goes to a completely different domain."""
    orig_domain = extract_domain(original_url)
    final_domain = extract_domain(final_url)

    if not orig_domain or not final_domain:
        return True

    # Allow same domain
    if orig_domain == final_domain:
        return False

    # Allow common subdomain variations (e.g., app.foo.com -> foo.com or foo.com -> www.foo.com)
    if orig_domain.endswith("." + final_domain) or final_domain.endswith("." + orig_domain):
        return False

    # Different domain entirely
    return True


def collect_urls(node):
    """Collect all URLs in the arf.json tree, returning a set."""
    urls = set()
    if node.get("url"):
        urls.add(node["url"])
    for child in node.get("children", []):
        urls.update(collect_urls(child))
    return urls


def replace_url_in_tree(node, old_url, new_url):
    """Replace old_url with new_url in tree. Returns count of replacements."""
    count = 0
    if node.get("url") == old_url:
        node["url"] = new_url
        count += 1
    for child in node.get("children", []):
        count += replace_url_in_tree(child, old_url, new_url)
    return count


def main():
    with open(REPORT_PATH, "r", encoding="utf-8") as f:
        report = json.load(f)

    with open(ARF_PATH, "r", encoding="utf-8") as f:
        arf = json.load(f)

    redirects = report.get("redirected", [])
    existing_urls = collect_urls(arf)

    updated = []
    skipped_not_in_arf = []
    skipped_empty = []
    skipped_login = []
    skipped_paywall = []
    skipped_parked = []
    skipped_homepage = []
    skipped_cross_domain = []
    skipped_manual = []

    for entry in redirects:
        old_url = entry.get("url", "")
        final_url = entry.get("final_url", "")

        # Skip if old URL not in arf.json
        if old_url not in existing_urls:
            skipped_not_in_arf.append(old_url)
            continue

        # Skip manual review entries
        if old_url in MANUAL_SKIP:
            skipped_manual.append((old_url, final_url, MANUAL_SKIP[old_url]))
            continue

        # Skip empty/null final_url
        if not final_url:
            skipped_empty.append((old_url, final_url))
            continue

        # Skip parked domains
        if is_parked_domain(final_url):
            skipped_parked.append((old_url, final_url))
            continue

        # Skip login pages
        if is_login_page(final_url):
            skipped_login.append((old_url, final_url))
            continue

        # Skip paywall pages
        if is_paywall_page(final_url):
            skipped_paywall.append((old_url, final_url))
            continue

        # Skip generic homepage redirects
        if is_generic_homepage_redirect(old_url, final_url):
            skipped_homepage.append((old_url, final_url))
            continue

        # Skip suspicious cross-domain redirects
        if is_cross_domain_redirect(old_url, final_url):
            skipped_cross_domain.append((old_url, final_url))
            continue

        # Safe to update
        count = replace_url_in_tree(arf, old_url, final_url)
        if count > 0:
            updated.append((old_url, final_url))

    # Write back
    with open(ARF_PATH, "w", encoding="utf-8") as f:
        json.dump(arf, f, indent=2, ensure_ascii=False)
        f.write("\n")  # trailing newline

    # Summary
    print("=" * 70)
    print("REDIRECT URL UPDATE SUMMARY (THE-8)")
    print("=" * 70)

    print(f"\nTotal redirects in report: {len(redirects)}")
    print(f"Already applied (not in arf.json): {len(skipped_not_in_arf)}")
    print(f"Safe updates applied: {len(updated)}")

    print(f"\n--- SKIPPED (needs manual review) ---")
    print(f"Manual review entries: {len(skipped_manual)}")
    print(f"Empty/null final_url: {len(skipped_empty)}")
    print(f"Login/auth pages: {len(skipped_login)}")
    print(f"Paywall/subscription: {len(skipped_paywall)}")
    print(f"Parked/spam domains: {len(skipped_parked)}")
    print(f"Generic homepage redirect: {len(skipped_homepage)}")
    print(f"Cross-domain redirect: {len(skipped_cross_domain)}")

    if updated:
        print(f"\n--- APPLIED UPDATES ({len(updated)}) ---")
        for old, new in sorted(updated):
            print(f"  {old}")
            print(f"    -> {new}")

    if skipped_manual:
        print(f"\n--- SKIPPED: Manual review ({len(skipped_manual)}) ---")
        for old, new, reason in sorted(skipped_manual):
            print(f"  {old} -> {new}")
            print(f"    Reason: {reason}")

    if skipped_empty:
        print(f"\n--- SKIPPED: Empty final_url ({len(skipped_empty)}) ---")
        for old, new in sorted(skipped_empty):
            print(f"  {old}")

    if skipped_login:
        print(f"\n--- SKIPPED: Login pages ({len(skipped_login)}) ---")
        for old, new in sorted(skipped_login):
            print(f"  {old} -> {new}")

    if skipped_paywall:
        print(f"\n--- SKIPPED: Paywall ({len(skipped_paywall)}) ---")
        for old, new in sorted(skipped_paywall):
            print(f"  {old} -> {new}")

    if skipped_parked:
        print(f"\n--- SKIPPED: Parked domains ({len(skipped_parked)}) ---")
        for old, new in sorted(skipped_parked):
            print(f"  {old} -> {new}")

    if skipped_homepage:
        print(f"\n--- SKIPPED: Generic homepage ({len(skipped_homepage)}) ---")
        for old, new in sorted(skipped_homepage):
            print(f"  {old} -> {new}")

    if skipped_cross_domain:
        print(f"\n--- SKIPPED: Cross-domain ({len(skipped_cross_domain)}) ---")
        for old, new in sorted(skipped_cross_domain):
            print(f"  {old} -> {new}")


if __name__ == "__main__":
    main()
