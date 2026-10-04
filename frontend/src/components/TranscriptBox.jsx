import React, { useEffect, useRef } from 'react';
import { MessageSquare, Mic, Volume2 } from 'lucide-react';

export default function TranscriptBox({
  finalTranscript = '',
  interimTranscript = '',
  isListening = false,
  isDevMockAllowed = false,
  onInjectDevMock = null,
}) {
  const containerRef = useRef(null);

  const wordCount = (finalTranscript + ' ' + interimTranscript)
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  // Auto-scroll to bottom as speech accumulates
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [finalTranscript, interimTranscript]);

  return (
    <div className="w-full flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Live Speech Transcript
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {wordCount} words
          </span>

          {/* Dev-only simulation trigger strictly gated behind DEV + ?mock=1 */}
          {isDevMockAllowed && onInjectDevMock && (
            <button
              onClick={() =>
                onInjectDevMock(
                  "In my experience building backend services with FastAPI and Python, I tackled a database scaling bottleneck. We basically optimized SQL queries with indexes, which you know reduced latency by 40%. The biggest challenge was, like, managing connection pooling during peak traffic."
                )
              }
              className="text-[11px] font-mono px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300 hover:bg-violet-200 border border-violet-300 dark:border-violet-800"
              title="Dev verification only (gated by ?mock=1)"
            >
              [Dev Mock Transcript]
            </button>
          )}
        </div>
      </div>

      {/* Transcript text area */}
      <div
        ref={containerRef}
        className="p-5 min-h-[140px] max-h-[220px] overflow-y-auto text-sm sm:text-base leading-relaxed"
      >
        {!finalTranscript && !interimTranscript ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-6 text-slate-400 dark:text-slate-500">
            {isListening ? (
              <>
                <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center mb-2 animate-bounce">
                  <Volume2 className="w-4 h-4 text-indigo-500" />
                </div>
                <p className="text-sm font-medium">Listening to your voice... start speaking now!</p>
                <p className="text-xs text-slate-400 mt-0.5">Your speech will appear here in real time.</p>
              </>
            ) : (
              <p className="text-sm">Transcript will stream here once the speaking timer begins.</p>
            )}
          </div>
        ) : (
          <p className="font-normal text-slate-800 dark:text-slate-200 break-words whitespace-pre-wrap">
            {finalTranscript}
            {interimTranscript && (
              <span className="text-slate-400 dark:text-slate-500 italic ml-1">
                {interimTranscript}
              </span>
            )}
          </p>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-5 py-2 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900/30 flex items-center justify-between text-[11px] text-slate-400">
        <span>Speak naturally into your microphone</span>
        <span>Target: 110–140 words in 60s</span>
      </div>
    </div>
  );
}
