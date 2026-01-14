
export type SignalLevel = "GREEN" | "AMBER" | "RED";

export type Decision =
  | "AUTO_APPROVE"
  | "CONTINUE_TEST"
  | "HUMAN_REVIEW"
  | "ESCALATE";

export type Severity = "INFO" | "WARN" | "CRITICAL";

export type Signals = {
  // core statistical signals
  p_value_level: SignalLevel;
  effect_size_level: SignalLevel;
  power_level: SignalLevel;

  // business / risk signals
  roi_level: SignalLevel;
  expected_loss_level: SignalLevel;

  // quality / governance signals
  srm_level: SignalLevel;

  // optional numeric context (good for explainability)
  p_value?: number;
  uplift_pct?: number;
  roi_pct?: number;
  power?: number;
  expected_loss?: number;
};

export type TriggeredRule = {
  id: string;
  title: string;
  severity: Severity;
  when: string;
  decision: Decision;
  reason: string;
  evidence?: string[];
};

export type PolicyEvaluation = {
  decision: Decision;
  triggeredRules: TriggeredRule[];
  confidence: number; // 0..1
};
