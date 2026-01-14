// src/policy/policyLoader.js
import YAML from "yaml";

// CRA serves files from /public at the app root.
// But on GitHub Pages the app is under /ab-testing-pro.
// Поэтому используем PUBLIC_URL.
const BASE = (process.env.PUBLIC_URL || "").replace(/\/$/, "");
const POLICIES_URL = `${BASE}/policies.yaml`;

export async function loadPoliciesFromPublic() {
  const res = await fetch(POLICIES_URL, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch policies.yaml: HTTP ${res.status}`);
  }
  const text = await res.text();
  // YAML.parse will throw on invalid YAML
  return YAML.parse(text);
}

// Alias for convenience (so imports "loadPolicies" won't break)
export async function loadPolicies() {
  return loadPoliciesFromPublic();
}
