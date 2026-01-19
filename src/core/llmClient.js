// src/core/llmClient.js

export function isLlmEnabled() {
  return Boolean(process.env.REACT_APP_LLM_PROXY_URL);
}

export async function fetchLlmInsights(payload) {
  const base = process.env.REACT_APP_LLM_PROXY_URL;

  // Demo mode: keep API keys out of frontend builds
  if (!base) {
    return {
      mode: "demo",
      markdown:
        "LLM insights are disabled in this demo build.\n\n" +
        "- No API keys are stored in the frontend.\n" +
        "- To enable live analysis, set `REACT_APP_LLM_PROXY_URL`.\n" +
        "- The proxy can call DeepSeek/OpenAI/etc. server-side.",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/insights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `LLM proxy HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ""}`
      );
    }

    const data = await res.json();

    // Normalize shape for UI
    return {
      mode: data?.mode || "proxy",
      markdown: String(data?.markdown ?? ""),
    };
  } finally {
    clearTimeout(timeout);
  }
}

