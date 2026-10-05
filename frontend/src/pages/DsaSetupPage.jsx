import React, { useState } from 'react';
import { Terminal, Code2, Sparkles, Sliders, ArrowRight, Check, Cpu, Brain, Compass, Target } from 'lucide-react';
import ErrorBanner from '../components/ErrorBanner';
import { getDsaJourneyBrief, getDsaJourneyData } from '../services/storage';

const SUBTOPICS = [
  'Surprise Me',
  'Arrays & Strings',
  'Linked Lists',
  'Stacks & Queues',
  'Hashing',
  'Trees & BST',
  'Graphs',
  'Recursion & Backtracking',
  'Dynamic Programming',
  'Sorting & Searching',
  'Heaps',
  'Greedy',
  'Two Pointers / Sliding Window',
  'Bit Manipulation',
];

const QUESTION_TYPES = [
  'Surprise Me',
  'Theory/Concept',
  'Explain an Approach',
  'Complexity Analysis',
  'Compare Data Structures',
  'Edge Cases & Pitfalls',
  '"Why did you choose X?"',
];

const DIFFICULTIES = [
  {
    id: 'Easy',
    label: 'Easy',
    desc: 'Core fundamentals, linear structure operations, standard traversal patterns.',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  },
  {
    id: 'Medium',
    label: 'Medium',
    desc: 'Trade-offs, recursive trees, graph traversals, DP transitions, two-pointer bounds.',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  },
  {
    id: 'Hard',
    label: 'Hard',
    desc: 'Subtle corner cases, DP state optimizations, complex amortized complexities, graph edge-cases.',
    badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
  },
];

export default function DsaSetupPage({ onGenerateQuestion, isLoading, error, onClearError, initialSubtopic = null }) {
  const journeyBrief = getDsaJourneyBrief();
  const journeyData = getDsaJourneyData();

  const [selectedSubtopic, setSelectedSubtopic] = useState(initialSubtopic || 'Surprise Me');
  const [selectedType, setSelectedType] = useState('Surprise Me');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Medium');
  const [useJourneyPersonalization, setUseJourneyPersonalization] = useState(Boolean(journeyBrief));

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerateQuestion({
      subtopic: selectedSubtopic,
      questionType: selectedType,
      difficulty: selectedDifficulty,
      journeyContext: useJourneyPersonalization ? journeyBrief : null,
    });
  };

  const handleSelectWeakTopicDrill = () => {
    const weak = journeyBrief?.weak_topics?.[0] || journeyBrief?.recommended_focus_topics?.[0] || 'Graphs';
    setSelectedSubtopic(weak);
    setSelectedType('Explain an Approach');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-200">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-3">
          <Terminal className="w-3.5 h-3.5" />
          <span>DSA Interview Mode • Spoken Explanations</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <span>Configure Your DSA Speaking Drill</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Practice explaining Data Structures & Algorithms out loud. No code writing—focus on crisp oral explanations of intuition, complexity, and trade-offs.
        </p>
      </div>

      {/* DSA Journey Profile Personalization Callout */}
      {journeyBrief ? (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/70 via-slate-900 to-emerald-950/70 text-white border border-sky-500/30 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-sky-300">
                DSA Journey Connected ({journeyBrief.total_solved} solved)
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
              Gemini can tailor prompts to your strengths ({journeyBrief.strong_topics.slice(0, 2).join(', ') || 'general'}),
              recent solved problems ({journeyBrief.recent_problems.slice(0, 2).join(', ') || 'N/A'}),
              or target gaps ({journeyBrief.weak_topics.slice(0, 2).join(', ') || 'untouched topics'}).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSelectWeakTopicDrill}
              className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Target Weakest Topic</span>
            </button>

            <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={useJourneyPersonalization}
                onChange={(e) => setUseJourneyPersonalization(e.target.checked)}
                className="rounded accent-sky-500"
              />
              <span>Condition on Journey</span>
            </label>
          </div>
        </div>
      ) : (
        /* Default Candidate Profile Callout */
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white border border-slate-800 shadow-sm flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <Brain className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-xs">
            <div className="font-bold text-slate-100 flex items-center gap-2">
              <span>Interview Calibration: 400+ Problems / C++ Context</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                Oral Only
              </span>
            </div>
            <p className="text-slate-300/90 leading-relaxed">
              Gemini tailors technical rigor to someone who already knows the algorithms and evaluates how fluently you convey logic to an interviewer in under 60 seconds.
            </p>
          </div>
        </div>
      )}

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
                      ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 dark:border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${d.badge}`}>
                      {d.label}
                    </span>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
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

        {/* Subtopic Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-500" />
              <span>DSA Subtopic</span>
            </label>
            <span className="text-xs text-slate-400">
              Selected: <strong className="text-slate-700 dark:text-slate-200">{selectedSubtopic}</strong>
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {SUBTOPICS.map((sub) => {
              const isSelected = selectedSubtopic === sub;
              return (
                <button
                  type="button"
                  key={sub}
                  onClick={() => setSelectedSubtopic(sub)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm font-semibold'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {sub === 'Surprise Me' ? '🎲 Surprise Me' : sub}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Type Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-500" />
              <span>Question Type</span>
            </label>
            <span className="text-xs text-slate-400">
              Selected: <strong className="text-slate-700 dark:text-slate-200">{selectedType}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {QUESTION_TYPES.map((type) => {
              const isSelected = selectedType === type;
              return (
                <button
                  type="button"
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:border-emerald-500 text-emerald-700 dark:text-emerald-300 font-semibold shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs block font-medium">
                    {type === 'Surprise Me' ? '🎲 Surprise Me' : type}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin" />
                <span>Crafting DSA Question from Gemini...</span>
              </>
            ) : (
              <>
                <Terminal className="w-5 h-5" />
                <span>Generate DSA Question & Begin Drill</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
