# Agentic Decision Intelligence Platform

### Deterministic, Governed AI with LLM & RAG as Supporting Systems

> A production-minded MVP showcasing how to build **enterprise-safe agentic AI systems** where decisions are deterministic, explainable, and governed — while LLMs and RAG enhance reasoning, interpretation, and operational guidance.

---

## What This Project Is

This repository represents a **hands-on architectural spike** into modern Agentic AI systems.

The goal is not to “add AI everywhere”, but to demonstrate **how AI systems should be designed when correctness, governance, and trust matter**.

The platform combines:

* deterministic decision-making,
* explicit policy evaluation,
* SOP-driven knowledge retrieval (RAG),
* constrained LLM reasoning,
* full traceability and fallback safety,
* containerized deployment.

The current use case is **A/B testing decision intelligence**, but the architecture is intentionally **general-purpose** and transferable to enterprise and industrial workflows.

---

## Key Capabilities (What’s Actually Built)

### Deterministic Decision Core

* Decisions are produced by a **policy engine**, not by an LLM.
* Policies are explicit, versioned, and auditable.
* Outcomes are reproducible for the same inputs.
* Each decision includes:

  * final verdict,
  * confidence score,
  * triggered rules,
  * full evaluation trace.

---

### Policy-Driven Governance

* Decision logic is encoded as **YAML policies**.
* Supports priority, severity, confidence, and escalation rules.
* Enables:

  * governance overrides,
  * risk-based escalation,
  * human-in-the-loop workflows.
* Designed to satisfy audit, compliance, and operational review.

---

### SOP & Playbook Layer (RAG)

* Operational knowledge is stored as **structured playbooks (Markdown / YAML)**.
* Retrieved dynamically at runtime via a lightweight RAG mechanism.
* Used to:

  * contextualize decisions,
  * guide explanations,
  * surface risks and recommended actions.
* Knowledge is **explicit, inspectable, and maintainable** — not hidden in model weights.

---

### LLM as Advisory System (Not Authority)

* LLMs are used **only after** a deterministic decision is made.
* They provide:

  * executive summaries,
  * interpretation of signals,
  * risk analysis,
  * concrete next steps.
* LLMs **cannot**:

  * change decisions,
  * invent rules,
  * bypass policies.

This enforces a clean separation between **authority and reasoning**.

---

### LLM Proxy Service (Enterprise-Safe)

* All LLM calls go through a dedicated **proxy service**.
* Features:

  * provider abstraction (OpenRouter / ProxyAPI),
  * model switching without UI changes,
  * latency measurement,
  * caching,
  * graceful fallback on failures.
* Prevents direct frontend access to API keys.
* Designed for secure, controlled enterprise deployment.

---

### Fallback & Safety by Design

* If the LLM fails, times out, or is unavailable:

  * the system still returns a valid decision,
  * explanations degrade gracefully,
  * no blocking or broken UX.
* Deterministic logic is never coupled to probabilistic components.

---

### Full Dockerized Stack

The entire system runs via **Docker Compose**:

* `web` — React UI
* `proxy` — Node.js LLM proxy

One command to run everything:

```bash
docker compose up
```

No local Node or dependency setup required.

---

## High-Level Architecture

```
Signals / Metrics
        ↓
Signal Normalization
        ↓
Deterministic Policy Engine
        ↓
Decision + Confidence + Trace
        ↓
Playbook / SOP Retrieval (RAG)
        ↓
LLM Advisory Layer
        ↓
Human-Readable Explanation & Guidance
```

---

## API Overview

### `POST /insights`

#### Input

```json
{
  "signals": {
    "p_value": 0.03,
    "uplift_pct": 4.2,
    "srm_level": "GREEN",
    "roi_level": "GREEN",
    "expected_loss_level": "YELLOW",
    "alpha": 0.05
  },
  "policyResult": {
    "decision": "IMPLEMENT_TREATMENT",
    "confidence": 0.9,
    "triggeredRules": [{ "id": "IMPLEMENT_GOOD" }]
  }
}
```

#### Output

```json
{
  "decision": "IMPLEMENT_TREATMENT",
  "confidence": 0.9,
  "latency_ms": 2100,
  "model": "allenai/molmo-2-8b:free",
  "markdown": "Executive summary, risks, and next actions"
}
```

---

## Why This Architecture Matters

Most AI systems today:

* rely on opaque probabilistic decisions,
* lack traceability,
* are difficult to govern or audit,
* break under real operational constraints.

This project demonstrates a different pattern:

**Deterministic systems enhanced by AI — not replaced by it.**

The same approach applies to:

* manufacturing quality gates,
* incident triage,
* compliance workflows,
* operational escalation systems,
* autonomous enterprise agents.

---

## Deployment & Environment

Secrets are never committed.

A safe template is provided:

```
.env.example
```

Required:

```
PROXYAPI_KEY=your_key_here
```

---

## Project Status

This repository is an architecture-validating MVP.

It intentionally focuses on:

* correct agent boundaries,
* enterprise-safe AI patterns,
* scalable foundations for autonomous workflows.

It is designed to be extended — not rewritten.

---

## Author Note

Built as a practical exploration of agentic AI, deterministic decision systems, and governed LLM integration, with a strong emphasis on correctness, safety, and real-world deployability.

---

**created by artemxdata**

