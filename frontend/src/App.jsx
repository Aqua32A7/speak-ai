import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import SetupPage from './pages/SetupPage';
import DsaSetupPage from './pages/DsaSetupPage';
import PracticePage from './pages/PracticePage';
import FeedbackPage from './pages/FeedbackPage';
import DsaFeedbackPage from './pages/DsaFeedbackPage';
import ProgressPage from './pages/ProgressPage';

import {
  fetchHealth,
  fetchTopic,
  analyzeSpeech,
  fetchFollowUp,
  fetchDsaQuestion,
  analyzeDsaAnswer,
  fetchDsaFollowUp,
} from './services/api';
import {
  getSessions,
  saveSession,
  getRecentTopics,
  getRecentDsaQuestions,
  getStats,
  getDsaStats,
  getInterviewReadiness,
  getStoredTheme,
  setStoredTheme,
} from './services/storage';
import { useSpeechRecognition } from './services/useSpeechRecognition';

export default function App() {
  // Navigation: 'home' | 'setup' | 'practice' | 'feedback' | 'progress' | 'dsa_setup' | 'dsa_practice' | 'dsa_feedback'
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

  // DSA Interview Mode State
  const [dsaChainCount, setDsaChainCount] = useState(1);

  // Storage state
  const [stats, setStats] = useState(getStats);
  const [dsaStats, setDsaStats] = useState(getDsaStats);
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
    setDsaStats(getDsaStats());
    setReadiness(getInterviewReadiness());
    setSessions(getSessions());
  }, []);

  // Generate general topic from Gemini
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
        mode: 'general',
        roundNumber: 1,
      });
      setCurrentView('practice');
    } catch (err) {
      console.error('Error generating topic:', err);
      setTopicError(err.message || 'Failed to generate topic from Gemini.');
    } finally {
      setIsGeneratingTopic(false);
    }
  };

  // Generate DSA interview question from Gemini
  const handleGenerateDsaQuestion = async ({ subtopic, questionType, difficulty }) => {
    setIsGeneratingTopic(true);
    setTopicError(null);
    try {
      const recentQuestions = getRecentDsaQuestions(15);
      const data = await fetchDsaQuestion({
        difficulty,
        subtopicFilter: subtopic,
        typeFilter: questionType,
        recentQuestions,
      });

      setActiveTopic({
        topic: data.question,
        subtopic: data.subtopic,
        question_type: data.question_type,
        difficulty: data.difficulty,
        key_points: data.key_points || [],
        follow_up_question: data.follow_up_question,
        mode: 'dsa',
        parentSessionId: null,
        roundNumber: 1,
      });
      setDsaChainCount(1);
      setCurrentView('dsa_practice');
    } catch (err) {
      console.error('Error generating DSA question:', err);
      setTopicError(err.message || 'Failed to generate DSA question from Gemini.');
    } finally {
      setIsGeneratingTopic(false);
    }
  };

  // Submit drill to Gemini for analysis (General or DSA)
  const handleFinishDrill = async ({
    topic,
    transcript,
    durationSeconds,
    timeToFirstWord,
    longestPause,
    pausesOver2s,
    parentSessionId,
    keyPoints = [],
    subtopic,
    questionType,
    mode = 'general',
  }) => {
    setIsLoadingAnalysis(true);
    setAnalysisError(null);

    const isDsa = mode === 'dsa' || activeTopic?.mode === 'dsa';

    try {
      if (isDsa) {
        // DSA Analysis
        const analysisData = await analyzeDsaAnswer({
          question: topic,
          transcript,
          keyPoints: keyPoints.length > 0 ? keyPoints : (activeTopic?.key_points || []),
          durationSeconds,
          timeToFirstWord,
          longestPause,
          pausesOver2s,
          parentSessionId,
          followUpChainCount: dsaChainCount,
        });

        // Save DSA drill session to localStorage
        const saved = saveSession({
          mode: 'dsa',
          topic,
          subtopic: subtopic || activeTopic?.subtopic || 'General DSA',
          question_type: questionType || activeTopic?.question_type || 'Theory/Concept',
          difficulty: activeTopic?.difficulty || 'Medium',
          transcript,
          duration_seconds: durationSeconds,
          ...analysisData,
          parent_session_id: parentSessionId,
        });

        // Optionally fetch dynamic contextual follow-up if chain < 3
        let nextFollowUp = activeTopic?.follow_up_question || null;
        if (dsaChainCount < 3) {
          try {
            const followUpRes = await fetchDsaFollowUp({
              question: topic,
              transcript,
              chainCount: dsaChainCount,
            });
            if (followUpRes?.follow_up_question) {
              nextFollowUp = followUpRes.follow_up_question;
            }
          } catch (fErr) {
            console.warn('Could not generate dynamic follow-up, keeping existing:', fErr);
          }
        }

        setActiveTopic((prev) => ({
          ...prev,
          follow_up_question: dsaChainCount >= 3 ? null : nextFollowUp,
        }));

        refreshStorageData();
        setCurrentAnalysis({
          ...analysisData,
          sessionId: saved?.id,
        });
        setCurrentView('dsa_feedback');
      } else {
        // General Drill Analysis
        const analysisData = await analyzeSpeech({
          topic,
          transcript,
          durationSeconds,
          timeToFirstWord,
          longestPause,
          pausesOver2s,
          parentSessionId,
        });

        const saved = saveSession({
          mode: 'general',
          topic,
          category: activeTopic?.category || 'General',
          difficulty: activeTopic?.difficulty || 'Medium',
          transcript,
          duration_seconds: durationSeconds,
          ...analysisData,
          parent_session_id: parentSessionId,
        });

        refreshStorageData();
        setCurrentAnalysis({
          ...analysisData,
          sessionId: saved?.id,
        });
        setCurrentView('feedback');
      }
    } catch (err) {
      console.error('Error analyzing speech:', err);
      setAnalysisError(err.message || 'Failed to analyze speech response.');
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  // Start follow-up practice round for general practice
  const handleStartFollowUp = (followUpQuestion) => {
    setActiveTopic({
      topic: followUpQuestion,
      category: activeTopic?.category || 'Technical Interview',
      difficulty: activeTopic?.difficulty || 'Medium',
      follow_up_question: null,
      parentSessionId: currentAnalysis?.sessionId || null,
      mode: 'general',
      roundNumber: 2,
    });
    setCurrentAnalysis(null);
    setCurrentView('practice');
  };

  // Start follow-up round for DSA interview
  const handleStartDsaFollowUp = (followUpQuestion) => {
    if (dsaChainCount >= 3) return;
    const nextRound = dsaChainCount + 1;
    setDsaChainCount(nextRound);

    setActiveTopic({
      topic: followUpQuestion,
      subtopic: activeTopic?.subtopic || 'General DSA',
      question_type: 'Follow-up Defense',
      difficulty: activeTopic?.difficulty || 'Medium',
      key_points: [],
      follow_up_question: null,
      parentSessionId: currentAnalysis?.sessionId || null,
      mode: 'dsa',
      roundNumber: nextRound,
    });
    setCurrentAnalysis(null);
    setCurrentView('dsa_practice');
  };

  // Try again with identical topic / question
  const handleTryAgain = () => {
    setCurrentAnalysis(null);
    if (activeTopic?.mode === 'dsa') {
      setCurrentView('dsa_practice');
    } else {
      setCurrentView('practice');
    }
  };

  // New general topic flow
  const handleNewTopic = () => {
    setActiveTopic(null);
    setCurrentAnalysis(null);
    setCurrentView('setup');
  };

  // New DSA question flow
  const handleNewDsaQuestion = () => {
    setActiveTopic(null);
    setCurrentAnalysis(null);
    setDsaChainCount(1);
    setCurrentView('dsa_setup');
  };

  const isCurrentDsa =
    currentView === 'dsa_setup' ||
    currentView === 'dsa_practice' ||
    currentView === 'dsa_feedback' ||
    activeTopic?.mode === 'dsa';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        theme={theme}
        toggleTheme={toggleTheme}
        health={health}
        isDsaMode={isCurrentDsa}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentView === 'home' && (
          <HomePage
            stats={stats}
            onStartPractice={() => setCurrentView('setup')}
            onStartDsaPractice={() => setCurrentView('dsa_setup')}
            onViewProgress={() => setCurrentView('progress')}
          />
        )}

        {/* General Practice Setup */}
        {currentView === 'setup' && (
          <SetupPage
            onGenerateTopic={handleGenerateTopic}
            isLoading={isGeneratingTopic}
            error={topicError}
            onClearError={() => setTopicError(null)}
          />
        )}

        {/* DSA Setup */}
        {currentView === 'dsa_setup' && (
          <DsaSetupPage
            onGenerateQuestion={handleGenerateDsaQuestion}
            isLoading={isGeneratingTopic}
            error={topicError}
            onClearError={() => setTopicError(null)}
          />
        )}

        {/* Practice Arena (Used for both General and DSA drills) */}
        {(currentView === 'practice' || currentView === 'dsa_practice') && (
          <PracticePage
            topicData={activeTopic}
            speechRecognition={speechRecognition}
            onFinishDrill={handleFinishDrill}
            isLoadingAnalysis={isLoadingAnalysis}
            analysisError={analysisError}
            onClearAnalysisError={() => setAnalysisError(null)}
            onCancelDrill={() => setCurrentView(activeTopic?.mode === 'dsa' ? 'dsa_setup' : 'setup')}
          />
        )}

        {/* General Drill Feedback */}
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

        {/* DSA Interview Feedback */}
        {currentView === 'dsa_feedback' && (
          <DsaFeedbackPage
            analysis={currentAnalysis}
            topicData={activeTopic}
            onTryAgain={handleTryAgain}
            onNewQuestion={handleNewDsaQuestion}
            onStartFollowUp={handleStartDsaFollowUp}
            onFinish={() => setCurrentView('progress')}
            chainCount={dsaChainCount}
          />
        )}

        {/* Progress & Analytics Dashboard */}
        {currentView === 'progress' && (
          <ProgressPage
            stats={stats}
            dsaStats={dsaStats}
            readiness={readiness}
            sessions={sessions}
            onStartPractice={() => setCurrentView('setup')}
            onStartDsaPractice={() => setCurrentView('dsa_setup')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 py-6 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SpeakPrep AI • Real-Time 60-Second Speaking Drills</span>
          <span>Powered by Google Gemini 2.5 & Web Speech API</span>
        </div>
      </footer>
    </div>
  );
}
