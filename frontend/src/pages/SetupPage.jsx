import React, { useState, useEffect } from 'react';
import { Sparkles, Layers, Sliders, ArrowRight, Check, FolderGit2, Info } from 'lucide-react';
import ErrorBanner from '../components/ErrorBanner';
import { getUserProjects } from '../services/storage';

const CATEGORIES = [
  { id: 'Random', label: 'Surprise Me', icon: '🎲' },
  { id: 'Interview', label: 'Interview', icon: '💼' },
  { id: 'Technical', label: 'Technical', icon: '⚙️' },
  { id: 'ML/AI', label: 'ML / AI', icon: '🤖' },
  { id: 'DSA', label: 'DSA & Algorithms', icon: '🧠' },
  { id: 'Projects', label: 'Projects', icon: '🚀' },
  { id: 'Behavioral', label: 'Behavioral', icon: '🤝' },
  { id: 'Career', label: 'Career', icon: '🎯' },
];

const DIFFICULTIES = [
  {
    id: 'Easy',
    label: 'Easy',
    desc: 'Introductory questions, general tech interest, and simple conversational prompts.',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  },
  {
    id: 'Medium',
    label: 'Medium',
    desc: 'Technical concepts, project challenges, teamwork stories, and behavioral scenarios.',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  },
  {
    id: 'Hard',
    label: 'Hard',
    desc: 'Deep algorithmic explanations, architectural trade-offs, scalability bottlenecks, and edge cases.',
    badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
  },
];

export default function SetupPage({ onGenerateTopic, isLoading, error, onClearError, onNavigateToProjects }) {
  const [selectedDifficulty, setSelectedDifficulty] = useState('Medium');
  const [selectedCategory, setSelectedCategory] = useState('Random');
  const [userProjects, setUserProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('generic');

  useEffect(() => {
    setUserProjects(getUserProjects());
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    let attachedBrief = null;
    if (selectedCategory === 'Projects' && selectedProjectId !== 'generic') {
      attachedBrief = userProjects.find((p) => p.id === selectedProjectId) || null;
    }

    onGenerateTopic({
      difficulty: selectedDifficulty,
      categoryFilter: selectedCategory,
      projectBrief: attachedBrief,
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-3">
          <Sliders className="w-3.5 h-3.5" />
          <span>Step 1: Choose Drill Parameters</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Configure Your Speaking Drill
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Every topic is dynamically crafted by Gemini AI based on your candidate profile and past sessions.
        </p>
      </div>

      <ErrorBanner message={error} onDismiss={onClearError} />

      <form onSubmit={handleSubmit} className="space-y-8">
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
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 dark:border-indigo-500 shadow-sm ring-1 ring-indigo-500'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${d.badge}`}>
                      {d.label}
                    </span>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
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

        {/* Category Selection */}
        <div className="space-y-3">
          <label className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <span>Category Filter</span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:border-indigo-500 text-indigo-700 dark:text-indigo-300 font-semibold shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span className="text-xs">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Project Picker if Category is Projects */}
        {selectedCategory === 'Projects' && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FolderGit2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Project Source
              </span>
              {onNavigateToProjects && (
                <button
                  type="button"
                  onClick={onNavigateToProjects}
                  className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-semibold"
                >
                  + Manage My Projects
                </button>
              )}
            </div>

            {userProjects.length > 0 ? (
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="generic">Generic Project Experience Questions</option>
                {userProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.tech_stack?.slice(0, 3).join(', ') || p.source})
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Info className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
                <span>
                  No saved projects found. Gemini will ask a generic project-experience question, or you can add your repo in <strong>My Projects</strong>.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 disabled:opacity-50 text-white font-bold text-sm sm:text-base shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin" />
                <span>Generating Fresh Topic from Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>Generate Topic & Begin Drill</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
