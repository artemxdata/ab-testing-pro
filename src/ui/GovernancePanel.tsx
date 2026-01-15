import React, { useMemo } from "react";

type Props = {
  signals: any;
  policyError?: string | null;
  policyDocLoaded?: boolean;
};

function badge(level: string) {
  const L = String(level || "UNKNOWN").toUpperCase();
  if (L === "GREEN")
    return "bg-emerald-500/15 text-emerald-800 border-emerald-200 dark:text-emerald-200 dark:border-emerald-400/20";
  if (L === "YELLOW")
    return "bg-amber-500/15 text-amber-900 border-amber-200 dark:text-amber-200 dark:border-amber-400/20";
  if (L === "RED")
    return "bg-rose-500/15 text-rose-800 border-rose-200 dark:text-rose-200 dark:border-rose-400/20";
  return "bg-slate-500/10 text-slate-800 border-slate-200 dark:text-slate-200 dark:border-slate-400/20";
}

function MetricRow({
  label,
  value,
  level,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  level: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <div className="font-semibold text-slate-900 dark:text-white">{label}</div>
        {hint ? (
          <div className="text-xs text-slate-600 dark:text-slate-300/80 mt-0.5">
            {hint}
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
          {value}
        </div>
        <span className={`px-2.5 py-1 rounded-full border text-xs font-bold ${badge(level)}`}>
          {String(level || "UNKNOWN").toUpperCase()}
        </span>
      </div>
    </div>
  );
}

export default function GovernancePanel({ signals, policyError, policyDocLoaded }: Props) {
  const items = useMemo(() => {
    const s = signals || {};

    const fmtP = (x: any) =>
      Number.isFinite(Number(x)) ? Number(x).toFixed(4) : "—";

    const fmtPct = (x: any) =>
      Number.isFinite(Number(x)) ? `${Number(x).toFixed(1)}%` : "—";

    const fmtRate = (x: any) =>
      Number.isFinite(Number(x)) ? Number(x).toFixed(3) : "—";

    const fmtPower = (x: any) =>
      Number.isFinite(Number(x)) ? `${(Number(x) * 100).toFixed(0)}%` : "—";

    return [
      {
        key: "srm",
        label: "SRM (traffic integrity)",
        value: fmtP(s?.srm_p_value),
        level: s?.srm_level || "UNKNOWN",
        hint: "Does observed traffic split match expected assignment?",
      },
      {
        key: "roi",
        label: "ROI",
        value: fmtPct(s?.roi_pct),
        level: s?.roi_level || "UNKNOWN",
        hint: "Business proxy. Negative ROI is a governance red flag.",
      },
      {
        key: "loss",
        label: "Expected loss (rate)",
        value: fmtRate(s?.expected_loss),
        level: s?.expected_loss_level || "UNKNOWN",
        hint: "Downside risk proxy. High expected loss → escalation.",
      },
      {
        key: "power",
        label: "Power",
        value: fmtPower(s?.power),
        level: s?.power_level || "UNKNOWN",
        hint: "Low power = uncertainty; prefer continuing test.",
      },
    ];
  }, [signals]);

  return (
    <div className="rounded-3xl border border-slate-200/70 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/40 backdrop-blur shadow-xl">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-300/80">
              Governance
            </div>
            <h3 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
              Risk & integrity checks
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300/90">
              These can override statistical wins.
            </p>
          </div>

          <div className="text-right">
            {!policyDocLoaded && !policyError ? (
              <div className="text-xs px-3 py-2 rounded-full border border-amber-300/40 bg-amber-500/10 text-amber-900 dark:text-amber-200">
                ⏳ Loading policies…
              </div>
            ) : null}

            {policyError ? (
              <div className="text-xs px-3 py-2 rounded-full border border-rose-300/40 bg-rose-500/10 text-rose-900 dark:text-rose-200">
                ⚠️ Policy error
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 divide-y divide-slate-200/70 dark:divide-slate-700/60">
          {items.map((it) => (
            <MetricRow
              key={it.key}
              label={it.label}
              value={it.value}
              level={it.level}
              hint={it.hint}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

