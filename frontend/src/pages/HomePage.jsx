import React from 'react';
import { Play, Sparkles, Clock, Target, Award, ArrowRight, CheckCircle2, Code2, Terminal, BookOpen, Compass, FolderGit2 } from 'lucide-react';
import StatCard from '../components/StatCard';

export default function HomePage({
  stats,
  onStartPractice,
  onStartDsaPractice,
  onStartCorePractice,
  onStartProjectPractice,
  onViewProjects,
  onViewJourney,
  onViewProgress,
}) {
  const today = stats?.today_stats || {
    sessions_completed: 0,
    avg_speaking_time: 0,
    avg_score: 0,
    topics_practiced: 0,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12 animate-fade-in">
      {/* Hero section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white p-8 sm:p-12 shadow-xl border border-indigo-700/40">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-80 h-80 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-indigo-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Spoken Technical Interview Preparation</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            SpeakPrep AI
          </h1>

          <p className="text-base sm:text-xl text-indigo-100/90 font-normal leading-relaxed">
            Practice speaking. Build confidence. Get interview-ready.
            Master technical explanations, DSA intuition, project architecture, and CS fundamentals through structured 60-second drills with real-time Gemini AI coaching.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onStartPractice}
              className="px-5 py-3 rounded-2xl bg-white text-indigo-900 font-bold text-sm shadow-lg hover:bg-indigo-50 active:scale-95 transition-all flex items-center gap-2 group cursor-pointer"
            >
              <Play className="w-4 h-4 fill-indigo-900 group-hover:scale-110 transition-transform" />
              <span>General Practice</span>
            </button>

            <button
              onClick={onStartProjectPractice}
              className="px-5 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 active:scale-95 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <FolderGit2 className="w-4 h-4" />
              <span>Project Interview</span>
            </button>

            <button
              onClick={onStartDsaPractice}
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Code2 className="w-4 h-4 stroke-[2.5]" />
              <span>DSA Interview</span>
            </button>

            <button
              onClick={onStartCorePractice}
              className="px-5 py-3 rounded-2xl bg-purple-500 hover:bg-purple-400 active:scale-95 text-white font-bold text-sm shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 stroke-[2.5]" />
              <span>CS Core</span>
            </button>

            <button
              onClick={onViewProgress}
              className="px-4 py-3 rounded-2xl bg-indigo-950/60 hover:bg-indigo-950/90 text-white font-semibold text-sm border border-indigo-400/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Readiness</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Feature Grid: Projects + DSA + CS Core */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Project Interview Spotlight Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950 text-white p-6 border border-teal-500/30 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold">
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>PROJECT INTERVIEW</span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-white">
              Defend Your Architecture
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Connect a GitHub repo or describe your project. Practice explaining tech choices, hard bugs, trade-offs, and personal ownership.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] text-slate-300">
              <span className="px-2 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700">GitHub Import</span>
              <span className="px-2 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700">Ownership Scoring</span>
              <span className="px-2 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700">Chained Follow-ups</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={onStartProjectPractice}
              className="flex-1 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 active:scale-95 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Drill Project</span>
            </button>
            <button
              onClick={onViewProjects}
              className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Manage</span>
            </button>
          </div>
        </div>

        {/* DSA Interview Mode Spotlight Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white p-6 border border-emerald-500/30 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <Terminal className="w-3.5 h-3.5" />
              <span>DSA INTERVIEW</span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-white">
              Explain Algorithms Out Loud
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Practice oral intuition, complexities, and trade-offs across 14 subtopics conditioned on your LeetCode/Codeforces journey.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] text-slate-300">
              <span className="px-2 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700">14 Topics</span>
              <span className="px-2 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700">Key Points Checklist</span>
              <span className="px-2 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700">Journey-Driven</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={onStartDsaPractice}
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Drill DSA</span>
            </button>
            <button
              onClick={onViewJourney}
              className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>Journey</span>
            </button>
          </div>
        </div>

        {/* CS Core Fundamentals Mode Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-purple-950 text-white p-6 border border-purple-500/30 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>CS FUNDAMENTALS</span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-white">
              4-Part Spoken Structure
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Master OS, DBMS, Networks, OOP, System Design, and more. Test yourself or learn first with dynamic primers before speaking.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] text-slate-300">
              <span className="px-2 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700">10 Subjects</span>
              <span className="px-2 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700">Teach vs Test</span>
              <span className="px-2 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700">Concept Refresher</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={onStartCorePractice}
              className="w-full px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Drill CS Core</span>
            </button>
          </div>
        </div>
      </div>

      {/* Today's Stats Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-500" />
            Today's Practice Stats
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Drills Completed"
            value={today.sessions_completed}
            subtitle={today.sessions_completed === 1 ? '1 session today' : `${today.sessions_completed} sessions today`}
            icon={Target}
            color="indigo"
          />

          <StatCard
            title="Avg Speaking Time"
            value={today.avg_speaking_time ? `${today.avg_speaking_time}s` : '0s'}
            subtitle="Target: 60s per drill"
            icon={Clock}
            color="emerald"
          />

          <StatCard
            title="Today's Avg Score"
            value={today.avg_score ? `${today.avg_score}/10` : '—'}
            subtitle={stats.best_score ? `All-time best: ${stats.best_score}/10` : 'No scores yet'}
            icon={Award}
            color="amber"
          />

          <StatCard
            title="Topics Practiced"
            value={today.topics_practiced}
            subtitle="Fresh Gemini prompts"
            icon={Sparkles}
            color="violet"
          />
        </div>
      </div>

      {/* How it works 4-step workflow */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="text-base font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-xs">
            How The 60-Second Drill Works
          </h3>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            Structured Practice Flow
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs">
              1
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Dynamic AI Topic</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Gemini generates a tailored prompt based on your candidate profile and difficulty without repeats.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center text-xs">
              2
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">10s Mental Preparation</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Drift-proof countdown timer lets you formulate your opening and organize your key points.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 font-bold flex items-center justify-center text-xs">
              3
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">60s Live Speech Drill</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Speak into your mic. The browser transcribes your speech live and tracks pauses and WPM.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-xs">
              4
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">AI Coach Feedback</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Receive 7-dimension scores, filler breakdown, 3 actionable improvements, and realistic sample answers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
