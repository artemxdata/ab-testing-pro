import React, { useMemo } from "react";
import { fetchLlmInsights, isLlmEnabled } from "../core/llmClient";

type Props = {
  decision: string;
  confidence: number;
  signals: any;
  policyResult?: any; // важно для proxy-режима
};

function badge(level: string) {
  const L = String(level || "UNKNOWN").toUpperCase();
  if (L === "GREEN")
    return "bg-emerald-500/15 text-emerald-200 border-emerald-400/20";
  if (L === "YELLOW")
    return "bg-amber-500/15 text-amber-200 border-amber-400/20";
  if (L === "RED")
    return "bg-rose-500/15 text-rose-200 border-rose-400/20";
  return "bg-slate-500/10 text-slate-200 border-slate-400/20";
}

export default function LLMInsightPanel({
  decision,
  confidence,
  signals,
  policyResult,
}: Props) {
  const confPct = Math.round(
    (Number.isFinite(confidence) ? confidence : 0) * 100
  );

  // --- proxy mode state ---
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [markdown, setMarkdown] = React.useState<string | null>(null);

  const canCall = isLlmEnabled();

  async function onGenerate() {
    try {
      setError(null);
      setLoading(true);
      const res = await fetchLlmInsights({ signals, policyResult });
      setMarkdown(res?.markdown ?? "");
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  // --- demo summary (existing) ---
  const demoText = useMemo(() => {
    const s = signals || {};
    const uplift = Number.isFinite(s?.uplift_pct) ? s.uplift_pct : 0;
    const pv = Number.isFinite(s?.p_value) ? s.p_value : 1;

    const parts: string[] = [];

    // 1) verdict-style line
    if (decision === "IMPLEMENT_TREATMENT" || decision === "IMPLEMENT") {
      parts.push(
        `Recommendation: **roll out Treatment B** (decision = ${decision}).`
      );
    } else if (decision === "REJECT_TREATMENT" || decision === "REJECT") {
      parts.push(
        `Recommendation: **reject Treatment B** (decision = ${decision}).`
      );
    } else if (decision === "ESCALATE") {
      parts.push(
        `Recommendation: **escalate** — governance risks detected (decision = ${decision}).`
      );
    } else {
      parts.push(
        `Recommendation: **continue testing** — not enough data or significance (decision = ${decision}).`
      );
    }

    // 2) quick metric readout
    parts.push(
      `Key metrics: uplift **${uplift.toFixed(1)}%**, p-value **${
        pv < 0.0001 ? "<0.0001" : pv.toFixed(4)
      }**, confidence **${confPct}%**.`
    );

    // 3) governance hints
    const govFlags: string[] = [];
    if (s?.srm_level) govFlags.push(`SRM: ${s.srm_level}`);
    if (s?.roi_level) govFlags.push(`ROI: ${s.roi_level}`);
    if (s?.expected_loss_level) govFlags.push(`Loss: ${s.expected_loss_level}`);
    if (s?.power_level) govFlags.push(`Power: ${s.power_level}`);

    if (govFlags.length) {
      parts.push(`Governance: ${govFlags.join(" · ")}.`);
    }

    return parts.join("\n\n");
  }, [decision, signals, confPct]);

  return (
    <div className="rounded-3xl border border-slate-200/10 bg-slate-900/35 backdrop-blur shadow-xl">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm uppercase tracking-widest text-slate-300/70">
              AI Insights
            </div>
            <h3 className="mt-1 text-xl font-extrabold text-white">
              LLM Metric Interpretation
            </h3>
            <p className="mt-2 text-sm text-slate-300/80">
              {canCall
                ? "Proxy mode enabled — generate an executive summary based on signals + policies."
                : "Demo mode — no LLM call is made (API keys are not stored client-side)."}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <span
              className={`px-2.5 py-1 rounded-full border text-xs font-bold ${badge(
                signals?.roi_level
              )}`}
            >
              ROI {String(signals?.roi_level || "—").toUpperCase()}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full border text-xs font-bold ${badge(
                signals?.expected_loss_level
              )}`}
            >
              LOSS {String(signals?.expected_loss_level || "—").toUpperCase()}
            </span>

            {/* button / demo badge */}
            <div className="mt-1">
              {canCall ? (
                <button
                  onClick={onGenerate}
                  disabled={loading}
                  className="px-3 py-2 rounded-xl border border-white/10 bg-white/10 hover:bg-white/15 text-xs font-semibold disabled:opacity-50"
                >
                  {loading ? "Generating…" : "Generate insights"}
                </button>
              ) : (
                <span className="text-xs opacity-70">demo</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-white">
              {canCall ? "LLM output" : "Demo output"}
            </div>
            <div className="text-xs text-slate-300/70">
              {canCall ? "proxy" : "placeholder"}
            </div>
          </div>

          {/* error */}
          {error ? (
            <div className="mt-3 text-sm text-rose-200/90 whitespace-pre-wrap">
              Error: {error}
            </div>
          ) : null}

          {/* output */}
          <pre className="mt-3 text-xs overflow-auto rounded-2xl p-4 bg-black/30 border border-white/10 whitespace-pre-wrap text-slate-200/90">
            {canCall ? markdown || demoText : demoText}
          </pre>
        </div>

        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-slate-300/70 hover:text-slate-200">
            What will be in the real LLM version?
          </summary>
          <div className="mt-3 text-sm text-slate-300/80 space-y-2">
            <div>• Short executive summary (what to do and why)</div>
            <div>• Sanity check: SRM/ROI/Expected loss/Power</div>
            <div>
              • Recommendations: how much more traffic, which segments to test,
              which risks to address
            </div>
            <div>
              • Links to the triggered policy rules + interpretation in plain
              language
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}

