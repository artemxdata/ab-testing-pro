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
