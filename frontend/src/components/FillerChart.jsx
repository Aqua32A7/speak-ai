import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function FillerChart({ totalFillers = 0, breakdown = {}, wpm = 0 }) {
  const fillerEntries = Object.entries(breakdown || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Filler Words & Pace
        </h3>
        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 italic">
          Approximate count
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Total Fillers Metric */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Total Fillers</p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
              {totalFillers}
            </span>
            <span className="text-xs text-slate-400">words</span>
          </div>
        </div>

        {/* WPM Metric */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Speaking Pace</p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
              {wpm}
            </span>
            <span className="text-xs text-slate-400">WPM</span>
          </div>
        </div>
      </div>

      {/* Breakdown Pills */}
      <div>
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Detected Fillers Breakdown:
        </p>

        {fillerEntries.length === 0 ? (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Excellent! No significant repetitive fillers detected in this session.</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {fillerEntries.map(([word, count]) => (
              <span
                key={word}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300"
              >
                <span className="font-semibold capitalize">"{word}"</span>
                <span className="px-1.5 py-0.2 rounded-full bg-amber-200/70 dark:bg-amber-800 text-[10px] font-mono font-bold">
                  {count}×
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Accuracy Disclosure */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-start gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
        <span>
          Note: Filler counts are approximate. Browser speech recognizers often filter subtle phonetic pauses like "um" or "uh".
        </span>
      </div>
    </div>
  );
}
