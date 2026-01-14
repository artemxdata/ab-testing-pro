import type { PolicyDoc } from "./policyLoader";

export type Decision = {
  decision: string;
  confidence: number;
  triggeredRules: Array<{
    id: string;
    title?: string;
    severity?: string;
    decision: string;
    confidence?: number;
    reason?: string;
    evidence?: string[];
  }>;
  trace: Array<{
    ruleId: string;
    matched: boolean;
    reasons: string[];
  }>;
};

type Signals = Record<string, any>;

function isObject(v: any): v is Record<string, any> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function matchObject(match: Record<string, any> | undefined, signals: Signals): { ok: boolean; reasons: string[] } {
  if (!match) return { ok: true, reasons: ["no match block"] };
  if (!isObject(match)) return { ok: false, reasons: ["match is not an object"] };

  const reasons: string[] = [];
  for (const [k, expected] of Object.entries(match)) {
    const actual = signals[k];
    const ok = actual === expected;
    reasons.push(ok ? `match ${k} == ${JSON.stringify(expected)}` : `FAIL ${k}: ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`);
    if (!ok) return { ok: false, reasons };
  }
  return { ok: true, reasons };
}

// Very small safe evaluator for expressions like:
// "p_value < 0.05 && uplift_pct > 2"
// Supports: == != > >= < <= , numbers, strings in quotes, && ||, parentheses (basic)
function evalWhen(expr: string | undefined, signals: Signals): { ok: boolean; reasons: string[] } {
  if (!expr || !expr.trim()) return { ok: true, reasons: ["no when expression"] };

  const reasons: string[] = [];

  // Tokenize by space, keep operators
  // We'll handle parentheses by just stripping them (simple but works for our patterns).
  const normalized = expr.replace(/[()]/g, " ").replace(/\s+/g, " ").trim();

  // Split by logical ops
  // We'll evaluate left-to-right with && and || (no precedence other than left-to-right).
  // For our YAML policies it's enough; keep expressions simple.
  const parts = normalized.split(" ").filter(Boolean);

  function readValue(token: string): any {
    if (token in signals) return signals[token];
    if (/^-?\d+(\.\d+)?$/.test(token)) return Number(token);
    // quoted string
    if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
      return token.slice(1, -1);
    }
    // raw
    return token;
  }

  function evalComparison(lhsTok: string, op: string, rhsTok: string): boolean {
    const lhs = readValue(lhsTok);
    const rhs = readValue(rhsTok);

    const cmp = (() => {
      switch (op) {
        case "==": return lhs === rhs;
        case "!=": return lhs !== rhs;
        case ">":  return Number(lhs) > Number(rhs);
        case ">=": return Number(lhs) >= Number(rhs);
        case "<":  return Number(lhs) < Number(rhs);
        case "<=": return Number(lhs) <= Number(rhs);
        default: return false;
      }
    })();

    reasons.push(`${lhsTok}(${JSON.stringify(lhs)}) ${op} ${rhsTok}(${JSON.stringify(rhs)}) => ${cmp}`);
    return cmp;
  }

  // Parse pattern: <a> <op> <b> [&&/|| <a> <op> <b> ...]
  let i = 0;
  let acc: boolean | null = null;
  let pendingLogic: "&&" | "||" | null = null;

  while (i < parts.length) {
    const a = parts[i++];
    const op = parts[i++];
    const b = parts[i++];

    if (!a || !op || !b) return { ok: false, reasons: [...reasons, "invalid when expression tokens"] };

    const res = evalComparison(a, op, b);

    if (acc === null) {
      acc = res;
    } else if (pendingLogic === "&&") {
      acc = acc && res;
    } else if (pendingLogic === "||") {
      acc = acc || res;
    } else {
      // If missing logic operator, treat as AND
      acc = acc && res;
    }

    const next = parts[i];
    if (next === "&&" || next === "||") {
      pendingLogic = next as any;
      i++;
    } else {
      pendingLogic = null;
    }
  }

  return { ok: Boolean(acc), reasons };
}

export function evaluatePolicies(doc: PolicyDoc, signals: Signals): Decision {
  const triggeredRules: Decision["triggeredRules"] = [];
  const trace: Decision["trace"] = [];

  for (const rule of doc.rules) {
    const m = matchObject(rule.match, signals);
    const w = evalWhen(rule.when, signals);

    const matched = m.ok && w.ok;

    trace.push({
      ruleId: rule.id,
      matched,
      reasons: [...m.reasons, ...w.reasons],
    });

    if (matched) {
      triggeredRules.push({
        id: rule.id,
        title: rule.title,
        severity: rule.severity,
        decision: rule.then.decision,
        confidence: rule.then.confidence,
        reason: rule.reason,
        evidence: rule.evidence,
      });
    }
  }

  // Pick the "strongest" rule: CRITICAL > WARN > INFO, then highest confidence
  const severityRank: Record<string, number> = { CRITICAL: 3, WARN: 2, INFO: 1 };
  const best = triggeredRules
    .slice()
    .sort((a, b) => {
      const sa = severityRank[a.severity || "INFO"] || 1;
      const sb = severityRank[b.severity || "INFO"] || 1;
      if (sb !== sa) return sb - sa;
      return (b.confidence || 0) - (a.confidence || 0);
    })[0];

  const decision = best?.decision || doc.defaultDecision;
  const confidence = best?.confidence ?? doc.defaultConfidence ?? 0.55;

  return { decision, confidence, triggeredRules, trace };
}
