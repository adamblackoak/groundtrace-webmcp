const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "POST, OPTIONS",
  },
  body: JSON.stringify(body),
});

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") return json(204, {});
  if (event.httpMethod !== "POST") return json(405, { error: "method_not_allowed" });

  const endpoint = process.env.GROUNDTRACE_API_URL;
  const token = process.env.GROUNDTRACE_DEMO_TOKEN;
  if (!endpoint || !token) {
    return json(503, { error: "groundtrace_not_configured" });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "invalid_json" });
  }

  const allowed = new Set(["health", "remember", "recall"]);
  if (!allowed.has(payload.operation)) {
    return json(400, { error: "unsupported_operation" });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await upstream.text();
    let body;
    try { body = JSON.parse(text); } catch { body = { raw: text }; }

    if (!upstream.ok) {
      return json(upstream.status, { error: "groundtrace_upstream_error", upstream: body });
    }
    return json(200, body);
  } catch (error) {
    if (error?.name === "AbortError") return json(504, { error: "groundtrace_timeout" });
    return json(502, { error: "groundtrace_unreachable" });
  } finally {
    clearTimeout(timeout);
  }
}
