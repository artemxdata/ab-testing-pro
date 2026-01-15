import React from "react";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function PanelCard({ title, subtitle, children }: Props) {
  return (
    <div className="rounded-3xl border border-slate-200/70 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/40 backdrop-blur shadow-xl">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm uppercase tracking-widest text-slate-500 dark:text-slate-300/80">
              {title}
            </div>
            {subtitle ? (
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-300/90">
                {subtitle}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-5 space-y-4">{children}</div>
      </div>
    </div>
  );
}

