#!/usr/bin/env python3
"""
Remove confirmed dead links from arf.json.
Targets: DNS failures, connection refused, HTTP 404.
Leaves alone: .onion, 403 (bot-block), 5xx (transient), timeouts.
"""

import json
import sys

REPORT_PATH = "tools/link_audit_report.json"
ARF_PATH = "public/arf.json"


def get_dead_urls(report_path: str) -> set:
    with open(report_path) as f:
        report = json.load(f)

    dead_urls = set()
    for d in report["dead"]:
        url = d.get("url", "")
        err = d.get("error") or ""
        status = d.get("status")

        # Skip .onion (Tor hidden services - expected failure from clearnet)
        if ".onion" in url:
            continue
        # DNS failure = truly dead
        if "nodename nor servname" in err:
            dead_urls.add(url)
        # Connection refused = truly dead
        elif "Connection refused" in err:
            dead_urls.add(url)
        # 404 = page gone
        elif status == 404:
            dead_urls.add(url)

    return dead_urls


def remove_nodes(tree, dead_urls: set) -> tuple:
    """Recursively remove leaf nodes whose URL is dead. Returns (cleaned_tree, removed_count)."""
    removed = 0

    if not isinstance(tree, dict):
        return tree, 0

    children = tree.get("children", [])
    if not children:
        # Leaf node - check URL
        url = tree.get("url", "")
        if url in dead_urls:
            return None, 1
        return tree, 0

    # Non-leaf: recurse into children
    new_children = []
    for child in children:
        cleaned, n = remove_nodes(child, dead_urls)
        removed += n
        if cleaned is not None:
            new_children.append(cleaned)

    tree = dict(tree)
    tree["children"] = new_children
    return tree, removed


def main():
    dead_urls = get_dead_urls(REPORT_PATH)
    print(f"Confirmed dead URLs to remove: {len(dead_urls)}")

    with open(ARF_PATH) as f:
        data = json.load(f)

    cleaned, removed = remove_nodes(data, dead_urls)

    print(f"Removed {removed} nodes from arf.json")

    with open(ARF_PATH, "w") as f:
        json.dump(cleaned, f, indent=2, separators=(",", ": "))
        f.write("\n")

    print(f"Wrote cleaned data to {ARF_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
