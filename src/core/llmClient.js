// src/core/llmClient.js

export function isLlmEnabled() {
  return Boolean(process.env.REACT_APP_LLM_PROXY_URL);
}

export async function fetchLlmInsights(payload) {
  const base = process.env.REACT_APP_LLM_PROXY_URL;
  if (!base) {
    return {
      mode: "demo",
      summary:
        "LLM insights are disabled in this demo build. Configure a proxy endpoint to enable live analysis.",
      bullets: [
        "No API keys are stored in the frontend.",
        "To enable, set REACT_APP_LLM_PROXY_URL to your secure proxy.",
        "The proxy can call DeepSeek/OpenAI/etc. server-side.",
      ],
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
      throw new Error(`LLM proxy HTTP ${res.status}`);
    }

    const data = await res.json();
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

