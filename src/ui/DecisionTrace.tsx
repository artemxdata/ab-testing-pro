import React from "react";

type Rule = {
  id: string;
  title?: string;
  severity?: string;
  decision?: string;
  confidence?: number;
  reason?: string;
  evidence?: string[];
};

type Props = {
  triggeredRules: Rule[];
};

const badge = (sev?: string) => {
  const s = String(sev || "INFO").toUpperCase();
  if (s === "CRITICAL") return "bg-red-100 text-red-800 border-red-200";
  if (s === "HIGH") return "bg-orange-100 text-orange-800 border-orange-200";
  if (s === "MEDIUM") return "bg-yellow-100 text-yellow-800 border-yellow-200";
  if (s === "LOW") return "bg-green-100 text-green-800 border-green-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
};

function DecisionTrace({ triggeredRules }: Props) {
  const rules = Array.isArray(triggeredRules) ? triggeredRules : [];

  return (
    <div className="p-4 rounded-xl border border-gray-200 bg-white">
      <div className="font-semibold mb-2">Decision Trace</div>

      {rules.length === 0 ? (
        <div className="text-sm text-gray-600">
          No rules matched. Default decision was used.
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((r, idx) => (
            <div key={`${r.id}-${idx}`} className="p-3 rounded-lg border border-gray-100 bg-gray-50">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">
                    {r.title || r.id}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Rule ID: <span className="font-mono">{r.id}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full border text-xs font-bold ${badge(r.severity)}`}>
                    {String(r.severity || "INFO").toUpperCase()}
                  </span>
                </div>
              </div>

              {r.reason ? (
                <div className="text-sm text-gray-700 mt-2">{r.reason}</div>
              ) : null}

              {(r.decision || r.confidence != null) ? (
                <div className="text-xs text-gray-700 mt-2">
                  {r.decision ? <span><b>then.decision:</b> {r.decision}</span> : null}
                  {r.confidence != null ? <span> • <b>then.confidence:</b> {(Number(r.confidence) * 100).toFixed(0)}%</span> : null}
                </div>
              ) : null}

              {Array.isArray(r.evidence) && r.evidence.length > 0 ? (
                <ul className="mt-2 text-xs text-gray-700 list-disc ml-5">
                  {r.evidence.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DecisionTrace;
export { DecisionTrace };
