import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, Loader2 } from 'lucide-react';

const TIPS = [
  "Tip: Lead with the bottom-line result before explaining technical details.",
  "Tip: In 60 seconds, structure your answer: Context (15s) → Action (30s) → Outcome & Trade-offs (15s).",
  "Tip: Replacing filler phrases with a 1-second silent breath conveys natural executive presence.",
  "Tip: Mention specific engineering decisions, such as time complexity or why you chose C++.",
  "Tip: High-impact interview communication is about clarity and conciseness, not speed.",
];

export default function LoadingState({ title = 'Analyzing your response...', subtitle = 'Gemini AI is evaluating your communication dimensions' }) {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-lg mx-auto my-8">
      {/* Animated icon orb */}
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 animate-pulse">
          <Brain className="w-8 h-8" />
        </div>
        <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
        </div>
      </div>

      <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        {subtitle}
      </p>

      {/* Rotating speaking tip */}
      <div className="w-full p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-300 flex items-center gap-2.5 transition-all duration-300">
        <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
        <span className="font-medium text-left">{TIPS[tipIndex]}</span>
      </div>
    </div>
  );
}
