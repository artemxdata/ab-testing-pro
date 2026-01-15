import React from "react";

type Props = {
  decision: string;
  confidence: number;
};

const pillByDecision = (decision: string) => {
  const d = String(decision || "").toUpperCase();

  if (["IMPLEMENT", "LAUNCH", "ACCEPT", "ROLLOUT", "SHIP"].some((k) => d.includes(k))) {
    return {
      emoji: "🚀",
      label: "IMPLEMENT",
      className: "bg-green-100 text-green-800 border-green-200",
    };
  }
  if (["REJECT", "STOP"].some((k) => d.includes(k))) {
    return {
      emoji: "⛔",
      label: "REJECT",
      className: "bg-red-100 text-red-800 border-red-200",
    };
  }
  if (d.includes("ESCALATE")) {
    return {
      emoji: "⚠️",
      label: "ESCALATE",
      className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    };
  }
  return {
    emoji: "⏳",
    label: "CONTINUE",
    className: "bg-gray-100 text-gray-800 border-gray-200",
  };
};

function DecisionCard({ decision, confidence }: Props) {
  const pill = pillByDecision(decision);

  return (
    <div className="p-4 rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{pill.emoji}</div>
          <div className="font-semibold text-sm">Policy Decision</div>
        </div>

        <span className={`px-3 py-1 rounded-full border text-xs font-bold ${pill.className}`}>
          {pill.label}
        </span>
      </div>

      <div className="mt-3 text-sm text-gray-700">
        <span className="font-semibold">Confidence:</span>{" "}
        {(Number(confidence || 0) * 100).toFixed(0)}%
      </div>
    </div>
  );
}

export default DecisionCard;
export { DecisionCard };

