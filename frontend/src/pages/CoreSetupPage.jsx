import React, { useState } from 'react';
import { BookOpen, Sparkles, Sliders, ArrowRight, Check, Lightbulb, Compass, Award } from 'lucide-react';
import ErrorBanner from '../components/ErrorBanner';

export const CORE_SUBJECTS = [
  'Surprise Me',
  'Operating Systems',
  'DBMS and SQL',
  'Computer Networks',
  'Object-Oriented Programming',
  'Computer Architecture basics',
  'System Design basics',
  'Web, HTTP and APIs',
  'Security basics',
  'Software Engineering and SDLC',
  'Version Control (Git)',
];

const QUESTION_STYLES = [
  'Surprise Me',
  'Explain a concept',
  'Compare A vs B',
  '"What happens when..." walkthrough',
  'Real-world analogy',
  'Scenario / debugging',
  '"Why does this exist?"',
  'Trade-offs',
];

const DIFFICULTIES = [
  {
    id: 'Easy',
    label: 'Easy',
    desc: 'Foundational definitions, standard acronyms, basic paradigms.',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  },
  {
    id: 'Medium',
    label: 'Medium',
    desc: 'Underlying mechanisms, protocol handshakes, query execution, caching.',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  },
  {
    id: 'Hard',
    label: 'Hard',
    desc: 'Subtle race conditions, distributed CAP tradeoffs, kernel memory boundaries, lock-free primitives.',
    badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
  },
];

export default function CoreSetupPage({
  onGenerateQuestion,
  isLoading,
  error,
  onClearError,
  initialSubject = null,
}) {
  const [selectedSubject, setSelectedSubject] = useState(initialSubject || 'Operating Systems');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Medium');
  const [learningMode, setLearningMode] = useState('teach'); // 'teach' | 'test'

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerateQuestion({
      subject: selectedSubject,
      difficulty: selectedDifficulty,
      mode: learningMode,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-200">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 text-xs font-semibold mb-3">
          <BookOpen className="w-3.5 h-3.5" />
          <span>CS Core Fundamentals • Learn & Speak</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <span>Configure Your CS Core Speaking Drill</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Master computer science fundamentals by learning the core concept and explaining it out loud using a structured 4-part interview format.
        </p>
      </div>

      {/* 4-Part Structure Callout Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-violet-950 text-white border border-slate-800 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-violet-300 font-bold text-xs uppercase tracking-wider">
          <Award className="w-4 h-4" />
          <span>The 4-Part Interview Answer Structure</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Top engineering interviewers expect candidate explanations to follow a crisp structure:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
          <div className="p-2 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-violet-400 font-bold block uppercase">Part 1</span>
            <span className="font-semibold text-slate-100">Definition</span>
            <p className="text-[11px] text-slate-400 mt-0.5">What it is in 1 sentence</p>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-violet-400 font-bold block uppercase">Part 2</span>
            <span className="font-semibold text-slate-100">Mechanism</span>
            <p className="text-[11px] text-slate-400 mt-0.5">How it works internally</p>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-violet-400 font-bold block uppercase">Part 3</span>
            <span className="font-semibold text-slate-100">Example</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Real-world scenario / use</p>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-violet-400 font-bold block uppercase">Part 4</span>
            <span className="font-semibold text-slate-100">Trade-off</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Overhead or limitation</p>
          </div>
        </div>
      </div>

      <ErrorBanner message={error} onDismiss={onClearError} />

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Learning Mode Selection */}
        <div className="space-y-3">
          <label className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>Practice Mode</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setLearningMode('teach')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                learningMode === 'teach'
                  ? 'border-violet-600 bg-violet-50/50 dark:bg-violet-950/40 dark:border-violet-500 shadow-sm ring-1 ring-violet-500'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>📖 Teach me first</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 font-semibold">
                    Recommended
                  </span>
                </span>
                {learningMode === 'teach' && (
                  <div className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Gemini provides a beginner-friendly 150-200 word primer with a simple analogy before you speak. Great for refreshing before testing!
              </p>
            </div>

            <div
              onClick={() => setLearningMode('test')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                learningMode === 'test'
                  ? 'border-violet-600 bg-violet-50/50 dark:bg-violet-950/40 dark:border-violet-500 shadow-sm ring-1 ring-violet-500'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  ⚡ Test me directly
                </span>
                {learningMode === 'test' && (
                  <div className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Jump straight into the 10-second mental preparation and 60-second speaking drill without a primer.
              </p>
            </div>
          </div>
        </div>

        {/* Subject Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Compass className="w-4 h-4 text-violet-500" />
              <span>Core Subject Area</span>
            </label>
            <span className="text-xs text-slate-400">
              Selected: <strong className="text-slate-700 dark:text-slate-200">{selectedSubject}</strong>
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {CORE_SUBJECTS.map((subj) => {
              const isSelected = selectedSubject === subj;
              return (
                <button
                  type="button"
                  key={subj}
                  onClick={() => setSelectedSubject(subj)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-violet-600 bg-violet-600 text-white shadow-sm font-semibold'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {subj === 'Surprise Me' ? '🎲 Surprise Me' : subj}
                </button>
              );
            })}
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="space-y-3">
          <label className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <span>Difficulty Level</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DIFFICULTIES.map((d) => {
              const isSelected = selectedDifficulty === d.id;
              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDifficulty(d.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-violet-600 bg-violet-50/50 dark:bg-violet-950/40 dark:border-violet-500 shadow-sm ring-1 ring-violet-500'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${d.badge}`}>
                      {d.label}
                    </span>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {d.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-violet-600 hover:bg-violet-700 active:scale-98 disabled:opacity-50 text-white font-bold text-sm sm:text-base shadow-lg shadow-violet-600/20 transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin" />
                <span>Generating CS Concept from Gemini...</span>
              </>
            ) : (
              <>
                <BookOpen className="w-5 h-5" />
                <span>
                  {learningMode === 'teach'
                    ? 'Get Concept Primer & Begin Drill'
                    : 'Generate Question & Begin Drill'}
                </span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
