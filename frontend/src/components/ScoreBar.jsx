import React from 'react';

export default function ScoreBar({ label, score = 0, max = 10, description = '' }) {
  const normalized = Math.max(0, Math.min(max, score));
  const percentage = (normalized / max) * 100;

  // Color gradient according to score bracket
  let barGradient = 'from-emerald-500 to-teal-400';
  let badgeColor = 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50';

  if (normalized < 5) {
    barGradient = 'from-rose-500 to-red-400';
    badgeColor = 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50';
  } else if (normalized < 7) {
    barGradient = 'from-amber-500 to-yellow-400';
    badgeColor = 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50';
  } else if (normalized < 8.5) {
    barGradient = 'from-indigo-500 to-cyan-400';
    badgeColor = 'text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50';
  }

  return (
    <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800 dark:text-slate-200">{label}</span>
          {description && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              {description}
            </span>
          )}
        </div>
        <span className={`font-mono font-bold px-2 py-0.5 rounded-md text-xs ${badgeColor}`}>
          {normalized.toFixed(1)} / {max}
        </span>
      </div>

      {/* Progress Track */}
      <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700/80 overflow-hidden mt-1">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-700 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
