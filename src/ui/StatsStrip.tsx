import React from "react";

type Props = {
  pValue: number;
  upliftPct: number;
  zScore: number;
  alpha?: number;
};

function tileLabel(label: string, value: React.ReactNode, hint?: string) {
  return (
    <div className="rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/40 backdrop-blur p-4 shadow-sm">
      <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-300/80">
        {label}
      </div>
      <div className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
        {value}
      </div>
      {hint ? (
        <div className="mt-1 text-xs text-slate-600 dark:text-slate-300/90">
          {hint}
        </div>
      ) : null}
    </div>
  );
}

export default function StatsStrip({ pValue, upliftPct, zScore, alpha = 0.05 }: Props) {
  const pv = Number.isFinite(pValue) ? pValue : 1;
  const up = Number.isFinite(upliftPct) ? upliftPct : 0;
  const z = Number.isFinite(zScore) ? zScore : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {tileLabel("Uplift", `${up.toFixed(1)}%`, "Relative change vs control")}
      {tileLabel("P-Value", pv < 0.0001 ? "< 0.0001" : pv.toFixed(4), `alpha = ${alpha}`)}
      {tileLabel("Z-Score", z.toFixed(2), "Standardized difference")}
    </div>
  );
}

