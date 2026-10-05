import React from 'react';
import { Tag, Zap, HelpCircle } from 'lucide-react';

export default function TopicCard({
  topic,
  category,
  difficulty,
  isFollowUp = false,
  subtopic,
  questionType,
  roundNumber,
  isDsa = false,
}) {
  const getDifficultyColor = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'easy':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60';
      case 'hard':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60';
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 transition-colors duration-200">
      {/* Decorative top accent gradient */}
      <div
        className={`absolute top-0 left-0 right-0 h-1.5 ${
          isDsa
            ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500'
            : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'
        }`}
      />

      {/* Meta tags */}
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        {isDsa && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60">
            <Tag className="w-3 h-3" />
            DSA Interview
          </span>
        )}

        {subtopic && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            {subtopic}
          </span>
        )}

        {questionType && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700">
            {questionType}
          </span>
        )}

        {!isDsa && category && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/60">
            <Tag className="w-3 h-3" />
            {category}
          </span>
        )}

        {difficulty && (
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getDifficultyColor(difficulty)}`}>
            <Zap className="w-3 h-3" />
            {difficulty}
          </span>
        )}

        {isFollowUp && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800/60">
            Follow-up {roundNumber ? `Round ${roundNumber} of 3` : ''}
          </span>
        )}
      </div>

      {/* Main topic statement */}
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-snug">
        {topic || 'Loading interview speaking drill...'}
      </h2>

      {/* Subtext prompt helper */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
        <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <span>
          {isDsa ? (
            <>
              <strong>Oral DSA Structure:</strong> State the core idea ➔ Outline the approach ➔ Explain Time & Space Complexity ➔ Mention tricky edge cases.
            </>
          ) : (
            'Take 10 seconds to structure your thoughts: state the core concept, provide a concrete project or algorithmic example, and explain the key trade-off before concluding.'
          )}
        </span>
      </div>
    </div>
  );
}
