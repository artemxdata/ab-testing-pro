import React, { useEffect, useMemo, useState } from "react";
import { loadPoliciesFromPublic } from "../policy/policyLoader";
import { evaluatePolicy } from "../policy/policyEngine";
import { buildSignals } from "../core/signals";
import type { PolicyDoc } from "../policy/policyTypes";
import type { PolicyEvaluation } from "../types/decision";
import { DecisionCard } from "./DecisionCard";
import { DecisionTrace } from "./DecisionTrace";

export function PolicyDemoPanel(props: {
  pValue: number;
  upliftPct: number;
  // optional extras (safe to omit for now)
  roiPct?: number;
  power?: number;
  expectedLoss?: number;
  srmFlag?: boolean;
}) {
  const [policies, setPolicies] = useState<PolicyDoc | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    loadPoliciesFromPublic("/policies/policies.yaml")
      .then(setPolicies)
      .catch((e) => setErr(String(e?.message || e)));
  }, []);

  const signals = useMemo(() => {
    return buildSignals(
      {
        pValue: props.pValue,
        upliftPct: props.upliftPct,
        roiPct: props.roiPct,
        power: props.power,
        expectedLoss: props.expectedLoss,
        srmFlag: props.srmFlag,
      },
      {
        alpha: 0.05,
        minUpliftPct: 2,
        minPower: 0.8,
        minRoiPct: 0,
      }
    );
  }, [props]);

  const result: PolicyEvaluation | null = useMemo(() => {
    if (!policies) return null;
    return evaluatePolicy(policies, signals);
  }, [policies, signals]);

  if (err) {
    return (
      <div style={{ marginTop: 16, padding: 16, border: "1px solid #ef4444", borderRadius: 12 }}>
        <b>Policy Engine Error:</b> {err}
      </div>
    );
  }

  if (!policies || !result) {
    return (
      <div style={{ marginTop: 16, padding: 16, border: "1px solid #e5e7eb", borderRadius: 12 }}>
        Loading policy engine...
      </div>
    );
  }

  return (
    <div style={{ marginTop: 18 }}>
      <DecisionCard decision={result.decision} confidence={result.confidence} signals={signals} />
      <DecisionTrace rules={result.triggeredRules} />

      <div style={{ marginTop: 16, padding: 16, border: "1px solid #e5e7eb", borderRadius: 12 }}>
        <div style={{ fontWeight: 700 }}>Signals (debug)</div>
        <pre style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{JSON.stringify(signals, null, 2)}</pre>
      </div>
    </div>
  );
}
