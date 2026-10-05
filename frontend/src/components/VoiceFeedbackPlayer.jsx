import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Square, Play, Sparkles, MessageSquare } from 'lucide-react';
import { useSpeechSynthesis } from '../services/useSpeechSynthesis';
import { cleanTextForSpeech, buildSpokenSummary } from '../utils/speechSummary';
import { getSettings, isVoiceMuted } from '../services/storage';

export default function VoiceFeedbackPlayer({
  analysis,
  mode = 'general',
  autoPlay = true,
  customSummary = null,
}) {
  const { speak, cancel, isSpeaking, isSupported } = useSpeechSynthesis();
  const [playingTarget, setPlayingTarget] = useState(null); // 'summary' | 'sample' | null
  const hasAutoPlayedRef = useRef(false);

  // Derive the 3-5 sentence spoken summary
  const summaryText = customSummary || analysis?.spoken_summary || (analysis ? buildSpokenSummary(analysis, mode) : '');
  const sampleAnswerText = analysis?.sample_answer ? cleanTextForSpeech(analysis.sample_answer) : '';

  // Auto-play spoken summary on mount if enabled in settings
  useEffect(() => {
    if (!isSupported || hasAutoPlayedRef.current) return;

    const settings = getSettings();
    const canAutoPlay = autoPlay && settings.voice_feedback !== false && !isVoiceMuted();

    if (canAutoPlay && summaryText) {
      hasAutoPlayedRef.current = true;
      // Slight delay for smooth UI mounting
      const timer = setTimeout(() => {
        setPlayingTarget('summary');
        speak(cleanTextForSpeech(summaryText), {
          onEnd: () => setPlayingTarget(null),
          onError: () => setPlayingTarget(null),
        });
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [isSupported, autoPlay, summaryText, speak]);

  // Cancel speech on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  // Track when speech ends from external sources
  useEffect(() => {
    if (!isSpeaking) {
      setPlayingTarget(null);
    }
  }, [isSpeaking]);

  const handleToggleSummary = () => {
    if (isSpeaking && playingTarget === 'summary') {
      cancel();
      setPlayingTarget(null);
    } else {
      setPlayingTarget('summary');
      speak(cleanTextForSpeech(summaryText), {
        onEnd: () => setPlayingTarget(null),
        onError: () => setPlayingTarget(null),
      });
    }
  };

  const handleToggleSample = () => {
    if (isSpeaking && playingTarget === 'sample') {
      cancel();
      setPlayingTarget(null);
    } else {
      setPlayingTarget('sample');
      speak(sampleAnswerText, {
        onEnd: () => setPlayingTarget(null),
        onError: () => setPlayingTarget(null),
      });
    }
  };

  if (!summaryText && !sampleAnswerText) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-r from-indigo-50/90 via-purple-50/80 to-pink-50/90 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-pink-950/40 border border-indigo-100 dark:border-indigo-900/60 p-4 sm:p-5 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-sm">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                Voice Interviewer Feedback
              </span>
              {isSpeaking && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
                  Speaking
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Listen to your concise spoken evaluation and coaching advice
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {summaryText && (
            <button
              type="button"
              onClick={handleToggleSummary}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                isSpeaking && playingTarget === 'summary'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isSpeaking && playingTarget === 'summary' ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop Summary</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Listen to Summary</span>
                </>
              )}
            </button>
          )}

          {sampleAnswerText && (
            <button
              type="button"
              onClick={handleToggleSample}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                isSpeaking && playingTarget === 'sample'
                  ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {isSpeaking && playingTarget === 'sample' ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop Answer</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Listen to Model Answer</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Summary spoken text box */}
      {summaryText && (
        <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-900/60 rounded-xl p-3 border border-indigo-100/70 dark:border-indigo-900/40 leading-relaxed italic">
          "{summaryText}"
        </div>
      )}
    </div>
  );
}
