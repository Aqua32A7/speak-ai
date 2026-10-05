import React, { useState } from 'react';
import {
  FolderGit2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Play,
  Award,
  Shield,
  Layers,
  ChevronDown,
  Volume2,
} from 'lucide-react';
import FillerChart from '../components/FillerChart';
import VoiceFeedbackPlayer from '../components/VoiceFeedbackPlayer';

export default function ProjectFeedbackPage({
  analysis,
  questionData,
  projectBrief,
  onStartFollowUp,
  onPracticeAgain,
  onDone,
  chainCount = 0,
  isLoadingFollowUp = false,
}) {
  const [showFullTranscript, setShowFullTranscript] = useState(false);

  if (!analysis) return null;

  const scoreColor = (val) => {
    if (val >= 8) return 'text-teal-600 dark:text-teal-400';
    if (val >= 6) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const scoreBarWidth = (val) => `${Math.min(Math.max((val / 10) * 100, 0), 100)}%`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      {/* Top Banner / Question Context */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50">
            <FolderGit2 className="w-3.5 h-3.5" />
            {projectBrief?.name || 'Project Drill'}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {questionData?.question_type || 'Architecture & Decisions'}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
            {questionData?.difficulty || 'Medium'}
          </span>
          {chainCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:purple-300 border border-purple-200 dark:border-purple-800">
              Round {chainCount + 1} of 3
            </span>
          )}
        </div>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
          "{questionData?.question || 'Interview Question'}"
        </h2>
      </div>

      {/* Voice Interviewer Spoken Feedback */}
      <div className="mb-6">
        <VoiceFeedbackPlayer analysis={analysis} mode="project" />
      </div>

      {/* Main Grid: Overall Score & Dimensions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Overall Score Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-lg flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-teal-400 mb-1">
              Overall Performance
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tight">
                {analysis.overall_score?.toFixed(1) || '0.0'}
              </span>
              <span className="text-sm font-semibold text-slate-400">/ 10</span>
            </div>
            <p className="text-xs text-slate-300 mt-2">
              Calibrated on technical accuracy, personal engineering ownership, and delivery.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Next Priority Focus
            </div>
            <div className="text-xs font-medium text-teal-300">
              {analysis.next_focus_area || 'Keep practicing concrete metric specifics.'}
            </div>
          </div>
        </div>

        {/* 5 Core Dimension Scores */}
        <div className="md:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
            Evaluation Dimensions
          </h3>
          <div className="space-y-3.5">
            {[
              {
                label: 'Ownership & Personal Agency',
                value: analysis.ownership_score || 0,
                desc: 'Active ("I built / I chose") vs passive/vague ("we kind of")',
              },
              {
                label: 'Technical Depth',
                value: analysis.technical_depth || 0,
                desc: 'Internal mechanics, data flow, and architecture accuracy',
              },
              {
                label: 'Concrete Details & Specifics',
                value: analysis.concrete_details_score || 0,
                desc: 'Naming real libraries, file paths, numbers, and trade-offs',
              },
              {
                label: 'Explanation Clarity',
                value: analysis.clarity_score || 0,
                desc: 'Structured logical reasoning without hand-waving',
              },
              {
                label: 'Verbal Fluency',
                value: analysis.fluency || 0,
                desc: 'Natural flow, steady cadence, minimal hesitation',
              },
            ].map((dim, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {dim.label}
                  </span>
                  <span className={`font-bold ${scoreColor(dim.value)}`}>
                    {dim.value.toFixed(1)} / 10
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-indigo-600 transition-all duration-700"
                    style={{ width: scoreBarWidth(dim.value) }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{dim.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ownership & Agency Advice Callout */}
      {analysis.ownership_feedback && (
        <div className="mb-6 p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-200 mb-1">
                Interviewer Perspective on Your Ownership
              </h4>
              <p className="text-xs text-indigo-900/90 dark:text-indigo-300 leading-relaxed">
                {analysis.ownership_feedback}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Key Points Checklist (Covered vs Missed) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          Key Points Evaluation Checklist
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Covered */}
          <div className="p-4 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/40">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-800 dark:text-teal-300 mb-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              Points You Covered ({analysis.covered_points?.length || 0})
            </div>
            {analysis.covered_points && analysis.covered_points.length > 0 ? (
              <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                {analysis.covered_points.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-teal-500 font-bold">✓</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400 italic">None specifically covered.</p>
            )}
          </div>

          {/* Missed */}
          <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300 mb-2">
              <XCircle className="w-4 h-4 text-amber-600" />
              Points You Omitted or Missed ({analysis.missed_points?.length || 0})
            </div>
            {analysis.missed_points && analysis.missed_points.length > 0 ? (
              <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                {analysis.missed_points.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">✗</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400 italic">Great job! All key points covered.</p>
            )}
          </div>
        </div>
      </div>

      {/* 3 Actionable Improvements & Strengths */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            3 Actionable Improvements
          </h3>
          <ul className="space-y-2.5">
            {(analysis.improvements || []).map((imp, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-teal-500" />
            What You Did Well
          </h3>
          <ul className="space-y-2.5">
            {(analysis.strengths || []).map((str, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                <span className="text-teal-500 font-bold mt-0.5">✓</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Model Sample Answer */}
      {analysis.sample_answer && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            <Sparkles className="w-4 h-4" />
            Model 60-Second Spoken Answer
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
            {analysis.sample_answer.split(/(\[[^\]]+\])/g).map((chunk, idx) => {
              if (chunk.startsWith('[') && chunk.endsWith(']')) {
                return (
                  <mark
                    key={idx}
                    className="bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 px-1 py-0.5 rounded font-semibold"
                  >
                    {chunk.slice(1, -1)}
                  </mark>
                );
              }
              return chunk;
            })}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Highlighted phrases illustrate strong ownership and clear architectural terminology.
          </p>
        </div>
      )}

      {/* Delivery Metrics & Filler Chart */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
          Delivery & Speaking Metrics
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center">
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {analysis.words_per_minute || 0}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Pace (WPM)</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center">
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {analysis.word_count || 0}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Words Spoken</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center">
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {analysis.filler_words_count || 0}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Filler Words</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center">
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {analysis.longest_pause_seconds?.toFixed(1) || '0.0'}s
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Longest Pause</div>
          </div>
        </div>

        {analysis.filler_words_breakdown && Object.keys(analysis.filler_words_breakdown).length > 0 && (
          <FillerChart breakdown={analysis.filler_words_breakdown} />
        )}
      </div>

      {/* Chained Follow-Up Section (Up to 3 rounds) */}
      {chainCount < 3 && questionData?.follow_up_question && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-xl mb-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-400 mb-2">
            <RotateCcw className="w-4 h-4" />
            Interviewer Follow-Up Drill (Round {chainCount + 2} of 3)
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            "{questionData.follow_up_question}"
          </h3>
          <p className="text-xs text-slate-300 mb-5">
            Senior interviewers immediately probe failure cases and testing. Answer this follow-up in a fresh 60-second drill!
          </p>

          <button
            onClick={() => onStartFollowUp(questionData.follow_up_question)}
            disabled={isLoadingFollowUp}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold text-xs shadow-md transition active:scale-95 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            Answer Follow-Up Question
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={onPracticeAgain}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold"
        >
          <RotateCcw className="w-4 h-4" />
          Practice Another Project Angle
        </button>

        <button
          onClick={onDone}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition active:scale-95"
        >
          Done & View Home
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
