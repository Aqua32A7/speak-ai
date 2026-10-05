import React from 'react';
import { Tag, Zap, HelpCircle, Volume2, Square } from 'lucide-react';

export default function TopicCard({
  topic,
  category,
  difficulty,
  isFollowUp = false,
  subtopic,
  questionType,
  roundNumber,
  isDsa = false,
  isCore = false,
  isProject = false,
  projectName,
  subject,
  primer,
  onSpeakQuestion,
  isSpeakingQuestion = false,
  onStopSpeaking,
  onSpeakPrimer,
  isSpeakingPrimer = false,
  disableAudio = false,
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

  const getGradient = () => {
    if (isProject) return 'bg-gradient-to-r from-teal-500 via-cyan-500 to-indigo-500';
    if (isCore) return 'bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500';
    if (isDsa) return 'bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500';
    return 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500';
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-8 transition-colors duration-200 space-y-4">
      {/* Decorative top accent gradient */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${getGradient()}`} />

      {/* Meta tags */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
        {isProject && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800/60">
            <Tag className="w-3 h-3" />
            Project: {projectName || 'My Project'}
          </span>
        )}

        {isCore && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800/60">
            <Tag className="w-3 h-3" />
            CS Fundamentals
          </span>
        )}

        {isDsa && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60">
            <Tag className="w-3 h-3" />
            DSA Interview
          </span>
        )}

        {subject && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            {subject}
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

        {!isDsa && !isCore && !isProject && category && (
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

      {/* Primer Card if present */}
      {primer && (
        <div className="p-4 rounded-xl bg-violet-50/70 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900/60 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet-800 dark:text-violet-300">
              <span>📖 Concept Primer (Read & Prepare)</span>
            </div>
            {onSpeakPrimer && !disableAudio && (
              <button
                type="button"
                onClick={isSpeakingPrimer ? onStopSpeaking : onSpeakPrimer}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSpeakingPrimer
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-violet-100/80 hover:bg-violet-200/80 text-violet-700 dark:bg-violet-900/60 dark:hover:bg-violet-800/60 dark:text-violet-300'
                }`}
              >
                {isSpeakingPrimer ? (
                  <>
                    <Square className="w-3 h-3 fill-current" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3 h-3" />
                    <span>Listen</span>
                  </>
                )}
              </button>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
            {primer}
          </p>
        </div>
      )}

      {/* Main topic statement + Audio Button */}
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-snug break-words">
          {topic || 'Loading interview speaking drill...'}
        </h2>
        {onSpeakQuestion && !disableAudio && topic && (
          <button
            type="button"
            onClick={isSpeakingQuestion ? onStopSpeaking : onSpeakQuestion}
            title={isSpeakingQuestion ? 'Stop speaking question' : 'Read question aloud'}
            className={`p-2 rounded-xl shrink-0 transition-all cursor-pointer shadow-sm ${
              isSpeakingQuestion
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200'
            }`}
          >
            {isSpeakingQuestion ? (
              <Square className="w-4 h-4 fill-white" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Subtext prompt helper */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
        <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <span>
          {isProject ? (
            <>
              <strong>Project Defense Advice:</strong> State your individual ownership ("I designed/built...") ➔ Explain key architectural choices ➔ Detail trade-offs, bugs, or scale challenges faced.
            </>
          ) : isCore ? (
            <>
              <strong>4-Part Structure to Follow:</strong> Definition (what it is) ➔ Mechanism (how it works) ➔ Concrete Example ➔ Trade-off or Limitation.
            </>
          ) : isDsa ? (
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
