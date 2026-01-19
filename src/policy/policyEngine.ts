import type { PolicyDoc } from "./policyLoader";

export type Decision = {
  decision: string;
  confidence: number;
  triggeredRules: Array<{
    id: string;
    title?: string;
    severity?: string;
    priority?: number;
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

// Minimal safe evaluator for expressions like:
// "p_value < 0.05 && uplift_pct > 2"
// Supports: == != > >= < <= , numbers, strings in quotes, && ||
function evalWhen(expr: string | undefined, signals: Signals): { ok: boolean; reasons: string[] } {
  if (!expr || !expr.trim()) return { ok: true, reasons: ["no when expression"] };

  const reasons: string[] = [];
  const normalized = expr.replace(/[()]/g, " ").replace(/\s+/g, " ").trim();
  const parts = normalized.split(" ").filter(Boolean);

  function readValue(token: string): any {
    if (token in signals) return signals[token];
    if (/^-?\d+(\.\d+)?$/.test(token)) return Number(token);
    if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
      return token.slice(1, -1);
    }
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

  let i = 0;
  let acc: boolean | null = null;
  let pendingLogic: "&&" | "||" | null = null;

  while (i < parts.length) {
    const a = parts[i++];
    const op = parts[i++];
    const b = parts[i++];

    if (!a || !op || !b) return { ok: false, reasons: [...reasons, "invalid when expression tokens"] };

    const res = evalComparison(a, op, b);

    if (acc === null) acc = res;
    else if (pendingLogic === "&&") acc = acc && res;
    else if (pendingLogic === "||") acc = acc || res;
    else acc = acc && res;

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

function severityRank(sev?: string): number {
  const s = String(sev || "INFO").toUpperCase();
  const map: Record<string, number> = {
    CRITICAL: 5,
    HIGH: 4,
    WARN: 3,
    MEDIUM: 2,
    LOW: 1,
    INFO: 1,
  };
  return map[s] ?? 1;
}

export function evaluatePolicies(doc: PolicyDoc, signals: Signals): Decision {
  const triggeredRules: Decision["triggeredRules"] = [];
  const trace: Decision["trace"] = [];

  for (const rule of doc.rules) {
    const m = matchObject((rule as any).match, signals);
    const w = evalWhen((rule as any).when, signals);

    const matched = m.ok && w.ok;

    trace.push({
      ruleId: (rule as any).id,
      matched,
      reasons: [...m.reasons, ...w.reasons],
    });

    if (matched) {
      triggeredRules.push({
        id: (rule as any).id,
        title: (rule as any).title,
        severity: (rule as any).severity,
        priority: typeof (rule as any).priority === "number" ? (rule as any).priority : 0,
        decision: (rule as any).then?.decision,
        confidence: (rule as any).then?.confidence,
        reason: (rule as any).reason,
        evidence: (rule as any).evidence,
      });
    }
  }

  // Strongest rule:
  // 1) highest priority
  // 2) higher severity
  // 3) higher confidence
  const best = triggeredRules
    .slice()
    .sort((a, b) => {
      const pa = typeof a.priority === "number" ? a.priority : 0;
      const pb = typeof b.priority === "number" ? b.priority : 0;
      if (pb !== pa) return pb - pa;

      const sa = severityRank(a.severity);
      const sb = severityRank(b.severity);
      if (sb !== sa) return sb - sa;

      return (b.confidence || 0) - (a.confidence || 0);
    })[0];

  const decision = best?.decision || doc.defaultDecision;
  const confidence = best?.confidence ?? doc.defaultConfidence ?? 0.55;

  // IMPORTANT: keep triggeredRules sorted for UI (top first)
  const sortedTriggered = triggeredRules
    .slice()
    .sort((a, b) => {
      const pa = typeof a.priority === "number" ? a.priority : 0;
      const pb = typeof b.priority === "number" ? b.priority : 0;
      if (pb !== pa) return pb - pa;

      const sa = severityRank(a.severity);
      const sb = severityRank(b.severity);
      if (sb !== sa) return sb - sa;

      return (b.confidence || 0) - (a.confidence || 0);
    });

  return { decision, confidence, triggeredRules: sortedTriggered, trace };
}

