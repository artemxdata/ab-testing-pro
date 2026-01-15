import { evaluatePolicies } from "../policy/policyEngine";

describe("evaluatePolicies", () => {
  const policyDoc = {
    version: "test",
    defaultDecision: "CONTINUE_TEST",
    defaultConfidence: 0.55,
    rules: [
      {
        id: "GOV_SRM_RED",
        title: "Sample Ratio Mismatch detected",
        severity: "CRITICAL",
        priority: 100,
        match: { srm_level: "RED" },
        then: { decision: "ESCALATE", confidence: 0.95 },
        reason: "SRM is red",
        evidence: ["SRM signal is RED"],
      },
      {
        id: "WEAK_SIGNAL",
        title: "Not enough evidence yet",
        severity: "MEDIUM",
        priority: 10,
        match: { p_value_level: "RED" },
        then: { decision: "CONTINUE_TEST", confidence: 0.7 },
        reason: "p-value >= 0.05",
        evidence: ["p-value >= 0.05"],
      },
    ],
  };

  test("ESCALATE when srm_level is RED", () => {
    const res = evaluatePolicies(policyDoc, { srm_level: "RED", p_value_level: "GREEN" });
    expect(res.decision).toBe("ESCALATE");
    expect(res.confidence).toBeCloseTo(0.95, 5);
    expect(res.triggeredRules.length).toBeGreaterThan(0);
    expect(res.triggeredRules[0].id).toBe("GOV_SRM_RED");
  });

  test("fallback to default when no match", () => {
    const res = evaluatePolicies(policyDoc, { srm_level: "GREEN", p_value_level: "GREEN" });
    expect(res.decision).toBe("CONTINUE_TEST");
    expect(res.triggeredRules).toEqual([]);
  });
});

describe("policy precedence (governance overrides)", () => {
  test("governance ESCALATE overrides IMPLEMENT even if significant positive", () => {
    const policyDoc = {
      defaultDecision: "CONTINUE_TEST",
      defaultConfidence: 0.55,
      rules: [
        {
          id: "GOV_ROI_RED",
          title: "ROI is negative",
          severity: "HIGH",
          priority: 1000,
          when: 'roi_level == "RED"',
          then: { decision: "ESCALATE", confidence: 0.85 },
          reason: "ROI risk",
        },
        {
          id: "POSITIVE_SIGNIFICANT",
          title: "Significant win",
          severity: "HIGH",
          priority: 500,
          when: "p_value < 0.05 && uplift_pct > 0",
          then: { decision: "IMPLEMENT_TREATMENT", confidence: 0.9 },
          reason: "Ship it",
        },
      ],
    };

    const signals = {
      p_value: 0.01,
      uplift_pct: 10,
      roi_level: "RED",
    };

    const res = evaluatePolicies(policyDoc, signals);
    expect(res.decision).toBe("ESCALATE");
    expect(res.triggeredRules?.[0]?.id).toBe("GOV_ROI_RED"); // top rule
  });

  test("IMPLEMENT allowed only when governance is ok", () => {
    const policyDoc = {
      defaultDecision: "CONTINUE_TEST",
      defaultConfidence: 0.55,
      rules: [
        {
          id: "GOV_SRM_RED",
          severity: "CRITICAL",
          priority: 1000,
          match: { srm_level: "RED" },
          then: { decision: "ESCALATE", confidence: 0.95 },
        },
        {
          id: "GOV_EXPECTED_LOSS_RED",
          severity: "HIGH",
          priority: 950,
          match: { expected_loss_level: "RED" },
          then: { decision: "ESCALATE", confidence: 0.85 },
        },
        {
          id: "GOV_ROI_RED",
          severity: "HIGH",
          priority: 900,
          when: 'roi_level == "RED"',
          then: { decision: "ESCALATE", confidence: 0.85 },
        },
        {
          id: "POSITIVE_SIGNIFICANT",
          severity: "HIGH",
          priority: 600,
          when:
            'p_value < 0.05 && uplift_pct > 0 && effect_size_level != "RED" && srm_level != "RED" && expected_loss_level != "RED"',
          then: { decision: "IMPLEMENT_TREATMENT", confidence: 0.9 },
        },
      ],
    };

    const signals = {
      p_value: 0.01,
      uplift_pct: 8,
      effect_size_level: "GREEN",
      srm_level: "GREEN",
      expected_loss_level: "YELLOW",
      roi_level: "GREEN",
    };

    const res = evaluatePolicies(policyDoc, signals);
    expect(res.decision).toBe("IMPLEMENT_TREATMENT");
  });
});
