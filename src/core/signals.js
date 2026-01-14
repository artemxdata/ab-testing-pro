// src/core/signals.js
// Builds "RAG" levels based on raw metrics.

function levelFromThresholds(value, thresholds) {
  // thresholds: { greenMax?, yellowMax? } or custom
  // We'll interpret:
  // - value <= greenMax => GREEN
  // - value <= yellowMax => YELLOW
  // - else => RED
  if (thresholds && typeof thresholds.greenMax === "number" && value <= thresholds.greenMax) return "GREEN";
  if (thresholds && typeof thresholds.yellowMax === "number" && value <= thresholds.yellowMax) return "YELLOW";
  return "RED";
}

export function buildSignals(raw) {
  const pValue = typeof raw?.p_value === "number" ? raw.p_value : 1;
  const uplift = typeof raw?.uplift_pct === "number" ? raw.uplift_pct : 0;
  const power = typeof raw?.power === "number" ? raw.power : 0;
  const roi = typeof raw?.roi_pct === "number" ? raw.roi_pct : 0;
  const expectedLoss = typeof raw?.expected_loss === "number" ? raw.expected_loss : 0;
  const srmP = typeof raw?.srm_p_value === "number" ? raw.srm_p_value : 1;

  // p-value: GREEN if <=0.05, YELLOW <=0.1, else RED
  const p_value_level = levelFromThresholds(pValue, { greenMax: 0.05, yellowMax: 0.1 });

  // effect size proxy: use absolute uplift (in %)
  // GREEN if >= 5%, YELLOW if >= 2%, else RED
  const absUplift = Math.abs(uplift);
  const effect_size_level =
    absUplift >= 5 ? "GREEN" : absUplift >= 2 ? "YELLOW" : "RED";

  // power: GREEN if >=0.8, YELLOW if >=0.6, else RED
  const power_level =
    power >= 0.8 ? "GREEN" : power >= 0.6 ? "YELLOW" : "RED";

  // ROI: simplistic: GREEN if >0, YELLOW if ==0, RED if <0
  const roi_level = roi > 0 ? "GREEN" : roi === 0 ? "YELLOW" : "RED";

  // expected loss: GREEN if <=0.02, YELLOW if <=0.05, else RED
  const expected_loss_level = levelFromThresholds(expectedLoss, { greenMax: 0.02, yellowMax: 0.05 });

  // SRM: if srm p-value < 0.01 => RED, <0.05 => YELLOW, else GREEN
  const srm_level = srmP < 0.01 ? "RED" : srmP < 0.05 ? "YELLOW" : "GREEN";

  return {
    p_value: pValue,
    uplift_pct: uplift,
    power,
    roi_pct: roi,
    expected_loss: expectedLoss,
    srm_p_value: srmP,

    p_value_level,
    effect_size_level,
    power_level,
    roi_level,
    expected_loss_level,
    srm_level,
  };
}
