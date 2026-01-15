// src/ui/PolicyDemoPanel.tsx
import React from "react";
import DecisionCard from "./DecisionCard.tsx";
import DecisionTrace from "./DecisionTrace.tsx";

type PolicyDemoPanelProps = {
  pValue: number;
  upliftPct: number;
  // NEW: single source of truth
  signals: any;
  policyResult: any;
  policyError?: string | null;
  policyDocLoaded?: boolean;
};

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

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          ⏳ Policy Decision
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Decision is produced by YAML policies (deterministic engine)
        </div>
      </div>

      {!policyDocLoaded && !policyError && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-sm">
          ⏳ Policy Engine: Loading policies…
        </div>
      )}

      {policyError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-sm">
          ⚠️ Policy load error: {policyError}
        </div>
      )}

      <DecisionCard
        decision={decision}
        confidence={confidence}
        // these are not critical; DecisionCard uses signals for badges
        signals={signals}
      />

      <DecisionTrace triggeredRules={triggeredRules} />

      <div className="mt-4">
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
          Signals (debug)
        </div>
        <pre className="text-xs p-4 rounded-xl bg-gray-50 dark:bg-gray-900/60 text-gray-800 dark:text-gray-100 overflow-auto border border-gray-200 dark:border-gray-700">
          {JSON.stringify(
            {
              p_value: pValue,
              uplift_pct: upliftPct,
              ...signals,
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
}

