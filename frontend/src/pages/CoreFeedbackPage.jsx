import React from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  TrendingUp,
  RotateCcw,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Clock,
  BookOpen,
  Lightbulb,
  Check,
  Flame,
  HelpCircle,
} from 'lucide-react';
import ScoreBar from '../components/ScoreBar';
import FillerChart from '../components/FillerChart';
import VoiceFeedbackPlayer from '../components/VoiceFeedbackPlayer';

export default function CoreFeedbackPage({
  analysis,
  topicData,
  onTryAgain,
  onNewQuestion,
  onStartFollowUp,
  onFinish,
  chainCount = 1,
}) {
  if (!analysis) return null;

  const getScoreBadgeColor = (score) => {
    if (score >= 8.5) return 'from-emerald-600 to-teal-500 text-white';
    if (score >= 7.0) return 'from-violet-600 to-indigo-500 text-white';
    if (score >= 5.0) return 'from-amber-500 to-orange-500 text-white';
    return 'from-rose-600 to-pink-500 text-white';
  };

  const isMaxFollowUps = chainCount >= 3;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-5 sm:space-y-8 animate-in fade-in duration-300">
      
      {/* Workflow Step Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-violet-50/70 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/60 text-xs font-semibold text-violet-800 dark:text-violet-300">
        <span className="flex items-center gap-1.5 text-[11px] sm:text-xs">
          <BookOpen className="w-3.5 h-3.5 text-violet-600" />
          <span>CS CORE DRILL</span> ➔ <span>ORAL EXPLANATION</span> ➔ <strong className="underline underline-offset-4">CONCEPT EVALUATION</strong>
        </span>
        <span className="text-[10px] sm:text-[11px] font-mono text-violet-600 dark:text-violet-400">
          Round {chainCount} of 3 • {analysis.duration_seconds}s • {analysis.word_count} words
        </span>
      </div>

      {/* Hero Score Header */}
      <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center gap-5 sm:gap-8 justify-between">
        <div className="space-y-2 text-center sm:text-left">
          <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
              <BookOpen className="w-3 h-3" />
              <span>{topicData?.subject || 'CS Fundamentals'}</span>
            </span>
            {topicData?.subtopic && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                {topicData.subtopic}
              </span>
            )}
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-medium border border-amber-200 dark:border-amber-800">
              Round {chainCount} of 3
            </span>
          </div>

          <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight break-words">
            {topicData?.topic}
          </h2>

          {analysis.next_focus_area && (
            <p className="text-xs sm:text-sm text-violet-600 dark:text-violet-400 font-semibold flex items-center justify-center sm:justify-start gap-1.5">
              <Flame className="w-4 h-4 shrink-0" />
              <span>Focus Area: {analysis.next_focus_area}</span>
            </p>
          )}
        </div>

        {/* Big Overall Score Circle */}
        <div className="flex flex-col items-center shrink-0">
          <div className={`w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl bg-gradient-to-tr ${getScoreBadgeColor(analysis.overall_score)} flex flex-col items-center justify-center shadow-lg shadow-violet-500/20`}>
            <span className="text-2xl sm:text-4xl font-extrabold font-mono tracking-tight">
              {analysis.overall_score.toFixed(1)}
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider opacity-85">
              out of 10
            </span>
          </div>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-2">
            Concept Mastery
          </span>
        </div>
      </div>

      {/* Voice Interviewer Spoken Feedback */}
      <VoiceFeedbackPlayer analysis={analysis} mode="core" />

      {/* 2-Column Grid: Core Dimensions & Delivery Hesitations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Core Dimensions */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Award className="w-4 h-4 text-violet-500" />
            CS Conceptual Dimensions
          </h3>

          <ScoreBar label="Concept Accuracy" score={analysis.concept_accuracy} description="Factual correctness of CS principles" />
          <ScoreBar label="Explanation Clarity" score={analysis.explanation_clarity} description="Simplicity and lucid communication of logic" />
          <ScoreBar label="4-Part Structure" score={analysis.structure} description="Definition ➔ Mechanism ➔ Example ➔ Trade-off" />
          <ScoreBar label="Technical Depth" score={analysis.depth} description="Underlying protocols, OS kernel or DB internals" />
          <ScoreBar label="Examples & Analogies" score={analysis.examples_and_analogies} description="Concrete real-world applications or analogies" />
          <ScoreBar label="Fluency & Continuity" score={analysis.fluency} description="Smooth speech delivery and steady pacing" />
        </div>

        {/* Hesitation & Fillers */}
        <div className="space-y-6">
          <FillerChart
            totalFillers={analysis.filler_words_count}
            breakdown={analysis.filler_words_breakdown}
            wpm={analysis.words_per_minute}
          />

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Pacing & Delivery Hesitations
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[10px] text-slate-400 block">First Word</span>
                <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">
                  {analysis.time_to_first_word_seconds}s
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[10px] text-slate-400 block">Longest Pause</span>
                <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">
                  {analysis.longest_pause_seconds}s
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[10px] text-slate-400 block">Pauses &gt; 2s</span>
                <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">
                  {analysis.pauses_over_2s_count}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 4-Part Structure Covered vs Missed Checklist */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-violet-500" />
            4-Part Explanation Checklist
          </h3>
          <span className="text-xs text-slate-400">
            {analysis.covered_points?.length || 0} covered • {analysis.missed_points?.length || 0} omitted
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Covered */}
          <div className="p-4 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Parts You Covered Well</span>
            </h4>
            {analysis.covered_points && analysis.covered_points.length > 0 ? (
              <ul className="space-y-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                {analysis.covered_points.map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{pt}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400 italic">No structural parts were clearly detected.</p>
            )}
          </div>

          {/* Missed */}
          <div className="p-4 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-amber-600" />
              <span>Parts You Skipped Or Omitted</span>
            </h4>
            {analysis.missed_points && analysis.missed_points.length > 0 ? (
              <ul className="space-y-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                {analysis.missed_points.map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                    <span className="leading-relaxed">{pt}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">All 4 structural components were covered!</p>
            )}
          </div>
        </div>
      </div>

      {/* Misconceptions Callout (If Any) */}
      {analysis.misconceptions && analysis.misconceptions.length > 0 && (
        <div className="rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-5 shadow-sm space-y-2.5">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
            <AlertOctagon className="w-4 h-4" />
            <span>Factual Inaccuracies Gently Corrected</span>
          </div>
          <p className="text-xs text-rose-900 dark:text-rose-300">
            Interviewers check for accurate mental models. Here are the corrections in simple words:
          </p>
          <ul className="space-y-1.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 list-disc list-inside">
            {analysis.misconceptions.map((m, idx) => (
              <li key={idx} className="leading-relaxed font-medium">
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Concept Refresher Card (Concise correct explanation + Remember points) */}
      {analysis.refresher && (
        <div className="rounded-3xl bg-gradient-to-br from-violet-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-md border border-violet-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-300" />
              <h3 className="text-base sm:text-lg font-bold tracking-tight">
                Concept Refresher
              </h3>
            </div>
            <span className="text-[11px] text-violet-300 font-mono">Quick Takeaways</span>
          </div>

          <p className="text-sm text-slate-200 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/10">
            {analysis.refresher.explanation}
          </p>

          {analysis.refresher.remember_points && analysis.refresher.remember_points.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 block">
                Remember These Points in Interviews:
              </span>
              <ul className="space-y-1.5 text-xs sm:text-sm text-slate-200">
                {analysis.refresher.remember_points.map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                    <span className="leading-relaxed">{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end">
            <button
              onClick={onTryAgain}
              className="px-4 py-2.5 rounded-xl bg-white text-violet-950 hover:bg-violet-50 active:scale-95 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Explain It Again (Retry 60s)</span>
            </button>
          </div>
        </div>
      )}

      {/* 3 Improvements & Strengths */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Exactly 3 Improvements */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <TrendingUp className="w-4 h-4" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              3 Things to Improve in Your Explanation
            </h3>
          </div>

          <div className="space-y-3">
            {analysis.improvements?.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-xs sm:text-sm text-slate-800 dark:text-slate-200"
              >
                <div className="w-5 h-5 rounded-full bg-rose-500 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              What Went Well
            </h3>
          </div>

          <div className="space-y-3">
            {analysis.strengths?.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-xs sm:text-sm text-slate-800 dark:text-slate-200"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Model College Student Spoken Answer */}
      {analysis.sample_answer && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-violet-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Model 60-Second Answer (Spoken Student Tone)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">Target oral structure</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-normal">
            {analysis.sample_answer.split(/(\[[^\]]+\])/).map((part, idx) => {
              if (part.startsWith('[') && part.endsWith(']')) {
                return (
                  <mark
                    key={idx}
                    className="bg-amber-200/80 dark:bg-amber-900/60 dark:text-amber-200 font-medium px-1 rounded mx-0.5"
                  >
                    {part.slice(1, -1)}
                  </mark>
                );
              }
              return part;
            })}
          </div>

          <p className="text-[11px] text-slate-400">
            Yellow highlighted brackets illustrate key phrasing transitions between Definition, Mechanism, Example, and Trade-off.
          </p>
        </div>
      )}

      {/* Chained Follow-up Round Card */}
      <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900 via-violet-950 to-slate-900 text-white p-4 sm:p-8 shadow-md border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/20 text-violet-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Interviewer Chained Follow-up (Round {chainCount} of 3)</span>
          </span>

          {topicData?.follow_up_question ? (
            <>
              <h3 className="text-base sm:text-xl font-bold tracking-tight">
                "{topicData.follow_up_question}"
              </h3>
              <p className="text-xs text-slate-300/80">
                Answer this deeper follow-up scenario in a linked 60-second response.
              </p>
            </>
          ) : (
            <>
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-200">
                {isMaxFollowUps ? 'All 3 Interview Follow-up Rounds Completed!' : 'Ready for the Next Interviewer Question?'}
              </h3>
              <p className="text-xs text-slate-400">
                {isMaxFollowUps
                  ? 'Great practice! You completed the full 3-round interview chain on this concept.'
                  : 'Click below to answer the interviewer follow-up.'}
              </p>
            </>
          )}
        </div>

        {!isMaxFollowUps && topicData?.follow_up_question ? (
          <button
            onClick={() => onStartFollowUp(topicData.follow_up_question)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-violet-500 hover:bg-violet-400 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-violet-500/20 transition-all shrink-0 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Answer Follow-up (60s)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : isMaxFollowUps ? (
          <span className="w-full sm:w-auto text-center px-4 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs font-mono shrink-0">
            Max 3 Rounds Finished
          </span>
        ) : null}
      </div>

      {/* Footer Navigation Actions */}
      <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <button
            onClick={onTryAgain}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Explain It Again</span>
          </button>

          <button
            onClick={onNewQuestion}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs sm:text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>Next Core Concept</span>
          </button>
        </div>

        <button
          onClick={onFinish}
          className="w-full sm:w-auto px-5 py-3 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center"
        >
          <span>View CS Mastery</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
