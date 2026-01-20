# ARCHITECTURE — Agentic Decision Intelligence Platform

Deterministic, policy-driven decisions with RAG + LLM as advisory systems (enterprise-safe)

---

## 1) System Goal

Build an agentic system that enterprises can trust:

* **Deterministic authority** for decisions (no hallucinated outcomes)
* **Explicit policies & SOPs** as the source of truth (versioned, reviewable)
* **RAG + LLM** used for interpretation, guidance, and executive summaries **only**
* **Traceability** as a first-class feature (audit-ready)

This repo intentionally proves the architectural pattern, not a “toy demo”.

---

## 2) Non-Negotiable Principles

### 2.1 Decision authority is deterministic

Final decisions come from the policy engine evaluating structured signals.
LLM output is advisory and cannot override policy outcomes.

### 2.2 Policies/SOPs are explicit and versioned

Operational rules are stored in YAML. Supporting “playbook knowledge” is stored as curated docs and retrieved at runtime.

### 2.3 Governance beats metrics

Governance controls (SRM, expected loss, ROI) can force escalation even if metrics “look good”.

### 2.4 Fail closed on LLM

If LLM fails/403/timeout, the system still returns a valid decision and a safe explanation fallback.

---

## 3) High-Level Architecture

```text
User Inputs / Experiment Data
        ↓
Metric Computation (UI)
        ↓
Signal Builder (levels + governance)
        ↓
Deterministic Policy Engine (YAML rules)
        ↓
Decision + Confidence + Trace
        ↓
Optional:
  RAG Retrieval (SOP / playbook)
        ↓
  LLM Proxy (provider/model abstraction)
        ↓
LLM Advisory Summary (markdown)
```

---

## 4) Data Flow (Runtime)

### Step A — Compute experiment metrics (frontend)

Frontend computes:

* conversion rates
* uplift %
* z-score and p-value approximation
* ROI proxy / incremental revenue
* expected loss proxy
* power approximation
* SRM p-value approximation (chi-square-ish)

### Step B — Normalize into “signals”

Signals are a compact structured object used everywhere downstream:

* **statistical**: `p_value`, `uplift_pct`, `alpha`, `power`, `power_level`
* **quality**: `srm_level`, expected split A/B
* **business**: `roi_pct`, `roi_level`, `expected_loss`, `expected_loss_level`
* other derived “levels” for governance

### Step C — Evaluate policies (deterministic)

Policies are loaded from `public/policies.yaml` and evaluated by `policyEngine`.

Outputs:

* `decision` (e.g., IMPLEMENT / CONTINUE / ESCALATE)
* `confidence`
* `triggeredRules[]`
* `trace[]` (why each rule matched / didn’t match)

### Step D — Optional advisory insights (LLM)

The UI may call the proxy with:

* `signals`
* `policyResult`

The proxy returns an executive markdown summary.

If proxy is disabled/unavailable, UI shows a safe demo summary.

---

## 5) Components & Responsibilities

### 5.1 Frontend UI (React)

**Responsibilities**

* Collect inputs (visitors, conversions, business values, split expectations)
* Compute metrics and build signals
* Render:

  * decision card
  * stats strip
  * governance panel
  * decision trace
  * LLM advisory panel
* Call `/insights` via `REACT_APP_LLM_PROXY_URL` (optional)

**Non-responsibilities**

* Never store API keys
* Never make direct calls to model providers

---

### 5.2 Signal Builder (`src/core/signals.js`)

**Responsibilities**

* Convert raw metrics into normalized, stable signals:

  * compute SRM p-value (approx)
  * compute “levels” (GREEN/YELLOW/RED) with thresholds
  * compute expected loss proxy
  * compute power approximation
  * produce governance indicators

This makes the policy layer stable and provider-agnostic.

---

### 5.3 Policy Engine (`src/policy/policyEngine.ts`)

**Responsibilities**

* Deterministically evaluate YAML rules:

  * `match` block (exact equality checks)
  * `when` block (simple safe expression evaluator)

Return:

* decision + confidence
* triggered rules
* full trace

**Important**

* No `eval()`
* Expression grammar is intentionally minimal and safe

---

### 5.4 Policies (`public/policies.yaml`)

**Responsibilities**

* Encodes decision logic and precedence

Typical precedence:

* Governance quality gates → `ESCALATE`
* Significant negative → `REJECT`
* Significant positive + governance OK → `IMPLEMENT`
* Otherwise → `CONTINUE`

Policies are editable without rebuilding the app (served from `/public`).

---

### 5.5 LLM Proxy Service (`server/`)

**Responsibilities**

* Keep secrets server-side (`PROXYAPI_KEY`)
* Abstract upstream provider path and models
* Expose:

  * `GET /health` (basic readiness)
  * `POST /insights` (generate advisory markdown)
  * `GET /debug-upstream` (diagnostics, optional)
* Provide:

  * caching (reduces latency/cost)
  * graceful fallback on errors
  * consistent response shape (UI-friendly)

**Non-responsibilities**

* Never decide. Never modify policy outcomes.

---

### 5.6 Playbook / SOP Retrieval (RAG-lite)

**Responsibilities**

* Load curated operational guidance (YAML/Markdown)
* Retrieve relevant snippets based on signals + decision context
* Provide bounded context to the LLM so output remains grounded

This is intentionally “lightweight RAG”: simple retrieval + curated sources > large uncontrolled corpora.

---

## 6) Trust & Safety Model (Why this is enterprise-safe)

### 6.1 Decision safety

* All decisions are deterministic and reproducible
* Governance rules can override “wins”
* SRM and expected loss are treated as “trust gates”

### 6.2 LLM safety

* LLM is advisory only
* Failure modes are safe:

  * proxy disabled → demo output
  * upstream failure → returns error markdown but system still operates
* Model switching is controlled by server env, not by UI

### 6.3 Auditability

* Full decision trace is available (rule-by-rule reasons)
* Policies are readable, reviewable, versioned

---

## 7) Deployment Architecture

### 7.1 Local dev (Docker Compose)

Two services:

* `web` (React) on `:3000`
* `proxy` (Node) on `:8787`

**Key detail**

Inside Docker network, UI calls proxy at:

```
http://proxy:8787
```

Not `localhost`.

---

### 7.2 Environment variables

**Proxy**:

* `PROXYAPI_KEY` (secret)
* `PROXYAPI_BASE_URL` (e.g., [https://api.proxyapi.ru/openrouter/v1](https://api.proxyapi.ru/openrouter/v1))
* `PROXYAPI_MODEL` (must be allowed by your ProxyAPI account)
* optional OpenRouter headers

**Frontend**:

* `REACT_APP_LLM_PROXY_URL` (points to proxy)

---

## 8) Extensibility (How to evolve this into “real product”)

### 8.1 Add richer RAG

* index larger SOP sets
* segment-based retrieval
* citations in the UI (show sources for each recommendation)

### 8.2 Add human override workflow

* “Approve / Reject / Escalate” override path
* record rationale + actor + timestamp
* export audit log

### 8.3 Add experiments repository integration

* pull real experiment stats from analytics DB
* schedule re-evaluation
* automated alerts on governance violations

### 8.4 Add policy testing and CI

* unit tests for policy outcomes
* golden test cases for decision traces
* policy linting (schema + forbidden patterns)

---

## 9) What Makes This Architecture “Senior”

* Deterministic authority for decisions (no “LLM decides” anti-pattern)
* Explicit governance and precedence
* Clean separation of concerns (signals → policies → advisory)
* Safe runtime behavior even when LLM fails
* Containerized dev stack for demo reproducibility
* Enterprise-aligned design: traceability, auditability, SOP-driven knowledge

---

## 10) Appendix — Key Files

**Frontend**:

* `src/components/ABTestingPro.js` — metrics + signal inputs + orchestration
* `src/core/signals.js` — signal normalization and governance levels
* `src/policy/policyEngine.ts` — deterministic policy evaluation
* `public/policies.yaml` — business rules
* `src/ui/LLMInsightPanel.tsx` — advisory insights UI

**Proxy**:

* `server/index.js` — proxy API routes (`/health`, `/insights`, etc.)
* `server/playbook.*` — SOP/playbook sources + retrieval
* `server/package.json` — proxy dependencies

**Infra**:

* `docker-compose.yml` — local stack
* `.env.example` — safe env template

---

**created by artemxdata**
