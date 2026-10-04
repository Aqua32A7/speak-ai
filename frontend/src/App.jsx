import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import SetupPage from './pages/SetupPage';
import PracticePage from './pages/PracticePage';
import FeedbackPage from './pages/FeedbackPage';
import ProgressPage from './pages/ProgressPage';

import { fetchHealth, fetchTopic, analyzeSpeech, fetchFollowUp } from './services/api';
import {
  getSessions,
  saveSession,
  getRecentTopics,
  getStats,
  getInterviewReadiness,
  getStoredTheme,
  setStoredTheme,
} from './services/storage';
import { useSpeechRecognition } from './services/useSpeechRecognition';

export default function App() {
  // Navigation: 'home' | 'setup' | 'practice' | 'feedback' | 'progress'
  const [currentView, setCurrentView] = useState('home');

  // Theme
  const [theme, setTheme] = useState(getStoredTheme);

  // Health state
  const [health, setHealth] = useState(null);

  // Practice state
  const [activeTopic, setActiveTopic] = useState(null);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [isGeneratingTopic, setIsGeneratingTopic] = useState(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [topicError, setTopicError] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);

  // Storage state
  const [stats, setStats] = useState(getStats);
  const [readiness, setReadiness] = useState(getInterviewReadiness);
  const [sessions, setSessions] = useState(getSessions);

  // Speech Recognition hook
  const speechRecognition = useSpeechRecognition();

  // Apply theme class to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setStoredTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Check backend health on mount
  useEffect(() => {
    fetchHealth()
      .then((data) => setHealth(data))
      .catch((err) => {
        console.warn('Backend health check note:', err);
        setHealth({ status: 'offline', gemini_configured: false, model: 'Not connected' });
      });
  }, []);

  // Refresh storage metrics
  const refreshStorageData = useCallback(() => {
    setStats(getStats());
    setReadiness(getInterviewReadiness());
    setSessions(getSessions());
  }, []);

  // Generate topic from Gemini
  const handleGenerateTopic = async ({ difficulty, categoryFilter }) => {
    setIsGeneratingTopic(true);
    setTopicError(null);
    try {
      const recentTopics = getRecentTopics(15);
      const data = await fetchTopic(difficulty, categoryFilter, recentTopics);
      setActiveTopic({
        topic: data.topic,
        category: data.category,
        difficulty: data.difficulty,
        follow_up_question: data.follow_up_question,
        parentSessionId: null,
      });
      setCurrentView('practice');
    } catch (err) {
      console.error('Error generating topic:', err);
      setTopicError(err.message || 'Failed to generate topic from Gemini.');
    } finally {
      setIsGeneratingTopic(false);
    }
  };

  // Submit drill to Gemini for analysis
  const handleFinishDrill = async ({
    topic,
    transcript,
    durationSeconds,
    timeToFirstWord,
    longestPause,
    pausesOver2s,
    parentSessionId,
  }) => {
    setIsLoadingAnalysis(true);
    setAnalysisError(null);

    try {
      const analysisData = await analyzeSpeech({
        topic,
        transcript,
        durationSeconds,
        timeToFirstWord,
        longestPause,
        pausesOver2s,
        parentSessionId,
      });

      // Save drill session to localStorage
      const saved = saveSession({
        topic,
        category: activeTopic?.category || 'General',
        difficulty: activeTopic?.difficulty || 'Medium',
        transcript,
        duration_seconds: durationSeconds,
        ...analysisData,
        parent_session_id: parentSessionId,
      });

      // Refresh stats
      refreshStorageData();

      setCurrentAnalysis({
        ...analysisData,
        sessionId: saved?.id,
      });
      setCurrentView('feedback');
    } catch (err) {
      console.error('Error analyzing speech:', err);
      setAnalysisError(err.message || 'Failed to analyze speech response.');
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  // Start follow-up practice round
  const handleStartFollowUp = (followUpQuestion) => {
    setActiveTopic({
      topic: followUpQuestion,
      category: activeTopic?.category || 'Technical Interview',
      difficulty: activeTopic?.difficulty || 'Medium',
      follow_up_question: null,
      parentSessionId: currentAnalysis?.sessionId || null,
    });
    setCurrentAnalysis(null);
    setCurrentView('practice');
  };

  // Try again with identical topic
  const handleTryAgain = () => {
    setCurrentAnalysis(null);
    setCurrentView('practice');
  };

  // New topic flow
  const handleNewTopic = () => {
    setActiveTopic(null);
    setCurrentAnalysis(null);
    setCurrentView('setup');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        theme={theme}
        toggleTheme={toggleTheme}
        health={health}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentView === 'home' && (
          <HomePage
            stats={stats}
            onStartPractice={() => setCurrentView('setup')}
            onViewProgress={() => setCurrentView('progress')}
          />
        )}

        {currentView === 'setup' && (
          <SetupPage
            onGenerateTopic={handleGenerateTopic}
            isLoading={isGeneratingTopic}
            error={topicError}
            onClearError={() => setTopicError(null)}
          />
        )}

        {currentView === 'practice' && (
          <PracticePage
            topicData={activeTopic}
            speechRecognition={speechRecognition}
            onFinishDrill={handleFinishDrill}
            isLoadingAnalysis={isLoadingAnalysis}
            analysisError={analysisError}
            onClearAnalysisError={() => setAnalysisError(null)}
            onCancelDrill={() => setCurrentView('setup')}
          />
        )}

        {currentView === 'feedback' && (
          <FeedbackPage
            analysis={currentAnalysis}
            topicData={activeTopic}
            onTryAgain={handleTryAgain}
            onNewTopic={handleNewTopic}
            onStartFollowUp={handleStartFollowUp}
            onFinish={() => setCurrentView('progress')}
          />
        )}

        {currentView === 'progress' && (
          <ProgressPage
            stats={stats}
            readiness={readiness}
            sessions={sessions}
            onStartPractice={() => setCurrentView('setup')}
          />
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 py-6 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SpeakPrep AI • Real-Time 60-Second Speaking Drills</span>
          <span>Powered by Google Gemini 2.5 & Web Speech API</span>
        </div>
      </footer>
    </div>
  );
}
