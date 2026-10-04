import React from 'react';
import { Mic, Radio } from 'lucide-react';

export default function TimerRing({
  totalSeconds = 60,
  remainingSeconds = 60,
  phase = 'SPEAKING', // 'PREPARING' or 'SPEAKING'
  isListening = false,
}) {
  const size = 220;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate progress ratio (1.0 down to 0.0)
  const progressRatio = Math.max(0, Math.min(1, remainingSeconds / totalSeconds));
  const strokeDashoffset = circumference * (1 - progressRatio);

  // Dynamic stroke color based on remaining time
  let strokeColor = '#6366f1'; // Indigo for prep
  if (phase === 'SPEAKING') {
    if (remainingSeconds <= 5) {
      strokeColor = '#ef4444'; // Red
    } else if (remainingSeconds <= 15) {
      strokeColor = '#f59e0b'; // Amber
    } else {
      strokeColor = '#10b981'; // Emerald
    }
  }

  // Format time MM:SS
  const mins = Math.floor(remainingSeconds / 60);
  const secs = Math.floor(remainingSeconds % 60);
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center">
        {/* SVG Circular Progress */}
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-slate-800"
            fill="transparent"
          />
          {/* Animated progress ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-300 ease-linear"
          />
        </svg>

        {/* Central Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
          <span className="text-4xl sm:text-5xl font-extrabold tracking-tighter font-mono text-slate-900 dark:text-white">
            {formattedTime}
          </span>
          <span className="text-xs font-semibold tracking-wider uppercase mt-1 text-slate-500 dark:text-slate-400">
            {phase === 'PREPARING' ? 'Get Ready' : 'Speak Now'}
          </span>
        </div>
      </div>

      {/* Pulsing Live Recording Status Indicator */}
      <div className="mt-5 flex items-center gap-2">
        {phase === 'SPEAKING' ? (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-semibold shadow-sm animate-pulse">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
            </span>
            <span>Recording Live</span>
            <Mic className="w-3.5 h-3.5" />
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Preparation Time</span>
          </div>
        )}
      </div>
    </div>
  );
}
