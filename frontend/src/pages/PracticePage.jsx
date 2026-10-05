import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, AlertTriangle, ArrowRight, Play, RotateCcw, CheckCircle } from 'lucide-react';
import TopicCard from '../components/TopicCard';
import TimerRing from '../components/TimerRing';
import TranscriptBox from '../components/TranscriptBox';
import LoadingState from '../components/LoadingState';
import ErrorBanner from '../components/ErrorBanner';

const PREP_DURATION = 10;
const SPEAK_DURATION = 60;

export default function PracticePage({
  topicData,
  speechRecognition,
  onFinishDrill,
  isLoadingAnalysis,
  analysisError,
  onClearAnalysisError,
  onCancelDrill,
}) {
  // State machine: 'READY' | 'PREPARING' | 'SPEAKING' | 'TIMES_UP' | 'ANALYZING'
  const [phase, setPhase] = useState('PREPARING');
  const [remainingSeconds, setRemainingSeconds] = useState(PREP_DURATION);
  const [localError, setLocalError] = useState(null);

  // High precision timestamp references
  const phaseStartTimeRef = useRef(Date.now());
  const timerIntervalRef = useRef(null);
  const actualSpeakingDurationRef = useRef(0);

  const {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    finalTranscript,
    error: speechError,
    metrics,
    startListening,
    stopListening,
    resetTranscript,
    isDevMockAllowed,
    devInjectMockText,
  } = speechRecognition;

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      stopListening();
    };
  }, [stopListening]);

  // Transition to SPEAKING phase
  const beginSpeaking = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    
    setPhase('SPEAKING');
    setRemainingSeconds(SPEAK_DURATION);
    phaseStartTimeRef.current = Date.now();
    resetTranscript();
    startListening();

    // Timestamp-based accurate interval ticker
    timerIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - phaseStartTimeRef.current) / 1000;
      const left = Math.max(0, SPEAK_DURATION - elapsed);
      setRemainingSeconds(Math.ceil(left));

      if (left <= 0) {
        // 60s finished!
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        actualSpeakingDurationRef.current = elapsed;
        stopListening();
        setPhase('TIMES_UP');
      }
    }, 100);
  }, [resetTranscript, startListening, stopListening]);

  // Handle Prep countdown
  useEffect(() => {
    if (phase === 'PREPARING') {
      phaseStartTimeRef.current = Date.now();
      setRemainingSeconds(PREP_DURATION);

      timerIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - phaseStartTimeRef.current) / 1000;
        const left = Math.max(0, PREP_DURATION - elapsed);
        setRemainingSeconds(Math.ceil(left));

        if (left <= 0) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          beginSpeaking();
        }
      }, 100);

      return () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      };
    }
  }, [phase, beginSpeaking]);

  // Automatically submit speech when TIME'S UP occurs
  useEffect(() => {
    if (phase === 'TIMES_UP') {
      const timer = setTimeout(() => {
        submitSpeech();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Submit collected transcript to backend for Gemini analysis
  const submitSpeech = useCallback(() => {
    stopListening();
    const finalContent = (finalTranscript || transcript).trim();
    const duration = Math.max(1, actualSpeakingDurationRef.current || (SPEAK_DURATION - remainingSeconds) || 60);

    if (!finalContent || finalContent.split(/\s+/).length < 5) {
      setLocalError("Your response was under 5 words. Please speak clearly into your mic for the full drill and try again.");
      setPhase('READY');
      return;
    }

    setPhase('ANALYZING');
    onFinishDrill({
      topic: topicData.topic,
      transcript: finalContent,
      durationSeconds: duration,
      timeToFirstWord: metrics.timeToFirstWord,
      longestPause: metrics.longestPause,
      pausesOver2s: metrics.pausesOver2s,
      parentSessionId: topicData.parentSessionId || null,
      keyPoints: topicData.key_points || [],
      subtopic: topicData.subtopic,
      questionType: topicData.question_type,
      mode: topicData.mode || 'general',
      roundNumber: topicData.roundNumber || 1,
      subject: topicData.subject || '',
      primer: topicData.primer || null,
    });
  }, [finalTranscript, transcript, remainingSeconds, metrics, onFinishDrill, stopListening, topicData]);

  // Early finish trigger
  const handleFinishEarly = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    const elapsed = (Date.now() - phaseStartTimeRef.current) / 1000;
    actualSpeakingDurationRef.current = elapsed;
    stopListening();
    setPhase('TIMES_UP');
  };

  // Retry from ready
  const handleRestart = () => {
    setLocalError(null);
    onClearAnalysisError();
    resetTranscript();
    setPhase('PREPARING');
  };

  // If loading analysis
  if (phase === 'ANALYZING' || isLoadingAnalysis) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <LoadingState
          title="Analyzing Your Communication"
          subtitle="Gemini is evaluating your fluency, confidence, technical depth, and crafting personalized improvements..."
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Unsupported browser warning */}
      {!isSupported && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Speech Recognition Notice:</span> The Web Speech API is not supported in this browser. For live speech recording, please open this app in <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>.
          </div>
        </div>
      )}

      {/* Errors */}
      <ErrorBanner
        message={localError || speechError || analysisError}
        onRetry={handleRestart}
        onDismiss={() => {
          setLocalError(null);
          onClearAnalysisError();
        }}
      />

      {/* Topic Card */}
      <TopicCard
        topic={topicData?.topic}
        category={topicData?.category}
        difficulty={topicData?.difficulty}
        isFollowUp={Boolean(topicData?.parentSessionId)}
        subtopic={topicData?.subtopic}
        questionType={topicData?.question_type}
        roundNumber={topicData?.roundNumber}
        isDsa={topicData?.mode === 'dsa'}
        isCore={topicData?.mode === 'core'}
        subject={topicData?.subject}
        primer={topicData?.primer}
      />

      {/* Practice Arena */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-10 flex flex-col items-center justify-center space-y-8">
        
        {/* Phase Header */}
        <div className="text-center">
          {phase === 'PREPARING' && (
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Preparation Countdown
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                Formulate your thoughts ({remainingSeconds}s)
              </h3>
            </div>
          )}

          {phase === 'SPEAKING' && (
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                60-Second Speaking Drill
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                Speak clearly into your microphone
              </h3>
            </div>
          )}

          {phase === 'TIMES_UP' && (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Time's up! Great job.
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Submitting your speech for Gemini evaluation...
              </p>
            </div>
          )}

          {phase === 'READY' && (
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Ready to try this topic again?
              </h3>
            </div>
          )}
        </div>

        {/* Circular Progress Ring Timer */}
        {phase !== 'TIMES_UP' && (
          <TimerRing
            totalSeconds={phase === 'PREPARING' ? PREP_DURATION : SPEAK_DURATION}
            remainingSeconds={remainingSeconds}
            phase={phase}
            isListening={isListening}
          />
        )}

        {/* Action button overrides */}
        <div className="flex items-center gap-3">
          {phase === 'PREPARING' && (
            <button
              onClick={beginSpeaking}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Speaking Now</span>
            </button>
          )}

          {phase === 'SPEAKING' && (
            <button
              onClick={handleFinishEarly}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Finish Early & Analyze
            </button>
          )}

          {phase === 'READY' && (
            <button
              onClick={handleRestart}
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          )}

          <button
            onClick={onCancelDrill}
            className="px-4 py-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Live speech transcript box */}
        <div className="w-full">
          <TranscriptBox
            finalTranscript={finalTranscript}
            interimTranscript={interimTranscript}
            isListening={isListening}
            isDevMockAllowed={isDevMockAllowed}
            onInjectDevMock={devInjectMockText}
          />
        </div>

      </div>
    </div>
  );
}
