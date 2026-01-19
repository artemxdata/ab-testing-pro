// src/policy/policyEngine.js

function isObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function matchObject(match, signals) {
  if (!match) return { ok: true, reasons: ["no match block"] };
  if (!isObject(match)) return { ok: false, reasons: ["match is not an object"] };

  const reasons = [];
  for (const [k, expected] of Object.entries(match)) {
    const actual = signals[k];
    const ok = actual === expected;
    reasons.push(ok ? `match ${k} == ${JSON.stringify(expected)}` : `FAIL ${k}: ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`);
    if (!ok) return { ok: false, reasons };
  }
  return { ok: true, reasons };
}

function evalWhen(expr, signals) {
  if (!expr || !String(expr).trim()) return { ok: true, reasons: ["no when expression"] };

  const reasons = [];
  const normalized = String(expr).replace(/[()]/g, " ").replace(/\s+/g, " ").trim();
  const parts = normalized.split(" ").filter(Boolean);

  function readValue(token) {
    if (token in signals) return signals[token];
    if (/^-?\d+(\.\d+)?$/.test(token)) return Number(token);
    if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
      return token.slice(1, -1);
    }
    return token;
  }

  function evalComparison(lhsTok, op, rhsTok) {
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
  let acc = null;
  let pendingLogic = null;

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
      pendingLogic = next;
      i++;
    } else pendingLogic = null;
  }

  return { ok: Boolean(acc), reasons };
}

function severityRank(sev) {
  const s = String(sev || "INFO").toUpperCase();
  const map = { CRITICAL: 5, HIGH: 4, WARN: 3, MEDIUM: 2, LOW: 1, INFO: 1 };
  return map[s] ?? 1;
}

export function evaluatePolicies(doc, signals) {
  const triggeredRules = [];
  const trace = [];

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
        priority: typeof rule.priority === "number" ? rule.priority : 0,
        decision: rule.then?.decision,
        confidence: rule.then?.confidence,
        reason: rule.reason,
        evidence: rule.evidence,
      });
    }
  }

  const sortedTriggered = triggeredRules.slice().sort((a, b) => {
    const pa = typeof a.priority === "number" ? a.priority : 0;
    const pb = typeof b.priority === "number" ? b.priority : 0;
    if (pb !== pa) return pb - pa;

    const sa = severityRank(a.severity);
    const sb = severityRank(b.severity);
    if (sb !== sa) return sb - sa;

    return (b.confidence || 0) - (a.confidence || 0);
  });

  const best = sortedTriggered[0];

  const decision = best?.decision || doc.defaultDecision;
  const confidence = best?.confidence ?? doc.defaultConfidence ?? 0.55;

  return { decision, confidence, triggeredRules: sortedTriggered, trace };
}

