import type { Signals, SignalLevel } from "../types/decision";

/**
 * Convert numeric metric to RAG level using thresholds.
 * Lower is better: p-value, expected loss
 * Higher is better: uplift, roi, power
 */
function levelHigherBetter(value: number, greenAt: number, amberAt: number): SignalLevel {
  if (value >= greenAt) return "GREEN";
  if (value >= amberAt) return "AMBER";
  return "RED";
}

function levelLowerBetter(value: number, greenAt: number, amberAt: number): SignalLevel {
  if (value <= greenAt) return "GREEN";
  if (value <= amberAt) return "AMBER";
  return "RED";
}

/**
 * Raw metrics (v1). We keep it minimal to integrate with your current UI quickly.
 * You can expand later with Bayesian metrics, guardrails, SRM checks, etc.
 */
export type RawMetrics = {
  pValue: number;         // frequentist p-value
  upliftPct: number;      // % uplift (e.g., +13.4)
  power?: number;         // 0..1 optional
  roiPct?: number;        // ROI percent optional
  expectedLoss?: number;  // optional (lower is better)
  srmFlag?: boolean;      // optional governance flag
};

export type DecisionContext = {
  alpha?: number;       // default 0.05
  minUpliftPct?: number; // practical significance threshold, e.g. 2%
  minPower?: number;     // recommended 0.8
  minRoiPct?: number;    // e.g. 0 for non-negative ROI
  maxExpectedLoss?: number; // business-defined risk threshold
};

export function buildSignals(raw: RawMetrics, ctx: DecisionContext = {}): Signals {
  const alpha = ctx.alpha ?? 0.05;
  const minUplift = ctx.minUpliftPct ?? 2;
  const minPower = ctx.minPower ?? 0.8;
  const minRoi = ctx.minRoiPct ?? 0;

  const p_value_level: SignalLevel =
    raw.pValue <= alpha ? "GREEN" : raw.pValue <= alpha * 2 ? "AMBER" : "RED";

  const effect_size_level: SignalLevel =
    raw.upliftPct >= minUplift ? "GREEN" : raw.upliftPct >= (minUplift / 2) ? "AMBER" : "RED";

  const powerVal = raw.power ?? 0.5;
  const power_level = levelHigherBetter(powerVal, minPower, Math.max(0.5, minPower - 0.2));

  const roiVal = raw.roiPct ?? 0;
  const roi_level = levelHigherBetter(roiVal, minRoi, minRoi - 10); // allow amber slightly below

  const expectedLossVal = raw.expectedLoss ?? 0;
  // If expectedLoss is not provided, treat as GREEN (risk unknown but not flagged)
  const expected_loss_level: SignalLevel =
    raw.expectedLoss === undefined ? "GREEN" : levelLowerBetter(expectedLossVal, 0.05, 0.15);

  const srm_level: SignalLevel =
    raw.srmFlag === true ? "RED" : "GREEN";

  return {
    p_value_level,
    effect_size_level,
    power_level,
    roi_level,
    expected_loss_level,
    srm_level,
    p_value: raw.pValue,
    uplift_pct: raw.upliftPct,
    roi_pct: raw.roiPct,
    power: raw.power,
    expected_loss: raw.expectedLoss,
  };
}
