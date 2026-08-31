# GroundTrace WebMCP

**Warranted operational memory for browser agents.**

GroundTrace WebMCP is a WebMCP extension of the pre-existing GroundTrace Memory project. It lets a browser agent use structured operational memory without treating retrieved precedent as automatic authority.

## Competition boundary

This repository contains the new WebMCP-facing work created for the 2026 WebMCP Challenge.

The underlying GroundTrace Memory system predates this challenge and remains frozen in the separate `adamblackoak/groundtrace-engine` repository, originally built for the CockroachDB × AWS Build with Agentic Memory hackathon. This repository does not modify that submission artifact.

## Product proposition

A browser agent encountering an operational incident can ask GroundTrace for relevant prior experience. GroundTrace retrieves candidate memories and applies its existing deterministic admission rules before any prior action can become a recommendation.

The intended interaction is:

```text
browser agent
    |
    v
WebMCP tool surface
    |
    v
GroundTrace Memory API
    |
    v
candidate memories -> RELY / HOLD / REJECT
    |
    v
bounded recommendation + inspectable warrant
```

## Initial WebMCP scope

The WebMCP layer will expose a deliberately small tool surface around existing GroundTrace capabilities:

- `groundtrace_recall` — retrieve and evaluate relevant prior incident memory for a new incident.
- `groundtrace_remember` — record a resolved incident with outcome, verification and provenance.
- `groundtrace_explain` — present the decision trace/warrant behind a recall result.

The WebMCP layer must not weaken or bypass GroundTrace admission semantics. Retrieved memory remains a candidate, not authority.

## Status

Initial WebMCP extension scaffold. Private during development; intended for public release before challenge submission.

## Licence

MIT licence will be added before public release.
