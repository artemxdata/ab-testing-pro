// src/components/ABTestingPro.js
import React, { useEffect, useMemo, useState } from "react";

import { PolicyDemoPanel } from "../ui";
import { loadPoliciesFromPublic } from "../policy";
import { evaluatePolicies } from "../policy";
import { buildSignals } from "../core";

const ABTestingPro = () => {
  const [controlVisitors, setControlVisitors] = useState(1000);
  const [controlConversions, setControlConversions] = useState(50);
  const [treatmentVisitors, setTreatmentVisitors] = useState(1000);
  const [treatmentConversions, setTreatmentConversions] = useState(58);

  // --- Business inputs (MVP) ---
  const [revenuePerConversion, setRevenuePerConversion] = useState(50); // €
  const [testCost, setTestCost] = useState(200); // €
  const [riskPenaltyPct, setRiskPenaltyPct] = useState(20); // % penalty for uncertainty

  // Expected traffic split (%) with auto-normalization (A + B = 100)
  const [expectedSplitA, setExpectedSplitA] = useState(50); // %
  const [expectedSplitB, setExpectedSplitB] = useState(50); // %

  const [isAnimating, setIsAnimating] = useState(false);
  const [darkMode, setDarkMode] = useState(true); // ✅ dark default
  const [activeTab, setActiveTab] = useState("calculator");

  // policy state
  const [policyDoc, setPolicyDoc] = useState(null);
  const [policyError, setPolicyError] = useState(null);

  // ---------- helpers ----------
  const clampInt = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.floor(n));
  };

  const clampPct = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, n));
  };

  const handleExpectedSplitAChange = (v) => {
    const a = clampPct(v);
    const b = 100 - a;
    setExpectedSplitA(a);
    setExpectedSplitB(b);
  };

  const handleExpectedSplitBChange = (v) => {
    const b = clampPct(v);
    const a = 100 - b;
    setExpectedSplitB(b);
    setExpectedSplitA(a);
  };

  const calculateConversionRate = (conversions, visitors) => {
    return visitors > 0 ? (conversions / visitors) * 100 : 0;
  };

  // ---------- derived metrics ----------
  const controlRate = useMemo(() => {
    return calculateConversionRate(controlConversions, controlVisitors);
  }, [controlConversions, controlVisitors]);

  const treatmentRate = useMemo(() => {
    return calculateConversionRate(treatmentConversions, treatmentVisitors);
  }, [treatmentConversions, treatmentVisitors]);

  const improvement = useMemo(() => {
    return controlRate > 0 ? ((treatmentRate - controlRate) / controlRate) * 100 : 0;
  }, [controlRate, treatmentRate]);

  const zScore = useMemo(() => {
    if (controlVisitors <= 0 || treatmentVisitors <= 0) return 0;
    if (controlConversions < 0 || treatmentConversions < 0) return 0;
    if (controlConversions > controlVisitors || treatmentConversions > treatmentVisitors) return 0;

    const p1 = controlConversions / controlVisitors;
    const p2 = treatmentConversions / treatmentVisitors;
    const pooledRate = (controlConversions + treatmentConversions) / (controlVisitors + treatmentVisitors);

    const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1 / controlVisitors + 1 / treatmentVisitors));
    return se > 0 ? (p2 - p1) / se : 0;
  }, [controlVisitors, treatmentVisitors, controlConversions, treatmentConversions]);

  // --- Correct normal CDF & p-value (two-tailed) ---
  const pValue = useMemo(() => {
    const erf = (x) => {
      const sign = x >= 0 ? 1 : -1;
      x = Math.abs(x);

      const a1 = 0.254829592;
      const a2 = -0.284496736;
      const a3 = 1.421413741;
      const a4 = -1.453152027;
      const a5 = 1.061405429;
      const p = 0.3275911;

      const t = 1.0 / (1.0 + p * x);
      const y = 1.0 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x));
      return sign * y;
    };

    const normalCdf = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
    const raw = zScore === 0 ? 1 : 2 * (1 - normalCdf(Math.abs(zScore)));
    const bounded = Math.max(0, Math.min(1, raw));

    if (!Number.isFinite(bounded)) return 1;
    return bounded;
  }, [zScore]);

  // --- Derived business metrics (MVP) ---
  const upliftRate = useMemo(() => {
    const p1 = controlVisitors > 0 ? controlConversions / controlVisitors : 0;
    const p2 = treatmentVisitors > 0 ? treatmentConversions / treatmentVisitors : 0;
    return p2 - p1;
  }, [controlVisitors, controlConversions, treatmentVisitors, treatmentConversions]);

  const incrementalConversions = useMemo(() => {
    return treatmentVisitors * upliftRate;
  }, [treatmentVisitors, upliftRate]);

  const incrementalRevenue = useMemo(() => {
    return incrementalConversions * Number(revenuePerConversion || 0);
  }, [incrementalConversions, revenuePerConversion]);

  const costPerVisitor = useMemo(() => {
    const total = Math.max(1, controlVisitors + treatmentVisitors);
    const cost = Number(testCost || 0);
    return cost / total;
  }, [testCost, controlVisitors, treatmentVisitors]);

  const roiPct = useMemo(() => {
    const cost = Number(testCost || 0);
    if (cost <= 0) return 0;
    return ((incrementalRevenue - cost) / cost) * 100;
  }, [incrementalRevenue, testCost]);

  const expectedLossEuro = useMemo(() => {
    const base = Math.abs(incrementalRevenue);
    if (!Number.isFinite(base) || base <= 0) return 0;
    const penalty = Number(riskPenaltyPct || 0) / 100;

    const uncertainty = Math.min(1, Math.max(0, pValue));
    return base * penalty * uncertainty;
  }, [incrementalRevenue, riskPenaltyPct, pValue]);

  const expectedLossRate = useMemo(() => {
    const cost = Number(testCost || 0);
    if (cost <= 0) return 0;
    return Number(expectedLossEuro || 0) / cost;
  }, [expectedLossEuro, testCost]);

  const power = useMemo(() => {
    const z = Math.abs(zScore);
    if (!Number.isFinite(z)) return 0;
    const v = 1 - Math.exp(-0.5 * z * z);
    return Math.max(0, Math.min(1, v));
  }, [zScore]);

  // ---------- dark mode ----------
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  // ---------- policy: load once ----------
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setPolicyError(null);
        const doc = await loadPoliciesFromPublic();
        if (!cancelled) setPolicyDoc(doc);
      } catch (e) {
        if (!cancelled) setPolicyError(e?.message || String(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- build signals + evaluate policies ----------
  const buildSignalsFn = buildSignals;

  const signals = useMemo(() => {
    return buildSignalsFn({
      p_value: pValue,
      uplift_pct: improvement,
      n_control: controlVisitors,
      n_treatment: treatmentVisitors,

      expected_split_a: Number(expectedSplitA || 50),
      expected_split_b: Number(expectedSplitB || 50),

      revenue_per_conversion: Number(revenuePerConversion || 0),
      cost_per_visitor: Number(costPerVisitor || 0),
      roi_pct: Number(roiPct || 0),

      expected_loss: Number(expectedLossRate || 0),

      power: Number(power || 0),
      alpha: 0.05,
    });
  }, [
    buildSignalsFn,
    pValue,
    improvement,
    controlVisitors,
    treatmentVisitors,
    expectedSplitA,
    expectedSplitB,
    revenuePerConversion,
    costPerVisitor,
    roiPct,
    expectedLossRate,
    power,
  ]);

  const policyResult = useMemo(() => {
    if (!policyDoc) return null;
    return evaluatePolicies(policyDoc, signals);
  }, [policyDoc, signals]);

  const decision = policyResult?.decision || "CONTINUE_TEST";
  const decisionConfidence = policyResult?.confidence ?? 0.55;

  const decisionMeta = useMemo(() => {
    switch (decision) {
      case "IMPLEMENT_TREATMENT":
        return {
          title: "🚀 Implement Treatment B!",
          subtitle: "Policy allows rollout.",
          tone: "from-green-500 to-emerald-600",
        };
      case "REJECT_TREATMENT":
        return {
          title: "⚠️ Reject Treatment B",
          subtitle: "Policy blocks rollout.",
          tone: "from-red-500 to-rose-600",
        };
      case "ESCALATE":
        return {
          title: "🧯 Escalate",
          subtitle: "Critical issue detected — investigate first.",
          tone: "from-orange-500 to-amber-600",
        };
      default:
        return {
          title: "⏳ Continue Testing",
          subtitle: "More data needed / no rule matched.",
          tone: "from-yellow-500 to-orange-600",
        };
    }
  }, [decision]);

  // ---------- actions ----------
  const loadSampleData = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setControlVisitors(1000);
      setControlConversions(50);
      setTreatmentVisitors(1000);
      setTreatmentConversions(58);
      setIsAnimating(false);
    }, 250);
  };

  const generateRandomData = () => {
    setIsAnimating(true);
    setTimeout(() => {
      const baseVisitors = Math.floor(Math.random() * 5000) + 1000;
      const baseRate = Math.random() * 0.15 + 0.02;
      const lift = (Math.random() - 0.5) * 0.6;

      const aVisitors = baseVisitors;
      const bVisitors = baseVisitors + Math.floor(Math.random() * 200 - 100);

      const aConv = Math.floor(aVisitors * baseRate);
      const bConv = Math.floor(bVisitors * baseRate * (1 + lift));

      setControlVisitors(aVisitors);
      setControlConversions(aConv);
      setTreatmentVisitors(Math.max(0, bVisitors));
      setTreatmentConversions(Math.max(0, bConv));
      setIsAnimating(false);
    }, 500);
  };

  // ---- presets (inserted next to loadSampleData / generateRandomData) ----
  const presets = {
    cleanWin: {
      name: "✅ Clean Win (Implement)",
      controlVisitors: 20000,
      controlConversions: 900,
      treatmentVisitors: 20000,
      treatmentConversions: 1030,
      revenuePerConversion: 50,
      testCost: 500,
      riskPenaltyPct: 15,
    },
    significantLoss: {
      name: "❌ Significant Loss (Reject)",
      controlVisitors: 20000,
      controlConversions: 900,
      treatmentVisitors: 20000,
      treatmentConversions: 780,
      revenuePerConversion: 50,
      testCost: 500,
      riskPenaltyPct: 15,
    },
    srmBroken: {
      name: "🧯 SRM Broken (Escalate)",
      controlVisitors: 20000,
      controlConversions: 900,
      treatmentVisitors: 60000,
      treatmentConversions: 2700,
      revenuePerConversion: 50,
      testCost: 500,
      riskPenaltyPct: 15,
    },
    riskyEconomics: {
      name: "⚠️ Risky Economics (Escalate)",
      controlVisitors: 20000,
      controlConversions: 900,
      treatmentVisitors: 20000,
      treatmentConversions: 950,
      revenuePerConversion: 10,
      testCost: 5000,
      riskPenaltyPct: 30,
    },
  };

  function applyPreset(p) {
    setControlVisitors(p.controlVisitors);
    setControlConversions(p.controlConversions);
    setTreatmentVisitors(p.treatmentVisitors);
    setTreatmentConversions(p.treatmentConversions);
    setRevenuePerConversion(p.revenuePerConversion);
    setTestCost(p.testCost);
    setRiskPenaltyPct(p.riskPenaltyPct);
  }

  // ---------- UI helpers ----------
  const cardBase = `rounded-2xl border p-6 shadow-xl ${
    darkMode ? "bg-slate-900/60 border-slate-800 text-slate-100" : "bg-white border-gray-200 text-gray-900"
  }`;

  return (
    <div
      className={`min-h-screen transition-all duration-300 ${
        darkMode ? "bg-gray-900" : "bg-gradient-to-br from-indigo-50 via-white to-cyan-50"
      }`}
    >
      <div className="relative z-10 container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <header className="text-center py-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <div className="text-left">
                <h1 className={`text-4xl font-black ${darkMode ? "text-white" : "text-gray-900"}`}>A/B Testing Pro</h1>
                <p className={`${darkMode ? "text-gray-300" : "text-gray-600"} font-medium`}>Professional Statistical Analysis Platform</p>
              </div>
            </div>

            <button
              onClick={() => setDarkMode((v) => !v)}
              className={`p-3 rounded-xl transition-all duration-200 ${
                darkMode ? "bg-yellow-500 text-gray-900 hover:bg-yellow-400" : "bg-gray-800 text-yellow-400 hover:bg-gray-700"
              }`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>

          {/* Tabs */}
          <div className={`flex justify-center space-x-1 p-1 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg max-w-md mx-auto`}>
            {[
              { id: "calculator", icon: "📊" },
              { id: "insights", icon: "🧠" },
              { id: "history", icon: "📈" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-lg"
                    : darkMode
                    ? "text-gray-300 hover:text-white hover:bg-gray-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {tab.icon}
              </button>
            ))}
          </div>
        </header>

        {/* ---------------- CALCULATOR TAB (DASHBOARD GRID) ---------------- */}
        {activeTab === "calculator" && (
          <div className="grid grid-cols-12 gap-6">
            {/* LEFT */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              {/* A/B Inputs card */}
              <div className={cardBase}>
                <div className="flex items-center justify-between mb-5">
                  <div className="text-left">
                    <h2 className="text-xl font-extrabold">Inputs</h2>
                    <p className={`${darkMode ? "text-slate-300" : "text-gray-600"} text-sm`}>Traffic & conversions</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${darkMode ? "bg-slate-800 text-slate-200" : "bg-gray-100 text-gray-700"}`}>
                    A/B
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Control */}
                  <div className={`rounded-xl border p-4 ${darkMode ? "border-slate-800 bg-slate-950/40" : "border-gray-200 bg-gray-50"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-600 text-white font-bold">A</span>
                        <span className="font-semibold">Control</span>
                      </div>
                      <span className={`${darkMode ? "text-slate-300" : "text-gray-600"} text-sm`}>{controlRate.toFixed(2)}%</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>Visitors</label>
                        <input
                          type="number"
                          className={`w-full px-3 py-2 rounded-xl border font-semibold ${
                            darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-gray-200 text-gray-900"
                          }`}
                          value={controlVisitors}
                          onChange={(e) => setControlVisitors(clampInt(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>Conversions</label>
                        <input
                          type="number"
                          className={`w-full px-3 py-2 rounded-xl border font-semibold ${
                            darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-gray-200 text-gray-900"
                          }`}
                          value={controlConversions}
                          onChange={(e) => setControlConversions(clampInt(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Treatment */}
                  <div className={`rounded-xl border p-4 ${darkMode ? "border-slate-800 bg-slate-950/40" : "border-gray-200 bg-gray-50"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold">B</span>
                        <span className="font-semibold">Treatment</span>
                      </div>
                      <span className={`${darkMode ? "text-slate-300" : "text-gray-600"} text-sm`}>{treatmentRate.toFixed(2)}%</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>Visitors</label>
                        <input
                          type="number"
                          className={`w-full px-3 py-2 rounded-xl border font-semibold ${
                            darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-gray-200 text-gray-900"
                          }`}
                          value={treatmentVisitors}
                          onChange={(e) => setTreatmentVisitors(clampInt(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>Conversions</label>
                        <input
                          type="number"
                          className={`w-full px-3 py-2 rounded-xl border font-semibold ${
                            darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-gray-200 text-gray-900"
                          }`}
                          value={treatmentConversions}
                          onChange={(e) => setTreatmentConversions(clampInt(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Inputs card */}
              <div className={cardBase}>
                <div className="flex items-center justify-between mb-5">
                  <div className="text-left">
                    <h3 className="text-xl font-extrabold">Business Inputs</h3>
                    <p className={`${darkMode ? "text-slate-300" : "text-gray-600"} text-sm`}>ROI & risk assumptions</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${darkMode ? "bg-slate-800 text-slate-200" : "bg-gray-100 text-gray-700"}`}>
                    MVP
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>Revenue / conversion (€)</label>
                    <input
                      type="number"
                      className={`w-full px-3 py-2 rounded-xl border font-semibold ${
                        darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-gray-200 text-gray-900"
                      }`}
                      value={revenuePerConversion}
                      onChange={(e) => setRevenuePerConversion(Number(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>Test cost (€)</label>
                    <input
                      type="number"
                      className={`w-full px-3 py-2 rounded-xl border font-semibold ${
                        darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-gray-200 text-gray-900"
                      }`}
                      value={testCost}
                      onChange={(e) => setTestCost(Number(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>Risk penalty (%)</label>
                    <input
                      type="number"
                      className={`w-full px-3 py-2 rounded-xl border font-semibold ${
                        darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-gray-200 text-gray-900"
                      }`}
                      value={riskPenaltyPct}
                      onChange={(e) => setRiskPenaltyPct(Number(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>Expected split A (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className={`w-full px-3 py-2 rounded-xl border font-semibold ${
                        darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-gray-200 text-gray-900"
                      }`}
                      value={expectedSplitA}
                      onChange={(e) => handleExpectedSplitAChange(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>Expected split B (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className={`w-full px-3 py-2 rounded-xl border font-semibold ${
                        darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-gray-200 text-gray-900"
                      }`}
                      value={expectedSplitB}
                      onChange={(e) => handleExpectedSplitBChange(e.target.value)}
                    />
                  </div>

                  <div className={`sm:col-span-2 rounded-xl border p-3 ${darkMode ? "border-slate-800 bg-slate-950/40" : "border-gray-200 bg-gray-50"}`}>
                    <div className={`text-sm ${darkMode ? "text-slate-200" : "text-gray-800"}`}>
                      <span className="font-semibold">ROI:</span> {roiPct.toFixed(1)}% ·{" "}
                      <span className="font-semibold">Expected loss:</span> €{expectedLossEuro.toFixed(0)} ·{" "}
                      <span className="font-semibold">Power:</span> {(power * 100).toFixed(0)}% ·{" "}
                      <span className="font-semibold">Cost/visitor:</span> €{costPerVisitor.toFixed(4)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CENTER */}
            <div className="col-span-12 lg:col-span-5 space-y-6">
              {/* Results header card */}
              <div className={cardBase}>
                <div className="flex items-center justify-between mb-5">
                  <div className="text-left">
                    <h2 className="text-xl font-extrabold">Statistical Results</h2>
                    <p className={`${darkMode ? "text-slate-300" : "text-gray-600"} text-sm`}>Key metrics snapshot</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${darkMode ? "bg-slate-800 text-slate-200" : "bg-gray-100 text-gray-700"}`}>Live</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className={`rounded-xl border p-4 ${darkMode ? "border-slate-800 bg-slate-950/40" : "border-gray-200 bg-gray-50"}`}>
                    <p className={`${darkMode ? "text-slate-300" : "text-gray-700"} text-xs font-semibold mb-1`}>📈 Improvement</p>
                    <p className={`text-2xl font-black ${improvement >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {improvement >= 0 ? "+" : ""}
                      {improvement.toFixed(1)}%
                    </p>
                  </div>

                  <div className={`rounded-xl border p-4 ${darkMode ? "border-slate-800 bg-slate-950/40" : "border-gray-200 bg-gray-50"}`}>
                    <p className={`${darkMode ? "text-slate-300" : "text-gray-700"} text-xs font-semibold mb-1`}>📊 Z-Score</p>
                    <p className={`text-2xl font-black ${darkMode ? "text-sky-300" : "text-blue-600"}`}>{zScore.toFixed(2)}</p>
                  </div>

                  <div className={`rounded-xl border p-4 ${darkMode ? "border-slate-800 bg-slate-950/40" : "border-gray-200 bg-gray-50"}`}>
                    <p className={`${darkMode ? "text-slate-300" : "text-gray-700"} text-xs font-semibold mb-1`}>🎯 P-Value</p>
                    <p className={`text-2xl font-black ${darkMode ? "text-indigo-300" : "text-indigo-600"}`}>{pValue.toFixed(4)}</p>
                  </div>

                  <div className={`rounded-xl border p-4 ${darkMode ? "border-slate-800 bg-slate-950/40" : "border-gray-200 bg-gray-50"}`}>
                    <p className={`${darkMode ? "text-slate-300" : "text-gray-700"} text-xs font-semibold mb-1`}>🏆 Winner</p>
                    <p className={`text-2xl font-black ${darkMode ? "text-pink-300" : "text-pink-600"}`}>
                      {treatmentRate > controlRate ? "B" : controlRate > treatmentRate ? "A" : "Tie"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Decision banner card */}
              <div className={`rounded-2xl border p-6 shadow-xl ${darkMode ? "border-slate-800" : "border-gray-200"} bg-gradient-to-r ${decisionMeta.tone} text-white`}>
                <div className="flex items-start gap-4">
                  <div className="text-4xl">🎛️</div>
                  <div className="text-left">
                    <h3 className="text-2xl font-black mb-1">{decisionMeta.title}</h3>
                    <p className="text-base opacity-90">
                      {decisionMeta.subtitle} Confidence: {(decisionConfidence * 100).toFixed(0)}%
                    </p>

                    {policyError && <p className="mt-3 text-sm opacity-95">⚠️ Policy load error: {policyError}</p>}
                    {!policyDoc && !policyError && <p className="mt-3 text-sm opacity-95">⏳ Policy Engine: Loading policies…</p>}
                  </div>
                </div>
              </div>

              {/* Actions + Presets (moved to CENTER) */}
              <div className={cardBase}>
                <div className="flex items-center justify-between mb-5">
                  <div className="text-left">
                    <h3 className="text-xl font-extrabold">Actions</h3>
                    <p className={`${darkMode ? "text-slate-300" : "text-gray-600"} text-sm`}>Quick scenarios & controls</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${darkMode ? "bg-slate-800 text-slate-200" : "bg-gray-100 text-gray-700"}`}>
                    Tools
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={loadSampleData}
                    disabled={isAnimating}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnimating ? "🔄 Loading..." : "📊 Load Sample"}
                  </button>

                  <button
                    onClick={generateRandomData}
                    disabled={isAnimating}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnimating ? "🎲 Generating..." : "🎲 Random Test"}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                  {Object.values(presets).map((p) => (
                    <button
                      key={p.name}
                      onClick={() => applyPreset(p)}
                      className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-semibold text-gray-800 dark:text-gray-100"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="col-span-12 lg:col-span-3 space-y-6">
              <div className={cardBase}>
                <div className="flex items-center justify-between mb-5">
                  <div className="text-left">
                    <h3 className="text-xl font-extrabold">Decision & Trace</h3>
                    <p className={`${darkMode ? "text-slate-300" : "text-gray-600"} text-sm`}>Rules & rationale</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${darkMode ? "bg-slate-800 text-slate-200" : "bg-gray-100 text-gray-700"}`}>
                    Audit
                  </div>
                </div>

                <PolicyDemoPanel
                  pValue={pValue}
                  upliftPct={improvement}
                  signals={signals}
                  policyResult={policyResult}
                  policyError={policyError}
                  policyDocLoaded={!!policyDoc}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "insights" && (
          <div className={cardBase}>
            <h2 className="text-3xl font-bold mb-6">🧠 AI-Powered Insights</h2>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className={`p-6 rounded-xl border ${darkMode ? "border-slate-800 bg-slate-950/40" : "border-gray-200 bg-gray-50"}`}>
                <h3 className="text-xl font-bold mb-4">📈 Performance Analysis</h3>
                <p className={`${darkMode ? "text-slate-200" : "text-gray-700"}`}>
                  Your test shows {Math.abs(improvement).toFixed(1)}% difference between variants.
                </p>
              </div>
              <div className={`p-6 rounded-xl border ${darkMode ? "border-slate-800 bg-slate-950/40" : "border-gray-200 bg-gray-50"}`}>
                <h3 className="text-xl font-bold mb-4">🎯 Recommendations</h3>
                <p className={`${darkMode ? "text-slate-200" : "text-gray-700"}`}>
                  Current policy decision: <b>{decision}</b> (confidence {(decisionConfidence * 100).toFixed(0)}%).
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className={cardBase}>
            <h2 className="text-3xl font-bold mb-6">📈 Test History</h2>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <p className={`text-xl ${darkMode ? "text-slate-300" : "text-gray-600"}`}>Test history feature coming soon!</p>
              <p className={`${darkMode ? "text-slate-400" : "text-gray-500"} mt-2`}>
                Track your experiments over time with detailed analytics.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center py-12">
          <div className={`inline-flex items-center space-x-2 px-6 py-3 rounded-full ${darkMode ? "bg-gray-800 text-gray-300" : "bg-white text-gray-600"} shadow-lg`}>
            <span>⚡</span>
            <span className="font-medium">Powered by Statistical Science</span>
            <span>•</span>
            <span>Built with React</span>
            <span>•</span>
            <span>Open Source</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ABTestingPro;

