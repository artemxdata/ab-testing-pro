import { parsePolicies } from "./policyEngine";

export async function loadPoliciesFromPublic() {
  // IMPORTANT:
  // CRA with "homepage" uses a base path (e.g. /ab-testing-pro).
  // PUBLIC_URL handles both localhost and GitHub Pages.
  const url = (process.env.PUBLIC_URL || "") + "/policies.yaml";

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch policies: ${res.status} ${res.statusText} (${url})`);
  }
  const yamlText = await res.text();

  // If we still got HTML, it means the server fell back to index.html
  if (yamlText.trim().startsWith("<!DOCTYPE html>")) {
    throw new Error(`Policies URL returned HTML (SPA fallback). Check that ${url} exists in /public.`);
  }

  return parsePolicies(yamlText);
}
