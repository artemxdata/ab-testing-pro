// src/policy/policyEngine.js
// Deterministic policy engine: YAML doc -> decision + triggeredRules
// Rule matching is based on rule.match object (simple equality checks).

export function evaluatePolicies(policyDoc, signals) {
  if (!policyDoc || typeof policyDoc !== "object") {
    return {
      decision: "CONTINUE_TEST",
      confidence: 0.55,
      triggeredRules: [],
      reason: "Invalid policy document",
    };
  }

  const defaultDecision = policyDoc.defaultDecision || "CONTINUE_TEST";
  const defaultConfidence =
    typeof policyDoc.defaultConfidence === "number"
      ? policyDoc.defaultConfidence
      : 0.55;

  const rules = Array.isArray(policyDoc.rules) ? policyDoc.rules : [];

  const triggeredRules = [];

  for (const rule of rules) {
    if (!rule || typeof rule !== "object") continue;

    // If rule.match exists - use it as deterministic matching
    const match = rule.match && typeof rule.match === "object" ? rule.match : null;

    let matched = true;

    if (match) {
      for (const [k, v] of Object.entries(match)) {
        if (signals?.[k] !== v) {
          matched = false;
          break;
        }
      }
    } else {
      // If no match object - consider rule not matchable (safe)
      matched = false;
    }

    if (matched) {
      triggeredRules.push({
        id: rule.id || "RULE_NO_ID",
        title: rule.title || rule.id || "Untitled rule",
        severity: rule.severity || "INFO",
        decision: rule.then?.decision || defaultDecision,
        confidence:
          typeof rule.then?.confidence === "number"
            ? rule.then.confidence
            : defaultConfidence,
        reason: rule.reason || rule.then?.reason || "",
        evidence: Array.isArray(rule.evidence) ? rule.evidence : [],
      });
    }
  }

  // Choose the strongest rule:
  // - Prefer higher confidence
  // - Tie-breaker by severity order
  if (triggeredRules.length === 0) {
    return {
      decision: defaultDecision,
      confidence: defaultConfidence,
      triggeredRules: [],
      reason: "No policy rule matched",
    };
  }

  const severityRank = (s) => {
    const m = String(s || "").toUpperCase();
    if (m === "CRITICAL") return 5;
    if (m === "HIGH") return 4;
    if (m === "MEDIUM") return 3;
    if (m === "LOW") return 2;
    return 1; // INFO / unknown
  };

  triggeredRules.sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return severityRank(b.severity) - severityRank(a.severity);
  });

  const top = triggeredRules[0];

  return {
    decision: top.decision,
    confidence: top.confidence,
    triggeredRules,
    reason: top.reason || "Matched policy rule",
  };
}
