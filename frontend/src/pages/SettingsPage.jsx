import React, { useState, useEffect } from 'react';
import {
  User,
  Settings,
  ShieldCheck,
  Trash2,
  Save,
  CheckCircle,
  AlertTriangle,
  FolderGit2,
  Layers,
  History,
  Volume2,
  Square,
  Play,
  Sparkles,
} from 'lucide-react';
import {
  getUserProfile,
  saveUserProfile,
  getSettings,
  saveSettings,
  getUserProjects,
  getSessions,
  getDsaPlatforms,
  clearAllUserData,
} from '../services/storage';
import { useSpeechSynthesis } from '../services/useSpeechSynthesis';

export default function SettingsPage({ onDataCleared, onProfileUpdated }) {
  // Speech synthesis hook
  const {
    voices,
    selectedVoice,
    selectVoice,
    speechRate,
    setSpeechRate,
    speak,
    cancel,
    isSpeaking,
    isSupported: isTtsSupported,
  } = useSpeechSynthesis();

  // Profile state
  const [name, setName] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [education, setEducation] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [languages, setLanguages] = useState('');
  const [skills, setSkills] = useState('');
  const [englishLevel, setEnglishLevel] = useState('Intermediate');
  const [goals, setGoals] = useState('');

  // Settings state
  const [includeProjectsInRandom, setIncludeProjectsInRandom] = useState(false);
  const [voiceInterviewer, setVoiceInterviewer] = useState(true);
  const [voiceFeedback, setVoiceFeedback] = useState(true);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState('');
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);

  // Status state
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Storage counts
  const [sessionCount, setSessionCount] = useState(0);
  const [projectCount, setProjectCount] = useState(0);
  const [platformCount, setPlatformCount] = useState(0);

  useEffect(() => {
    const profile = getUserProfile();
    if (profile) {
      setName(profile.name || '');
      setTargetRole(profile.target_role || '');
      setExperienceLevel(profile.experience_level || '');
      setEducation(profile.education || '');
      setFieldOfStudy(profile.field_of_study || '');
      setLanguages((profile.languages || []).join(', '));
      setSkills((profile.skills || []).join(', '));
      setEnglishLevel(profile.english_level || 'Intermediate');
      setGoals(profile.goals || '');
    }

    const currentSettings = getSettings();
    setIncludeProjectsInRandom(Boolean(currentSettings.include_projects_in_random_topics));
    setVoiceInterviewer(currentSettings.voice_interviewer !== false);
    setVoiceFeedback(currentSettings.voice_feedback !== false);
    setSelectedVoiceUri(currentSettings.voice_uri || '');
    setVoiceSpeed(currentSettings.voice_speed || 1.0);

    setSessionCount(getSessions().length);
    setProjectCount(getUserProjects().length);
    setPlatformCount(getDsaPlatforms().length);
  }, []);

  // Sync selected voice URI when voices load if none selected yet
  useEffect(() => {
    if (!selectedVoiceUri && selectedVoice) {
      setSelectedVoiceUri(selectedVoice.voiceURI);
    }
  }, [selectedVoice, selectedVoiceUri]);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const updatedProfile = {
      name: name.trim() || null,
      target_role: targetRole.trim() || null,
      experience_level: experienceLevel.trim() || null,
      education: education.trim() || null,
      field_of_study: fieldOfStudy.trim() || null,
      languages: languages
        ? languages.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      skills: skills
        ? skills.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      english_level: englishLevel,
      goals: goals.trim() || null,
    };

    saveUserProfile(updatedProfile);
    saveSettings({
      include_projects_in_random_topics: includeProjectsInRandom,
      voice_interviewer: voiceInterviewer,
      voice_feedback: voiceFeedback,
      voice_uri: selectedVoiceUri || null,
      voice_speed: Number(voiceSpeed) || 1.0,
    });

    if (onProfileUpdated) onProfileUpdated(updatedProfile);

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleConfirmClear = () => {
    clearAllUserData();
    setShowClearConfirm(false);
    setName('');
    setTargetRole('');
    setExperienceLevel('');
    setEducation('');
    setFieldOfStudy('');
    setLanguages('');
    setSkills('');
    setEnglishLevel('Intermediate');
    setGoals('');
    setSessionCount(0);
    setProjectCount(0);
    setPlatformCount(0);
    if (onDataCleared) onDataCleared();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900/50 mb-3">
          <Settings className="w-3.5 h-3.5" />
          Settings & Candidate Profile
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Candidate Profile & Preferences
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize how Gemini calibrates questions, tone, and feedback for your background.
        </p>
      </div>

      {saveSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-center gap-3 text-teal-800 dark:text-teal-300 text-sm animate-fade-in">
          <CheckCircle className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
          <span>Profile and preferences updated successfully!</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveProfile} className="space-y-8">
        {/* Profile Section */}
        <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Candidate Information
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                All fields are optional. Leave blank for neutral defaults.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name or Preferred Name
              </label>
              <input
                type="text"
                placeholder="e.g. Jordan Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Interview Role
              </label>
              <input
                type="text"
                placeholder="e.g. SDE Intern, Backend Engineer, ML Specialist"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Experience Level or College Year
              </label>
              <input
                type="text"
                placeholder="e.g. 2nd Year B.Tech, Master's, 1 Year SWE Experience"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Field of Study
              </label>
              <input
                type="text"
                placeholder="e.g. Computer Science, Information Science, Electrical"
                value={fieldOfStudy}
                onChange={(e) => setFieldOfStudy(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                College / Institution / Company
              </label>
              <input
                type="text"
                placeholder="e.g. National Institute of Tech"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Spoken English Confidence Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                  <button
                    type="button"
                    key={lvl}
                    onClick={() => setEnglishLevel(lvl)}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg border transition ${
                      englishLevel === lvl
                        ? 'bg-teal-50 dark:bg-teal-900/40 border-teal-500 text-teal-700 dark:text-teal-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Primary Programming Languages (comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g. Python, Java, C++, TypeScript, Go"
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Technical Skills & Interests (comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g. React, PostgreSQL, Docker, Microservices, Machine Learning"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Practice Goals & Objectives
              </label>
              <input
                type="text"
                placeholder="e.g. Speak smoothly without long pauses; articulate system architecture clearly"
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Voice Interviewer Settings */}
        <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Voice Interviewer Settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure simulated spoken questions, speed pacing, and audio feedback summaries.
              </p>
            </div>
          </div>

          {/* Toggle: Voice Interviewer */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                Voice Interviewer (Read questions aloud)
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                The interviewer reads out the question or follow-up before the 10-second preparation countdown begins. (Default: ON)
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={voiceInterviewer}
                onChange={(e) => setVoiceInterviewer(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-violet-600"></div>
            </label>
          </div>

          {/* Toggle: Voice Feedback */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                Voice Feedback (Spoken summary)
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Automatically speak a concise 3-5 sentence coaching summary when the evaluation screen loads. (Default: ON)
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={voiceFeedback}
                onChange={(e) => setVoiceFeedback(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-violet-600"></div>
            </label>
          </div>

          {/* Voice Picker Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Interviewer Voice
            </label>
            <select
              value={selectedVoiceUri}
              onChange={(e) => {
                setSelectedVoiceUri(e.target.value);
                selectVoice(e.target.value);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {voices.length === 0 ? (
                <option value="">Default System Voice</option>
              ) : (
                voices.map((v) => {
                  const isRecommended =
                    v.lang === 'en-IN' ||
                    /natural|google|neural|samantha|karen|daniel/i.test(v.name);
                  return (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang}) {isRecommended ? '★ Recommended' : ''}
                    </option>
                  );
                })
              )}
            </select>
          </div>

          {/* Speech Speed Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
              Speaking Pace
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { speed: 0.8, label: '0.8x (Deliberate)' },
                { speed: 1.0, label: '1.0x (Normal)' },
                { speed: 1.2, label: '1.2x (Fast / Pace)' },
              ].map(({ speed, label }) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => {
                    setVoiceSpeed(speed);
                    setSpeechRate(speed);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    Number(voiceSpeed) === speed
                      ? 'bg-violet-50 border-violet-500 text-violet-700 dark:bg-violet-950/60 dark:border-violet-600 dark:text-violet-300 shadow-sm'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Test Voice & Privacy Note */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                if (isSpeaking) {
                  cancel();
                } else {
                  speak('Hello! I am your AI interviewer. I will read your questions and summarize your feedback.');
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-100 dark:bg-violet-900/50 hover:bg-violet-200 dark:hover:bg-violet-800/60 text-violet-700 dark:text-violet-300 text-xs font-semibold transition active:scale-95 cursor-pointer self-start sm:self-auto"
            >
              {isSpeaking ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop Test Audio</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Test Voice</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              🔒 Speech synthesis runs entirely in your browser. No voice audio is sent to external servers.
            </p>
          </div>
        </div>

        {/* Practice Preferences */}
        <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Drill Preferences
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Control how topic selection interacts with your saved projects.
              </p>
            </div>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                Include my projects in random topics
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                When enabled, "Random" or "Surprise Me" speaking drills may occasionally ask questions grounded in your saved projects. (Default: Off)
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={includeProjectsInRandom}
                onChange={(e) => setIncludeProjectsInRandom(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-teal-500"></div>
            </label>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 text-white font-semibold shadow-md transition active:scale-95"
          >
            <Save className="w-4 h-4" />
            Save Profile & Preferences
          </button>
        </div>
      </form>

      {/* Storage & Privacy (Danger Zone) */}
      <div className="mt-12 p-6 md:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-950/60 shadow-sm">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-rose-100 dark:border-rose-950/40">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Data Storage & Privacy
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              All information is stored strictly within this browser instance.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
            <div className="text-lg font-extrabold text-slate-900 dark:text-white">
              {sessionCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Practice Drills</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
            <div className="text-lg font-extrabold text-slate-900 dark:text-white">
              {projectCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Saved Projects</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
            <div className="text-lg font-extrabold text-slate-900 dark:text-white">
              {platformCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">DSA Platforms</div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40">
          <div>
            <div className="text-sm font-bold text-rose-900 dark:text-rose-200">
              Clear All My Data
            </div>
            <div className="text-xs text-rose-700 dark:text-rose-300">
              Permanently wipes your profile, saved projects, practice drill history, and DSA stats from this browser.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition active:scale-95 shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Data
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Clear All Data?
              </h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              This will permanently delete all candidate profile details, saved project briefs, drill session transcripts, and DSA journey stats stored in your browser. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-sm"
              >
                Yes, Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
