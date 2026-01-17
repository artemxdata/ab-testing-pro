// src/components/ABTestingPro.js
import React, { useMemo, useState } from "react";

import { PolicyDemoPanel, DecisionHero, GovernancePanel, StatsStrip } from "../ui";
import PanelCard from "../ui/PanelCard.tsx";
import InputField from "../ui/InputField.tsx";

import { evaluatePolicies } from "../policy";
import { usePolicies } from "../policy";
import { buildSignals } from "../core";

const ABTestingPro = () => {
  const [controlVisitors, setControlVisitors] = useState(1000);
  const [controlConversions, setControlConversions] = useState(50);
  const [treatmentVisitors, setTreatmentVisitors] = useState(1000);
  const [treatmentConversions, setTreatmentConversions] = useState(58);

  // --- Business inputs ---
  const [revenuePerConversion, setRevenuePerConversion] = useState(50);
  const [testCost, setTestCost] = useState(200);
  const [riskPenaltyPct, setRiskPenaltyPct] = useState(20);

  // Expected traffic split (%)
  const [expectedSplitA, setExpectedSplitA] = useState(50);
  const [expectedSplitB, setExpectedSplitB] = useState(50);

  const [darkMode] = useState(true);
  const [activeTab] = useState("calculator");

  // ---------- Scenario Presets (Demo scenarios) ----------
  const applyScenario = (preset) => {
    const base = {
      revenuePerConversion: 50,
      testCost: 200,
      riskPenaltyPct: 20,
      expectedSplitA: 50,
      expectedSplitB: 50,
    };

    const p = { ...base, ...(preset || {}) };

    setControlVisitors(p.controlVisitors);
    setControlConversions(p.controlConversions);
    setTreatmentVisitors(p.treatmentVisitors);
    setTreatmentConversions(p.treatmentConversions);

    setRevenuePerConversion(p.revenuePerConversion);
    setTestCost(p.testCost);
    setRiskPenaltyPct(p.riskPenaltyPct);

    setExpectedSplitA(p.expectedSplitA);
    setExpectedSplitB(p.expectedSplitB);
  };

  const scenarios = [
    {
      id: "baseline",
      title: "Neutral / Continue",
      hint: "Not significant → CONTINUE_TEST",
      preset: {
        controlVisitors: 1000,
        controlConversions: 50,
        treatmentVisitors: 1000,
        treatmentConversions: 58,
      },
    },
    {
      id: "win",
      title: "Strong Win (Implement)",
      hint: "Significant positive + ok governance → IMPLEMENT",
      preset: {
        controlVisitors: 20000,
        controlConversions: 1000,
        treatmentVisitors: 20000,
        treatmentConversions: 1120,
        testCost: 500,
        revenuePerConversion: 50,
        riskPenaltyPct: 10,
        expectedSplitA: 50,
        expectedSplitB: 50,
      },
    },
    {
      id: "lose",
      title: "Significant Loss (Reject)",
      hint: "Significant negative → REJECT_TREATMENT",
      preset: {
        controlVisitors: 20000,
        controlConversions: 1000,
        treatmentVisitors: 20000,
        treatmentConversions: 850,
        testCost: 500,
        revenuePerConversion: 50,
        riskPenaltyPct: 10,
        expectedSplitA: 50,
        expectedSplitB: 50,
      },
    },
    {
      id: "srm",
      title: "SRM Broken (Escalate)",
      hint: "Traffic split mismatch → ESCALATE",
      preset: {
        controlVisitors: 1000,
        controlConversions: 50,
        treatmentVisitors: 3300,
        treatmentConversions: 58,
        testCost: 200,
        revenuePerConversion: 50,
        riskPenaltyPct: 20,
        expectedSplitA: 50,
        expectedSplitB: 50,
      },
    },
    {
      id: "gov",
      title: "Governance Red (Escalate)",
      hint: "Bad ROI / high loss → ESCALATE (even if looks good)",
      preset: {
        controlVisitors: 5000,
        controlConversions: 250,
        treatmentVisitors: 5000,
        treatmentConversions: 300,
        testCost: 8000,
        revenuePerConversion: 20,
        riskPenaltyPct: 30,
        expectedSplitA: 50,
        expectedSplitB: 50,
      },
    },
  ];

  // ---------- policies ----------
  const { policyDoc, policyError, loading: policyLoading } = usePolicies();

  // ---------- helpers ----------
  const rate = (c, v) => (v > 0 ? (c / v) * 100 : 0);

  // ---------- metrics ----------
  const controlRate = useMemo(
    () => rate(controlConversions, controlVisitors),
    [controlConversions, controlVisitors]
  );

  const treatmentRate = useMemo(
    () => rate(treatmentConversions, treatmentVisitors),
    [treatmentConversions, treatmentVisitors]
  );

  const improvement = useMemo(() => {
    return controlRate > 0
      ? ((treatmentRate - controlRate) / controlRate) * 100
      : 0;
  }, [controlRate, treatmentRate]);

  const zScore = useMemo(() => {
    if (controlVisitors <= 0 || treatmentVisitors <= 0) return 0;
    const p1 = controlConversions / controlVisitors;
    const p2 = treatmentConversions / treatmentVisitors;
    const pooled =
      (controlConversions + treatmentConversions) /
      (controlVisitors + treatmentVisitors);
    const se = Math.sqrt(
      pooled * (1 - pooled) * (1 / controlVisitors + 1 / treatmentVisitors)
    );
    return se > 0 ? (p2 - p1) / se : 0;
  }, [
    controlVisitors,
    treatmentVisitors,
    controlConversions,
    treatmentConversions,
  ]);

  const pValue = useMemo(() => {
    const erf = (x) => {
      const sign = x >= 0 ? 1 : -1;
      x = Math.abs(x);
      const t = 1 / (1 + 0.3275911 * x);
      const y =
        1 -
        (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t -
          0.284496736) *
          t +
          0.254829592) *
          t *
          Math.exp(-x * x));
      return sign * y;
    };
    const cdf = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
    return zScore === 0 ? 1 : 2 * (1 - cdf(Math.abs(zScore)));
  }, [zScore]);

  const upliftRate = useMemo(() => {
    const a = controlVisitors > 0 ? controlConversions / controlVisitors : 0;
    const b =
      treatmentVisitors > 0 ? treatmentConversions / treatmentVisitors : 0;
    return b - a;
  }, [
    controlVisitors,
    controlConversions,
    treatmentVisitors,
    treatmentConversions,
  ]);

  const incrementalRevenue = useMemo(() => {
    return treatmentVisitors * upliftRate * revenuePerConversion;
  }, [treatmentVisitors, upliftRate, revenuePerConversion]);

  const roiPct = useMemo(() => {
    if (testCost <= 0) return 0;
    return ((incrementalRevenue - testCost) / testCost) * 100;
  }, [incrementalRevenue, testCost]);

  const expectedLossRate = useMemo(() => {
    const penalty = riskPenaltyPct / 100;
    return (
      Math.abs(incrementalRevenue) * penalty * pValue / Math.max(testCost, 1)
    );
  }, [incrementalRevenue, riskPenaltyPct, pValue, testCost]);

  const power = useMemo(() => {
    const z = Math.abs(zScore);
    return Math.min(1, Math.max(0, 1 - Math.exp(-0.5 * z * z)));
  }, [zScore]);

  // ---------- signals ----------
  const signals = useMemo(
    () =>
      buildSignals({
        p_value: pValue,
        uplift_pct: improvement,
        n_control: controlVisitors,
        n_treatment: treatmentVisitors,
        expected_split_a: expectedSplitA,
        expected_split_b: expectedSplitB,
        revenue_per_conversion: revenuePerConversion,
        roi_pct: roiPct,
        expected_loss: expectedLossRate,
        power,
        alpha: 0.05,
      }),
    [
      pValue,
      improvement,
      controlVisitors,
      treatmentVisitors,
      expectedSplitA,
      expectedSplitB,
      revenuePerConversion,
      roiPct,
      expectedLossRate,
      power,
    ]
  );

  const policyResult = useMemo(() => {
    if (!policyDoc) return null;
    return evaluatePolicies(policyDoc, signals);
  }, [policyDoc, signals]);

  const decision = policyResult?.decision || "CONTINUE_TEST";
  const decisionConfidence = policyResult?.confidence ?? 0.55;

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {activeTab === "calculator" && (
          <div className="grid grid-cols-12 gap-6">
            {/* LEFT — Inputs */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <PanelCard
                title="Experiment setup"
                subtitle="Edit counts + business assumptions"
              >
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-300/80">
                      Control (A)
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <InputField
                        label="Visitors"
                        value={controlVisitors}
                        min={0}
                        step={1}
                        onChange={(v) => setControlVisitors(Number(v || 0))}
                      />
                      <InputField
                        label="Conversions"
                        value={controlConversions}
                        min={0}
                        step={1}
                        onChange={(v) => setControlConversions(Number(v || 0))}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-300/80">
                      Treatment (B)
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <InputField
                        label="Visitors"
                        value={treatmentVisitors}
                        min={0}
                        step={1}
                        onChange={(v) =>
                          setTreatmentVisitors(Number(v || 0))
                        }
                      />
                      <InputField
                        label="Conversions"
                        value={treatmentConversions}
                        min={0}
                        step={1}
                        onChange={(v) =>
                          setTreatmentConversions(Number(v || 0))
                        }
                      />
                    </div>
                  </div>
                </div>
              </PanelCard>

              <PanelCard title="Business inputs" subtitle="MVP governance knobs">
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="Revenue / conv"
                    suffix="€"
                    value={revenuePerConversion}
                    min={0}
                    step={1}
                    onChange={(v) =>
                      setRevenuePerConversion(Number(v || 0))
                    }
                  />
                  <InputField
                    label="Test cost"
                    suffix="€"
                    value={testCost}
                    min={0}
                    step={10}
                    onChange={(v) => setTestCost(Number(v || 0))}
                  />
                  <InputField
                    label="Risk penalty"
                    suffix="%"
                    value={riskPenaltyPct}
                    min={0}
                    step={1}
                    onChange={(v) => setRiskPenaltyPct(Number(v || 0))}
                  />
                  <div />
                </div>
              </PanelCard>

              <PanelCard
                title="Traffic expectation"
                subtitle="Used for SRM detection"
              >
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="Expected A"
                    suffix="%"
                    value={expectedSplitA}
                    min={0}
                    step={1}
                    onChange={(v) => setExpectedSplitA(Number(v || 0))}
                  />
                  <InputField
                    label="Expected B"
                    suffix="%"
                    value={expectedSplitB}
                    min={0}
                    step={1}
                    onChange={(v) => setExpectedSplitB(Number(v || 0))}
                  />
                </div>

                <div className="mt-3 text-xs text-slate-600 dark:text-slate-300/80">
                  Tip: keep A+B = 100. If not, we normalize internally.
                </div>
              </PanelCard>
            </div>

            {/* CENTER */}
            <div className="col-span-12 lg:col-span-5 space-y-6">
              <DecisionHero
                decision={decision}
                confidence={decisionConfidence}
                topRule={policyResult?.triggeredRules?.[0] || null}
                darkMode={darkMode}
              />

              <StatsStrip
                pValue={pValue}
                upliftPct={improvement}
                zScore={zScore}
                alpha={0.05}
              />

              {/* Demo scenarios (kept) */}
              <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur shadow-xl p-6">
                <div className="text-sm uppercase tracking-widest opacity-80">
                  Demo scenarios
                </div>
                <h3 className="mt-1 text-xl font-extrabold">One-click presets</h3>
                <p className="mt-2 text-sm opacity-85">
                  Быстро переключайся между кейсами, чтобы проверять policy правила.
                </p>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {scenarios.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => applyScenario(s.preset)}
                      className="text-left rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all p-4"
                    >
                      <div className="font-bold">{s.title}</div>
                      <div className="text-xs opacity-80 mt-1">{s.hint}</div>
                    </button>
                  ))}
                </div>
              </div>

              <GovernancePanel
                signals={signals}
                policyError={policyError}
                policyDocLoaded={!policyLoading && !!policyDoc}
              />
            </div>

            {/* RIGHT — Details */}
            <div className="col-span-12 lg:col-span-3 space-y-6">
              <PolicyDemoPanel
                pValue={pValue}
                upliftPct={improvement}
                signals={signals}
                policyResult={policyResult}
                policyError={policyError}
                policyDocLoaded={!policyLoading && !!policyDoc}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ABTestingPro;

