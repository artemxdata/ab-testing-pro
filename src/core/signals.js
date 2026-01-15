// src/core/signals.js
// Builds "RAG" levels + useful business signals.

function clamp01(x) {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

// Normal CDF via erf approximation (Abramowitz–Stegun)
function erf(x) {
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
    (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) *
      t *
      Math.exp(-x * x));

  return sign * y;
}

function normalCdf(z) {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

function levelFromThresholds(value, thresholds) {
  if (thresholds && typeof thresholds.greenMax === "number" && value <= thresholds.greenMax) return "GREEN";
  if (thresholds && typeof thresholds.yellowMax === "number" && value <= thresholds.yellowMax) return "YELLOW";
  return "RED";
}

/**
 * SRM p-value approximation (MVP):
 * - Supports expected split for A and B (expectedA/expectedB) as fractions (0..1)
 * - Computes chi-square(1 dof) against expected counts
 * - p ≈ exp(-x/2) (rough, deterministic, good enough for governance signal)
 */
export function computeSrmPValue(nA, nB, expectedA = 0.5, expectedB = 0.5) {
  const a = Number(nA);
  const b = Number(nB);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a < 0 || b < 0) return 0;

  // invalid split: one side is zero (assignment broken)
  if (a === 0 || b === 0) return 0;

  const n = a + b;
  if (n <= 0) return 0;

  let eA = Number(expectedA);
  let eB = Number(expectedB);

  if (!Number.isFinite(eA)) eA = 0.5;
  if (!Number.isFinite(eB)) eB = 0.5;

  // Normalize expected shares safely:
  // - clamp to [0,1]
  // - if sum != 1, normalize; if sum==0 fallback 0.5/0.5
  eA = clamp01(eA);
  eB = clamp01(eB);
  const sum = eA + eB;
  if (sum <= 0) {
    eA = 0.5;
    eB = 0.5;
  } else {
    eA = eA / sum;
    eB = eB / sum;
  }

  const expA = n * eA;
  const expB = n * eB;

  const chi2 =
    (expA > 0 ? ((a - expA) * (a - expA)) / expA : 0) +
    (expB > 0 ? ((b - expB) * (b - expB)) / expB : 0);

  const p = Math.exp(-0.5 * chi2);
  if (!Number.isFinite(p)) return 0;
  if (p < 1e-12) return 0;
  return clamp01(p);
}

/**
 * Approximate power from z-score and alpha (two-tailed).
 * power ≈ P(|Z| > z_alpha/2 | true effect = observed z)
 *
 * This is a rough approximation: good enough for product signal.
 */
export function approximatePowerFromZ(zScore, alpha = 0.05) {
  const z = Number(zScore);
  if (!Number.isFinite(z)) return 0;

  const target = 1 - alpha / 2;
  let lo = -10, hi = 10;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (normalCdf(mid) < target) lo = mid;
    else hi = mid;
  }
  const zcrit = (lo + hi) / 2;

  const p1 = 1 - normalCdf(zcrit - z);
  const p2 = normalCdf(-zcrit - z);
  return clamp01(p1 + p2);
}

/**
 * ROI (%) based on uplift, visitors, revenue per conversion and traffic cost.
 * - baselineConvRate inferred from conversions/visitors is handled in UI, here we use uplift and conversions delta proxy.
 */
export function computeRoiPct({
  controlVisitors,
  treatmentVisitors,
  controlConversions,
  treatmentConversions,
  revenuePerConversion = 0,
  costPerVisitor = 0,
}) {
  const nA = Number(controlVisitors);
  const nB = Number(treatmentVisitors);
  const cA = Number(controlConversions);
  const cB = Number(treatmentConversions);
  const rev = Number(revenuePerConversion);
  const cost = Number(costPerVisitor);

  if (![nA, nB, cA, cB, rev, cost].every(Number.isFinite)) return 0;
  if (nA <= 0 || nB <= 0) return 0;
  if (cA < 0 || cB < 0) return 0;

  const rA = cA / nA;

  const expectedBAtA = rA * nB;
  const incrementalConversions = cB - expectedBAtA;

  const additionalRevenue = incrementalConversions * rev;
  const testCost = (nA + nB) * cost;

  if (testCost === 0) {
    return ((additionalRevenue - 0) / 1) * 100;
  }

  return ((additionalRevenue - testCost) / testCost) * 100;
}

/**
 * Expected loss proxy:
 * - if result is not significant -> higher risk
 * - if uplift is negative -> higher risk
 * Scaled into 0..1 (not currency), to be used in governance.
 */
export function expectedLossProxy({ pValue = 1, upliftPct = 0, roiPct = 0 }) {
  const p = Number(pValue);
  const u = Number(upliftPct);
  const r = Number(roiPct);
  if (![p, u, r].every(Number.isFinite)) return 0.5;

  const uncertainty = clamp01(Math.min(1, p / 0.2)); // p=0.2 => 1
  const negPenalty = u < 0 ? clamp01(Math.min(1, Math.abs(u) / 20)) : 0;
  const roiPenalty = r < 0 ? clamp01(Math.min(1, Math.abs(r) / 50)) : 0;

  return clamp01(0.4 * uncertainty + 0.35 * negPenalty + 0.25 * roiPenalty);
}

export function buildSignals(raw) {
  const pValue = typeof raw?.p_value === "number" ? raw.p_value : 1;
  const uplift = typeof raw?.uplift_pct === "number" ? raw.uplift_pct : 0;
  const alpha = typeof raw?.alpha === "number" ? raw.alpha : 0.05;

  // Optional raw inputs for SRM
  const nControl = typeof raw?.n_control === "number" ? raw.n_control : null;
  const nTreatment = typeof raw?.n_treatment === "number" ? raw.n_treatment : null;

  // Expected split from signals (as % 0..100), fallback 50/50
  const expectedSplitA_pct = Number(raw?.expected_split_a);
  const expectedSplitB_pct = Number(raw?.expected_split_b);

  const expectedA = Number.isFinite(expectedSplitA_pct) ? expectedSplitA_pct / 100 : 0.5;
  const expectedB = Number.isFinite(expectedSplitB_pct) ? expectedSplitB_pct / 100 : 0.5;

  // Optional business inputs
  const revenuePerConversion = typeof raw?.revenue_per_conversion === "number" ? raw.revenue_per_conversion : 0;
  const costPerVisitor = typeof raw?.cost_per_visitor === "number" ? raw.cost_per_visitor : 0;

  // Optional conversions for ROI
  const controlConversions = typeof raw?.control_conversions === "number" ? raw.control_conversions : 0;
  const treatmentConversions = typeof raw?.treatment_conversions === "number" ? raw.treatment_conversions : 0;

  // SRM p
  let srmP = 1;
  if (Number.isFinite(nControl) && Number.isFinite(nTreatment)) {
    srmP = computeSrmPValue(nControl, nTreatment, expectedA, expectedB);
  }

  // p-value: GREEN if <= alpha, YELLOW if <= 2*alpha, else RED
  const p_value_level = levelFromThresholds(pValue, { greenMax: alpha, yellowMax: alpha * 2 });

  // effect size proxy: abs uplift in %
  const absUplift = Math.abs(uplift);
  const effect_size_level = absUplift >= 5 ? "GREEN" : absUplift >= 2 ? "YELLOW" : "RED";

  // power approximation: use observed z from p-value approx
  let zApprox = 0;
  if (pValue > 0 && pValue < 1) {
    const target = 1 - pValue / 2;
    let lo = -10, hi = 10;
    for (let i = 0; i < 80; i++) {
      const mid = (lo + hi) / 2;
      if (normalCdf(mid) < target) lo = mid;
      else hi = mid;
    }
    zApprox = (lo + hi) / 2;
  }

  const power = approximatePowerFromZ(zApprox, alpha);
  const power_level = power >= 0.8 ? "GREEN" : power >= 0.6 ? "YELLOW" : "RED";

  // ROI (%): prefer the value computed upstream (ABTestingPro), fallback to internal compute
  const roiPct =
    Number.isFinite(Number(raw?.roi_pct))
      ? Number(raw.roi_pct)
      : computeRoiPct({
          controlVisitors: nControl ?? 0,
          treatmentVisitors: nTreatment ?? 0,
          controlConversions,
          treatmentConversions,
          revenuePerConversion,
          costPerVisitor,
        });

  const roi_level = roiPct > 10 ? "GREEN" : roiPct >= 0 ? "YELLOW" : "RED";

  const expected_loss = expectedLossProxy({ pValue, upliftPct: uplift, roiPct });
  const expected_loss_level = expected_loss <= 0.2 ? "GREEN" : expected_loss <= 0.4 ? "YELLOW" : "RED";

  const srm_level = srmP < 0.01 ? "RED" : srmP < 0.05 ? "YELLOW" : "GREEN";

  return {
    p_value: pValue,
    uplift_pct: uplift,
    alpha,

    // expected split (keep as provided, %)
    expected_split_a: Number.isFinite(expectedSplitA_pct) ? expectedSplitA_pct : 50,
    expected_split_b: Number.isFinite(expectedSplitB_pct) ? expectedSplitB_pct : 50,

    // business
    revenue_per_conversion: revenuePerConversion,
    cost_per_visitor: costPerVisitor,
    roi_pct: roiPct,
    expected_loss,
    power,

    // governance
    srm_p_value: srmP,

    // levels
    p_value_level,
    effect_size_level,
    power_level,
    roi_level,
    expected_loss_level,
    srm_level,
  };
}

