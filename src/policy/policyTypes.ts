import type { Decision, Severity, Signals } from "../types/decision";

export type PolicyRule = {
  id: string;
  title: string;
  severity: Severity;
  // "when" — строка-описание, чтобы показывать человеку (а не вычислять из неё)
  when: string;

  // match — детерминированные условия
  match: Partial<Record<keyof Signals, any>>;

  // what to do
  then: {
    decision: Decision;
    confidence?: number; // optional override
  };

  reason: string;
  evidence?: string[];
};

export type PolicyDoc = {
  version: string;
  defaultDecision: Decision;
  defaultConfidence?: number;
  rules: PolicyRule[];
};
