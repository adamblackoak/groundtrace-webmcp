# GroundTrace WebMCP

**Agents can remember. GroundTrace decides whether they should rely.**

GroundTrace WebMCP gives browser agents structured access to warranted operational memory. A retrieved precedent is a candidate, not authority: GroundTrace admits it as `RELY`, `HOLD`, or `REJECT` before its action can become a recommendation.

## Live demo

https://groundtrace-webmcp.netlify.app/

The page exposes three WebMCP tools through `document.modelContext.registerTool(...)`:

- `groundtrace_remember` — preserve a resolved incident with outcome, verification state and provenance.
- `groundtrace_recall` — retrieve relevant precedent and apply the deterministic warrant gate.
- `groundtrace_explain` — inspect the current admission result without inventing or overriding it.

A human proof button exercises the same isolated runtime, but the core challenge path has also been tested directly through ChatGPT Work: the agent discovered and invoked the WebMCP tools without using the button.

## Why this is different from ordinary agent memory

Retrieval is not permission to act.

GroundTrace evaluates candidate memory using explicit evidence conditions. In the challenge extension, a candidate can be:

- `REJECT` — for example, missing provenance or an unsuccessful prior outcome;
- `HOLD` — for example, unverified, stale, or below the similarity threshold;
- `RELY` — only when the candidate satisfies the warrant conditions.

Only `RELY` can supply a recommendation.

This creates the useful failure case: an agent can retrieve an exact-match precedent and GroundTrace can still refuse to recommend its action.

## Proven WebMCP paths

### RELY

An external ChatGPT Work agent used `groundtrace_remember`, `groundtrace_recall`, and `groundtrace_explain` directly. A verified, successful, provenance-bearing exact-match memory returned:

- similarity `1`
- admission `RELY`
- reason `admissible_memory`
- a bounded recommendation
- an inspectable trace ID

### HOLD

A second direct WebMCP test stored an exact-match memory with `verified: false`. Retrieval succeeded with similarity `1`, but GroundTrace returned:

- admission `HOLD`
- reason `memory_unverified`
- `recommendation: null`

The agent therefore had the precedent but was not permitted to turn it into authority.

## Architecture

```text
browser agent
    |
    v
WebMCP tools registered by the page
    |
    v
same-origin /api/groundtrace
    |
    v
isolated Netlify demo runtime
    |
    v
candidate memory -> RELY / HOLD / REJECT
    |
    +---- RELY ----> bounded recommendation
    |
    +---- HOLD/REJECT ----> no recommendation
```

The challenge deployment is intentionally isolated from the infrastructure of the pre-existing GroundTrace submission described below.

## Competition provenance / pre-existing work

GroundTrace Memory predates the WebMCP Challenge. It was built separately for the CockroachDB × AWS **Build with Agentic Memory** hackathon and is frozen in the separate `adamblackoak/groundtrace-engine` repository.

That pre-existing project supplied the core idea and admission semantics: incident memory, provenance and deterministic `RELY / HOLD / REJECT` gating.

**New work in this repository for the WebMCP Challenge includes:**

- the browser-facing WebMCP product experience;
- the three `document.modelContext` tools and their schemas;
- direct external-agent discovery and invocation path;
- the independent same-origin Netlify runtime used by this challenge demo;
- the human proof harness;
- WebMCP-specific UI, deployment and documentation.

This repository does not modify or call the frozen AWS competition deployment.

## Reproduce the agent test

Open the live URL in a WebMCP-capable browser/agent and ask it to inspect the tools exposed by the page. It should discover `groundtrace_remember`, `groundtrace_recall`, and `groundtrace_explain`.

For the distinguishing refusal case:

1. Call `groundtrace_remember` with a successful but **unverified** incident and provenance.
2. Call `groundtrace_recall` for an identical incident under the same tenant.
3. Call `groundtrace_explain`.
4. Confirm that retrieval succeeds but admission is `HOLD`, reason is `memory_unverified`, and no recommendation is returned.

## Local / deployment structure

- `index.html` — human-facing WebMCP surface and proof path.
- `app.js` — WebMCP tool registration and browser interaction.
- `netlify/functions/groundtrace.mjs` — isolated challenge demo runtime and admission logic.
- `netlify.toml` — Netlify function routing and security headers.

No AWS competition credentials or CockroachDB connection details are used by this deployment.

## Scope

This is a bounded challenge demonstration of the WebMCP interaction pattern and warrant semantics, not a production incident-management service. The isolated serverless demo memory is deliberately lightweight.

## Licence

MIT
