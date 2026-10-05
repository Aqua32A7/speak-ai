import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  Sparkles,
  Play,
  Layers,
  ChevronDown,
  ArrowRight,
  Plus,
  HelpCircle,
  ShieldCheck,
  User,
} from 'lucide-react';
import { getUserProjects, getUserProfile } from '../services/storage';

export const PROJECT_ANGLES = [
  'Why you chose this tech',
  'Architecture decisions',
  'A hard bug and how you fixed it',
  'Trade-offs',
  'Scaling & Performance',
  'Testing & Reliability',
  'Teamwork & Collaboration',
  "What you'd improve",
  'Explain a feature end to end',
];

export default function ProjectSetupPage({
  onStartDrill,
  initialProject = null,
  onNavigateToProjects,
}) {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProject?.id || '');
  const [selectedAngle, setSelectedAngle] = useState('Surprise Me');
  const [difficulty, setDifficulty] = useState('Medium');
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const list = getUserProjects();
    setProjects(list);
    setProfile(getUserProfile());

    if (initialProject && initialProject.id) {
      setSelectedProjectId(initialProject.id);
    } else if (list.length > 0 && !selectedProjectId) {
      setSelectedProjectId(list[0].id);
    }
  }, [initialProject]);

  const activeProject =
    selectedProjectId === 'random'
      ? projects[Math.floor(Math.random() * projects.length)]
      : projects.find((p) => p.id === selectedProjectId) || projects[0];

  const handleStart = (e) => {
    e.preventDefault();
    if (!activeProject) return;

    setIsLoading(true);
    onStartDrill({
      project: activeProject,
      difficulty,
      questionType: selectedAngle,
    });
  };

  if (projects.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-4">
          <FolderGit2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Add a Project First
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Project Interview Mode asks questions grounded in the actual codebase or architecture of your projects. Add a public GitHub repository or fill in your project highlights first!
        </p>
        <button
          onClick={onNavigateToProjects}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 shadow-md transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add Your First Project
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50 mb-3">
          <FolderGit2 className="w-3.5 h-3.5" />
          <span>Project Speaking Drill</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Project Interview Practice
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          Practice speaking about system design, hard engineering bugs, and technical trade-offs from your real projects.
        </p>
      </div>

      {/* Dynamic Calibration Card */}
      <div className="mb-6 p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2.5">
          <User className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
          <span>
            Candidate Calibration:{' '}
            <strong className="text-slate-900 dark:text-slate-200">
              {profile?.target_role || profile?.experience_level || 'General Candidate'}
            </strong>
            {profile?.english_level ? ` • ${profile.english_level} English` : ''}
          </span>
        </div>
        <button
          onClick={onNavigateToProjects}
          className="text-teal-600 dark:text-teal-400 font-semibold hover:underline text-left sm:text-right"
        >
          Manage Projects
        </button>
      </div>

      <form onSubmit={handleStart} className="space-y-6">
        {/* Project Selector */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            Select Project
          </label>
          <div className="space-y-2.5">
            {projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => setSelectedProjectId(proj.id)}
                className={`flex items-start justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                  selectedProjectId === proj.id
                    ? 'bg-teal-50/60 dark:bg-teal-950/30 border-teal-500 dark:border-teal-500 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {proj.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {proj.summary}
                  </div>
                  {proj.tech_stack && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {proj.tech_stack.slice(0, 4).map((tech, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                    selectedProjectId === proj.id
                      ? 'border-teal-600 bg-teal-600 text-white'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {selectedProjectId === proj.id && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </div>
            ))}

            {projects.length > 1 && (
              <div
                onClick={() => setSelectedProjectId('random')}
                className={`p-3 rounded-xl border cursor-pointer text-xs font-semibold text-center transition ${
                  selectedProjectId === 'random'
                    ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-700 dark:text-teal-300'
                    : 'border-dashed border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                🎲 Pick one project for me at random
              </div>
            )}
          </div>
        </div>

        {/* Question Angle Selector */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            Interview Angle / Focus
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSelectedAngle('Surprise Me')}
              className={`py-2 px-3 text-left text-xs font-semibold rounded-xl border transition ${
                selectedAngle === 'Surprise Me'
                  ? 'bg-teal-50 dark:bg-teal-900/40 border-teal-500 text-teal-700 dark:text-teal-300 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              🎲 Surprise Me (Any Angle)
            </button>
            {PROJECT_ANGLES.map((angle) => (
              <button
                type="button"
                key={angle}
                onClick={() => setSelectedAngle(angle)}
                className={`py-2 px-3 text-left text-xs font-semibold rounded-xl border transition ${
                  selectedAngle === angle
                    ? 'bg-teal-50 dark:bg-teal-900/40 border-teal-500 text-teal-700 dark:text-teal-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {angle}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Selector */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            Difficulty Level
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'Easy', label: 'Easy', desc: 'Feature walkthrough & basic tools' },
              { id: 'Medium', label: 'Medium', desc: 'Architecture & technical choices' },
              { id: 'Hard', label: 'Hard', desc: 'Edge cases, scaling & bottlenecks' },
            ].map((d) => (
              <button
                type="button"
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                className={`p-3 text-left rounded-xl border transition ${
                  difficulty === d.id
                    ? 'bg-teal-50 dark:bg-teal-900/40 border-teal-500 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div
                  className={`text-xs font-bold ${
                    difficulty === d.id
                      ? 'text-teal-700 dark:text-teal-300'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {d.label}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {d.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <button
          type="submit"
          disabled={isLoading || !activeProject}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 shadow-lg shadow-teal-500/20 disabled:opacity-50 transition active:scale-[0.98]"
        >
          {isLoading ? (
            'Preparing Question...'
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              Start 60-Second Drill on {activeProject?.name || 'Project'}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
