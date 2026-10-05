import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  TrendingUp,
  RotateCcw,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Clock,
  Compass,
  Zap,
} from 'lucide-react';
import ScoreBar from '../components/ScoreBar';
import FillerChart from '../components/FillerChart';
import VoiceFeedbackPlayer from '../components/VoiceFeedbackPlayer';

export default function FeedbackPage({
  analysis,
  topicData,
  onTryAgain,
  onNewTopic,
  onStartFollowUp,
  onFinish,
}) {
  const [activeTab, setActiveTab] = useState('feedback'); // 'feedback' | 'sample' | 'transcript'

  if (!analysis) return null;

  const getScoreBadgeColor = (score) => {
    if (score >= 8.5) return 'from-emerald-600 to-teal-500 text-white';
    if (score >= 7.0) return 'from-indigo-600 to-violet-500 text-white';
    if (score >= 5.0) return 'from-amber-500 to-orange-500 text-white';
    return 'from-rose-600 to-pink-500 text-white';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Workflow Step Banner */}
      <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
        <span className="flex items-center gap-1.5">
          <span>TOPIC</span> ➔ <span>SPEAK</span> ➔ <strong className="underline underline-offset-4">FEEDBACK</strong> ➔ <span>IMPROVE</span>
        </span>
        <span className="text-[11px] font-mono">
          Duration: {analysis.duration_seconds}s • {analysis.word_count} words
        </span>
      </div>

      {/* Hero Score Header */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center gap-6 sm:gap-8 justify-between">
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <Zap className="w-3.5 h-3.5" />
            <span>Drill Evaluation</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {topicData?.topic}
          </h2>
          {analysis.next_focus_area && (
            <p className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 font-semibold flex items-center justify-center sm:justify-start gap-1.5">
              <Compass className="w-4 h-4 shrink-0" />
              <span>Next priority: {analysis.next_focus_area}</span>
            </p>
          )}
        </div>

        {/* Big Overall Score Circle */}
        <div className="flex flex-col items-center shrink-0">
          <div className={`w-28 h-28 rounded-3xl bg-gradient-to-tr ${getScoreBadgeColor(analysis.overall_score)} flex flex-col items-center justify-center shadow-lg shadow-indigo-500/20`}>
            <span className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight">
              {analysis.overall_score.toFixed(1)}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-85">
              out of 10
            </span>
          </div>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-2">
            Overall Score
          </span>
        </div>
      </div>

      {/* Voice Interviewer Spoken Feedback */}
      <VoiceFeedbackPlayer analysis={analysis} mode="general" />

      {/* 2-Column Grid: Score Dimensions & Filler Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Core Dimensions */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-500" />
            Evaluation Dimensions
          </h3>

          <ScoreBar label="Fluency & Continuity" score={analysis.fluency_score} description="Flow and rhythm without stuttering" />
          <ScoreBar label="Clarity & Structure" score={analysis.clarity_score} description="Logical explanation and concise sentences" />
          <ScoreBar label="Technical Depth" score={analysis.technical_depth_score} description="Accuracy in concepts, DSA, or system trade-offs" />
          <ScoreBar label="Topic Relevance" score={analysis.relevance_score} description="Direct response to the prompt" />
          <ScoreBar label="Perceived Confidence" score={analysis.confidence_score} description="Conviction and authoritative delivery" />
          <ScoreBar label="Spoken Grammar" score={analysis.grammar_score} description="Clean phrasing without clunky syntax" />
        </div>

        {/* Fillers & Pacing Chart */}
        <div className="space-y-6">
          <FillerChart
            totalFillers={analysis.filler_words_count}
            breakdown={analysis.filler_words_breakdown}
            wpm={analysis.words_per_minute}
          />

          {/* Pause and hesitation metrics */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Delivery Hesitation Metrics
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

      {/* 3 Things to Improve & Strengths */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Exactly 3 Improvements */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <TrendingUp className="w-4 h-4" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              3 Things to Improve
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

      {/* Better Phrases Upgrade Table */}
      {analysis.better_phrases && analysis.better_phrases.length > 0 && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Professional Phrase Upgrades
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {analysis.better_phrases.map((phrase, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2"
              >
                <div className="text-xs">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">Instead of:</span>
                  <span className="text-rose-600 dark:text-rose-400 font-medium italic">
                    "{phrase.original}"
                  </span>
                </div>
                <div className="text-xs pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">Try saying:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                    "{phrase.suggested}"
                  </span>
                </div>
                {phrase.reason && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Why: {phrase.reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Realistic College Student Sample Answer */}
      {analysis.sample_answer && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                How You Could Answer Better (Realistic 60s Model)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">Realistic student tone</span>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
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
            Highlighted expressions in yellow represent high-leverage phrases you can adopt in your next drill.
          </p>
        </div>
      )}

      {/* Follow-up Question Card */}
      {topicData?.follow_up_question && (
        <div className="rounded-3xl bg-gradient-to-r from-violet-900 to-indigo-900 text-white p-6 sm:p-8 shadow-md border border-violet-700/50 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/20 text-violet-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Interviewer Follow-up Question</span>
            </span>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight">
              "{topicData.follow_up_question}"
            </h3>
            <p className="text-xs text-violet-200/80">
              Simulate real interview dynamics by defending your technical choices in a linked 60-second response.
            </p>
          </div>

          <button
            onClick={() => onStartFollowUp(topicData.follow_up_question)}
            className="px-6 py-3.5 rounded-2xl bg-white text-violet-900 hover:bg-violet-50 active:scale-95 font-bold text-xs sm:text-sm shadow-lg transition-all shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <span>Answer Follow-up (60s)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Footer Navigation Actions */}
      <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onTryAgain}
            className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again (Same Topic)</span>
          </button>

          <button
            onClick={onNewTopic}
            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>New Topic</span>
          </button>
        </div>

        <button
          onClick={onFinish}
          className="px-5 py-3 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold text-xs sm:text-sm transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <span>View Progress Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
