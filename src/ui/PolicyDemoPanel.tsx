import React, { useEffect, useMemo, useState } from "react";
import DecisionCard from "./DecisionCard";
import DecisionTrace from "./DecisionTrace";

// ВАЖНО: эти импорты должны уже существовать у тебя в проекте
import { loadPoliciesFromPublic } from "../policy/policyLoader";
import { evaluatePolicies } from "../policy/policyEngine";
import { buildSignals } from "../core/signals";

export type PolicyResult = {
  decision: string;
  confidence: number;
  triggeredRules: Array<{
    id: string;
    title?: string;
    severity?: string;
    decision?: string;
    reason?: string;
  }>;
  signals: Record<string, any>;
  policyVersion?: string;
};

type Props = {
  pValue: number;
  upliftPct: number;
  onResult?: (result: PolicyResult) => void; // <-- КЛЮЧЕВО: отдаём наверх
};

const PolicyDemoPanel: React.FC<Props> = ({ pValue, upliftPct, onResult }) => {
  const [loading, setLoading] = useState(false);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [result, setResult] = useState<PolicyResult | null>(null);

  // Сигналы считаем детерминированно из чисел
  const signals = useMemo(() => {
    // buildSignals — твоя функция ядра. Держим входы минимальными.
    return buildSignals({
      p_value: pValue,
      uplift_pct: upliftPct,
    });
  }, [pValue, upliftPct]);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      setLoading(true);
      setPolicyError(null);

      try {
        const policies = await loadPoliciesFromPublic();

        // evaluatePolicies — возвращает decision + confidence + triggeredRules
        const evaluated = evaluatePolicies(policies, signals);

        const res: PolicyResult = {
          decision: evaluated.decision,
          confidence: evaluated.confidence ?? policies?.defaultConfidence ?? 0.55,
          triggeredRules: evaluated.triggeredRules ?? [],
          signals,
          policyVersion: policies?.version,
        };

        if (!alive) return;

        setResult(res);
        onResult?.(res);
      } catch (e: any) {
        if (!alive) return;
        const msg = e?.message ? String(e.message) : "Unknown policy error";
        setPolicyError(msg);
        setResult(null);
        onResult?.({
          decision: "CONTINUE_TEST",
          confidence: 0.55,
          triggeredRules: [],
          signals,
        });
      } finally {
        if (alive) setLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [signals, onResult]);

  if (policyError) {
    return (
      <div className="mt-6 p-4 rounded-xl border border-red-300 bg-red-50 text-red-800">
        <b>Policy Engine Error:</b> {policyError}
      </div>
    );
  }

  if (loading || !result) {
    return (
      <div className="mt-6 p-4 rounded-xl border border-gray-200 bg-white text-gray-700">
        <b>Policy Engine:</b> {loading ? "Loading policies…" : "Waiting for decision…"}
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <DecisionCard decision={result.decision} confidence={result.confidence} />
      <DecisionTrace triggeredRules={result.triggeredRules} />
      <div className="p-4 rounded-xl border border-gray-200 bg-white">
        <div className="font-semibold mb-2">Signals (debug)</div>
        <pre className="text-xs overflow-auto">{JSON.stringify(result.signals, null, 2)}</pre>
      </div>
    </div>
  );
};

export default PolicyDemoPanel;
