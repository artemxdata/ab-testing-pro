// server/index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import { OpenAI } from "openai";
import { retrievePlaybook } from "./playbook.js";

const CACHE_TTL_MS = 30_000;
const cache = new Map();

function stableKey(obj) {
  return JSON.stringify(obj, Object.keys(obj || {}).sort());
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 8787;

function getBase() {
  return (process.env.PROXYAPI_BASE_URL || "https://api.proxyapi.ru/openrouter/v1").replace(/\/$/, "");
}

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.PROXYAPI_KEY || ""}`,
    "HTTP-Referer": process.env.OPENROUTER_REFERER || "http://localhost:3000",
    "X-Title": process.env.OPENROUTER_TITLE || "ab-testing-pro",
    "Content-Type": "application/json",
  };
}

function makeClient() {
  const key = process.env.PROXYAPI_KEY;
  if (!key) return null;

  const baseURL = getBase();
  const model = process.env.PROXYAPI_MODEL || "openai/gpt-5.2-codex";

  const client = new OpenAI({
    apiKey: key,
    baseURL,
    defaultHeaders: {
      "HTTP-Referer": process.env.OPENROUTER_REFERER || "http://localhost:3000",
      "X-Title": process.env.OPENROUTER_TITLE || "ab-testing-pro",
    },
  });

  return { client, model, mode: "proxyapi-openrouter" };
}

function buildPrompt({ signals, policyResult, playbookSnippets }) {
  const s = signals || {};
  const pr = policyResult || {};

  const locked = {
    decision: pr?.decision,
    confidence: pr?.confidence,
    triggeredRuleIds: Array.isArray(pr?.triggeredRules)
      ? pr.triggeredRules.map((r) => r?.id).filter(Boolean)
      : [],
    // LOCKED governance levels
    srm_level: s?.srm_level,
    roi_level: s?.roi_level,
    expected_loss_level: s?.expected_loss_level,
    power_level: s?.power_level,
    p_value: s?.p_value,
    uplift_pct: s?.uplift_pct,
    alpha: s?.alpha,
  };

  return `
You are an A/B testing executive analyst writing for busy stakeholders.

NON-NEGOTIABLE RULES:
- Policy decision is FINAL. Never contradict locked.decision.
- LOCKED FACTS below are truth. Never flip GREEN/YELLOW/RED.
${JSON.stringify(locked, null, 2)}
- No code fences. No debug phrases. No repeating “policy is final”.

## Playbook (Best Practices)
${
  playbookSnippets?.length
    ? playbookSnippets.join("\n")
    : "- No additional guidance"
}

OUTPUT (STRICT Markdown, concise):
## Executive Decision
One line: emoji + decision + confidence (e.g. "⏳ CONTINUE_TEST — 70%")

## Key Drivers
Exactly 3 bullets. Use numbers (p-value, uplift, power) + 1 governance item.

## Risks
Exactly 2 bullets, only if any level is YELLOW/RED (else write "None material").

## Next Actions
Exactly 3 bullets. Concrete, measurable.

Guidance:
- If decision is CONTINUE_TEST: focus on sample size/power and monitoring.
- If ESCALATE/REJECT/IMPLEMENT: focus on rollout/mitigation steps.

INPUT:
signals_json: ${JSON.stringify(s)}
policy_result_json: ${JSON.stringify(pr)}
`.trim();
}

app.get("/", (_req, res) => {
  res.type("text/plain").send("OK. Use /health or POST /insights");
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

async function listModelsShort() {
  try {
    const url = `${getBase()}/models`;
    const r = await fetch(url, { headers: getHeaders() });
    const j = await r.json().catch(() => null);
    const data = Array.isArray(j?.data) ? j.data : [];
    return data.slice(0, 50).map((m) => m?.id).filter(Boolean);
  } catch {
    return [];
  }
}

app.post("/insights", async (req, res) => {
  const t0 = Date.now();

  const body = req.body || {};
  const signals = body.signals || {};
  const policyResult = body.policyResult || body.policy_result || {};

  try {
    const bundle = makeClient();
    if (!bundle) {
      return res.status(400).json({
        version: "v1",
        mode: "demo",
        model: process.env.PROXYAPI_MODEL || "openai/gpt-5.2-codex",
        latency_ms: Date.now() - t0,
        decision: policyResult?.decision,
        confidence: policyResult?.confidence,
        markdown:
          "Proxy is not configured.\n\n" +
          "Set server/.env:\n" +
          "- PROXYAPI_KEY=...\n" +
          '- PROXYAPI_BASE_URL="https://api.proxyapi.ru/openrouter/v1"\n' +
          "- PROXYAPI_MODEL=<model id from /models>\n",
      });
    }

    const { client, model, mode } = bundle;

    const key = stableKey({ signals, policyResult, model: process.env.PROXYAPI_MODEL });
    const now = Date.now();

    const cached = cache.get(key);
    if (cached && now - cached.ts < CACHE_TTL_MS) {
      return res.json(cached.value);
    }

    const playbookSnippets = retrievePlaybook({
      decision: policyResult?.decision,
      signals,
    });

    const prompt = buildPrompt({ signals, policyResult, playbookSnippets });

    const out = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an A/B testing executive analyst. Policy decision is FINAL: never contradict it. " +
            "Be concise, numeric, governance-first. No code fences. Use bullet points. " +
            "If SRM level is GREEN, never call results untrustworthy due to SRM.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 700,
    });

    const markdown = (out?.choices?.[0]?.message?.content ?? "")
      .replace(/^```markdown\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    const response = {
      version: "v1",
      mode,
      model,
      latency_ms: Date.now() - t0,
      decision: policyResult?.decision,
      confidence: policyResult?.confidence,
      markdown,
    };

    cache.set(key, { ts: Date.now(), value: response });
    return res.json(response);
  } catch (e) {
    const status = e?.status || e?.response?.status;
    const msg = e?.message ? String(e.message) : String(e);

    if (status === 403) {
      const models = await listModelsShort();
      const fallback = models.find((m) => String(m).includes(":free")) || models[0];

      return res.status(403).json({
        version: "v1",
        mode: "error",
        model: process.env.PROXYAPI_MODEL,
        latency_ms: Date.now() - t0,
        decision: policyResult?.decision,
        confidence: policyResult?.confidence,
        markdown:
          `Proxy error (403): access denied for model "${process.env.PROXYAPI_MODEL}".\n\n` +
          `Fix: set PROXYAPI_MODEL to:\n- ${fallback}\n`,
        suggestedModel: fallback,
        availableModelsPreview: models.slice(0, 20),
      });
    }

    return res.status(500).json({
      version: "v1",
      mode: "error",
      model: process.env.PROXYAPI_MODEL,
      latency_ms: Date.now() - t0,
      decision: policyResult?.decision,
      confidence: policyResult?.confidence,
      markdown: `Proxy error${status ? ` (${status})` : ""}: ${msg}`,
    });
  }
});

app.listen(PORT, () => {
  console.log(`LLM proxy listening on http://localhost:${PORT}`);
});

