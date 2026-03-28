#!/usr/bin/env python3
import json
import sys

def merge_enrichment_into_node(node, enrichments):
    """Recursively search and merge enrichment data into matching nodes."""
    if isinstance(node, dict):
        if "name" in node and node["name"] in enrichments:
            # Found a matching tool, merge enrichment data
            enrichment = enrichments[node["name"]]
            for key, value in enrichment.items():
                node[key] = value

        # Recursively process children
        if "children" in node and isinstance(node["children"], list):
            for child in node["children"]:
                merge_enrichment_into_node(child, enrichments)

def main():
    # Load enrichment data
    with open("enrichment-batch4-domains.json", "r") as f:
        enrichment_data = json.load(f)

    enrichments = enrichment_data["enrichments"]

    # Load arf.json
    with open("public/arf.json", "r") as f:
        arf_data = json.load(f)

    # Merge enrichment data into arf.json
    merge_enrichment_into_node(arf_data, enrichments)

    # Write the updated arf.json
    with open("public/arf.json", "w") as f:
        json.dump(arf_data, f, indent=2)

    print(f"Successfully merged enrichment data for {len(enrichments)} tools")
    print("Updated public/arf.json")

if __name__ == "__main__":
    main()
