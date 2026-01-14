import React from "react";
import type { TriggeredRule } from "../types/decision";

export function DecisionTrace(props: { rules: TriggeredRule[] }) {
  const { rules } = props;

  return (
    <div style={{
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      padding: 16,
      marginTop: 16
    }}>
      <div style={{ fontSize: 16, fontWeight: 700 }}>Decision Trace</div>
      <div style={{ marginTop: 8, opacity: 0.8 }}>
        {rules.length === 0 ? "No rules matched (default policy applied)." : `${rules.length} rule(s) matched.`}
      </div>

      {rules.length > 0 && (
        <div style={{ marginTop: 12, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 8 }}>Rule</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 8 }}>Severity</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 8 }}>Decision</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 8 }}>Reason</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id}>
                  <td style={{ borderBottom: "1px solid #f3f4f6", padding: 8 }}>
                    <div style={{ fontWeight: 600 }}>{r.title}</div>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>{r.id}</div>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>When: {r.when}</div>
                  </td>
                  <td style={{ borderBottom: "1px solid #f3f4f6", padding: 8 }}>{r.severity}</td>
                  <td style={{ borderBottom: "1px solid #f3f4f6", padding: 8 }}>{r.decision}</td>
                  <td style={{ borderBottom: "1px solid #f3f4f6", padding: 8 }}>
                    <div>{r.reason}</div>
                    {r.evidence?.length ? (
                      <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
                        Evidence: {r.evidence.join(", ")}
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DecisionTrace;
