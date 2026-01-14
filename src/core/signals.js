// src/core/signals.js
// Builds "RAG" levels based on raw metrics.
// If a metric is not provided (undefined/null/NaN), we mark its level as "UNKNOWN".

function isNumber(x) {
  return typeof x === "number" && Number.isFinite(x);
}

function levelFromThresholds(value, thresholds) {
  if (!isNumber(value)) return "UNKNOWN";
  if (thresholds && isNumber(thresholds.greenMax) && value <= thresholds.greenMax) return "GREEN";
  if (thresholds && isNumber(thresholds.yellowMax) && value <= thresholds.yellowMax) return "YELLOW";
  return "RED";
}

// --- SRM: Chi-square test p-value (df=1) for 50/50 split ---
// For df=1: CDF(x) = erf(sqrt(x/2)) ; p-value = 1 - CDF(x)
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

function chiSquare1Cdf(x) {
  if (!isNumber(x) || x < 0) return 0;
  return erf(Math.sqrt(x / 2));
}

export function computeSrmPValue(nControl, nTreatment) {
  if (!isNumber(nControl) || !isNumber(nTreatment)) return null;
  if (nControl < 0 || nTreatment < 0) return null;

  const n = nControl + nTreatment;
  if (n === 0) return null;

  // expected 50/50
  const e = n / 2;
  const chi2 = ((nControl - e) ** 2) / e + ((nTreatment - e) ** 2) / e;

  const p = 1 - chiSquare1Cdf(chi2);
  // clamp
  return Math.max(0, Math.min(1, p));
}

export function buildSignals(raw) {
  const pValue = isNumber(raw?.p_value) ? raw.p_value : null;
  const uplift = isNumber(raw?.uplift_pct) ? raw.uplift_pct : null;

  const power = isNumber(raw?.power) ? raw.power : null;
  const roi = isNumber(raw?.roi_pct) ? raw.roi_pct : null;
  const expectedLoss = isNumber(raw?.expected_loss) ? raw.expected_loss : null;

  // SRM: either provided directly or computed from group sizes
  let srmP = isNumber(raw?.srm_p_value) ? raw.srm_p_value : null;
  if (srmP == null && isNumber(raw?.n_control) && isNumber(raw?.n_treatment)) {
    srmP = computeSrmPValue(raw.n_control, raw.n_treatment);
  }

  // p-value: GREEN if <=0.05, YELLOW <=0.1, else RED
  const p_value_level = levelFromThresholds(pValue, { greenMax: 0.05, yellowMax: 0.1 });

  // effect size proxy (absolute uplift %)
  let effect_size_level = "UNKNOWN";
  if (isNumber(uplift)) {
    const absUplift = Math.abs(uplift);
    effect_size_level = absUplift >= 5 ? "GREEN" : absUplift >= 2 ? "YELLOW" : "RED";
  }

  // power: GREEN if >=0.8, YELLOW if >=0.6, else RED
  let power_level = "UNKNOWN";
  if (isNumber(power)) {
    power_level = power >= 0.8 ? "GREEN" : power >= 0.6 ? "YELLOW" : "RED";
  }

  // ROI: GREEN if >0, YELLOW if ==0, RED if <0
  let roi_level = "UNKNOWN";
  if (isNumber(roi)) {
    roi_level = roi > 0 ? "GREEN" : roi === 0 ? "YELLOW" : "RED";
  }

  // expected loss: GREEN if <=0.02, YELLOW if <=0.05, else RED
  const expected_loss_level = levelFromThresholds(expectedLoss, { greenMax: 0.02, yellowMax: 0.05 });

  // SRM: if srm p-value < 0.01 => RED, <0.05 => YELLOW, else GREEN
  let srm_level = "UNKNOWN";
  if (isNumber(srmP)) {
    srm_level = srmP < 0.01 ? "RED" : srmP < 0.05 ? "YELLOW" : "GREEN";
  }

  return {
    p_value: pValue,
    uplift_pct: uplift,
    power,
    roi_pct: roi,
    expected_loss: expectedLoss,

    // SRM
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

