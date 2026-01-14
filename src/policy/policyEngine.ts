import YAML from "yaml";
import type { PolicyDoc, PolicyRule } from "./policyTypes";
import type { Decision, PolicyEvaluation, Signals, TriggeredRule } from "../types/decision";

/**
 * Parse YAML policy document into typed PolicyDoc.
 */
export function parsePolicies(yamlText: string): PolicyDoc {
  const doc = YAML.parse(yamlText) as PolicyDoc;

  if (!doc || !doc.version || !doc.defaultDecision || !Array.isArray(doc.rules)) {
    throw new Error("Invalid policies.yaml format: missing required fields");
  }

  return doc;
}

/**
 * Deterministic match:
 * - For each key in rule.match, require signals[key] === rule.match[key].
 * - Special-case rule id "ESCALATE_MULTIPLE_REDS" (count red signals).
 */
function ruleMatches(rule: PolicyRule, signals: Signals): boolean {
  if (rule.id === "ESCALATE_MULTIPLE_REDS") {
    const criticalKeys: (keyof Signals)[] = ["srm_level", "roi_level", "expected_loss_level"];
    const redCount = criticalKeys.reduce((acc, k) => acc + (signals[k] === "RED" ? 1 : 0), 0);
    return redCount >= 2;
  }

  const match = rule.match || {};
  for (const [key, expected] of Object.entries(match)) {
    const k = key as keyof Signals;
    // Empty match object is allowed (e.g., DEFAULT rule)
    if (expected === undefined) continue;
    if (signals[k] !== expected) return false;
  }
  return true;
}

/**
 * Evaluate policies:
 * - Find all matching rules
 * - Choose the strongest by severity priority + order (first wins among same severity)
 * - Return decision + triggeredRules (all matches for trace)
 */
export function evaluatePolicy(doc: PolicyDoc, signals: Signals): PolicyEvaluation {
  const matches: PolicyRule[] = doc.rules.filter((r) => ruleMatches(r, signals));

  // For trace: include all matched rules
  const triggeredRules: TriggeredRule[] = matches.map((r) => ({
    id: r.id,
    title: r.title,
    severity: r.severity,
    when: r.when,
    decision: r.then.decision,
    reason: r.reason,
    evidence: r.evidence || [],
  }));

  // Select final rule (deterministic)
  const severityRank: Record<string, number> = { CRITICAL: 3, WARN: 2, INFO: 1 };
  const sorted = [...matches].sort((a, b) => {
    const sa = severityRank[a.severity] ?? 0;
    const sb = severityRank[b.severity] ?? 0;
    if (sb !== sa) return sb - sa;
    // same severity: keep original order in YAML (stable sort-ish)
    return 0;
  });

  const chosen = sorted[0];
  if (!chosen) {
    return {
      decision: doc.defaultDecision,
      triggeredRules: [],
      confidence: doc.defaultConfidence ?? 0.55,
    };
  }

  return {
    decision: chosen.then.decision as Decision,
    triggeredRules,
    confidence: chosen.then.confidence ?? doc.defaultConfidence ?? 0.55,
  };
}
