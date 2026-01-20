# Agentic Decision Intelligence Platform

Deterministic, policy-driven decision intelligence with RAG and LLMs used strictly as advisory systems.

This repository demonstrates how to build **enterprise-safe agentic AI systems** where:

* decisions are deterministic and reproducible,
* governance rules are explicit and auditable,
* SOPs and playbooks are first-class knowledge artifacts,
* LLMs enhance understanding and guidance but never hold authority.

The current implementation focuses on **A/B testing decision intelligence**, but the architecture is deliberately general and transferable to other enterprise domains.

---

## What This Project Is

This is not an “AI-first” demo.

It is an **architecture-first MVP** designed to answer a practical question:

> How should agentic systems be built when correctness, governance, auditability, and failure safety actually matter?

The system combines:

* deterministic policy evaluation,
* governance-driven decision precedence,
* SOP-based knowledge retrieval (RAG-lite),
* constrained LLM reasoning via a secure proxy,
* full decision traceability,
* containerized, reproducible deployment.

LLMs are explicitly **supporting components**, not decision-makers.

---

## Core Architectural Principles

### Deterministic Authority

All final decisions are produced by a policy engine evaluating structured signals.

LLMs cannot:

* change outcomes,
* invent rules,
* bypass governance constraints.

### Explicit Governance

Decision logic and escalation rules are encoded in versioned YAML policies.

Governance signals (SRM, expected loss, ROI quality) can override statistical wins.

### SOP-Driven Knowledge (RAG)

Operational guidance lives in curated Markdown/YAML playbooks.

Knowledge is:

* explicit,
* inspectable,
* reviewable,
* retrieved dynamically at runtime.

Nothing critical is hidden inside model weights.

### LLM as Advisory Layer

LLMs are invoked only **after** a deterministic decision is made.

They provide:

* executive summaries,
* interpretation of signals,
* risk analysis,
* recommended next steps.

If the LLM fails, the system still works.

---

## High-Level Flow

```
Signals / Experiment Data
        ↓
Signal Normalization
        ↓
Deterministic Policy Engine
        ↓
Decision + Confidence + Trace
        ↓
SOP / Playbook Retrieval (RAG)
        ↓
LLM Advisory Summary (optional)
```

---

## Quick Start (Docker / Local Demo)

This project is fully containerized and can be run locally in **one command** using Docker Compose.

### Prerequisites

* Docker >= 24
* Docker Compose v2

Verify:

```bash
docker --version
docker compose version
```

---

### 1. Clone the repository

```bash
git clone https://github.com/artemxdata/ab-testing-pro.git
cd ab-testing-pro
```

---

### 2. Configure environment variables

Create a local `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` and set your ProxyAPI key:

```env
PROXYAPI_KEY=PASTE_YOUR_KEY_HERE
PROXYAPI_BASE_URL=https://api.proxyapi.ru/openrouter/v1
PROXYAPI_MODEL=allenai/molmo-2-8b:free
```

Important notes:

* `.env` is gitignored
* API keys are never exposed to the frontend
* The UI communicates only with the local proxy service

---

### 3. Start the full stack

```bash
docker compose up --build
```

This launches two services:

| Service | Description                                       | Port |
| ------- | ------------------------------------------------- | ---- |
| web     | React UI (A/B testing dashboard)                  | 3000 |
| proxy   | LLM Proxy (policy-safe, cached, fallback-enabled) | 8787 |

---

### 4. Open the application

UI:

```
http://localhost:3000/ab-testing-pro
```

Proxy health check:

```
http://localhost:8787/health
```

---

### 5. Test the LLM proxy directly (optional)

```bash
curl -X POST http://localhost:8787/insights \
  -H "Content-Type: application/json" \
  -d '{
    "signals": {
      "p_value": 0.03,
      "uplift_pct": 4.2,
      "srm_level": "GREEN",
      "roi_level": "GREEN",
      "expected_loss_level": "YELLOW"
    },
    "policyResult": {
      "decision": "IMPLEMENT_TREATMENT",
      "confidence": 0.9,
      "triggeredRules": [{"id": "IMPLEMENT_GOOD"}]
    }
  }'
```

---

### 6. Docker networking model (important)

Inside Docker, the frontend calls the proxy via:

```
http://proxy:8787
```

Not `localhost`.

This keeps API keys isolated and mirrors real production deployment patterns.

---

### 7. Stop and clean up

```bash
docker compose down -v
```

---

## Why Docker Matters Here

* Reproducible demo for reviewers and stakeholders
* Zero local Node or React setup
* Clean separation of concerns:

  * UI is stateless
  * Proxy is secure and key-protected
* Matches real enterprise deployment constraints

This is not a toy demo. It is a portable, governed agentic decision system.

---

## Repository Status

This project is an architecture-validating MVP.

It focuses on:

* correct agent boundaries,
* deterministic decision authority,
* governance-first design,
* safe failure modes,
* enterprise-aligned deployment patterns.

It is designed to be extended, not rewritten.

---

## Further Reading

* `ARCHITECTURE.md` — detailed system design and trust model
* `public/policies.yaml` — deterministic decision rules
* `server/` — LLM proxy and SOP retrieval

---

created by artemxdata
