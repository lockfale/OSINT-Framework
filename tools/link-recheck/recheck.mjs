#!/usr/bin/env node
/**
 * Second opinion on the links lychee flagged as broken.
 *
 * lychee sends plain HTTP requests from a GitHub datacenter IP, so sites
 * behind bot protection (JavaScript challenges, WAF checks), sites with
 * HTTP/2 quirks and sites with incomplete certificate chains show up as dead
 * even though they load fine for a person. This script opens every URL lychee
 * reported as an error or timeout in headless Chromium and sorts it into:
 *
 *   ok      - the page loaded (status < 400) in a real browser
 *   blocked - the server answered but refused the browser (401/403/429 or a
 *             challenge page); the site is up, so it's not counted as dead
 *   failing - 404/410, DNS failure, refused/reset connection, timeout,
 *             certificate error or 5xx; these still need a human look
 *
 * Usage: node recheck.mjs <lychee-json> [report.md]
 * Exits 1 when anything is still failing.
 */

import { readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { chromium } from "playwright";

const NAV_TIMEOUT_MS = 45_000;
const SETTLE_TIMEOUT_MS = 10_000; // time for a JS challenge to redirect to the real page
const CONCURRENCY = 4;

const BLOCKED_STATUSES = new Set([401, 403, 429]);
const CHALLENGE_MARKERS = [
  "just a moment",
  "checking your browser",
  "verify you are human",
  "attention required",
  "cf-chl",
  "captcha",
];

export function lycheeFailures(report) {
  // lychee >= 0.16 writes error_map, older versions fail_map; timeouts can
  // live in their own map. Each maps an input file to a list of results.
  const urls = new Map();
  for (const key of ["error_map", "fail_map", "timeout_map"]) {
    for (const results of Object.values(report[key] ?? {})) {
      for (const r of results) {
        if (!urls.has(r.url)) urls.set(r.url, statusText(r.status));
      }
    }
  }
  return urls;
}

function statusText(status) {
  if (status == null) return "";
  if (typeof status === "string") return status;
  return status.text ?? (status.code != null ? String(status.code) : JSON.stringify(status));
}

export function classify({ status, error, body }) {
  if (error) return "failing";
  if (status < 400) return "ok";
  if (status === 404 || status === 410) return "failing";
  if (BLOCKED_STATUSES.has(status)) return "blocked";
  const text = (body ?? "").toLowerCase();
  if (CHALLENGE_MARKERS.some((m) => text.includes(m))) return "blocked";
  return status >= 500 ? "failing" : "blocked";
}

async function check(context, url) {
  const page = await context.newPage();
  let lastDocResponse = null;
  page.on("response", (res) => {
    if (res.request().isNavigationRequest() && res.frame() === page.mainFrame()) {
      lastDocResponse = res;
    }
  });
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT_MS });
    // Challenge pages (often 202/403/503) run a script and then redirect to
    // the real page, so give them a moment to land on a 2xx/3xx.
    const settled = () => {
      const s = lastDocResponse?.status() ?? 0;
      return (s > 0 && s < 400 && s !== 202) || s === 404 || s === 410;
    };
    const deadline = Date.now() + SETTLE_TIMEOUT_MS;
    while (!settled() && Date.now() < deadline) await page.waitForTimeout(500);
    await page.waitForLoadState("domcontentloaded").catch(() => {});
    const status = lastDocResponse?.status() ?? 0;
    const body = status >= 400 ? await page.content().catch(() => "") : "";
    return { url, status, finalUrl: page.url(), body };
  } catch (err) {
    return { url, status: 0, error: err.message.split("\n")[0] };
  } finally {
    await page.close().catch(() => {});
  }
}

function describe(r) {
  if (r.error) return r.error;
  const redirect = r.finalUrl && r.finalUrl !== r.url ? ` → ${r.finalUrl}` : "";
  return `HTTP ${r.status}${redirect}`;
}

function renderReport(results, lycheeReasons) {
  const groups = { failing: [], blocked: [], ok: [] };
  for (const r of results) groups[r.verdict].push(r);

  const lines = [
    "## Browser recheck of lychee failures",
    "",
    `lychee flagged ${results.length} URLs. Rechecked in headless Chromium:`,
    "",
    "| Result | URLs |",
    "|---|---|",
    `| Still failing | ${groups.failing.length} |`,
    `| Up, but blocks automated browsers | ${groups.blocked.length} |`,
    `| Loaded fine (lychee false positive) | ${groups.ok.length} |`,
  ];
  const sections = [
    ["failing", "Still failing (needs a human look)"],
    ["blocked", "Up, but blocks automated browsers"],
    ["ok", "Loaded fine in a browser"],
  ];
  for (const [key, title] of sections) {
    if (!groups[key].length) continue;
    lines.push("", `### ${title}`, "", "| URL | Browser | lychee |", "|---|---|---|");
    for (const r of groups[key].sort((a, b) => a.url.localeCompare(b.url))) {
      const cell = (s) => String(s).replaceAll("|", "\\|");
      lines.push(`| ${cell(r.url)} | ${cell(describe(r))} | ${cell(lycheeReasons.get(r.url) ?? "")} |`);
    }
  }
  return { markdown: lines.join("\n") + "\n", failing: groups.failing.length };
}

async function main() {
  const [reportPath, outPath = "link-recheck-report.md"] = process.argv.slice(2);
  if (!reportPath) {
    console.error("usage: node recheck.mjs <lychee-json> [report.md]");
    process.exit(2);
  }

  const lycheeReasons = lycheeFailures(JSON.parse(readFileSync(reportPath, "utf8")));
  const urls = [...lycheeReasons.keys()];
  console.log(`Rechecking ${urls.length} URLs flagged by lychee`);

  const browser = await chromium.launch({
    channel: "chromium", // full Chromium in new headless mode, closer to a real browser
    executablePath: process.env.CHROMIUM_PATH || undefined,
  });
  const userAgent = (await browser.newPage().then(async (p) => {
    const ua = await p.evaluate(() => navigator.userAgent);
    await p.close();
    return ua;
  })).replace("HeadlessChrome", "Chrome");
  const context = await browser.newContext({ userAgent, locale: "en-US" });

  const results = [];
  let next = 0;
  async function worker() {
    while (next < urls.length) {
      const url = urls[next++];
      const r = await check(context, url);
      r.verdict = classify(r);
      delete r.body;
      results.push(r);
      console.log(`${r.verdict.padEnd(7)} ${url} (${describe(r)})`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  await browser.close();

  const { markdown, failing } = renderReport(results, lycheeReasons);
  writeFileSync(outPath, markdown);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
  console.log(`\n${failing} still failing after browser recheck`);
  process.exit(failing ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(2);
  });
}
