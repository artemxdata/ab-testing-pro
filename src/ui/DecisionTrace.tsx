// src/ui/DecisionTrace.tsx
import React, { useMemo, useState } from "react";

type TriggeredRule = {
  id: string;
  title?: string;
  severity?: string;
  decision?: string;
  confidence?: number;
  reason?: string;
  evidence?: string[];
  when?: string;
  match?: Record<string, any>;
  priority?: number;
};

type Props = {
  triggeredRules?: TriggeredRule[];
};

function severityBadge(sev?: string) {
  const s = String(sev || "").toUpperCase();
  if (s === "CRITICAL")
    return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800/40";
  if (s === "HIGH")
    return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-800/40";
  if (s === "MEDIUM")
    return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-800/40";
  if (s === "LOW")
    return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800/40";
  return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700";
}

function RuleCard({
  rule,
  compact = false,
}: {
  rule: TriggeredRule;
  compact?: boolean;
}) {
  const sev = String(rule.severity || "INFO").toUpperCase();
  const title = rule.title || rule.id;

  return (
    <div
      className={`rounded-xl border p-4 ${
        compact
          ? "bg-white/60 dark:bg-gray-900/40"
          : "bg-white dark:bg-gray-900/50"
      } border-gray-200 dark:border-gray-700`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 dark:text-white truncate">
            {title}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
            <span className="font-semibold">Rule ID:</span> {rule.id}
            {typeof rule.priority === "number" ? (
              <>
                {" "}
                <span className="opacity-70">•</span>{" "}
                <span className="font-semibold">priority:</span>{" "}
                {rule.priority}
              </>
            ) : null}
          </div>
        </div>

        <span
          className={`shrink-0 px-2.5 py-1 rounded-full border text-xs font-bold ${severityBadge(
            sev
          )}`}
        >
          {sev}
        </span>
      </div>

      {rule.reason ? (
        <div className="mt-3 text-sm text-gray-700 dark:text-gray-200">
          {rule.reason}
        </div>
      ) : null}

      <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
        {rule.decision ? (
          <div>
            <span className="font-semibold">then.decision:</span>{" "}
            {rule.decision}
            {typeof rule.confidence === "number" ? (
              <>
                {" "}
                <span className="opacity-70">•</span>{" "}
                <span className="font-semibold">then.confidence:</span>{" "}
                {(rule.confidence * 100).toFixed(0)}%
              </>
            ) : null}
          </div>
        ) : null}

        {Array.isArray(rule.evidence) && rule.evidence.length > 0 ? (
          <div className="mt-2">
            <div className="font-semibold mb-1">Evidence</div>
            <ul className="list-disc pl-5 space-y-0.5">
              {rule.evidence.map((e, idx) => (
                <li key={idx} className="break-words">
                  {e}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function DecisionTrace({ triggeredRules }: Props) {
  // Top rule should already be first (policyEngine sorts by priority/confidence),
  // but we still defend in UI.
  const sorted = useMemo(() => {
    const base = Array.isArray(triggeredRules) ? triggeredRules : [];
    const copy = [...base];

    copy.sort((a, b) => {
      const pa = typeof a.priority === "number" ? a.priority : 0;
      const pb = typeof b.priority === "number" ? b.priority : 0;
      if (pb !== pa) return pb - pa;

      const ca = typeof a.confidence === "number" ? a.confidence : 0;
      const cb = typeof b.confidence === "number" ? b.confidence : 0;
      return cb - ca;
    });

    return copy;
  }, [triggeredRules]);

  const top = sorted[0];
  const rest = sorted.slice(1);

  const [open, setOpen] = useState(false);

  if (!sorted.length) {
    return (
      <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-4">
        <div className="font-semibold text-gray-900 dark:text-white">
          Decision Trace
        </div>
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          No rules matched. Default decision was used.
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-semibold text-gray-900 dark:text-white">
            Decision Trace
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Why the engine made this decision (top rule + optional details)
          </div>
        </div>

        {rest.length > 0 ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-sm font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            {open ? "Hide details" : `Show all (${sorted.length})`}
          </button>
        ) : null}
      </div>

      {/* Top rule always visible */}
      <div className="mt-4">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
          Top rule
        </div>
        <RuleCard rule={top} compact />
      </div>

      {/* Rest collapsible */}
      {rest.length > 0 && open ? (
        <div className="mt-4">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
            Other triggered rules
          </div>
          <div className="space-y-3">
            {rest.map((r) => (
              <RuleCard key={r.id} rule={r} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

