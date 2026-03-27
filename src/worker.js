/**
 * OSINT Framework – Cloudflare Worker entry point
 *
 * API routes (all others fall through to static assets):
 *   POST /api/track       – fire-and-forget click tracking
 *   GET  /api/tool-stats  – per-tool click + vote counts
 *   POST /api/vote        – community 5-star rating
 *   POST /api/report      – flag dead link / paywalled / incorrect info
 *
 * KV binding: CLICK_DATA  (configured in wrangler.jsonc + Pages dashboard)
 * Secret:     GITHUB_TOKEN (for auto-creating GitHub issues on report threshold)
 *
 * Privacy contract:
 *   - No IP addresses stored
 *   - No cookies used or set
 *   - session_hash is client-generated and ephemeral (sessionStorage)
 *   - Rate-limit key TTL: 2 min (60 req/min ceiling per session_hash)
 *   - Rating dedup: permanent per session (sessionStorage already limits scope)
 *   - Report dedup key TTL: 7 days (prevents same session from inflating counts)
 */

const ALLOWED_ORIGINS = [
  "https://osintframework.com",
  "https://www.osintframework.com",
];

const REPORT_THRESHOLD = 3; // auto-create GitHub issue after this many unique reports
const REPORT_DEDUP_TTL = 7 * 24 * 3600; // 7 days in seconds

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
 * Validate common inputs: tool_id and session_hash.
 * Returns an error string if invalid, null if valid.
 */
function validateCommon(tool_id, session_hash) {
  if (
    typeof tool_id !== "string" ||
    tool_id.length === 0 ||
    tool_id.length > 200
  ) {
    return "invalid tool_id";
  }
  if (
    typeof session_hash !== "string" ||
    session_hash.length === 0 ||
    session_hash.length > 64
  ) {
    return "invalid session_hash";
  }
  return null;
}

/**
 * Check and increment rate limit for a session.
 * Returns true if rate limited (over 60 req/min).
 */
async function isRateLimited(env, session_hash) {
  const minute = Math.floor(Date.now() / 60000);
  const rlKey = `ratelimit:${session_hash}:${minute}`;
  const rlRaw = await env.CLICK_DATA.get(rlKey);
  const rlCount = rlRaw ? parseInt(rlRaw, 10) : 0;
  if (rlCount >= 60) return true;
  await env.CLICK_DATA.put(rlKey, String(rlCount + 1), { expirationTtl: 120 });
  return false;
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

  const { tool_id, session_hash } = body;
  const validationError = validateCommon(tool_id, session_hash);
  if (validationError) {
    return jsonResponse({ ok: false, error: validationError }, 400, origin);
  }

  if (await isRateLimited(env, session_hash)) {
    return jsonResponse({ ok: false, error: "rate limited" }, 429, origin);
  }

  // Dedup: one counted click per tool per session (TTL: 1 hour)
  const dedupKey = `dedup:${session_hash}:${tool_id}`;
  const alreadyCounted = await env.CLICK_DATA.get(dedupKey);
  if (alreadyCounted) {
    return jsonResponse({ ok: true, counted: false }, 200, origin);
  }

  // Increment click counter
  const clickKey = `clicks:${tool_id}`;
  const currentRaw = await env.CLICK_DATA.get(clickKey);
  const current = currentRaw ? parseInt(currentRaw, 10) : 0;

  await Promise.all([
    env.CLICK_DATA.put(clickKey, String(current + 1)),
    env.CLICK_DATA.put(dedupKey, "1", { expirationTtl: 3600 }),
  ]);

  return jsonResponse({ ok: true, counted: true }, 200, origin);
}

/**
 * POST /api/vote
 * Body: { tool_id: string, rating: 0|0.5|1|...|5|null, session_hash: string }
 *   rating=null removes the current rating (toggle off)
 *
 * Returns: { ok: true, average: number, count: number, userRating: number|null }
 */
async function handleVote(request, env) {
  const origin = request.headers.get("Origin") || "";

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "invalid json" }, 400, origin);
  }

  const { tool_id, rating, session_hash } = body;
  const validationError = validateCommon(tool_id, session_hash);
  if (validationError) {
    return jsonResponse({ ok: false, error: validationError }, 400, origin);
  }

  if (rating !== null) {
    var validRatings = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
    if (typeof rating !== "number" || validRatings.indexOf(rating) === -1) {
      return jsonResponse(
        { ok: false, error: "rating must be 0-5 in 0.5 increments, or null" },
        400,
        origin
      );
    }
  }

  if (await isRateLimited(env, session_hash)) {
    return jsonResponse({ ok: false, error: "rate limited" }, 429, origin);
  }

  const userRatingKey = `rating:${session_hash}:${tool_id}`;
  const sumKey = `ratings:sum:${tool_id}`;
  const countKey = `ratings:count:${tool_id}`;

  // Read current state in parallel
  const [prevRatingRaw, sumRaw, countRaw] = await Promise.all([
    env.CLICK_DATA.get(userRatingKey),
    env.CLICK_DATA.get(sumKey),
    env.CLICK_DATA.get(countKey),
  ]);

  const prevRating = prevRatingRaw ? parseFloat(prevRatingRaw) : null;
  let sum = sumRaw ? parseFloat(sumRaw) : 0;
  let count = countRaw ? parseInt(countRaw, 10) : 0;

  // Toggle off if same rating submitted again
  let newRating = rating;
  if (rating !== null && rating === prevRating) {
    newRating = null;
  }

  // Undo previous rating
  if (prevRating !== null) {
    sum = Math.max(0, sum - prevRating);
    count = Math.max(0, count - 1);
  }

  // Apply new rating
  if (newRating !== null) {
    sum += newRating;
    count++;
  }

  // Persist
  const writes = [
    env.CLICK_DATA.put(sumKey, String(sum)),
    env.CLICK_DATA.put(countKey, String(count)),
  ];
  if (newRating === null) {
    writes.push(env.CLICK_DATA.delete(userRatingKey));
  } else {
    writes.push(env.CLICK_DATA.put(userRatingKey, String(newRating)));
  }
  await Promise.all(writes);

  const average = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;
  return jsonResponse(
    { ok: true, average, count, userRating: newRating },
    200,
    origin
  );
}

/**
 * POST /api/report
 * Body: { tool_id: string, report_type: "dead_link"|"paywalled"|"incorrect_info", session_hash: string }
 *
 * Returns: { ok: true, counted: boolean }
 *
 * When a tool accumulates REPORT_THRESHOLD unique reports of the same type within
 * 7 days, a GitHub issue is auto-created on lockfale/OSINT-Framework (requires
 * GITHUB_TOKEN env secret).
 */
async function handleReport(request, env) {
  const origin = request.headers.get("Origin") || "";

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "invalid json" }, 400, origin);
  }

  const { tool_id, report_type, session_hash } = body;
  const validationError = validateCommon(tool_id, session_hash);
  if (validationError) {
    return jsonResponse({ ok: false, error: validationError }, 400, origin);
  }

  const validTypes = ["dead_link", "paywalled", "incorrect_info"];
  if (!validTypes.includes(report_type)) {
    return jsonResponse(
      { ok: false, error: "report_type must be dead_link, paywalled, or incorrect_info" },
      400,
      origin
    );
  }

  if (await isRateLimited(env, session_hash)) {
    return jsonResponse({ ok: false, error: "rate limited" }, 429, origin);
  }

  // Dedup: one report per session per tool per type within 7 days
  const dedupKey = `reported:${session_hash}:${tool_id}:${report_type}`;
  const alreadyReported = await env.CLICK_DATA.get(dedupKey);
  if (alreadyReported) {
    return jsonResponse({ ok: true, counted: false }, 200, origin);
  }

  // Increment report counter
  const countKey = `reportcount:${tool_id}:${report_type}`;
  const countRaw = await env.CLICK_DATA.get(countKey);
  const prevCount = countRaw ? parseInt(countRaw, 10) : 0;
  const newCount = prevCount + 1;

  await Promise.all([
    env.CLICK_DATA.put(countKey, String(newCount)),
    env.CLICK_DATA.put(dedupKey, "1", { expirationTtl: REPORT_DEDUP_TTL }),
  ]);

  // Check if we should create a GitHub issue (threshold reached, not already done)
  if (newCount >= REPORT_THRESHOLD) {
    const notifiedKey = `github_issue_created:${tool_id}:${report_type}`;
    const alreadyNotified = await env.CLICK_DATA.get(notifiedKey);
    if (!alreadyNotified && env.GITHUB_TOKEN) {
      const created = await createGitHubIssue(env, tool_id, report_type, newCount);
      if (created) {
        await env.CLICK_DATA.put(notifiedKey, "1");
      }
    }
  }

  return jsonResponse({ ok: true, counted: true }, 200, origin);
}

/**
 * Create a GitHub issue on lockfale/OSINT-Framework via the GitHub API.
 * Returns true on success.
 */
async function createGitHubIssue(env, tool_id, report_type, count) {
  const typeLabels = {
    dead_link: "dead link",
    paywalled: "paywalled",
    incorrect_info: "incorrect info",
  };
  const typeLabel = typeLabels[report_type] || report_type;
  const title = `[Community Report] ${tool_id} flagged as ${typeLabel}`;
  const body = [
    `**Tool:** ${tool_id}`,
    `**Report type:** ${typeLabel}`,
    `**Report count:** ${count} unique reports`,
    ``,
    `This issue was automatically created by the OSINT Framework community reporting system.`,
    `Community members have flagged this tool ${count} time(s) as \`${report_type}\`.`,
    ``,
    `Please review and take appropriate action (update URL, change pricing badge, correct description, etc.).`,
  ].join("\n");

  try {
    const resp = await fetch(
      "https://api.github.com/repos/lockfale/OSINT-Framework/issues",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
          "User-Agent": "OSINT-Framework-Worker/1.0",
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({
          title,
          body,
          labels: ["community-report", "needs-review"],
        }),
      }
    );
    return resp.ok;
  } catch {
    return false;
  }
}

/**
 * GET /api/tool-stats?tool_id=<name>
 *
 * Returns: { tool_id: string, clicks: number, ratings: { average: number, count: number } }
 */
async function handleStats(request, env) {
  const origin = request.headers.get("Origin") || "";
  const url = new URL(request.url);
  const tool_id = url.searchParams.get("tool_id");

  if (!tool_id || tool_id.length === 0 || tool_id.length > 200) {
    return jsonResponse({ ok: false, error: "invalid tool_id" }, 400, origin);
  }

  const [clicksRaw, sumRaw, countRaw] = await Promise.all([
    env.CLICK_DATA.get(`clicks:${tool_id}`),
    env.CLICK_DATA.get(`ratings:sum:${tool_id}`),
    env.CLICK_DATA.get(`ratings:count:${tool_id}`),
  ]);

  const clicks = clicksRaw ? parseInt(clicksRaw, 10) : 0;
  const sum = sumRaw ? parseFloat(sumRaw) : 0;
  const count = countRaw ? parseInt(countRaw, 10) : 0;
  const average = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;

  return jsonResponse(
    { tool_id, clicks, ratings: { average, count } },
    200,
    origin
  );
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

    if (url.pathname === "/api/vote" && request.method === "POST") {
      return handleVote(request, env);
    }

    if (url.pathname === "/api/report" && request.method === "POST") {
      return handleReport(request, env);
    }

    // Everything else: serve static assets
    return env.ASSETS.fetch(request);
  },
};
