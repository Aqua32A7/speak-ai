import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getSettings, saveSettings, isVoiceMuted } from './storage';
import { chunkTextForTTS } from '../utils/speechSummary';

/**
 * Custom React hook wrapping the browser SpeechSynthesis API.
 * Features:
 * - Sequenced sentence chunking to defeat Chrome's 15-second speech cutoff bug
 * - Asynchronous voice discovery with en-IN / en-US / natural voice priority
 * - Rate configuration (0.8x, 1x, 1.2x) with localStorage persistence
 * - Automatic cancellation on unmount and page navigation
 */
export function useSpeechSynthesis() {
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [speechRate, setSpeechRateState] = useState(() => {
    const s = getSettings();
    return s.voice_speed || 1.0;
  });
  const [isSpeaking, setIsSpeaking] = useState(false);

  // References to manage queue and lifecycle
  const activeQueueRef = useRef([]);
  const currentChunkIndexRef = useRef(0);
  const isCanceledRef = useRef(false);
  const onEndCallbackRef = useRef(null);
  const onStartCallbackRef = useRef(null);
  const onErrorCallbackRef = useRef(null);

  // Load and sort available voices
  const populateVoices = useCallback(() => {
    if (!isSupported) return;

    try {
      const allVoices = window.speechSynthesis.getVoices() || [];
      // Filter for English voices (or all voices if no English available)
      const englishVoices = allVoices.filter((v) => v.lang && (v.lang.startsWith('en') || v.lang.startsWith('EN')));
      const availableVoices = englishVoices.length > 0 ? englishVoices : allVoices;

      setVoices(availableVoices);

      const settings = getSettings();
      const savedUri = settings.voice_uri;

      // Priority matching:
      // 1. Saved voiceURI from settings
      // 2. en-IN natural / standard voice
      // 3. en-US / en-GB natural or Google voice
      // 4. Default system voice
      let chosenVoice = null;

      if (savedUri) {
        chosenVoice = availableVoices.find((v) => v.voiceURI === savedUri);
      }

      if (!chosenVoice) {
        // Look for Indian English (en-IN)
        chosenVoice = availableVoices.find(
          (v) => (v.lang === 'en-IN' || v.lang === 'en_IN') && /natural|google|neural/i.test(v.name)
        ) || availableVoices.find((v) => v.lang === 'en-IN' || v.lang === 'en_IN');
      }

      if (!chosenVoice) {
        // Look for natural sounding US or GB voice
        chosenVoice = availableVoices.find(
          (v) => (v.lang.startsWith('en-US') || v.lang.startsWith('en-GB')) && /natural|google|neural/i.test(v.name)
        ) || availableVoices.find((v) => /samantha|karen|daniel|alex|natural/i.test(v.name))
          || availableVoices.find((v) => v.default)
          || availableVoices[0];
      }

      if (chosenVoice) {
        setSelectedVoice(chosenVoice);
      }
    } catch (err) {
      console.warn('Could not retrieve speech synthesis voices:', err);
    }
  }, [isSupported]);

  // Handle voiceschanged event and initial load
  useEffect(() => {
    if (!isSupported) return;

    populateVoices();

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = populateVoices;
    }

    return () => {
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [isSupported, populateVoices]);

  // Cancel immediately
  const cancel = useCallback(() => {
    isCanceledRef.current = true;
    activeQueueRef.current = [];
    currentChunkIndexRef.current = 0;

    if (isSupported) {
      try {
        window.speechSynthesis.cancel();
      } catch (err) {
        console.warn('SpeechSynthesis cancel error:', err);
      }
    }

    setIsSpeaking(false);
  }, [isSupported]);

  // Cleanup on unmount & page unload, and handle mute/setting changes
  useEffect(() => {
    const handleBeforeUnload = () => {
      cancel();
    };

    const handleSettingsChanged = (e) => {
      if (e.detail?.voice_muted) {
        cancel();
      }
      if (e.detail?.voice_speed) {
        setSpeechRateState(e.detail.voice_speed);
      }
      if (e.detail?.voice_uri && voices.length > 0) {
        const found = voices.find((v) => v.voiceURI === e.detail.voice_uri);
        if (found) setSelectedVoice(found);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('speakprep_settings_changed', handleSettingsChanged);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('speakprep_settings_changed', handleSettingsChanged);
      cancel();
    };
  }, [cancel, voices]);

  // Play next chunk in queue
  const playNextChunk = useCallback(() => {
    if (isCanceledRef.current || !isSupported) {
      setIsSpeaking(false);
      return;
    }

    const chunks = activeQueueRef.current;
    const index = currentChunkIndexRef.current;

    if (index >= chunks.length) {
      // Completed all chunks!
      setIsSpeaking(false);
      if (onEndCallbackRef.current) {
        try {
          onEndCallbackRef.current();
        } catch (err) {
          console.error('onEnd callback error:', err);
        }
      }
      return;
    }

    const chunkText = chunks[index];

    try {
      const utterance = new SpeechSynthesisUtterance(chunkText);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang || 'en-US';
      }
      utterance.rate = speechRate || 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        if (index === 0 && onStartCallbackRef.current) {
          onStartCallbackRef.current();
        }
      };

      utterance.onend = () => {
        if (!isCanceledRef.current) {
          currentChunkIndexRef.current += 1;
          playNextChunk();
        }
      };

      utterance.onerror = (e) => {
        // 'interrupted' and 'canceled' happen upon intentional cancel()
        if (e.error === 'interrupted' || e.error === 'canceled') {
          return;
        }
        console.warn('SpeechSynthesis utterance error:', e.error);
        if (!isCanceledRef.current) {
          if (onErrorCallbackRef.current) {
            onErrorCallbackRef.current(e);
          }
          currentChunkIndexRef.current += 1;
          playNextChunk();
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('SpeechSynthesis speak call failed:', err);
      if (onErrorCallbackRef.current) {
        onErrorCallbackRef.current(err);
      }
      setIsSpeaking(false);
    }
  }, [isSupported, selectedVoice, speechRate]);

  /**
   * Speak a block of text with sequential chunking.
   * Options:
   * - onStart: callback when first chunk begins
   * - onEnd: callback when all chunks finish
   * - onError: callback if playback errors
   */
  const speak = useCallback((text, options = {}) => {
    if (!isSupported || !text || isVoiceMuted()) {
      if (options.onEnd) options.onEnd();
      return;
    }

    // Cancel any active speech first
    cancel();

    const chunks = chunkTextForTTS(text);
    if (chunks.length === 0) {
      if (options.onEnd) options.onEnd();
      return;
    }

    isCanceledRef.current = false;
    activeQueueRef.current = chunks;
    currentChunkIndexRef.current = 0;
    onEndCallbackRef.current = options.onEnd || null;
    onStartCallbackRef.current = options.onStart || null;
    onErrorCallbackRef.current = options.onError || null;

    setIsSpeaking(true);

    // Small timeout to allow any pending cancel() on the browser engine to clear
    setTimeout(() => {
      if (!isCanceledRef.current) {
        playNextChunk();
      }
    }, 50);
  }, [isSupported, cancel, playNextChunk]);

  // Pause
  const pause = useCallback(() => {
    if (isSupported) {
      try {
        window.speechSynthesis.pause();
      } catch (err) {
        console.warn('SpeechSynthesis pause error:', err);
      }
    }
  }, [isSupported]);

  // Resume
  const resume = useCallback(() => {
    if (isSupported) {
      try {
        window.speechSynthesis.resume();
      } catch (err) {
        console.warn('SpeechSynthesis resume error:', err);
      }
    }
  }, [isSupported]);

  // Select voice and persist to settings
  const selectVoice = useCallback((voiceURI) => {
    const v = voices.find((item) => item.voiceURI === voiceURI);
    if (v) {
      setSelectedVoice(v);
      const settings = getSettings();
      saveSettings({ ...settings, voice_uri: voiceURI });
    }
  }, [voices]);

  // Set speech rate (0.8, 1.0, 1.2) and persist
  const setSpeechRate = useCallback((rate) => {
    const num = Math.min(Math.max(Number(rate) || 1.0, 0.5), 2.0);
    setSpeechRateState(num);
    const settings = getSettings();
    saveSettings({ ...settings, voice_speed: num });
  }, []);

  return {
    isSupported,
    isSpeaking,
    voices,
    selectedVoice,
    selectVoice,
    speechRate,
    setSpeechRate,
    speak,
    cancel,
    pause,
    resume,
  };
}
