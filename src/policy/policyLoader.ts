import YAML from "yaml";

export type PolicyDoc = {
  version?: string;
  defaultDecision: string;
  defaultConfidence?: number;
  rules: Array<{
    id: string;
    title?: string;
    severity?: "INFO" | "WARN" | "CRITICAL";
    when?: string;
    match?: Record<string, any>;
    then: {
      decision: string;
      confidence?: number;
    };
    reason?: string;
    evidence?: string[];
  }>;
};

export async function loadPolicies(): Promise<PolicyDoc> {
  // CRA / GitHub Pages safe URL:
  // - dev: http://localhost:3000/ab-testing-pro -> PUBLIC_URL="/ab-testing-pro"
  // - prod: GitHub Pages -> same
  const url = `${process.env.PUBLIC_URL || ""}/policies.yaml`;

  const res = await fetch(url, { cache: "no-cache" });

  if (!res.ok) {
    throw new Error(`Failed to fetch policies.yaml (${res.status} ${res.statusText}) at: ${url}`);
  }

  const text = await res.text();

  // sanity check: иногда вместо yaml отдавался index.html
  if (text.trim().startsWith("<!DOCTYPE html")) {
    throw new Error(`policies.yaml URL returned HTML instead of YAML. URL: ${url}`);
  }

  const doc = YAML.parse(text) as PolicyDoc;

  if (!doc || !doc.defaultDecision || !Array.isArray(doc.rules)) {
    throw new Error("Invalid policies.yaml schema: expected { defaultDecision, rules[] }");
  }

  return doc;
}
