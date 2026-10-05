import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  Plus,
  FileText,
  Trash2,
  Edit3,
  Play,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Layers,
  ArrowRight,
  Loader2,
  X,
  Save,
} from 'lucide-react';

function GithubIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
    </svg>
  );
}
import {
  getUserProjects,
  saveUserProject,
  updateUserProject,
  deleteUserProject,
} from '../services/storage';
import { analyzeProjectRepoOrManual } from '../services/api';

export default function ProjectsPage({ onStartProjectInterview }) {
  const [projects, setProjects] = useState([]);
  const [modalMode, setModalMode] = useState(null); // 'github' | 'manual' | 'edit' | null
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState(null);

  // GitHub input
  const [githubUrl, setGithubUrl] = useState('');

  // Manual inputs
  const [manualName, setManualName] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualTechStack, setManualTechStack] = useState('');
  const [manualWhatBuilt, setManualWhatBuilt] = useState('');
  const [manualChallenges, setManualChallenges] = useState('');
  const [manualResults, setManualResults] = useState('');

  // Review & Edit Brief state (shown after analysis or when editing)
  const [editingBrief, setEditingBrief] = useState(null);
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  useEffect(() => {
    setProjects(getUserProjects());
  }, []);

  const openGithubModal = () => {
    setGithubUrl('');
    setAnalyzeError(null);
    setModalMode('github');
  };

  const openManualModal = () => {
    setManualName('');
    setManualDescription('');
    setManualTechStack('');
    setManualWhatBuilt('');
    setManualChallenges('');
    setManualResults('');
    setAnalyzeError(null);
    setModalMode('manual');
  };

  const closeModal = () => {
    setModalMode(null);
    setIsAnalyzing(false);
    setAnalyzeError(null);
  };

  const handleAnalyzeGithub = async (e) => {
    e.preventDefault();
    if (!githubUrl.trim()) return;

    setIsAnalyzing(true);
    setAnalyzeError(null);

    try {
      const brief = await analyzeProjectRepoOrManual({
        github_url: githubUrl.trim(),
      });
      // Open review & edit screen
      setEditingBrief({
        ...brief,
        tech_stack_str: (brief.tech_stack || []).join(', '),
        key_features_str: (brief.key_features || []).join('\n'),
        notable_challenges_str: (brief.notable_challenges || []).join('\n'),
        likely_angles_str: (brief.likely_interview_angles || []).join('\n'),
      });
      setIsEditingExisting(false);
      setModalMode('edit');
    } catch (err) {
      setAnalyzeError(err.message || 'Failed to analyze GitHub repository.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeManual = async (e) => {
    e.preventDefault();
    if (!manualName.trim() || !manualDescription.trim()) {
      setAnalyzeError('Project Name and Description are required.');
      return;
    }

    setIsAnalyzing(true);
    setAnalyzeError(null);

    try {
      const brief = await analyzeProjectRepoOrManual({
        manual_details: {
          name: manualName.trim(),
          description: manualDescription.trim(),
          tech_stack: manualTechStack.trim(),
          what_user_built: manualWhatBuilt.trim(),
          challenges_faced: manualChallenges.trim(),
          results_impact: manualResults.trim(),
        },
      });
      setEditingBrief({
        ...brief,
        tech_stack_str: (brief.tech_stack || []).join(', '),
        key_features_str: (brief.key_features || []).join('\n'),
        notable_challenges_str: (brief.notable_challenges || []).join('\n'),
        likely_angles_str: (brief.likely_interview_angles || []).join('\n'),
      });
      setIsEditingExisting(false);
      setModalMode('edit');
    } catch (err) {
      setAnalyzeError(err.message || 'Failed to analyze project details.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOpenEdit = (project) => {
    setEditingBrief({
      ...project,
      tech_stack_str: (project.tech_stack || []).join(', '),
      key_features_str: (project.key_features || []).join('\n'),
      notable_challenges_str: (project.notable_challenges || []).join('\n'),
      likely_angles_str: (project.likely_interview_angles || []).join('\n'),
    });
    setIsEditingExisting(true);
    setModalMode('edit');
  };

  const handleSaveBrief = () => {
    if (!editingBrief) return;

    const parsedBrief = {
      ...editingBrief,
      tech_stack: (editingBrief.tech_stack_str || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      key_features: (editingBrief.key_features_str || '')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      notable_challenges: (editingBrief.notable_challenges_str || '')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      likely_interview_angles: (editingBrief.likely_angles_str || '')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    // Remove helper string keys
    delete parsedBrief.tech_stack_str;
    delete parsedBrief.key_features_str;
    delete parsedBrief.notable_challenges_str;
    delete parsedBrief.likely_angles_str;

    if (isEditingExisting && editingBrief.id) {
      updateUserProject(editingBrief.id, parsedBrief);
    } else {
      saveUserProject(parsedBrief);
    }

    setProjects(getUserProjects());
    setModalMode(null);
    setEditingBrief(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this project brief? This will not delete your past practice sessions.')) {
      deleteUserProject(id);
      setProjects(getUserProjects());
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50 mb-3">
            <FolderGit2 className="w-3.5 h-3.5" />
            My Projects Portfolio
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My Technical Projects
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Connect public GitHub repositories or enter project highlights to practice real-world architecture drills.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openGithubModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold shadow-sm transition active:scale-95"
          >
            <GithubIcon className="w-4 h-4" />
            + Add via GitHub
          </button>
          <button
            onClick={openManualModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition active:scale-95"
          >
            <FileText className="w-4 h-4" />
            + Add Manually
          </button>
        </div>
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-4">
            <FolderGit2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            No projects added yet
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            Paste a public GitHub repository link or describe your project manually. Gemini will summarize it into an interview brief to test your technical choices and architectural ownership.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={openGithubModal}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 hover:bg-black rounded-lg transition"
            >
              <GithubIcon className="w-4 h-4" />
              Analyze GitHub Repo
            </button>
            <button
              onClick={openManualModal}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition"
            >
              <FileText className="w-4 h-4" />
              Fill In Manually
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="flex flex-col justify-between p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-500/50 dark:hover:border-teal-500/50 transition group"
            >
              <div>
                {/* Badge & Title */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${
                        proj.source === 'github'
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          : 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                      }`}
                    >
                      {proj.source === 'github' ? 'GitHub Repo' : 'Self-Reported'}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition">
                      {proj.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(proj)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Edit Brief"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(proj.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Summary */}
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                  {proj.summary}
                </p>

                {/* Tech Stack Pills */}
                {proj.tech_stack && proj.tech_stack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {proj.tech_stack.slice(0, 6).map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        {tech}
                      </span>
                    ))}
                    {proj.tech_stack.length > 6 && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-400">
                        +{proj.tech_stack.length - 6} more
                      </span>
                    )}
                  </div>
                )}

                {/* Architecture & Ownership Preview */}
                <div className="space-y-2 mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400">
                  {proj.what_user_built && (
                    <div>
                      <strong className="text-slate-900 dark:text-slate-200">What you built:</strong>{' '}
                      <span className="line-clamp-2">{proj.what_user_built}</span>
                    </div>
                  )}
                  {proj.likely_interview_angles && proj.likely_interview_angles.length > 0 && (
                    <div>
                      <strong className="text-slate-900 dark:text-slate-200">Interview angle:</strong>{' '}
                      <span className="text-teal-600 dark:text-teal-400">{proj.likely_interview_angles[0]}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Start Interview CTA */}
              <button
                onClick={() => onStartProjectInterview(proj)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 shadow-sm transition active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Start Interview Drill on This Project
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add via GitHub */}
      {modalMode === 'github' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <GithubIcon className="w-5 h-5 text-slate-900 dark:text-white" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Add Project from GitHub
                </h3>
              </div>
              <button
                onClick={closeModal}
                disabled={isAnalyzing}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Paste the link to any <strong>public</strong> GitHub repository. SpeakPrep AI will fetch metadata, README, and key manifests to construct your project interview brief.
            </p>

            {analyzeError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                <div>
                  <p>{analyzeError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      closeModal();
                      openManualModal();
                    }}
                    className="mt-1 font-semibold underline hover:text-rose-900 dark:hover:text-rose-200"
                  >
                    Switch to manual project entry instead →
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleAnalyzeGithub}>
              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  GitHub Repository URL
                </label>
                <input
                  type="text"
                  placeholder="https://github.com/username/repository"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  disabled={isAnalyzing}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isAnalyzing}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAnalyzing || !githubUrl.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 shadow-md transition"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing Repo...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Brief
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Manually */}
      {modalMode === 'manual' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Add Project Details Manually
                </h3>
              </div>
              <button
                onClick={closeModal}
                disabled={isAnalyzing}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Describe your project below. Gemini will structure it into an interview brief with likely discussion angles.
            </p>

            {analyzeError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center gap-2 text-xs text-rose-800 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{analyzeError}</span>
              </div>
            )}

            <form onSubmit={handleAnalyzeManual} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Distributed Task Queue"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Project Description & Problem Solved *
                </label>
                <textarea
                  rows={3}
                  placeholder="What does the project do and why was it built?"
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tech Stack (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Go, Redis, Docker, PostgreSQL"
                  value={manualTechStack}
                  onChange={(e) => setManualTechStack(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  What Did You Personally Build?
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Built the worker pool and heartbeat monitoring system"
                  value={manualWhatBuilt}
                  onChange={(e) => setManualWhatBuilt(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notable Challenges / Bugs Solved
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Race condition during task worker timeout reassignments"
                  value={manualChallenges}
                  onChange={(e) => setManualChallenges(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isAnalyzing}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 shadow-md transition"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating Brief...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Brief
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Review & Edit Project Brief */}
      {modalMode === 'edit' && editingBrief && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {isEditingExisting ? 'Edit Project Brief' : 'Review & Confirm Project Brief'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Review the extracted details before saving. You can edit any field.
                </p>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MANDATORY WARNING NOTE */}
            <div className="mb-6 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <strong>Check this summary:</strong> Your interview questions will be based on it. Ensure the tech stack, what you built, and key features reflect what you want to practice.
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={editingBrief.name || ''}
                  onChange={(e) => setEditingBrief({ ...editingBrief, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Project Summary
                </label>
                <textarea
                  rows={3}
                  value={editingBrief.summary || ''}
                  onChange={(e) => setEditingBrief({ ...editingBrief, summary: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tech Stack (comma-separated)
                </label>
                <input
                  type="text"
                  value={editingBrief.tech_stack_str || ''}
                  onChange={(e) => setEditingBrief({ ...editingBrief, tech_stack_str: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  What You Personally Built
                </label>
                <textarea
                  rows={2}
                  value={editingBrief.what_user_built || ''}
                  onChange={(e) => setEditingBrief({ ...editingBrief, what_user_built: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Architecture Overview
                </label>
                <textarea
                  rows={2}
                  value={editingBrief.architecture_overview || ''}
                  onChange={(e) => setEditingBrief({ ...editingBrief, architecture_overview: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Key Features (one per line)
                  </label>
                  <textarea
                    rows={3}
                    value={editingBrief.key_features_str || ''}
                    onChange={(e) => setEditingBrief({ ...editingBrief, key_features_str: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Likely Interview Angles (one per line)
                  </label>
                  <textarea
                    rows={3}
                    value={editingBrief.likely_angles_str || ''}
                    onChange={(e) => setEditingBrief({ ...editingBrief, likely_angles_str: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              {editingBrief.confidence_notes && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Analysis Confidence Notes
                  </label>
                  <input
                    type="text"
                    value={editingBrief.confidence_notes || ''}
                    onChange={(e) => setEditingBrief({ ...editingBrief, confidence_notes: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 outline-none"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBrief}
                className="flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 shadow-md transition"
              >
                <Save className="w-4 h-4" />
                Save to My Projects
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
