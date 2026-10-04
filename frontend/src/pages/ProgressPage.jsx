import React, { useState } from 'react';
import {
  TrendingUp,
  Award,
  Clock,
  Zap,
  Target,
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  CheckCircle,
  MessageSquare,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import ScoreBar from '../components/ScoreBar';

export default function ProgressPage({ stats, readiness, sessions, onStartPractice }) {
  const [expandedSessionId, setExpandedSessionId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedSessionId((prev) => (prev === id ? null : id));
  };

  const formatSpeakingTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Your Progress & Interview Readiness
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track metrics across your 60-second drills, improve fluency, and eliminate verbal fillers.
          </p>
        </div>

        <button
          onClick={onStartPractice}
          className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>New 1-Minute Drill</span>
        </button>
      </div>

      {/* Aggregate Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Drills"
          value={stats.total_sessions}
          subtitle={`${stats.sessions_this_week} this week`}
          icon={Target}
          color="indigo"
        />

        <StatCard
          title="Average Score"
          value={stats.average_score ? `${stats.average_score}/10` : '—'}
          subtitle={`Best: ${stats.best_score || 0}/10`}
          icon={Award}
          color="emerald"
        />

        <StatCard
          title="Average Pace"
          value={stats.average_wpm ? `${stats.average_wpm} WPM` : '—'}
          subtitle="Target: 110-140 WPM"
          icon={Zap}
          color="amber"
        />

        <StatCard
          title="Speaking Time"
          value={formatSpeakingTime(stats.total_speaking_time_seconds)}
          subtitle={`Top filler: ${stats.most_common_filler}`}
          icon={Clock}
          color="violet"
        />
      </div>

      {/* Interview Readiness Section */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Interview Readiness Indicators
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Practice indicators derived from past sessions' scores, not scientifically validated.</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Readiness Index:</span>
            <span className="text-2xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
              {readiness.overall_readiness}%
            </span>
          </div>
        </div>

        {readiness.has_data ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ScoreBar
              label="Communication & Conciseness"
              score={readiness.communication}
              description="Clarity of structure, sentence boundaries, and natural phrasing"
            />
            <ScoreBar
              label="Technical Explanation Depth"
              score={readiness.technical_explanation}
              description="Accurate explanation of DSA, ML, and engineering trade-offs"
            />
            <ScoreBar
              label="Perceived Confidence"
              score={readiness.confidence}
              description="Authoritative tone, decisive conclusions, and minimal filler words"
            />
            <ScoreBar
              label="Fluency & Continuity"
              score={readiness.fluency}
              description="Steady pacing and minimal hesitation before answering"
            />
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 text-sm">
            Complete your first speaking drill to populate your Interview Readiness indicators.
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      {Object.keys(stats.category_breakdown || {}).length > 0 && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-base font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Category Performance
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(stats.category_breakdown).map(([cat, data]) => (
              <div
                key={cat}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1"
              >
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block truncate">
                  {cat}
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400">
                    {data.avg_score}/10
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {data.count} {data.count === 1 ? 'drill' : 'drills'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drill History List */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Past Practice Drills
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {sessions.length} recorded
          </span>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-3">
            <p className="text-sm font-medium">No speaking drills recorded yet.</p>
            <button
              onClick={onStartPractice}
              className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 transition-colors"
            >
              Start your first 60s drill
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => {
              const isExpanded = expandedSessionId === s.id;
              const dateStr = new Date(s.timestamp).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={s.id}
                  className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 overflow-hidden transition-all"
                >
                  {/* Summary Bar */}
                  <div
                    onClick={() => toggleExpand(s.id)}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          {s.category || 'General'}
                        </span>
                        {s.parent_session_id && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
                            Follow-up
                          </span>
                        )}
                        <span className="text-xs text-slate-400">{dateStr}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {s.topic}
                      </h4>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                      <div className="text-right">
                        <span className="text-lg font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                          {s.overall_score ? s.overall_score.toFixed(1) : '—'}
                        </span>
                        <span className="text-xs text-slate-400">/10</span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono hidden md:block">
                        {s.words_per_minute} WPM
                      </div>
                      <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="p-4 sm:p-6 border-t border-slate-200/50 dark:border-slate-800/60 bg-white dark:bg-slate-900/60 space-y-4 text-xs sm:text-sm animate-in fade-in duration-150">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Spoken Transcript ({s.duration_seconds}s)
                        </span>
                        <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                          "{s.transcript}"
                        </p>
                      </div>

                      {s.improvements && s.improvements.length > 0 && (
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500 block mb-1">
                            Recommendations
                          </span>
                          <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                            {s.improvements.map((imp, idx) => (
                              <li key={idx}>{imp}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {s.sample_answer && (
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-500 block mb-1">
                            Model Answer
                          </span>
                          <p className="p-3 rounded-xl bg-indigo-50/30 dark:bg-indigo-950/20 text-slate-700 dark:text-slate-300 leading-relaxed">
                            {s.sample_answer}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
