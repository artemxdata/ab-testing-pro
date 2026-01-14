import { readFileSync } from "node:fs";
import { parsePolicies, evaluatePolicy } from "../src/policy/policyEngine";
import type { Signals } from "../src/types/decision";

const yamlText = readFileSync("public/policies/policies.yaml", "utf-8");
const doc = parsePolicies(yamlText);

// Scenario 1: strong win -> AUTO_APPROVE
const s1: Signals = {
  p_value_level: "GREEN",
  effect_size_level: "GREEN",
  power_level: "GREEN",
  roi_level: "GREEN",
  expected_loss_level: "AMBER",
  srm_level: "GREEN",
  p_value: 0.01,
  uplift_pct: 8.2,
  roi_pct: 35,
  power: 0.86,
};

const r1 = evaluatePolicy(doc, s1);

// Scenario 2: SRM red -> ESCALATE
const s2: Signals = {
  p_value_level: "GREEN",
  effect_size_level: "GREEN",
  power_level: "GREEN",
  roi_level: "GREEN",
  expected_loss_level: "GREEN",
  srm_level: "RED",
};

const r2 = evaluatePolicy(doc, s2);

// Scenario 3: not significant -> CONTINUE_TEST
const s3: Signals = {
  p_value_level: "AMBER",
  effect_size_level: "AMBER",
  power_level: "AMBER",
  roi_level: "AMBER",
  expected_loss_level: "GREEN",
  srm_level: "GREEN",
};

const r3 = evaluatePolicy(doc, s3);

console.log("\n--- Scenario 1 (Strong Win) ---");
console.log("Decision:", r1.decision, "Confidence:", r1.confidence);
console.log("Triggered Rules:", r1.triggeredRules.map((x) => x.id));

console.log("\n--- Scenario 2 (SRM Red) ---");
console.log("Decision:", r2.decision, "Confidence:", r2.confidence);
console.log("Triggered Rules:", r2.triggeredRules.map((x) => x.id));

console.log("\n--- Scenario 3 (Not Significant) ---");
console.log("Decision:", r3.decision, "Confidence:", r3.confidence);
console.log("Triggered Rules:", r3.triggeredRules.map((x) => x.id));
