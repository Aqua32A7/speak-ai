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
  Code2,
  Terminal,
  AlertTriangle,
  Flame,
  BookOpen,
  FolderGit2,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import ScoreBar from '../components/ScoreBar';
import { CORE_SUBJECTS } from '../services/storage';

export default function ProgressPage({
  stats,
  readiness,
  sessions = [],
  dsaStats,
  coreStats,
  projectStats,
  onStartPractice,
  onStartDsaPractice,
  onStartCorePractice,
  onStartProjectPractice,
}) {
  const [expandedSessionId, setExpandedSessionId] = useState(null);
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all' | 'general' | 'dsa' | 'core' | 'project'

  const toggleExpand = (id) => {
    setExpandedSessionId((prev) => (prev === id ? null : id));
  };

  const formatSpeakingTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const filteredSessions = sessions.filter((s) => {
    if (historyFilter === 'general') return s.mode !== 'dsa' && s.mode !== 'core' && s.mode !== 'project';
    if (historyFilter === 'dsa') return s.mode === 'dsa';
    if (historyFilter === 'core') return s.mode === 'core';
    if (historyFilter === 'project') return s.mode === 'project';
    return true;
  });

  const totalDsa = dsaStats?.total_dsa || 0;
  const weakestSubtopics = dsaStats?.weakest_subtopics || [];

  const totalCore = coreStats?.total_core || 0;
  const weakestCoreSubtopics = coreStats?.weakest_subtopics || [];

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-10 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Your Progress & Interview Readiness
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track metrics across your 60-second drills, improve fluency, and eliminate verbal fillers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onStartPractice}
            className="flex-1 sm:flex-initial justify-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>General Drill</span>
          </button>

          <button
            onClick={onStartDsaPractice}
            className="flex-1 sm:flex-initial justify-center px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>DSA Drill</span>
          </button>

          <button
            onClick={onStartCorePractice}
            className="flex-1 sm:flex-initial justify-center px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>CS Core Drill</span>
          </button>

          <button
            onClick={onStartProjectPractice}
            className="flex-1 sm:flex-initial justify-center px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>Project Drill</span>
          </button>
        </div>
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

      {/* Dedicated DSA Speaking Mastery Section */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                DSA Speaking Mastery
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Track concept accuracy, oral algorithmic structure, and complexity explanation skills.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">DSA Drills:</span>
            <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {totalDsa}
            </span>
          </div>
        </div>

        {totalDsa > 0 ? (
          <div className="space-y-6">
            {/* 4 Mini Dimension Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                  Concept Accuracy
                </span>
                <span className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                  {dsaStats.avg_concept_score}/10
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                  Complexity
                </span>
                <span className="text-xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                  {dsaStats.avg_complexity_score}/10
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                  Answer Structure
                </span>
                <span className="text-xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
                  {dsaStats.avg_structure_score}/10
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                  Edge Case Recall
                </span>
                <span className="text-xl font-extrabold font-mono text-rose-600 dark:text-rose-400">
                  {dsaStats.avg_edge_case_score}/10
                </span>
              </div>
            </div>

            {/* Weakest Subtopics Alert Banner */}
            {weakestSubtopics.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-amber-900 dark:text-amber-200">
                    Recommended DSA Focus Areas
                  </div>
                  <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                    Based on your drills, your lowest scoring areas are{' '}
                    <strong className="underline">
                      {weakestSubtopics.map((w) => `${w.subtopic} (${w.avg_score}/10)`).join(', ')}
                    </strong>
                    . Practice these subtopics to turn them into strengths.
                  </p>
                </div>
              </div>
            )}

            {/* Subtopic Performance Grid */}
            {Object.keys(dsaStats.subtopic_stats || {}).length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Subtopic Performance Breakdown
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(dsaStats.subtopic_stats).map(([sub, data]) => (
                    <div
                      key={sub}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1"
                    >
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block truncate">
                        {sub}
                      </span>
                      <div className="flex items-baseline justify-between">
                        <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
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
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 space-y-3">
            <p className="text-sm">No DSA oral drills completed yet.</p>
            <button
              onClick={onStartDsaPractice}
              className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              Start your first DSA interview drill
            </button>
          </div>
        )}
      </div>

      {/* CS Fundamentals Mastery Section */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              <BookOpen className="w-4 h-4" />
              <span>CS Core Fundamentals Mastery</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              Spoken Computer Science Concepts
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Core Drills:</span>
            <span className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400">
              {totalCore}
            </span>
          </div>
        </div>

        {totalCore > 0 ? (
          <div className="space-y-6">
            {/* 3 Mini Dimension Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                  Concept Accuracy
                </span>
                <span className="text-xl font-extrabold font-mono text-purple-600 dark:text-purple-400">
                  {coreStats.avg_concept_accuracy}/10
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                  4-Part Structure
                </span>
                <span className="text-xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                  {coreStats.avg_structure_score}/10
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                  Technical Depth
                </span>
                <span className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                  {coreStats.avg_depth_score}/10
                </span>
              </div>
            </div>

            {/* Recommended Next Subject Banner */}
            {coreStats?.recommended_next_subject && (
              <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-bold text-purple-600 dark:text-purple-400 block">
                      Recommended Next Subject
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {coreStats.recommended_next_subject}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onStartCorePractice}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
                >
                  Practice {coreStats.recommended_next_subject}
                </button>
              </div>
            )}

            {/* Weakest Subtopics Alert Banner */}
            {weakestCoreSubtopics.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-amber-900 dark:text-amber-200">
                    CS Core Improvement Areas
                  </div>
                  <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                    Concepts with lower accuracy:{' '}
                    <strong className="underline">
                      {weakestCoreSubtopics.map((w) => `${w.subtopic} (${w.avg_accuracy}/10)`).join(', ')}
                    </strong>
                    . Focus on defining mechanisms clearly and stating trade-offs.
                  </p>
                </div>
              </div>
            )}

            {/* Subject Mastery Breakdown Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                10 Core Subjects Mastery Matrix
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CORE_SUBJECTS.map((subj) => {
                  const mastery = coreStats?.subject_mastery?.[subj];
                  const hasPracticed = Boolean(mastery && mastery.count > 0);
                  const accuracy = hasPracticed ? mastery.avg_accuracy : 0;
                  const count = hasPracticed ? mastery.count : 0;

                  return (
                    <div
                      key={subj}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">
                          {subj}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 shrink-0">
                          {hasPracticed ? `${count} ${count === 1 ? 'drill' : 'drills'}` : 'Not practiced'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              hasPracticed ? 'bg-purple-600 dark:bg-purple-500' : 'bg-transparent'
                            }`}
                            style={{ width: `${(accuracy / 10) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300 w-10 text-right">
                          {hasPracticed ? `${accuracy}/10` : '—'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 space-y-3">
            <p className="text-sm">No CS Core Fundamentals drills completed yet.</p>
            <button
              onClick={onStartCorePractice}
              className="px-4 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-semibold hover:bg-purple-100 transition-colors cursor-pointer"
            >
              Start your first CS Fundamentals drill
            </button>
          </div>
        )}
      </div>

      {/* Project Speaking Mastery Section */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              <FolderGit2 className="w-4 h-4" />
              <span>Project Speaking Mastery</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              Architecture & Ownership Drills
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Project Drills:</span>
            <span className="text-xl font-bold font-mono text-teal-600 dark:text-teal-400">
              {projectStats?.totalDrills || 0}
            </span>
          </div>
        </div>

        {(projectStats?.totalDrills || 0) > 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                  Avg Project Score
                </span>
                <span className="text-xl font-extrabold font-mono text-teal-600 dark:text-teal-400">
                  {projectStats.averageScore}/10
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                  Ownership & Agency
                </span>
                <span className="text-xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                  {projectStats.averageOwnership}/10
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                  Technical Depth
                </span>
                <span className="text-xl font-extrabold font-mono text-purple-600 dark:text-purple-400">
                  {projectStats.averageDepth}/10
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                  Explanation Clarity
                </span>
                <span className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                  {projectStats.averageClarity}/10
                </span>
              </div>
            </div>

            {projectStats.practicedProjects && projectStats.practicedProjects.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Practiced Projects
                </h3>
                <div className="flex flex-wrap gap-2">
                  {projectStats.practicedProjects.map((p, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-2"
                    >
                      <span className="text-slate-800 dark:text-slate-200">{p.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300">
                        {p.count} {p.count === 1 ? 'drill' : 'drills'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 space-y-3">
            <p className="text-sm">No project interview drills completed yet.</p>
            <button
              onClick={onStartProjectPractice}
              className="px-4 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-semibold hover:bg-teal-100 transition-colors cursor-pointer"
            >
              Start your first project drill
            </button>
          </div>
        )}
      </div>

      {/* Category Breakdown (General Drills) */}
      {Object.keys(stats.category_breakdown || {}).length > 0 && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-base font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            General Category Performance
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

      {/* Drill History List with Filters */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Past Practice Drills
          </h2>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
            <button
              onClick={() => setHistoryFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                historyFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({sessions.length})
            </button>
            <button
              onClick={() => setHistoryFilter('general')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                historyFilter === 'general'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              General ({sessions.filter((s) => s.mode !== 'dsa' && s.mode !== 'core').length})
            </button>
            <button
              onClick={() => setHistoryFilter('dsa')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                historyFilter === 'dsa'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              DSA Interview ({sessions.filter((s) => s.mode === 'dsa').length})
            </button>
            <button
              onClick={() => setHistoryFilter('core')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                historyFilter === 'core'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              CS Fundamentals ({sessions.filter((s) => s.mode === 'core').length})
            </button>
            <button
              onClick={() => setHistoryFilter('project')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                historyFilter === 'project'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Projects ({sessions.filter((s) => s.mode === 'project').length})
            </button>
          </div>
        </div>

        {filteredSessions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-3">
            <p className="text-sm font-medium">No speaking drills recorded for this filter.</p>
            <button
              onClick={
                historyFilter === 'project'
                  ? onStartProjectPractice
                  : historyFilter === 'core'
                  ? onStartCorePractice
                  : historyFilter === 'dsa'
                  ? onStartDsaPractice
                  : onStartPractice
              }
              className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              Start a new drill
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSessions.map((s) => {
              const isExpanded = expandedSessionId === s.id;
              const isDsa = s.mode === 'dsa';
              const isCore = s.mode === 'core';
              const isProject = s.mode === 'project';
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
                      <div className="flex flex-wrap items-center gap-2">
                        {isProject ? (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                            Project: {s.project_name || 'My Project'}
                          </span>
                        ) : isCore ? (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                            CS Core: {s.subject || 'Fundamentals'}
                          </span>
                        ) : isDsa ? (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                            DSA: {s.subtopic || 'General'}
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                            {s.category || 'General'}
                          </span>
                        )}

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
                        <span
                          className={`text-lg font-extrabold font-mono ${
                            isProject
                              ? 'text-teal-600 dark:text-teal-400'
                              : isCore
                              ? 'text-purple-600 dark:text-purple-400'
                              : isDsa
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-indigo-600 dark:text-indigo-400'
                          }`}
                        >
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
                      {isProject && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                              <span className="text-slate-400 block text-[10px]">Ownership & Agency</span>
                              <span className="font-bold text-teal-600 dark:text-teal-400">
                                {s.ownership_score || 0}/10
                              </span>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                              <span className="text-slate-400 block text-[10px]">Technical Depth</span>
                              <span className="font-bold text-purple-600 dark:text-purple-400">
                                {s.technical_depth_score || 0}/10
                              </span>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                              <span className="text-slate-400 block text-[10px]">Clarity & Structure</span>
                              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                {s.clarity_score || 0}/10
                              </span>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                              <span className="text-slate-400 block text-[10px]">Conciseness</span>
                              <span className="font-bold text-amber-600 dark:text-amber-400">
                                {s.conciseness_score || 0}/10
                              </span>
                            </div>
                          </div>
                          {s.ownership_feedback && (
                            <div className="p-3 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/40 text-xs">
                              <span className="font-bold text-teal-900 dark:text-teal-200 block mb-1">
                                Ownership Coaching:
                              </span>
                              <p className="text-teal-800 dark:text-teal-300 leading-relaxed">
                                {s.ownership_feedback}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {isCore && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                              <span className="text-slate-400 block text-[10px]">Concept Accuracy</span>
                              <span className="font-bold text-purple-600 dark:text-purple-400">
                                {s.concept_accuracy || 0}/10
                              </span>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                              <span className="text-slate-400 block text-[10px]">4-Part Structure</span>
                              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                {s.structure || 0}/10
                              </span>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                              <span className="text-slate-400 block text-[10px]">Technical Depth</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {s.depth || 0}/10
                              </span>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                              <span className="text-slate-400 block text-[10px]">Delivery & Clarity</span>
                              <span className="font-bold text-amber-600 dark:text-amber-400">
                                {s.clarity || 0}/10
                              </span>
                            </div>
                          </div>

                          {s.four_part_structure && (
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                                4-Part Structure Covered
                              </span>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                <span className={`inline-flex items-center gap-1 ${s.four_part_structure.definition_covered ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400 line-through'}`}>
                                  {s.four_part_structure.definition_covered ? '✓' : '✗'} 1. Definition
                                </span>
                                <span className={`inline-flex items-center gap-1 ${s.four_part_structure.mechanism_covered ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400 line-through'}`}>
                                  {s.four_part_structure.mechanism_covered ? '✓' : '✗'} 2. Mechanism
                                </span>
                                <span className={`inline-flex items-center gap-1 ${s.four_part_structure.example_covered ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400 line-through'}`}>
                                  {s.four_part_structure.example_covered ? '✓' : '✗'} 3. Example
                                </span>
                                <span className={`inline-flex items-center gap-1 ${s.four_part_structure.tradeoff_covered ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400 line-through'}`}>
                                  {s.four_part_structure.tradeoff_covered ? '✓' : '✗'} 4. Trade-off
                                </span>
                              </div>
                            </div>
                          )}

                          {s.gentle_misconceptions && s.gentle_misconceptions.length > 0 && (
                            <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs">
                              <span className="font-bold text-amber-900 dark:text-amber-200 block mb-1">
                                Misconceptions Corrected:
                              </span>
                              <ul className="list-disc list-inside space-y-0.5 text-amber-800 dark:text-amber-300">
                                {s.gentle_misconceptions.map((m, idx) => (
                                  <li key={idx}>{m}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {isDsa && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                            <span className="text-slate-400 block text-[10px]">Concept Score</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {s.concept_correctness || s.technical_depth_score || 0}/10
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                            <span className="text-slate-400 block text-[10px]">Complexity Score</span>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                              {s.complexity_awareness || 0}/10
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                            <span className="text-slate-400 block text-[10px]">Structure Score</span>
                            <span className="font-bold text-amber-600 dark:text-amber-400">
                              {s.structure || s.clarity_score || 0}/10
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                            <span className="text-slate-400 block text-[10px]">Edge Case Score</span>
                            <span className="font-bold text-rose-600 dark:text-rose-400">
                              {s.edge_case_awareness || 0}/10
                            </span>
                          </div>
                        </div>
                      )}

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

                      {s.refresher?.quick_explanation && (
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block mb-1">
                            Concept Refresher
                          </span>
                          <div className="p-3 rounded-xl bg-purple-50/30 dark:bg-purple-950/20 text-slate-700 dark:text-slate-300 space-y-2">
                            <p className="leading-relaxed">{s.refresher.quick_explanation}</p>
                            {s.refresher.key_takeaways?.length > 0 && (
                              <ul className="list-disc list-inside space-y-0.5 text-xs text-purple-700 dark:text-purple-300">
                                {s.refresher.key_takeaways.map((k, idx) => (
                                  <li key={idx}>{k}</li>
                                ))}
                              </ul>
                            )}
                          </div>
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
