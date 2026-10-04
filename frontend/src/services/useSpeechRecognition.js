import { useState, useEffect, useRef, useCallback } from 'react';

// Dev-only mock flag strictly checked behind Vite's DEV mode and explicit ?mock=1 query param
const isDevMockAllowed =
  import.meta.env.DEV &&
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('mock') === '1';

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState(null);

  // Pause and delivery timing metrics
  const [timeToFirstWord, setTimeToFirstWord] = useState(0);
  const [longestPause, setLongestPause] = useState(0);
  const [pausesOver2s, setPausesOver2s] = useState(0);

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const shouldBeListeningRef = useRef(false);
  
  // Timing references
  const recordingStartTimeRef = useRef(0);
  const firstWordTimeRef = useRef(null);
  const lastEventTimeRef = useRef(null);
  const longestPauseRef = useRef(0);
  const pausesOver2sRef = useRef(0);

  // Finalized chunks set for Android Chrome deduplication
  const finalizedPhrasesRef = useRef(new Set());
  const finalTranscriptRef = useRef('');

  const isSupported =
    typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  // Setup Web Speech API recognition instance
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isListeningRef.current = true;
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      const now = performance.now();

      // Track first word timestamp
      if (firstWordTimeRef.current === null && recordingStartTimeRef.current > 0) {
        const delta = Math.max(0, (now - recordingStartTimeRef.current) / 1000);
        firstWordTimeRef.current = delta;
        setTimeToFirstWord(delta);
        lastEventTimeRef.current = now;
      } else if (lastEventTimeRef.current !== null) {
        // Track gap between speech results
        const gap = Math.max(0, (now - lastEventTimeRef.current) / 1000);
        if (gap > longestPauseRef.current) {
          longestPauseRef.current = gap;
          setLongestPause(gap);
        }
        if (gap >= 2.0) {
          pausesOver2sRef.current += 1;
          setPausesOver2s(pausesOver2sRef.current);
        }
        lastEventTimeRef.current = now;
      }

      let currentInterim = '';
      let newFinals = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const res = event.results[i];
        const text = res[0].transcript.trim();

        if (res.isFinal) {
          // Android Chrome Deduplication:
          // Check if this exact final chunk was already recorded recently
          if (text && !finalizedPhrasesRef.current.has(text.toLowerCase())) {
            finalizedPhrasesRef.current.add(text.toLowerCase());
            newFinals += (newFinals ? ' ' : '') + text;
          }
        } else {
          currentInterim += (currentInterim ? ' ' : '') + text;
        }
      }

      if (newFinals) {
        const updatedFinal = finalTranscriptRef.current
          ? `${finalTranscriptRef.current} ${newFinals}`
          : newFinals;
        finalTranscriptRef.current = updatedFinal;
        setFinalTranscript(updatedFinal);
      }

      setInterimTranscript(currentInterim);
      
      const combined = finalTranscriptRef.current
        ? (currentInterim ? `${finalTranscriptRef.current} ${currentInterim}` : finalTranscriptRef.current)
        : currentInterim;
      setTranscript(combined);
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition event error:', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone access was denied. Please allow microphone permissions in your browser settings.');
        shouldBeListeningRef.current = false;
        setIsListening(false);
      } else if (event.error === 'no-speech') {
        // Silent timeout, keep listening if drill is active
      } else if (event.error === 'audio-capture') {
        setError('No microphone was detected. Please ensure your microphone is plugged in and working.');
      } else if (event.error === 'network') {
        setError('Speech recognition network error. Please check your internet connection.');
      }
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      // Auto-restart if the drill is still active (Chrome stops on pause)
      if (shouldBeListeningRef.current) {
        try {
          recognition.start();
        } catch (e) {
          console.warn('Error auto-restarting speech recognition:', e);
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldBeListeningRef.current = false;
      try {
        recognition.stop();
      } catch {
        // ignore on unmount
      }
    };
  }, [isSupported]);

  // Start listening
  const startListening = useCallback(() => {
    setError(null);
    setTranscript('');
    setInterimTranscript('');
    setFinalTranscript('');
    finalTranscriptRef.current = '';
    finalizedPhrasesRef.current.clear();

    const now = performance.now();
    recordingStartTimeRef.current = now;
    firstWordTimeRef.current = null;
    lastEventTimeRef.current = null;
    longestPauseRef.current = 0;
    pausesOver2sRef.current = 0;
    setTimeToFirstWord(0);
    setLongestPause(0);
    setPausesOver2s(0);

    shouldBeListeningRef.current = true;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        // If already started, ignore error
        console.warn('SpeechRecognition start notice:', err);
      }
    } else if (!isSupported) {
      setError('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
    }
  }, [isSupported]);

  // Stop listening
  const stopListening = useCallback(() => {
    shouldBeListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn('SpeechRecognition stop notice:', err);
      }
    }
    setIsListening(false);
  }, []);

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setFinalTranscript('');
    finalTranscriptRef.current = '';
    finalizedPhrasesRef.current.clear();
    setTimeToFirstWord(0);
    setLongestPause(0);
    setPausesOver2s(0);
    setError(null);
  }, []);

  // DEV-ONLY helper to inject simulated speech during automated dev testing with ?mock=1
  const devInjectMockText = useCallback((text) => {
    if (isDevMockAllowed) {
      setTranscript(text);
      setFinalTranscript(text);
      finalTranscriptRef.current = text;
      setTimeToFirstWord(1.2);
      setLongestPause(2.1);
      setPausesOver2s(1);
    }
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    finalTranscript,
    error,
    metrics: {
      timeToFirstWord: Number(timeToFirstWord.toFixed(2)),
      longestPause: Number(longestPause.toFixed(2)),
      pausesOver2s,
    },
    startListening,
    stopListening,
    resetTranscript,
    isDevMockAllowed,
    devInjectMockText,
  };
}
