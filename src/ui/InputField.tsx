import React from "react";

type Props = {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
  suffix?: string;
  min?: number;
  step?: number;
};

export default function InputField({
  label,
  value,
  onChange,
  hint,
  suffix,
  min,
  step,
}: Props) {
  return (
    <label className="block">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-white">
            {label}
          </div>
          {hint ? (
            <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-300/80">
              {hint}
            </div>
          ) : null}
        </div>

        {suffix ? (
          <div className="text-xs text-slate-500 dark:text-slate-300/80">
            {suffix}
          </div>
        ) : null}
      </div>

      <input
        type="number"
        min={min}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value || 0))}
        className="mt-2 w-full rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/40 backdrop-blur px-4 py-3 text-slate-900 dark:text-white shadow-sm outline-none transition
                   focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-400/60"
      />
    </label>
  );
}

