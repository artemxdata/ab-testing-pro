// src/ui/PolicyDemoPanel.tsx
import React, { useMemo } from "react";
import DecisionTrace from "./DecisionTrace.tsx";

type PolicyDemoPanelProps = {
  pValue: number;
  upliftPct: number;
  signals: any;
  policyResult: any;
  policyError?: string | null;
  policyDocLoaded?: boolean;
};

function chipTone(sev: string) {
  const s = String(sev || "").toUpperCase();
  if (s === "CRITICAL") return "bg-rose-500/15 text-rose-800 border-rose-200 dark:text-rose-200 dark:border-rose-400/20";
  if (s === "HIGH") return "bg-amber-500/15 text-amber-900 border-amber-200 dark:text-amber-200 dark:border-amber-400/20";
  if (s === "MEDIUM") return "bg-slate-500/10 text-slate-800 border-slate-200 dark:text-slate-200 dark:border-slate-400/20";
  return "bg-slate-500/10 text-slate-800 border-slate-200 dark:text-slate-200 dark:border-slate-400/20";
}

export default function PolicyDemoPanel({
  pValue,
  upliftPct,
  signals,
  policyResult,
  policyError,
  policyDocLoaded,
}: PolicyDemoPanelProps) {
  const decision = policyResult?.decision || "CONTINUE_TEST";
  const confidence = policyResult?.confidence ?? 0.55;
  const triggeredRules = policyResult?.triggeredRules || [];

  const top = triggeredRules?.[0] || null;

  const summary = useMemo(() => {
    const title = top?.title || "No matched rule";
    const reason = top?.reason || "Default decision was used.";
    const severity = top?.severity || "INFO";
    const ruleId = top?.id || "—";
    const priority = typeof top?.priority === "number" ? top.priority : "—";

    return { title, reason, severity, ruleId, priority };
  }, [top]);

  return (
    <div className="rounded-3xl border border-slate-200/70 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/40 backdrop-blur shadow-xl">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-300/80">
              Explain
            </div>
            <h3 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
              Decision & trace
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300/90">
              Deterministic output from YAML policies.
            </p>
          </div>

          <div className="text-right">
            {!policyDocLoaded && !policyError ? (
              <div className="text-xs px-3 py-2 rounded-full border border-amber-300/40 bg-amber-500/10 text-amber-900 dark:text-amber-200">
                ⏳ Loading policies…
              </div>
            ) : null}

            {policyError ? (
              <div className="text-xs px-3 py-2 rounded-full border border-rose-300/40 bg-rose-500/10 text-rose-900 dark:text-rose-200">
                ⚠️ Policy error
              </div>
            ) : null}
          </div>
        </div>

        {/* Top summary */}
        <div className="mt-5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-950/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {decision}
                <span className="ml-2 text-xs font-semibold text-slate-600 dark:text-slate-300/80">
                  ({Math.round(Number(confidence || 0) * 100)}% confidence)
                </span>
              </div>
              <div className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                {summary.reason}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className={`px-2.5 py-1 rounded-full border text-xs font-bold ${chipTone(summary.severity)}`}>
                {String(summary.severity).toUpperCase()}
              </span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300/80">
            <div>
              <span className="font-semibold">Rule:</span> {summary.ruleId}
            </div>
            <div className="text-right">
              <span className="font-semibold">Priority:</span> {summary.priority}
            </div>
          </div>
        </div>

        {/* Trace */}
        <div className="mt-5">
          <DecisionTrace triggeredRules={triggeredRules} />
        </div>

        {/* Debug */}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-slate-600 dark:text-slate-300/80 select-none">
            Signals (debug)
          </summary>
          <pre className="mt-2 text-xs overflow-auto rounded-2xl p-4 bg-black/30 text-slate-50 border border-white/10">
            {JSON.stringify(
              { p_value: pValue, uplift_pct: upliftPct, ...signals },
              null,
              2
            )}
          </pre>
        </details>
      </div>
    </div>
  );
}

