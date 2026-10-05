import { Mic, Moon, Sun, Activity, Sparkles, Code2, BookOpen, Compass, FolderGit2, Settings } from 'lucide-react';

export default function Navbar({ currentView, setCurrentView, theme, toggleTheme, health, isDsaMode, isCoreMode, isProjectMode }) {
  const isPracticeActive = currentView === 'setup' || (currentView === 'practice' && !isDsaMode && !isCoreMode && !isProjectMode) || (currentView === 'feedback' && !isDsaMode && !isCoreMode && !isProjectMode);
  const isDsaActive = currentView === 'dsa_setup' || currentView === 'dsa_practice' || (currentView === 'practice' && isDsaMode) || currentView === 'dsa_feedback' || (currentView === 'feedback' && isDsaMode);
  const isCoreActive = currentView === 'core_setup' || currentView === 'core_practice' || (currentView === 'practice' && isCoreMode) || currentView === 'core_feedback' || (currentView === 'feedback' && isCoreMode);
  const isProjectActive = currentView === 'projects' || currentView === 'project_setup' || currentView === 'project_practice' || currentView === 'project_feedback' || (currentView === 'practice' && isProjectMode);
  const isJourneyActive = currentView === 'dsa_journey';

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div 
          onClick={() => setCurrentView('home')}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200">
                SpeakPrep
              </span>
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              60s Interview Communication
            </p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setCurrentView('home')}
            className={`px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0 ${
              currentView === 'home'
                ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            Home
          </button>
          
          <button
            onClick={() => setCurrentView('setup')}
            className={`px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
              isPracticeActive && !isDsaActive && !isCoreActive && !isProjectActive
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Practice</span>
            <span className="sm:hidden">Drill</span>
          </button>

          <button
            onClick={() => setCurrentView('projects')}
            className={`px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
              isProjectActive
                ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5 text-teal-500" />
            <span>Projects</span>
          </button>

          <button
            onClick={() => setCurrentView('dsa_setup')}
            className={`px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
              isDsaActive
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>DSA</span>
          </button>

          <button
            onClick={() => setCurrentView('core_setup')}
            className={`px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
              isCoreActive
                ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-500" />
            <span className="hidden sm:inline">CS Core</span>
            <span className="sm:hidden">Core</span>
          </button>

          <button
            onClick={() => setCurrentView('dsa_journey')}
            className={`px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
              isJourneyActive
                ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-sky-500" />
            <span className="hidden md:inline">DSA Journey</span>
            <span className="md:hidden">Journey</span>
          </button>

          <button
            onClick={() => setCurrentView('progress')}
            className={`px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0 ${
              currentView === 'progress'
                ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            Progress
          </button>
        </nav>

        {/* Controls: Health + Settings + Theme */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Health indicator */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span
              className={`w-2 h-2 rounded-full ${
                health?.status === 'healthy' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="text-[11px] font-mono">
              {health?.gemini_configured ? health?.model : 'API Ready'}
            </span>
          </div>

          {/* Settings */}
          <button
            onClick={() => setCurrentView('settings')}
            aria-label="Settings"
            title="Candidate Profile & Settings"
            className={`p-2 rounded-xl transition-colors ${
              currentView === 'settings'
                ? 'bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
