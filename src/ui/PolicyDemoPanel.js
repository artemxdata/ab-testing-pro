import React, { useEffect, useMemo, useState } from "react";
import { loadPoliciesFromPublic } from "../policy/policyLoader";
import { evaluatePolicies } from "../policy/policyEngine";
import { buildSignals } from "../core/signals";

export function PolicyDemoPanel({ pValue, upliftPct }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [decision, setDecision] = useState(null);

  // Build minimal raw inputs for signals
  const signals = useMemo(() => {
    return buildSignals({
      p_value: pValue,
      uplift_pct: upliftPct,
      power: 0.6,          // пока заглушка
      roi_pct: upliftPct,  // тоже заглушка (потом заменим на реальный ROI)
      expected_loss: 0.0,  // заглушка
      srm_p_value: 1.0,    // заглушка
    });
  }, [pValue, upliftPct]);

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        setLoading(true);
        setError(null);

        const doc = await loadPoliciesFromPublic();
        const res = evaluatePolicies(doc, signals);

        if (!alive) return;
        setDecision(res);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || String(e));
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [signals]);

  if (loading) {
    return (
      <div className="mt-8 p-4 rounded-xl border border-gray-200">
        Loading policy engine…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 p-4 rounded-xl border border-red-300 bg-red-50 text-red-800">
        <b>Policy Engine Error:</b> {error}
      </div>
    );
  }

  if (!decision) return null;

  const listForTable =
    decision.triggeredRules && decision.triggeredRules.length
      ? decision.triggeredRules
      : [
          {
            id: "DEFAULT_CONTINUE",
            title: "Default safe behavior",
            severity: "INFO",
            decision: decision.decision,
            reason: "No policy rule matched",
          },
        ];

  return (
    <div className="mt-8 space-y-4">
      <div className="p-4 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="font-bold">Policy Decision</div>
          <div className="text-sm opacity-70">
            Confidence: {(decision.confidence * 100).toFixed(0)}%
          </div>
        </div>

        <div className="mt-2 text-2xl font-black">{decision.decision}</div>

        <div className="mt-3">
          <div className="font-semibold mb-2">Key Drivers</div>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>
              Significance (p-value): <b>{signals.p_value_level}</b>
            </li>
            <li>
              Effect size: <b>{signals.effect_size_level}</b>
            </li>
            <li>
              ROI: <b>{signals.roi_level}</b>
            </li>
            <li>
              Expected loss: <b>{signals.expected_loss_level}</b>
            </li>
            <li>
              SRM: <b>{signals.srm_level}</b>
            </li>
          </ul>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-gray-200">
        <div className="font-bold">Decision Trace</div>
        <div className="text-sm opacity-70">
          {decision.triggeredRules?.length || 0} rule(s) matched.
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Rule</th>
                <th className="py-2 pr-4">Severity</th>
                <th className="py-2 pr-4">Decision</th>
                <th className="py-2 pr-4">Reason</th>
              </tr>
            </thead>
            <tbody>
              {listForTable.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="py-2 pr-4">
                    <div className="font-semibold">{r.title || r.id}</div>
                    <div className="opacity-60">{r.id}</div>
                  </td>
                  <td className="py-2 pr-4">{r.severity || "INFO"}</td>
                  <td className="py-2 pr-4">{r.decision}</td>
                  <td className="py-2 pr-4">{r.reason || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <details className="p-4 rounded-xl border border-gray-200">
        <summary className="cursor-pointer font-bold">Signals (debug)</summary>
        <pre className="mt-3 text-xs overflow-x-auto">
{JSON.stringify(signals, null, 2)}
        </pre>
      </details>
    </div>
  );
}
