// src/components/ABTestingPro.js
import React, { useEffect, useMemo, useState } from "react";

import PolicyDemoPanel from "../ui/PolicyDemoPanel";
import { loadPoliciesFromPublic } from "../policy/policyLoader";
import { evaluatePolicies } from "../policy/policyEngine";
import { buildSignals } from "../core/signals";

const ABTestingPro = () => {
  const [controlVisitors, setControlVisitors] = useState(1000);
  const [controlConversions, setControlConversions] = useState(50);
  const [treatmentVisitors, setTreatmentVisitors] = useState(1000);
  const [treatmentConversions, setTreatmentConversions] = useState(58);

  const [isAnimating, setIsAnimating] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
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
    const pooledRate =
      (controlConversions + treatmentConversions) / (controlVisitors + treatmentVisitors);

    const se = Math.sqrt(
      pooledRate * (1 - pooledRate) * (1 / controlVisitors + 1 / treatmentVisitors)
    );
    return se > 0 ? (p2 - p1) / se : 0;
  }, [controlVisitors, treatmentVisitors, controlConversions, treatmentConversions]);

  // --- Correct normal CDF & p-value (two-tailed) ---
  const pValue = useMemo(() => {
    // Error function (Abramowitz–Stegun approximation)
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
      const y =
        1.0 -
        (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x));

      return sign * y;
    };

    const normalCdf = (z) => 0.5 * (1 + erf(z / Math.SQRT2));

    const raw = zScore === 0 ? 1 : 2 * (1 - normalCdf(Math.abs(zScore)));
    const bounded = Math.max(0, Math.min(1, raw));

    // на всякий случай — если вдруг получилось NaN
    if (!Number.isFinite(bounded)) return 1;
    return bounded;
  }, [zScore]);

  // ---------- dark mode (optional) ----------
  useEffect(() => {
    // Если Tailwind dark:class используешь — оставь
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
  // (минимально) алиас, чтобы использовать buildSignalsFn как в твоём варианте
  const buildSignalsFn = buildSignals;

  const signals = useMemo(() => {
    console.log("SRM inputs:", { controlVisitors, treatmentVisitors, types: [typeof controlVisitors, typeof treatmentVisitors] });
    return buildSignalsFn({
      p_value: pValue,
      uplift_pct: improvement,
      n_control: controlVisitors,
      n_treatment: treatmentVisitors,
    });
  }, [buildSignalsFn, pValue, improvement, controlVisitors, treatmentVisitors]);

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
      const baseRate = Math.random() * 0.15 + 0.02; // 2-17%
      const lift = (Math.random() - 0.5) * 0.6; // -30% to +30%

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

  // ---------- UI helpers ----------
  const getConfidenceTone = () => {
    // Тон карточек можно потом поменять на нормальный дизайн.
    // Сейчас привязываем к decision.
    return decisionMeta.tone;
  };

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
                <h1 className={`text-4xl font-black ${darkMode ? "text-white" : "text-gray-900"}`}>
                  A/B Testing Pro
                </h1>
                <p className={`${darkMode ? "text-gray-300" : "text-gray-600"} font-medium`}>
                  Professional Statistical Analysis Platform
                </p>
              </div>
            </div>

            <button
              onClick={() => setDarkMode((v) => !v)}
              className={`p-3 rounded-xl transition-all duration-200 ${
                darkMode
                  ? "bg-yellow-500 text-gray-900 hover:bg-yellow-400"
                  : "bg-gray-800 text-yellow-400 hover:bg-gray-700"
              }`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>

          {/* Tabs */}
          <div
            className={`flex justify-center space-x-1 p-1 rounded-xl ${
              darkMode ? "bg-gray-800" : "bg-white"
            } shadow-lg max-w-md mx-auto`}
          >
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

        {activeTab === "calculator" && (
          <div className="space-y-8">
            {/* Inputs */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Control */}
              <div
                className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-2xl p-8 shadow-2xl border ${
                  darkMode ? "border-gray-700" : "border-gray-100"
                }`}
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">A</span>
                  </div>
                  <div className="text-left">
                    <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                      Control Group
                    </h2>
                    <p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>Baseline variant</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label
                      className={`block text-sm font-semibold mb-2 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      👥 Visitors
                    </label>
                    <input
                      type="number"
                      className={`w-full px-4 py-3 rounded-xl border-2 font-semibold text-lg ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                          : "bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500"
                      }`}
                      value={controlVisitors}
                      onChange={(e) => setControlVisitors(clampInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-semibold mb-2 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      ✅ Conversions
                    </label>
                    <input
                      type="number"
                      className={`w-full px-4 py-3 rounded-xl border-2 font-semibold text-lg ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                          : "bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500"
                      }`}
                      value={controlConversions}
                      onChange={(e) => setControlConversions(clampInt(e.target.value))}
                    />
                  </div>

                  <div
                    className={`p-6 rounded-xl ${darkMode ? "bg-blue-900/30" : "bg-blue-50"} border-2 border-blue-200`}
                  >
                    <p className={`text-sm font-medium mb-2 ${darkMode ? "text-blue-300" : "text-blue-700"}`}>
                      Conversion Rate
                    </p>
                    <p
                      className={`text-4xl font-black ${isAnimating ? "animate-pulse" : ""} ${
                        darkMode ? "text-blue-400" : "text-blue-600"
                      }`}
                    >
                      {controlRate.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Treatment */}
              <div
                className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-2xl p-8 shadow-2xl border ${
                  darkMode ? "border-gray-700" : "border-gray-100"
                }`}
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">B</span>
                  </div>
                  <div className="text-left">
                    <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                      Treatment Group
                    </h2>
                    <p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>Test variant</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label
                      className={`block text-sm font-semibold mb-2 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      👥 Visitors
                    </label>
                    <input
                      type="number"
                      className={`w-full px-4 py-3 rounded-xl border-2 font-semibold text-lg ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white focus:border-green-500"
                          : "bg-gray-50 border-gray-200 text-gray-900 focus:border-green-500"
                      }`}
                      value={treatmentVisitors}
                      onChange={(e) => setTreatmentVisitors(clampInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-semibold mb-2 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      ✅ Conversions
                    </label>
                    <input
                      type="number"
                      className={`w-full px-4 py-3 rounded-xl border-2 font-semibold text-lg ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white focus:border-green-500"
                          : "bg-gray-50 border-gray-200 text-gray-900 focus:border-green-500"
                      }`}
                      value={treatmentConversions}
                      onChange={(e) => setTreatmentConversions(clampInt(e.target.value))}
                    />
                  </div>

                  <div
                    className={`p-6 rounded-xl ${darkMode ? "bg-green-900/30" : "bg-green-50"} border-2 border-green-200`}
                  >
                    <p className={`text-sm font-medium mb-2 ${darkMode ? "text-green-300" : "text-green-700"}`}>
                      Conversion Rate
                    </p>
                    <p
                      className={`text-4xl font-black ${isAnimating ? "animate-pulse" : ""} ${
                        darkMode ? "text-green-400" : "text-green-600"
                      }`}
                    >
                      {treatmentRate.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            <div
              className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-2xl p-8 shadow-2xl border ${
                darkMode ? "border-gray-700" : "border-gray-100"
              }`}
            >
              <div className="flex items-center space-x-3 mb-8">
                <div
                  className={`w-12 h-12 bg-gradient-to-r ${getConfidenceTone()} rounded-xl flex items-center justify-center`}
                >
                  <span className="text-2xl">🎛️</span>
                </div>
                <div className="text-left">
                  <h2 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                    Statistical Results
                  </h2>
                  <p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Policy-driven decision with transparent trace
                  </p>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div
                  className={`p-6 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"} border ${
                    darkMode ? "border-gray-600" : "border-gray-200"
                  }`}
                >
                  <p className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    📈 Improvement
                  </p>
                  <p className={`text-3xl font-black ${improvement >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {improvement >= 0 ? "+" : ""}
                    {improvement.toFixed(1)}%
                  </p>
                </div>

                <div
                  className={`p-6 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"} border ${
                    darkMode ? "border-gray-600" : "border-gray-200"
                  }`}
                >
                  <p className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    📊 Z-Score
                  </p>
                  <p className={`text-3xl font-black ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                    {zScore.toFixed(2)}
                  </p>
                </div>

                <div
                  className={`p-6 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"} border ${
                    darkMode ? "border-gray-600" : "border-gray-200"
                  }`}
                >
                  <p className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    🎯 P-Value
                  </p>
                  <p className={`text-3xl font-black ${darkMode ? "text-indigo-400" : "text-indigo-600"}`}>
                    {pValue.toFixed(4)}
                  </p>
                </div>

                <div
                  className={`p-6 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"} border ${
                    darkMode ? "border-gray-600" : "border-gray-200"
                  }`}
                >
                  <p className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    🏆 Winner
                  </p>
                  <p className={`text-2xl font-black ${darkMode ? "text-pink-400" : "text-pink-600"}`}>
                    {treatmentRate > controlRate ? "B" : controlRate > treatmentRate ? "A" : "Tie"}
                  </p>
                </div>
              </div>

              {/* Policy-driven Banner */}
              <div className={`p-8 rounded-2xl bg-gradient-to-r ${decisionMeta.tone} text-white`}>
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">🎛️</div>
                  <div className="text-left">
                    <h3 className="text-2xl font-bold mb-2">{decisionMeta.title}</h3>
                    <p className="text-lg opacity-90">
                      {decisionMeta.subtitle} Confidence: {(decisionConfidence * 100).toFixed(0)}%
                    </p>

                    {policyError && <p className="mt-3 text-sm opacity-90">⚠️ Policy load error: {policyError}</p>}

                    {!policyDoc && !policyError && (
                      <p className="mt-3 text-sm opacity-90">⏳ Policy Engine: Loading policies…</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button
                  onClick={loadSampleData}
                  disabled={isAnimating}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnimating ? "🔄 Loading..." : "📊 Load Sample Data"}
                </button>

                <button
                  onClick={generateRandomData}
                  disabled={isAnimating}
                  className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnimating ? "🎲 Generating..." : "🎲 Generate Random Test"}
                </button>
              </div>

              {/* Policy Panel */}
              <div className="mt-8">
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
          <div
            className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-2xl p-8 shadow-2xl border ${
              darkMode ? "border-gray-700" : "border-gray-100"
            }`}
          >
            <h2 className={`text-3xl font-bold mb-6 ${darkMode ? "text-white" : "text-gray-900"}`}>
              🧠 AI-Powered Insights
            </h2>
            <div className="grid lg:grid-cols-2 gap-6">
              <div
                className={`p-6 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"} border ${
                  darkMode ? "border-gray-600" : "border-gray-200"
                }`}
              >
                <h3 className={`text-xl font-bold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
                  📈 Performance Analysis
                </h3>
                <p className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Your test shows {Math.abs(improvement).toFixed(1)}% difference between variants.
                </p>
              </div>
              <div
                className={`p-6 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"} border ${
                  darkMode ? "border-gray-600" : "border-gray-200"
                }`}
              >
                <h3 className={`text-xl font-bold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
                  🎯 Recommendations
                </h3>
                <p className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Current policy decision: <b>{decision}</b> (confidence {(decisionConfidence * 100).toFixed(0)}%).
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div
            className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-2xl p-8 shadow-2xl border ${
              darkMode ? "border-gray-700" : "border-gray-100"
            }`}
          >
            <h2 className={`text-3xl font-bold mb-6 ${darkMode ? "text-white" : "text-gray-900"}`}>
              📈 Test History
            </h2>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <p className={`text-xl ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Test history feature coming soon!
              </p>
              <p className={`${darkMode ? "text-gray-500" : "text-gray-500"} mt-2`}>
                Track your experiments over time with detailed analytics.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center py-12">
          <div
            className={`inline-flex items-center space-x-2 px-6 py-3 rounded-full ${
              darkMode ? "bg-gray-800 text-gray-300" : "bg-white text-gray-600"
            } shadow-lg`}
          >
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

