const API_URL = window.GROUNDTRACE_CONFIG?.apiUrl || "";
const API_TOKEN = window.GROUNDTRACE_CONFIG?.token || "";

const statusEl = document.querySelector("#status");
const outputEl = document.querySelector("#output");

function render(value) {
  outputEl.textContent = JSON.stringify(value, null, 2);
}

async function groundTrace(payload, signal) {
  if (!API_URL) throw new Error("GroundTrace API URL is not configured.");
  const headers = { "Content-Type": "application/json" };
  if (API_TOKEN) headers.Authorization = `Bearer ${API_TOKEN}`;
  const response = await fetch(API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `GroundTrace API returned ${response.status}`);
  render(body);
  return body;
}

function asToolResult(body) {
  return { content: [{ type: "text", text: JSON.stringify(body) }] };
}

async function registerTools() {
  if (!document.modelContext?.registerTool) {
    statusEl.textContent = "WebMCP is not available in this browser. Enable WebMCP or use ChatGPT's browser.";
    return;
  }

  await document.modelContext.registerTool({
    name: "groundtrace_recall",
    description: "Recall relevant prior operational incidents and return only recommendations admitted by GroundTrace's deterministic RELY/HOLD/REJECT warrant gate.",
    inputSchema: {
      type: "object",
      properties: {
        tenant_id: { type: "string", description: "GroundTrace tenant identifier." },
        incident_text: { type: "string", description: "The current incident or operational situation." }
      },
      required: ["tenant_id", "incident_text"]
    },
    annotations: { readOnlyHint: false },
    execute: async ({ tenant_id, incident_text }, { signal } = {}) => {
      const body = await groundTrace({ operation: "recall", tenant_id, incident_text }, signal);
      return asToolResult(body);
    }
  });

  await document.modelContext.registerTool({
    name: "groundtrace_remember",
    description: "Store a resolved operational incident with its action, outcome, verification state and provenance so it can become a future memory candidate.",
    inputSchema: {
      type: "object",
      properties: {
        tenant_id: { type: "string" },
        incident_text: { type: "string" },
        action_text: { type: "string" },
        outcome_success: { type: "boolean" },
        verified: { type: "boolean" },
        occurred_at: { type: "string", description: "ISO 8601 timestamp." },
        provenance_source: { type: "string", description: "Human-readable source for the memory." }
      },
      required: ["tenant_id", "incident_text", "action_text", "outcome_success", "verified", "occurred_at", "provenance_source"]
    },
    annotations: { readOnlyHint: false },
    execute: async (input, { signal } = {}) => {
      const { provenance_source, ...memory } = input;
      const body = await groundTrace({ operation: "remember", ...memory, provenance: { source: provenance_source } }, signal);
      return asToolResult(body);
    }
  });

  await document.modelContext.registerTool({
    name: "groundtrace_explain",
    description: "Explain the warrant in a GroundTrace recall result already present on this page: candidate memories, admission outcomes, reasons, recommendation and trace identifier. This does not invent or override GroundTrace decisions.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true },
    execute: async () => {
      const text = outputEl.textContent.trim();
      if (!text || text === "No result yet.") return asToolResult({ status: "NO_RESULT", message: "Run groundtrace_recall first." });
      const body = JSON.parse(text);
      return asToolResult({
        status: body.status,
        recommendation: body.recommendation,
        trace_id: body.trace_id,
        candidates: body.candidates,
        explanation: "GroundTrace recommendations are bounded by the persisted RELY/HOLD/REJECT admission decisions returned by the existing GroundTrace Memory service."
      });
    }
  });

  statusEl.textContent = "WebMCP ready — 3 GroundTrace tools registered.";
}

registerTools().catch((error) => {
  statusEl.textContent = `WebMCP registration failed: ${error.message}`;
});
