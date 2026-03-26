/**
 * OSINT Framework – Cloudflare Worker entry point
 *
 * Handles two API routes, then falls through to static assets:
 *   POST /api/track       – fire-and-forget click tracking
 *   GET  /api/tool-stats  – per-tool click counts
 *
 * KV binding: CLICK_DATA  (configured in wrangler.jsonc + Pages dashboard)
 *
 * Privacy contract:
 *   - No IP addresses stored
 *   - No cookies used or set
 *   - session_hash is client-generated and ephemeral (sessionStorage)
 *   - Dedup key TTL: 1 hour   (prevents double-counting same session open)
 *   - Rate-limit key TTL: 2 min (60 req/min ceiling per session_hash)
 */

const ALLOWED_ORIGINS = [
  "https://osintframework.com",
  "https://www.osintframework.com",
];

function corsHeaders(origin) {
  const allowed =
    ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".osintframework.com")
      ? origin
      : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function jsonResponse(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
    },
  });
}

/**
 * POST /api/track
 * Body: { tool_id: string, session_hash: string, timestamp: number }
 *
 * Returns: { ok: true } or { ok: false, error: string }
 */
async function handleTrack(request, env) {
  const origin = request.headers.get("Origin") || "";

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "invalid json" }, 400, origin);
  }

  const { tool_id, session_hash, timestamp } = body;

  if (
    typeof tool_id !== "string" ||
    tool_id.length === 0 ||
    tool_id.length > 200
  ) {
    return jsonResponse({ ok: false, error: "invalid tool_id" }, 400, origin);
  }

  if (
    typeof session_hash !== "string" ||
    session_hash.length === 0 ||
    session_hash.length > 64
  ) {
    return jsonResponse(
      { ok: false, error: "invalid session_hash" },
      400,
      origin
    );
  }

  // Rate limit: 60 req/min per session_hash (stored in KV with 2-min TTL)
  const minute = Math.floor(Date.now() / 60000);
  const rlKey = `ratelimit:${session_hash}:${minute}`;
  const rlRaw = await env.CLICK_DATA.get(rlKey);
  const rlCount = rlRaw ? parseInt(rlRaw, 10) : 0;
  if (rlCount >= 60) {
    return jsonResponse({ ok: false, error: "rate limited" }, 429, origin);
  }

  // Dedup: one counted click per tool per session (TTL: 1 hour)
  const dedupKey = `dedup:${session_hash}:${tool_id}`;
  const alreadyCounted = await env.CLICK_DATA.get(dedupKey);
  if (alreadyCounted) {
    // Acknowledge without incrementing
    return jsonResponse({ ok: true, counted: false }, 200, origin);
  }

  // Increment click counter
  const clickKey = `clicks:${tool_id}`;
  const currentRaw = await env.CLICK_DATA.get(clickKey);
  const current = currentRaw ? parseInt(currentRaw, 10) : 0;

  // Write all three keys; dedup and rate-limit keys have TTLs
  await Promise.all([
    env.CLICK_DATA.put(clickKey, String(current + 1)),
    env.CLICK_DATA.put(dedupKey, "1", { expirationTtl: 3600 }),
    env.CLICK_DATA.put(rlKey, String(rlCount + 1), { expirationTtl: 120 }),
  ]);

  return jsonResponse({ ok: true, counted: true }, 200, origin);
}

/**
 * GET /api/tool-stats?tool_id=<name>
 *
 * Returns: { tool_id: string, clicks: number }
 */
async function handleStats(request, env) {
  const origin = request.headers.get("Origin") || "";
  const url = new URL(request.url);
  const tool_id = url.searchParams.get("tool_id");

  if (!tool_id || tool_id.length === 0 || tool_id.length > 200) {
    return jsonResponse({ ok: false, error: "invalid tool_id" }, 400, origin);
  }

  const clickKey = `clicks:${tool_id}`;
  const raw = await env.CLICK_DATA.get(clickKey);
  const clicks = raw ? parseInt(raw, 10) : 0;

  return jsonResponse({ tool_id, clicks }, 200, origin);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (url.pathname === "/api/track" && request.method === "POST") {
      return handleTrack(request, env);
    }

    if (url.pathname === "/api/tool-stats" && request.method === "GET") {
      return handleStats(request, env);
    }

    // Everything else: serve static assets
    return env.ASSETS.fetch(request);
  },
};
