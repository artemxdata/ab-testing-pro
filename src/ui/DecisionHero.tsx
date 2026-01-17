import React, { useMemo } from "react";

type Props = {
  decision: string;
  confidence: number;
  topRule?: any | null;
  darkMode?: boolean;
};

function clamp01(x: any) {
  const v = Number(x);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

function metaByDecision(decision: string) {
  switch (decision) {
    case "IMPLEMENT_TREATMENT":
    case "IMPLEMENT":
      return {
        emoji: "🚀",
        title: "Implement Treatment B",
        subtitle: "Rollout is allowed by policy.",
        tone: "from-emerald-500/90 via-emerald-600/90 to-teal-600/90",
        pill: "bg-emerald-600/20 text-emerald-50 border-emerald-200/20",
      };
    case "REJECT_TREATMENT":
    case "REJECT":
      return {
        emoji: "🛑",
        title: "Reject Treatment B",
        subtitle: "Policy blocks rollout due to negative impact.",
        tone: "from-rose-500/90 via-rose-600/90 to-red-700/90",
        pill: "bg-rose-600/20 text-rose-50 border-rose-200/20",
      };
    case "ESCALATE":
      return {
        emoji: "🧯",
        title: "Escalate",
        subtitle: "Critical risk detected — investigate first.",
        tone: "from-amber-500/90 via-orange-600/90 to-rose-600/90",
        pill: "bg-amber-500/20 text-amber-50 border-amber-200/20",
      };
    default:
      return {
        emoji: "⏳",
        title: "Continue Testing",
        subtitle: "More data needed or no rule matched.",
        tone: "from-slate-600/90 via-slate-700/90 to-slate-800/90",
        pill: "bg-white/10 text-white border-white/15",
      };
  }
}

export default function DecisionHero({ decision, confidence, topRule }: Props) {
  const conf = clamp01(confidence);
  const meta = useMemo(() => metaByDecision(decision), [decision]);

  const reason =
    topRule?.reason ||
    topRule?.title ||
    "Decision is produced by YAML policies (deterministic engine).";

  const severity = topRule?.severity || "";

  return (
    <div
      className={`rounded-3xl p-6 sm:p-8 bg-gradient-to-r ${meta.tone} text-white shadow-2xl border border-white/10 overflow-hidden`}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        {/* LEFT */}
        <div className="flex gap-4 min-w-0">
          <div className="text-4xl sm:text-5xl leading-none shrink-0">
            {meta.emoji}
          </div>

          <div className="min-w-0">
            <div className="text-sm uppercase tracking-widest opacity-90">
              Policy Decision
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
              {meta.title}
            </h2>

            <p className="mt-2 text-base sm:text-lg opacity-90">
              {meta.subtitle}
            </p>

            <div className="mt-4 max-w-2xl">
              <div className="text-sm font-semibold opacity-95">
                Why (top reason)
              </div>
              <div className="mt-1 text-sm sm:text-base opacity-90 break-words">
                {reason}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="w-full md:w-[300px] max-w-full">
          <div className="flex flex-wrap items-center gap-2 justify-start md:justify-end">
            <span
              className={`px-3 py-1 rounded-full border text-xs font-bold ${meta.pill}`}
            >
              {decision}
            </span>

            {severity ? (
              <span className="px-3 py-1 rounded-full border border-white/15 bg-white/10 text-xs font-semibold">
                {String(severity).toUpperCase()}
              </span>
            ) : null}
          </div>

          <div className="mt-4 rounded-2xl border border-white/15 bg-white/10 p-4 w-full max-w-full">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold">Confidence</div>
              <div className="text-sm font-bold tabular-nums">
                {(conf * 100).toFixed(0)}%
              </div>
            </div>

            <div className="mt-2 h-2 w-full rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-2 rounded-full bg-white/80"
                style={{ width: `${Math.round(conf * 100)}%` }}
              />
            </div>

            <div className="mt-3 text-xs opacity-85">
              Deterministic decision from YAML policies.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

