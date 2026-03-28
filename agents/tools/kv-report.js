#!/usr/bin/env node
/**
 * KV Click Report — Top tools per category
 *
 * Pulls click data from the live OSINT Framework API (/api/tool-stats),
 * cross-references with arf.json categories, and prints a sorted report.
 *
 * Usage:
 *   node agents/tools/kv-report.js                # top 5 per category (default)
 *   node agents/tools/kv-report.js --top 10       # top 10 per category
 *   node agents/tools/kv-report.js --csv          # output as CSV
 *   node agents/tools/kv-report.js --json         # output as JSON
 *   node agents/tools/kv-report.js --all-keys     # dump all key-value pairs as CSV
 *   node agents/tools/kv-report.js --rating-report # all tools by category, sorted by star rating
 */

const fs = require("fs");
const path = require("path");

const API_BASE = "https://osintframework.com";

// --- Parse args ---
const args = process.argv.slice(2);
const topN = (() => {
  const idx = args.indexOf("--top");
  return idx !== -1 && args[idx + 1] ? parseInt(args[idx + 1], 10) : 5;
})();
const outputCsv = args.includes("--csv");
const outputJson = args.includes("--json");
const allKeys = args.includes("--all-keys");
const ratingReport = args.includes("--rating-report");

// --- Build tool list from arf.json ---
function extractTools(node, ancestors = []) {
  const tools = [];
  if (!node.children) return tools;

  for (const child of node.children) {
    const currentPath = [...ancestors, node.name];
    if (child.type === "url" && child.name) {
      const cleanName = child.name.replace(/\s*\([TDRM]\)\s*$/, "").trim();
      const topCategory = currentPath.length > 1 ? currentPath[1] : node.name;
      const breadcrumb = currentPath.slice(1).join(" > ");
      tools.push({ cleanName, topCategory, breadcrumb, originalName: child.name });
    }
    if (child.children) {
      tools.push(...extractTools(child, currentPath));
    }
  }
  return tools;
}

async function fetchStats(toolId) {
  const url = `${API_BASE}/api/tool-stats?tool_id=${encodeURIComponent(toolId)}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

// --- Main ---
async function main() {
  // Load arf.json (try repo public/ first, then fall back to relative)
  const arfPaths = [
    path.resolve(__dirname, "../../public/arf.json"),
    path.resolve(__dirname, "../public/arf.json"),
  ];
  let arfPath;
  for (const p of arfPaths) {
    if (fs.existsSync(p)) { arfPath = p; break; }
  }
  if (!arfPath) {
    console.error("Cannot find arf.json");
    process.exit(1);
  }

  const arf = JSON.parse(fs.readFileSync(arfPath, "utf8"));
  const tools = extractTools(arf);
  const uniqueTools = [...new Map(tools.map(t => [t.cleanName, t])).values()];

  console.error(`Found ${uniqueTools.length} tools in arf.json. Fetching stats from live API...`);

  // Fetch in batches of 10 to avoid hammering the API
  const BATCH_SIZE = 10;
  const results = [];
  for (let i = 0; i < uniqueTools.length; i += BATCH_SIZE) {
    const batch = uniqueTools.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (tool) => {
        const stats = await fetchStats(tool.cleanName);
        return { ...tool, stats };
      })
    );
    results.push(...batchResults);
    if (i + BATCH_SIZE < uniqueTools.length) {
      process.stderr.write(`  ${Math.min(i + BATCH_SIZE, uniqueTools.length)}/${uniqueTools.length}...\r`);
    }
  }
  console.error(`  ${uniqueTools.length}/${uniqueTools.length} done.`);

  // Filter to tools with at least 1 click
  const withClicks = results.filter(r => r.stats && r.stats.clicks > 0);

  // --- All keys mode ---
  if (allKeys) {
    console.log("tool_id,clicks,rating_avg,rating_count,category,path");
    for (const r of withClicks.sort((a, b) => b.stats.clicks - a.stats.clicks)) {
      const esc = (s) => `"${s.replace(/"/g, '""')}"`;
      const rat = r.stats.ratings || { average: 0, count: 0 };
      console.log(
        `${esc(r.cleanName)},${r.stats.clicks},${rat.average},${rat.count},${esc(r.topCategory)},${esc(r.breadcrumb)}`
      );
    }
    return;
  }

  // --- Rating report mode: all tools by category, sorted by star rating ---
  if (ratingReport) {
    // Include all tools (even those with no clicks/ratings)
    const allWithStats = results.map(r => {
      const rat = (r.stats && r.stats.ratings) || { average: 0, count: 0 };
      const clicks = (r.stats && r.stats.clicks) || 0;
      return { ...r, ratingAvg: rat.average, ratingCount: rat.count, clicks };
    });

    // Group by top-level category
    const byCategory = {};
    for (const r of allWithStats) {
      if (!byCategory[r.topCategory]) byCategory[r.topCategory] = [];
      byCategory[r.topCategory].push(r);
    }

    // Sort within each category: by rating desc, then rating count desc, then clicks desc
    for (const cat of Object.keys(byCategory)) {
      byCategory[cat].sort((a, b) =>
        b.ratingAvg - a.ratingAvg ||
        b.ratingCount - a.ratingCount ||
        b.clicks - a.clicks
      );
    }

    // Sort categories alphabetically
    const sortedCats = Object.entries(byCategory).sort((a, b) => a[0].localeCompare(b[0]));

    if (outputCsv) {
      console.log("category,tool,rating_avg,rating_count,clicks,path");
      for (const [cat, items] of sortedCats) {
        for (const r of items) {
          const esc = (s) => `"${s.replace(/"/g, '""')}"`;
          console.log(
            `${esc(cat)},${esc(r.cleanName)},${r.ratingAvg},${r.ratingCount},${r.clicks},${esc(r.breadcrumb)}`
          );
        }
      }
      return;
    }

    if (outputJson) {
      const result = {};
      for (const [cat, items] of sortedCats) {
        result[cat] = items.map(r => ({
          tool: r.cleanName,
          rating: r.ratingAvg,
          ratingCount: r.ratingCount,
          clicks: r.clicks,
          path: r.breadcrumb,
        }));
      }
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    // Default: table output
    const rated = allWithStats.filter(r => r.ratingCount > 0);
    console.log(`\n=== OSINT Framework Rating Report ===`);
    console.log(`Total tools: ${allWithStats.length}`);
    console.log(`Tools with ratings: ${rated.length}`);
    console.log(`Tools without ratings: ${allWithStats.length - rated.length}\n`);

    for (const [cat, items] of sortedCats) {
      const catRated = items.filter(r => r.ratingCount > 0);
      console.log(`\n## ${cat} (${items.length} tools, ${catRated.length} rated)`);
      console.log("-".repeat(70));
      for (const r of items) {
        const stars = r.ratingCount > 0
          ? `${"★".repeat(Math.round(r.ratingAvg))}${"☆".repeat(5 - Math.round(r.ratingAvg))} ${r.ratingAvg.toFixed(1)} (${r.ratingCount})`
          : "  unrated";
        console.log(`  ${stars.padEnd(22)} ${r.cleanName}`);
      }
    }
    console.log("");
    return;
  }

  // Group by top-level category
  const byCategory = {};
  for (const r of withClicks) {
    if (!byCategory[r.topCategory]) byCategory[r.topCategory] = [];
    byCategory[r.topCategory].push(r);
  }
  for (const cat of Object.keys(byCategory)) {
    byCategory[cat].sort((a, b) => b.stats.clicks - a.stats.clicks);
  }

  // --- Output ---
  if (outputJson) {
    const result = {};
    for (const [cat, items] of Object.entries(byCategory)) {
      result[cat] = items.slice(0, topN).map((r) => ({
        tool: r.cleanName,
        clicks: r.stats.clicks,
        rating: r.stats.ratings ? r.stats.ratings.average : 0,
        ratingCount: r.stats.ratings ? r.stats.ratings.count : 0,
        path: r.breadcrumb,
      }));
    }
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (outputCsv) {
    console.log("category,tool,clicks,rating_avg,rating_count,path");
    for (const [cat, items] of Object.entries(byCategory).sort()) {
      for (const r of items.slice(0, topN)) {
        const esc = (s) => `"${s.replace(/"/g, '""')}"`;
        const rat = r.stats.ratings || { average: 0, count: 0 };
        console.log(
          `${esc(cat)},${esc(r.cleanName)},${r.stats.clicks},${rat.average},${rat.count},${esc(r.breadcrumb)}`
        );
      }
    }
    return;
  }

  // Default: table output
  const totalClicks = withClicks.reduce((s, r) => s + r.stats.clicks, 0);
  console.log(`\n=== OSINT Framework Click Report ===`);
  console.log(`Tools with clicks: ${withClicks.length} / ${uniqueTools.length}`);
  console.log(`Total clicks: ${totalClicks.toLocaleString()}`);
  console.log(`Showing top ${topN} per category\n`);

  const sortedCategories = Object.entries(byCategory).sort(
    (a, b) =>
      b[1].reduce((s, r) => s + r.stats.clicks, 0) -
      a[1].reduce((s, r) => s + r.stats.clicks, 0)
  );

  for (const [cat, items] of sortedCategories) {
    const catTotal = items.reduce((s, r) => s + r.stats.clicks, 0);
    console.log(`\n## ${cat} (${catTotal.toLocaleString()} total clicks)`);
    console.log("-".repeat(60));
    for (const r of items.slice(0, topN)) {
      const bar = "\u2588".repeat(Math.ceil((r.stats.clicks / items[0].stats.clicks) * 20));
      console.log(`  ${String(r.stats.clicks).padStart(6)} ${bar} ${r.cleanName}`);
    }
  }
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
