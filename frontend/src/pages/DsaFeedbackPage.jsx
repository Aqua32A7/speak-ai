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
  Code2,
  Terminal,
  Zap,
  Check,
  Flame,
} from 'lucide-react';
import ScoreBar from '../components/ScoreBar';
import FillerChart from '../components/FillerChart';
import VoiceFeedbackPlayer from '../components/VoiceFeedbackPlayer';

export default function DsaFeedbackPage({
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
    if (score >= 7.0) return 'from-indigo-600 to-violet-500 text-white';
    if (score >= 5.0) return 'from-amber-500 to-orange-500 text-white';
    return 'from-rose-600 to-pink-500 text-white';
  };

  const isMaxFollowUps = chainCount >= 3;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Workflow Step Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
        <span className="flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-emerald-600" />
          <span>DSA DRILL</span> ➔ <span>SPOKEN ANSWER</span> ➔ <strong className="underline underline-offset-4">DETAILED EVALUATION</strong>
        </span>
        <span className="text-[11px] font-mono">
          Round {chainCount} of 3 • {analysis.duration_seconds}s • {analysis.word_count} words
        </span>
      </div>

      {/* Hero Score Header */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center gap-6 sm:gap-8 justify-between">
        <div className="space-y-2 text-center sm:text-left">
          <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <Code2 className="w-3 h-3" />
              <span>{topicData?.subtopic || 'DSA Practice'}</span>
            </span>
            {topicData?.question_type && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                {topicData.question_type}
              </span>
            )}
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-medium border border-amber-200 dark:border-amber-800">
              Round {chainCount} of 3
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
            {topicData?.topic}
          </h2>

          {analysis.next_focus_area && (
            <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center sm:justify-start gap-1.5">
              <Flame className="w-4 h-4 shrink-0" />
              <span>DSA Focus Area: {analysis.next_focus_area}</span>
            </p>
          )}
        </div>

        {/* Big Overall Score Circle */}
        <div className="flex flex-col items-center shrink-0">
          <div className={`w-28 h-28 rounded-3xl bg-gradient-to-tr ${getScoreBadgeColor(analysis.overall_score)} flex flex-col items-center justify-center shadow-lg shadow-emerald-500/20`}>
            <span className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight">
              {analysis.overall_score.toFixed(1)}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-85">
              out of 10
            </span>
          </div>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-2">
            DSA Oral Mastery
          </span>
        </div>
      </div>

      {/* Voice Interviewer Spoken Feedback */}
      <VoiceFeedbackPlayer analysis={analysis} mode="dsa" />

      {/* 2-Column Grid: 6 DSA Evaluation Dimensions & Hesitation/Fillers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Core DSA Dimensions */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-500" />
            DSA Technical Dimensions
          </h3>

          <ScoreBar label="Concept Correctness" score={analysis.concept_correctness} description="Factual algorithmic accuracy and validity" />
          <ScoreBar label="Explanation Clarity" score={analysis.explanation_clarity} description="Simplicity and lucid communication of logic" />
          <ScoreBar label="Answer Structure" score={analysis.structure} description="Flow: Idea ➔ Approach ➔ Complexity ➔ Edge cases" />
          <ScoreBar label="Complexity Awareness" score={analysis.complexity_awareness} description="Clear time and space complexity articulation" />
          <ScoreBar label="Edge Case Awareness" score={analysis.edge_case_awareness} description="Handling null, bounds, duplicates, constraints" />
          <ScoreBar label="Fluency & Continuity" score={analysis.fluency_score} description="Continuous speech without excessive hesitation" />
        </div>

        {/* Delivery Hesitations & Fillers */}
        <div className="space-y-6">
          <FillerChart
            totalFillers={analysis.filler_words_count}
            breakdown={analysis.filler_words_breakdown}
            wpm={analysis.words_per_minute}
          />

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Pacing & Hesitations
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

      {/* Covered vs Missed Key Points Checklist */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-emerald-500" />
            Core Concepts Checklist
          </h3>
          <span className="text-xs text-slate-400">
            {analysis.covered_points?.length || 0} covered • {analysis.missed_points?.length || 0} missed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Covered */}
          <div className="p-4 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Points You Covered Well</span>
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
              <p className="text-xs text-slate-400 italic">None of the core expected points were articulated.</p>
            )}
          </div>

          {/* Missed */}
          <div className="p-4 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-amber-600" />
              <span>Points You Missed Or Omitted</span>
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
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Outstanding! You touched upon all essential points.</p>
            )}
          </div>
        </div>
      </div>

      {/* Misconceptions Callout (If Any) */}
      {analysis.misconceptions && analysis.misconceptions.length > 0 && (
        <div className="rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-5 shadow-sm space-y-2.5">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
            <AlertOctagon className="w-4 h-4" />
            <span>Misconceptions or Inaccuracies Flagged</span>
          </div>
          <p className="text-xs text-rose-900 dark:text-rose-300">
            Interviewers quickly notice subtle algorithmic errors. Review these corrections:
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

      {/* Realistic College Student Spoken Answer */}
      {analysis.sample_answer && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Model 60-Second Answer (Spoken Student Tone)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">Target oral delivery</span>
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
            Yellow bracketed expressions represent high-leverage phrases you can steal for your next technical interview.
          </p>
        </div>
      )}

      {/* Chained Follow-up Round Card */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-md border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/20 text-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Interviewer Chained Follow-up (Round {chainCount} of 3)</span>
          </span>

          {topicData?.follow_up_question ? (
            <>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight">
                "{topicData.follow_up_question}"
              </h3>
              <p className="text-xs text-slate-300/80">
                Real interviewers drill deeper based on what you said. Answer this follow-up in a linked 60-second response.
              </p>
            </>
          ) : (
            <>
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-200">
                {isMaxFollowUps ? 'All 3 Interview Follow-up Rounds Completed!' : 'Ready for the Next Interviewer Question?'}
              </h3>
              <p className="text-xs text-slate-400">
                {isMaxFollowUps
                  ? 'Great session! You completed the full 3-round interview chain on this topic.'
                  : 'Click below to answer the interviewer follow-up.'}
              </p>
            </>
          )}
        </div>

        {!isMaxFollowUps && topicData?.follow_up_question ? (
          <button
            onClick={() => onStartFollowUp(topicData.follow_up_question)}
            className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <span>Answer Follow-up (60s)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : isMaxFollowUps ? (
          <span className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs font-mono shrink-0">
            Max 3 Rounds Finished
          </span>
        ) : null}
      </div>

      {/* Footer Navigation Actions */}
      <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onTryAgain}
            className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again (Same Question)</span>
          </button>

          <button
            onClick={onNewQuestion}
            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-md transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Terminal className="w-4 h-4" />
            <span>Next DSA Question</span>
          </button>
        </div>

        <button
          onClick={onFinish}
          className="px-5 py-3 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold text-xs sm:text-sm transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <span>View DSA Progress</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
