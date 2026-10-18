#!/usr/bin/env python3
"""
Extract every tool URL from arf.json for the CI link check.

Template URLs (search patterns the user fills in, such as
https://ask.fm/<username>) are skipped: the literal URL was never meant to
load, so checking it only produces false "dead link" reports.
"""

import json
import re
import sys

ARF_PATH = "public/arf.json"
OUT_PATH = "urls.txt"

# <username>, <searchterm>, <domain.com> etc., raw or percent-encoded
PLACEHOLDER = re.compile(r"<[^>]*>|%3C.*?%3E", re.IGNORECASE)

# Templates that don't use angle brackets
TEMPLATE_URLS = {
    "https://www.facebook.com/photo.php?fbid=PHOTO-ID-HERE",
    "https://api.opencnam.com/v2/phone/+19073372323",  # sample number, needs an API key
}


def is_template(url):
    return bool(PLACEHOLDER.search(url)) or url in TEMPLATE_URLS


def extract_urls(node):
    urls = []
    url = node.get("url", "")
    if url and url.startswith("http"):
        urls.append(url)
    for child in node.get("children", []):
        urls.extend(extract_urls(child))
    return urls


def main():
    with open(ARF_PATH) as f:
        data = json.load(f)

    urls = extract_urls(data)
    templates = [u for u in urls if is_template(u)]
    checked = [u for u in urls if not is_template(u)]

    print(f"Found {len(urls)} URLs, skipping {len(templates)} template URLs:", file=sys.stderr)
    for u in templates:
        print(f"  skip {u}", file=sys.stderr)

    with open(OUT_PATH, "w") as f:
        f.write("\n".join(checked))


if __name__ == "__main__":
    main()
