import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getSettings, saveSettings, isVoiceMuted } from './storage.js';
import { chunkTextForTTS } from '../utils/speechSummary.js';

/**
 * Score a voice according to audio fidelity, naturalness, and conversational suitability.
 * State-of-the-art neural and natural voices (Edge Azure Natural, Google Cloud, Apple Enhanced/Siri)
 * are prioritized over robotic, metallic, or novelty synthesizers.
 */
export function scoreVoice(v) {
  if (!v || !v.name) return -100;
  const name = v.name.toLowerCase();
  const lang = (v.lang || '').toLowerCase();

  // Strongly deprioritize robotic novelty, novelty cartoon, or obsolete synthesizers
  if (
    /espeak|festival|fred|albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|pipe organ|trinoids|whisper|zarvox|junior|kathy|princess|vicki|bruce|agnes|ralph/i.test(
      name
    )
  ) {
    return -100;
  }

  // Deprioritize compact/low-bitrate legacy voices
  if (/compact/i.test(name)) return -20;
  if (/microsoft (david|zira|mark) desktop/i.test(name)) return -10;
  if (name === 'alex' || name.startsWith('alex ')) return -5;

  let score = 10;

  // Language priority: prioritize English accents for interview simulation
  if (lang.startsWith('en')) {
    score += 20;
    if (lang === 'en-us' || lang === 'en_us') score += 15;
    else if (lang === 'en-gb' || lang === 'en_gb') score += 14;
    else if (lang === 'en-in' || lang === 'en_in') score += 13;
    else if (lang === 'en-au' || lang === 'en_au') score += 12;
    else if (lang === 'en-ca' || lang === 'en_ca') score += 12;
  } else {
    // Deprioritize non-English voices
    return -50;
  }

  // Tier 1: Microsoft Edge Online Natural Voices (Azure Neural TTS stream)
  if (/online.*natural|natural.*online/i.test(name)) {
    score += 100;
  } else if (/natural/i.test(name)) {
    score += 80;
  } else if (/neural/i.test(name)) {
    score += 80;
  }

  // Tier 2: Apple Enhanced & Siri / Premium Voices (iOS & macOS high fidelity)
  if (/enhanced/i.test(name)) {
    score += 75;
  } else if (/siri/i.test(name)) {
    score += 70;
  } else if (/premium/i.test(name)) {
    score += 65;
  }

  // Tier 3: Google Chrome / Android Neural TTS
  if (/google/i.test(name)) {
    score += 60;
  }

  // Cloud/Remote synthesis bonus (Edge / Chrome stream high-quality remote neural models)
  if (v.localService === false) {
    score += 25;
  }

  // High quality natural voice personas
  if (
    /jenny|guy|aria|sonia|ryan|neerja|prabhat|ava|samantha|zoe|serena|oliver|allison|daniel|karen|matthew|joanna|amy/i.test(
      name
    )
  ) {
    score += 20;
  }

  if (v.default) {
    score += 5;
  }

  return score;
}

/**
 * Determine if a voice qualifies as modern/natural.
 */
export function isModernVoice(v) {
  return scoreVoice(v) >= 60;
}

/**
 * Get an informational badge string for UI display.
 */
export function getVoiceBadge(voice) {
  if (!voice) return '';
  const name = (voice.name || '').toLowerCase();
  if (/online.*natural|natural.*online/i.test(name)) return '✨ Neural Natural';
  if (/neural/i.test(name)) return '✨ Neural';
  if (/enhanced/i.test(name)) return '✨ Enhanced';
  if (/google/i.test(name)) return '✨ Google Natural';
  if (/siri/i.test(name)) return '✨ Siri';
  if (/premium/i.test(name)) return '✨ Premium';
  if (voice.localService === false) return '✨ Cloud Voice';
  return '';
}

/**
 * Custom React hook wrapping the browser SpeechSynthesis API.
 * Features:
 * - Prioritizes modern neural/natural voices across Edge, Chrome, Safari, and Android
 * - Sequenced sentence chunking to defeat Chrome's 15-second speech cutoff bug
 * - Prevents premature utterance garbage collection
 * - Natural 65ms conversational cadence between utterance sentences
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
  const activeUtteranceRef = useRef(null);
  const interChunkTimerRef = useRef(null);

  // Load and sort available voices
  const populateVoices = useCallback(() => {
    if (!isSupported) return;

    try {
      const allVoices = window.speechSynthesis.getVoices() || [];
      if (!allVoices || allVoices.length === 0) return;

      // Filter out joke / unusable novelty voices and sort by quality score descending
      const filteredAndScored = allVoices
        .filter((v) => {
          const name = (v.name || '').toLowerCase();
          return !/bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|pipe organ|trinoids|whisper|zarvox/i.test(name);
        })
        .sort((a, b) => scoreVoice(b) - scoreVoice(a));

      // Separate into English vs other languages (English prioritized first)
      const englishVoices = filteredAndScored.filter(
        (v) => v.lang && (v.lang.startsWith('en') || v.lang.startsWith('EN'))
      );
      const availableVoices = englishVoices.length > 0 ? englishVoices : filteredAndScored;

      setVoices(availableVoices);

      const settings = getSettings();
      const savedUri = settings.voice_uri;

      let chosenVoice = null;

      // 1. If user previously selected a voice, check if it's available
      if (savedUri) {
        const found = availableVoices.find((v) => v.voiceURI === savedUri);
        if (found) {
          const isRobotic = scoreVoice(found) < 20;
          const hasModernVoice = availableVoices.length > 0 && isModernVoice(availableVoices[0]);
          // If the previously saved voice was an old default robotic voice (like Alex) and modern voices exist,
          // upgrade to modern voice. Otherwise honor user's choice.
          if (!isRobotic || !hasModernVoice) {
            chosenVoice = found;
          }
        }
      }

      // 2. If no valid saved voice, auto-select the highest-scoring modern voice!
      if (!chosenVoice && availableVoices.length > 0) {
        chosenVoice = availableVoices[0];
      }

      if (chosenVoice) {
        setSelectedVoice(chosenVoice);
      }
    } catch (err) {
      console.warn('Could not retrieve speech synthesis voices:', err);
    }
  }, [isSupported]);

  // Handle voiceschanged event and initial load with fallback retries
  useEffect(() => {
    if (!isSupported) return;

    populateVoices();

    const handleVoicesChanged = () => {
      populateVoices();
    };

    if (window.speechSynthesis.addEventListener) {
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    }
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
    }

    // Fallback retries for mobile Safari / Chrome where voices load asynchronously
    const t1 = setTimeout(populateVoices, 150);
    const t2 = setTimeout(populateVoices, 600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (window.speechSynthesis.removeEventListener) {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      }
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
    activeUtteranceRef.current = null;

    if (interChunkTimerRef.current) {
      clearTimeout(interChunkTimerRef.current);
      interChunkTimerRef.current = null;
    }

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
      activeUtteranceRef.current = null;
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
      // Ensure audio context is unpaused
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(chunkText);
      // Retain reference to prevent premature browser garbage collection
      activeUtteranceRef.current = utterance;

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
        activeUtteranceRef.current = null;
        if (!isCanceledRef.current) {
          currentChunkIndexRef.current += 1;
          // Natural conversational pause between sentences (65ms)
          interChunkTimerRef.current = setTimeout(() => {
            playNextChunk();
          }, 65);
        }
      };

      utterance.onerror = (e) => {
        activeUtteranceRef.current = null;
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
          interChunkTimerRef.current = setTimeout(() => {
            playNextChunk();
          }, 65);
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('SpeechSynthesis speak call failed:', err);
      activeUtteranceRef.current = null;
      if (onErrorCallbackRef.current) {
        onErrorCallbackRef.current(err);
      }
      setIsSpeaking(false);
    }
  }, [isSupported, selectedVoice, speechRate]);

  /**
   * Speak a block of text with sequential chunking.
   */
  const speak = useCallback((text, options = {}) => {
    if (!isSupported || !text || isVoiceMuted()) {
      if (options.onEnd) options.onEnd();
      return;
    }

    // Cancel any active speech first
    cancel();

    // Ensure audio subsystem is active
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch (_) {}

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

    // Small delay to allow browser engine to clear previous cancel()
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

  // Filtered voice groups for UI display
  const modernVoices = voices.filter(isModernVoice);
  const standardVoices = voices.filter((v) => !isModernVoice(v));
  const isModernVoiceSelected = selectedVoice ? isModernVoice(selectedVoice) : false;

  return {
    isSupported,
    isSpeaking,
    voices,
    modernVoices,
    standardVoices,
    selectedVoice,
    isModernVoiceSelected,
    selectVoice,
    speechRate,
    setSpeechRate,
    speak,
    cancel,
    pause,
    resume,
  };
}
