// server/playbook.js
import fs from "fs";
import path from "path";
import YAML from "yaml";

const PLAYBOOK_PATH = path.join(process.cwd(), "playbook.yaml");

let cache = null;

function loadPlaybook() {
  if (cache) return cache;
  const raw = fs.readFileSync(PLAYBOOK_PATH, "utf8");
  cache = YAML.parse(raw);
  return cache;
}

export function retrievePlaybook({ decision, signals }) {
  const doc = loadPlaybook();
  const items = Array.isArray(doc?.items) ? doc.items : [];

  const s = signals || {};

  const scored = items.map((it) => {
    let score = 0;

    // decision match
    if (it?.decision && decision && it.decision === decision) score += 2;

    // simple tags
    const when = Array.isArray(it?.when) ? it.when : [];
    if (when.includes("POWER_LOW") && s.power_level === "RED") score += 1;
    if (when.includes("LOSS_YELLOW") && s.expected_loss_level === "YELLOW") score += 1;
    if (when.includes("LOSS_RED") && s.expected_loss_level === "RED") score += 1;
    if (when.includes("SRM_RED") && s.srm_level === "RED") score += 2;
    if (when.includes("SRM_GREEN") && s.srm_level === "GREEN") score += 1;

    return { it, score };
  });

  return scored
    .filter((x) => x.score > 0 && x.it?.text)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((x) => `- ${x.it.text}`);
}
