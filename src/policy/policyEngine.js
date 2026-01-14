// src/policy/policyEngine.js
import { evaluateWhen } from "./whenEvaluator";

// Deterministic policy engine: YAML doc -> decision + triggeredRules
// Matching order:
// 1) rule.when (boolean expression) if present
// 2) rule.match (simple equality object) if present

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
    typeof policyDoc.defaultConfidence === "number" ? policyDoc.defaultConfidence : 0.55;

  const rules = Array.isArray(policyDoc.rules) ? policyDoc.rules : [];
  const triggeredRules = [];

  for (const rule of rules) {
    if (!rule || typeof rule !== "object") continue;

    const hasWhen = typeof rule.when === "string" && rule.when.trim().length > 0;
    const hasMatch = rule.match && typeof rule.match === "object";

    let matched = false;

    try {
      if (hasWhen) {
        matched = evaluateWhen(rule.when, signals);
      } else if (hasMatch) {
        matched = true;
        for (const [k, v] of Object.entries(rule.match)) {
          if (signals?.[k] !== v) {
            matched = false;
            break;
          }
        }
      } else {
        matched = false;
      }
    } catch (e) {
      matched = false;
    }

    if (matched) {
      triggeredRules.push({
        id: rule.id || "RULE_NO_ID",
        title: rule.title || rule.id || "Untitled rule",
        severity: rule.severity || "INFO",
        priority: typeof rule.priority === "number" ? rule.priority : 0,
        decision: rule.then?.decision || defaultDecision,
        confidence:
          typeof rule.then?.confidence === "number" ? rule.then.confidence : defaultConfidence,
        reason: rule.reason || rule.then?.reason || "",
        evidence: Array.isArray(rule.evidence) ? rule.evidence : [],
      });
    }
  }

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
    return 1;
  };

  // Choose "top" rule:
  // 1) priority desc
  // 2) confidence desc
  // 3) severity desc
  triggeredRules.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
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
