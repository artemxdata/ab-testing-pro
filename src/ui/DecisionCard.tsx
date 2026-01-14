import React from "react";
import type { Decision, Signals } from "../types/decision";

function badgeText(decision: Decision): string {
  switch (decision) {
    case "AUTO_APPROVE": return "AUTO APPROVE ✅";
    case "CONTINUE_TEST": return "CONTINUE TEST ⏳";
    case "HUMAN_REVIEW": return "HUMAN REVIEW 👤";
    case "ESCALATE": return "ESCALATE 🚨";
    default: return decision;
  }
}

export function DecisionCard(props: {
  decision: Decision;
  confidence: number;
  signals: Signals;
}) {
  const { decision, confidence, signals } = props;

  const drivers = [
    { k: "p_value_level", label: "Significance (p-value)", v: signals.p_value_level },
    { k: "effect_size_level", label: "Effect size", v: signals.effect_size_level },
    { k: "roi_level", label: "ROI", v: signals.roi_level },
    { k: "expected_loss_level", label: "Expected loss", v: signals.expected_loss_level },
    { k: "srm_level", label: "SRM", v: signals.srm_level },
  ];

  return (
    <div style={{
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      padding: 16,
      marginTop: 16
    }}>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{badgeText(decision)}</div>
      <div style={{ marginTop: 6, opacity: 0.8 }}>
        Confidence: {(confidence * 100).toFixed(0)}%
      </div>

      <div style={{ marginTop: 12, fontWeight: 600 }}>Key Drivers</div>
      <ul style={{ marginTop: 8, paddingLeft: 18 }}>
        {drivers.map((d) => (
          <li key={d.k} style={{ marginBottom: 6 }}>
            {d.label}: <b>{d.v}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
