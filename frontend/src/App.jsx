import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import SetupPage from './pages/SetupPage';
import DsaSetupPage from './pages/DsaSetupPage';
import CoreSetupPage from './pages/CoreSetupPage';
import PracticePage from './pages/PracticePage';
import FeedbackPage from './pages/FeedbackPage';
import DsaFeedbackPage from './pages/DsaFeedbackPage';
import CoreFeedbackPage from './pages/CoreFeedbackPage';
import DsaJourneyPage from './pages/DsaJourneyPage';
import ProgressPage from './pages/ProgressPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectSetupPage from './pages/ProjectSetupPage';
import ProjectFeedbackPage from './pages/ProjectFeedbackPage';
import SettingsPage from './pages/SettingsPage';
import OnboardingModal from './components/OnboardingModal';

import {
  fetchHealth,
  fetchTopic,
  analyzeSpeech,
  fetchFollowUp,
  fetchDsaQuestion,
  analyzeDsaAnswer,
  fetchDsaFollowUp,
  fetchCoreQuestion,
  analyzeCoreAnswer,
  fetchCoreFollowUp,
  fetchProjectQuestion,
  analyzeProjectAnswer,
  fetchProjectFollowUp,
} from './services/api';
import {
  getSessions,
  saveSession,
  getRecentTopics,
  getRecentDsaQuestions,
  getRecentCoreQuestions,
  getRecentProjectQuestions,
  getStats,
  getDsaStats,
  getCoreStats,
  getProjectStats,
  getUserProjects,
  getUserProfile,
  isOnboardingCompleted,
  getInterviewReadiness,
  getDsaJourneyBrief,
  getStoredTheme,
  setStoredTheme,
} from './services/storage';
import { useSpeechRecognition } from './services/useSpeechRecognition';

export default function App() {
  // Navigation: 'home' | 'setup' | 'practice' | 'feedback' | 'progress' | 'dsa_setup' | 'dsa_practice' | 'dsa_feedback' | 'core_setup' | 'core_practice' | 'core_feedback' | 'dsa_journey' | 'projects' | 'project_setup' | 'project_practice' | 'project_feedback' | 'settings'
  const [currentView, setCurrentView] = useState('home');

  // Theme
  const [theme, setTheme] = useState(getStoredTheme);

  // Health state
  const [health, setHealth] = useState(null);

  // Onboarding Modal
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Practice state
  const [activeTopic, setActiveTopic] = useState(null);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [isGeneratingTopic, setIsGeneratingTopic] = useState(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [topicError, setTopicError] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);

  // Interview Mode States
  const [dsaChainCount, setDsaChainCount] = useState(1);
  const [projectChainCount, setProjectChainCount] = useState(0);
  const [selectedProjectForDrill, setSelectedProjectForDrill] = useState(null);

  // Storage state
  const [stats, setStats] = useState(getStats);
  const [dsaStats, setDsaStats] = useState(getDsaStats);
  const [coreStats, setCoreStats] = useState(getCoreStats);
  const [projectStats, setProjectStats] = useState(getProjectStats);
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

  // Check first-time onboarding
  useEffect(() => {
    if (!isOnboardingCompleted()) {
      setShowOnboarding(true);
    }
  }, []);

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
    setCoreStats(getCoreStats());
    setProjectStats(getProjectStats());
    setReadiness(getInterviewReadiness());
    setSessions(getSessions());
  }, []);

  // Generate general topic from Gemini
  const handleGenerateTopic = async ({ difficulty, categoryFilter, projectBrief = null }) => {
    setIsGeneratingTopic(true);
    setTopicError(null);
    try {
      const recentTopics = getRecentTopics(15);
      const data = await fetchTopic(difficulty, categoryFilter, recentTopics, projectBrief);
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
  const handleGenerateDsaQuestion = async ({ subtopic, questionType, difficulty, journeyContext = null }) => {
    setIsGeneratingTopic(true);
    setTopicError(null);
    try {
      const recentQuestions = getRecentDsaQuestions(15);
      const data = await fetchDsaQuestion({
        difficulty,
        subtopicFilter: subtopic,
        typeFilter: questionType,
        recentQuestions,
        journeyContext,
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

  // Launch DSA Drill targeting a specific topic from DSA Journey page
  const handleStartDsaWithTopic = (topic) => {
    handleGenerateDsaQuestion({
      subtopic: topic,
      questionType: 'Explain an Approach',
      difficulty: 'Medium',
      journeyContext: getDsaJourneyBrief(),
    });
  };

  // Launch DSA Drill targeting an actual recently solved problem from DSA Journey page
  const handleStartDsaWithProblem = (problemTitle) => {
    const brief = getDsaJourneyBrief() || {};
    handleGenerateDsaQuestion({
      subtopic: 'Surprise Me',
      questionType: 'Explain an Approach',
      difficulty: 'Medium',
      journeyContext: {
        ...brief,
        recent_problems: [problemTitle, ...(brief.recent_problems || [])],
      },
    });
  };

  // Generate CS Core Fundamentals question from Gemini
  const handleGenerateCoreQuestion = async ({ subject, style, difficulty, setupMode }) => {
    setIsGeneratingTopic(true);
    setTopicError(null);
    try {
      const recentQuestions = getRecentCoreQuestions(15);
      const data = await fetchCoreQuestion({
        subject,
        style,
        difficulty,
        setupMode,
        recentQuestions,
      });

      setActiveTopic({
        topic: data.question,
        subject: data.subject,
        subtopic: data.subject,
        style: data.style,
        difficulty: data.difficulty,
        setup_mode: data.setup_mode,
        primer: data.primer,
        primer_analogy: data.primer_analogy,
        key_aspects: data.key_aspects || [],
        follow_up_question: data.follow_up_question,
        mode: 'core',
        parentSessionId: null,
        roundNumber: 1,
      });
      setCurrentView('core_practice');
    } catch (err) {
      console.error('Error generating CS Core question:', err);
      setTopicError(err.message || 'Failed to generate CS Fundamentals question from Gemini.');
    } finally {
      setIsGeneratingTopic(false);
    }
  };

  // Generate Project interview question from Gemini
  const handleStartProjectDrillFromSetup = async ({ project, difficulty, questionType }) => {
    setIsGeneratingTopic(true);
    setTopicError(null);
    try {
      const recentQuestions = getRecentProjectQuestions(15);
      const data = await fetchProjectQuestion({
        projectBrief: project,
        difficulty,
        recentQuestions,
        questionType,
      });

      setActiveTopic({
        topic: data.question,
        question_type: data.question_type || questionType,
        difficulty: data.difficulty || difficulty,
        key_points: data.key_points || [],
        follow_up_question: data.follow_up_question,
        project_brief: project,
        project_id: project.id,
        project_name: project.name,
        mode: 'project',
        parentSessionId: null,
        roundNumber: 1,
      });
      setSelectedProjectForDrill(project);
      setProjectChainCount(0);
      setCurrentView('project_practice');
    } catch (err) {
      console.error('Error generating project question:', err);
      setTopicError(err.message || 'Failed to generate project interview question.');
    } finally {
      setIsGeneratingTopic(false);
    }
  };

  const handleStartProjectInterview = (proj = null) => {
    if (proj && proj.id) {
      setSelectedProjectForDrill(proj);
      setCurrentView('project_setup');
      return;
    }
    const projects = getUserProjects();
    if (projects.length > 0) {
      setSelectedProjectForDrill(projects[0]);
      setCurrentView('project_setup');
    } else {
      setCurrentView('projects');
    }
  };

  // Submit drill to Gemini for analysis (General, DSA, CS Core, or Project)
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
    subject,
    mode = 'general',
  }) => {
    setIsLoadingAnalysis(true);
    setAnalysisError(null);

    const isProject = mode === 'project' || activeTopic?.mode === 'project';
    const isCore = mode === 'core' || activeTopic?.mode === 'core';
    const isDsa = mode === 'dsa' || activeTopic?.mode === 'dsa';

    try {
      if (isProject) {
        // Project Interview Drill Analysis
        const targetBrief = activeTopic?.project_brief || selectedProjectForDrill;
        const analysisData = await analyzeProjectAnswer({
          question: topic,
          questionType: activeTopic?.question_type || questionType || 'Project Architecture',
          projectBrief: targetBrief,
          keyPoints: keyPoints.length > 0 ? keyPoints : (activeTopic?.key_points || []),
          transcript,
          durationSeconds,
          timeToFirstWord,
          longestPause,
          pausesOver2s,
          parentSessionId,
          followUpChainCount: projectChainCount,
        });

        const saved = saveSession({
          mode: 'project',
          topic,
          project_id: activeTopic?.project_id || targetBrief?.id,
          project_name: activeTopic?.project_name || targetBrief?.name || 'Project Drill',
          question_type: activeTopic?.question_type || questionType || 'Project Architecture',
          difficulty: activeTopic?.difficulty || 'Medium',
          transcript,
          duration_seconds: durationSeconds,
          ...analysisData,
          parent_session_id: parentSessionId,
        });

        // Optionally fetch dynamic follow-up for round 2 or 3
        let nextFollowUp = activeTopic?.follow_up_question || null;
        if (projectChainCount < 2) {
          try {
            const followUpRes = await fetchProjectFollowUp({
              question: topic,
              transcript,
              projectBrief: targetBrief,
              chainCount: projectChainCount + 1,
            });
            if (followUpRes?.follow_up_question) {
              nextFollowUp = followUpRes.follow_up_question;
            }
          } catch (fErr) {
            console.warn('Could not generate dynamic Project follow-up:', fErr);
          }
        }

        setActiveTopic((prev) => ({
          ...prev,
          follow_up_question: projectChainCount >= 2 ? null : nextFollowUp,
        }));

        refreshStorageData();
        setCurrentAnalysis({
          ...analysisData,
          sessionId: saved?.id,
        });
        setCurrentView('project_feedback');
      } else if (isCore) {
        // CS Core Fundamentals Analysis
        const analysisData = await analyzeCoreAnswer({
          question: topic,
          subject: subject || activeTopic?.subject || 'Operating Systems',
          transcript,
          durationSeconds,
          timeToFirstWord,
          longestPause,
          pausesOver2s,
          parentSessionId,
        });

        const saved = saveSession({
          mode: 'core',
          topic,
          subject: subject || activeTopic?.subject || 'Operating Systems',
          subtopic: subtopic || activeTopic?.subtopic || activeTopic?.subject || 'Operating Systems',
          style: activeTopic?.style || 'Standard Technical Definition',
          difficulty: activeTopic?.difficulty || 'Medium',
          setup_mode: activeTopic?.setup_mode || 'test',
          primer: activeTopic?.primer,
          primer_analogy: activeTopic?.primer_analogy,
          key_aspects: activeTopic?.key_aspects || [],
          transcript,
          duration_seconds: durationSeconds,
          ...analysisData,
          parent_session_id: parentSessionId,
        });

        // Optionally fetch dynamic contextual follow-up
        let nextFollowUp = activeTopic?.follow_up_question || null;
        try {
          const followUpRes = await fetchCoreFollowUp({
            question: topic,
            subject: subject || activeTopic?.subject || 'Operating Systems',
            transcript,
          });
          if (followUpRes?.follow_up_question) {
            nextFollowUp = followUpRes.follow_up_question;
          }
        } catch (fErr) {
          console.warn('Could not generate dynamic Core follow-up, keeping existing:', fErr);
        }

        setActiveTopic((prev) => ({
          ...prev,
          follow_up_question: nextFollowUp,
        }));

        refreshStorageData();
        setCurrentAnalysis({
          ...analysisData,
          sessionId: saved?.id,
        });
        setCurrentView('core_feedback');
      } else if (isDsa) {
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

  // Start follow-up round for CS Core Fundamentals
  const handleStartCoreFollowUp = (followUpQuestion) => {
    setActiveTopic({
      topic: followUpQuestion,
      subject: activeTopic?.subject || 'Operating Systems',
      subtopic: activeTopic?.subtopic || activeTopic?.subject || 'Operating Systems',
      style: 'Trade-off & Deep Dive',
      difficulty: activeTopic?.difficulty || 'Medium',
      setup_mode: 'test',
      primer: null,
      primer_analogy: null,
      key_aspects: [],
      follow_up_question: null,
      parentSessionId: currentAnalysis?.sessionId || null,
      mode: 'core',
      roundNumber: (activeTopic?.roundNumber || 1) + 1,
    });
    setCurrentAnalysis(null);
    setCurrentView('core_practice');
  };

  // Start follow-up round for Project Interview
  const handleStartProjectFollowUp = (followUpQuestion) => {
    if (projectChainCount >= 2) return;
    const nextRound = projectChainCount + 1;
    setProjectChainCount(nextRound);

    setActiveTopic({
      topic: followUpQuestion,
      question_type: 'Architecture Defense & Follow-up',
      difficulty: activeTopic?.difficulty || 'Medium',
      key_points: [],
      follow_up_question: null,
      project_brief: activeTopic?.project_brief || selectedProjectForDrill,
      project_id: activeTopic?.project_id || selectedProjectForDrill?.id,
      project_name: activeTopic?.project_name || selectedProjectForDrill?.name,
      parentSessionId: currentAnalysis?.sessionId || null,
      mode: 'project',
      roundNumber: nextRound + 1,
    });
    setCurrentAnalysis(null);
    setCurrentView('project_practice');
  };

  // Try again with identical topic / question
  const handleTryAgain = () => {
    setCurrentAnalysis(null);
    if (activeTopic?.mode === 'project') {
      setCurrentView('project_practice');
    } else if (activeTopic?.mode === 'core') {
      setCurrentView('core_practice');
    } else if (activeTopic?.mode === 'dsa') {
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

  // New Core question flow
  const handleNewCoreQuestion = () => {
    setActiveTopic(null);
    setCurrentAnalysis(null);
    setCurrentView('core_setup');
  };

  const isCurrentDsa =
    currentView === 'dsa_setup' ||
    currentView === 'dsa_practice' ||
    currentView === 'dsa_feedback' ||
    activeTopic?.mode === 'dsa';

  const isCurrentCore =
    currentView === 'core_setup' ||
    currentView === 'core_practice' ||
    currentView === 'core_feedback' ||
    activeTopic?.mode === 'core';

  const isCurrentProject =
    currentView === 'projects' ||
    currentView === 'project_setup' ||
    currentView === 'project_practice' ||
    currentView === 'project_feedback' ||
    activeTopic?.mode === 'project';

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
        isCoreMode={isCurrentCore}
        isProjectMode={isCurrentProject}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-24 lg:pb-12">
        {currentView === 'home' && (
          <HomePage
            stats={stats}
            onStartPractice={() => setCurrentView('setup')}
            onStartProjectPractice={() => handleStartProjectInterview()}
            onStartDsaPractice={() => setCurrentView('dsa_setup')}
            onStartCorePractice={() => setCurrentView('core_setup')}
            onViewProjects={() => setCurrentView('projects')}
            onViewJourney={() => setCurrentView('dsa_journey')}
            onViewProgress={() => setCurrentView('progress')}
          />
        )}

        {/* My Projects Management Hub */}
        {currentView === 'projects' && (
          <ProjectsPage
            onStartProjectInterview={(proj) => {
              setSelectedProjectForDrill(proj);
              setCurrentView('project_setup');
            }}
          />
        )}

        {/* Project Setup Page */}
        {currentView === 'project_setup' && (
          <ProjectSetupPage
            initialProject={selectedProjectForDrill}
            onStartDrill={handleStartProjectDrillFromSetup}
            onNavigateToProjects={() => setCurrentView('projects')}
          />
        )}

        {/* Settings Page */}
        {currentView === 'settings' && (
          <SettingsPage
            onDataCleared={refreshStorageData}
            onProfileUpdated={refreshStorageData}
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

        {/* CS Core Fundamentals Setup */}
        {currentView === 'core_setup' && (
          <CoreSetupPage
            onGenerateQuestion={handleGenerateCoreQuestion}
            isLoading={isGeneratingTopic}
            error={topicError}
            onClearError={() => setTopicError(null)}
          />
        )}

        {/* Practice Arena (Used for General, DSA, CS Core, and Project drills) */}
        {(currentView === 'practice' || currentView === 'dsa_practice' || currentView === 'core_practice' || currentView === 'project_practice') && (
          <PracticePage
            topicData={activeTopic}
            speechRecognition={speechRecognition}
            onFinishDrill={handleFinishDrill}
            isLoadingAnalysis={isLoadingAnalysis}
            analysisError={analysisError}
            onClearAnalysisError={() => setAnalysisError(null)}
            onCancelDrill={() => {
              if (activeTopic?.mode === 'project') setCurrentView('project_setup');
              else if (activeTopic?.mode === 'core') setCurrentView('core_setup');
              else if (activeTopic?.mode === 'dsa') setCurrentView('dsa_setup');
              else setCurrentView('setup');
            }}
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

        {/* CS Core Fundamentals Feedback */}
        {currentView === 'core_feedback' && (
          <CoreFeedbackPage
            analysis={currentAnalysis}
            topicData={activeTopic}
            onTryAgain={handleTryAgain}
            onNewQuestion={handleNewCoreQuestion}
            onStartFollowUp={handleStartCoreFollowUp}
            onFinish={() => setCurrentView('progress')}
          />
        )}

        {/* Project Drill Feedback */}
        {currentView === 'project_feedback' && (
          <ProjectFeedbackPage
            analysis={currentAnalysis}
            questionData={activeTopic}
            projectBrief={activeTopic?.project_brief || selectedProjectForDrill}
            onStartFollowUp={handleStartProjectFollowUp}
            onPracticeAgain={handleTryAgain}
            onDone={() => setCurrentView('progress')}
            chainCount={projectChainCount}
          />
        )}

        {/* DSA Journey & Coding Profile Analysis */}
        {currentView === 'dsa_journey' && (
          <DsaJourneyPage
            onStartDsaPracticeWithTopic={handleStartDsaWithTopic}
            onStartDsaPracticeWithProblem={handleStartDsaWithProblem}
          />
        )}

        {/* Progress & Analytics Dashboard */}
        {currentView === 'progress' && (
          <ProgressPage
            stats={stats}
            dsaStats={dsaStats}
            coreStats={coreStats}
            projectStats={projectStats}
            readiness={readiness}
            sessions={sessions}
            onStartPractice={() => setCurrentView('setup')}
            onStartProjectPractice={() => handleStartProjectInterview()}
            onStartDsaPractice={() => setCurrentView('dsa_setup')}
            onStartCorePractice={() => setCurrentView('core_setup')}
          />
        )}
      </main>

      {/* First-Time Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onProfileSaved={() => {
          refreshStorageData();
          setShowOnboarding(false);
        }}
      />

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
