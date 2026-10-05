/**
 * LocalStorage helpers for SpeakPrep AI.
 * Stores only transcripts, scores, feedback, topics, and metrics.
 * NEVER stores raw audio.
 */

const STORAGE_KEY_SESSIONS = 'speakprep_sessions_v1';
const STORAGE_KEY_THEME = 'speakprep_theme';
const STORAGE_KEY_PROFILE = 'speakprep_user_profile_v1';
const STORAGE_KEY_PROJECTS = 'speakprep_projects_v1';
const STORAGE_KEY_SETTINGS = 'speakprep_settings_v1';
const STORAGE_KEY_ONBOARDING = 'speakprep_onboarding_completed';

/**
 * Retrieve all practice sessions ordered newest first
 */
export function getSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to parse sessions from localStorage:', err);
    return [];
  }
}

/**
 * Save a completed practice session
 */
export function saveSession(session) {
  try {
    const sessions = getSessions();
    const newSession = {
      id: session.id || `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: session.timestamp || new Date().toISOString(),
      topic: session.topic || '',
      category: session.category || 'General',
      difficulty: session.difficulty || 'Medium',
      transcript: session.transcript || '',
      duration_seconds: session.duration_seconds || 60,
      overall_score: session.overall_score || 0,
      fluency_score: session.fluency_score || 0,
      clarity_score: session.clarity_score || 0,
      grammar_score: session.grammar_score || 0,
      relevance_score: session.relevance_score || 0,
      confidence_score: session.confidence_score || 0,
      technical_depth_score: session.technical_depth_score || 0,
      words_per_minute: session.words_per_minute || 0,
      filler_words_count: session.filler_words_count || 0,
      filler_words_breakdown: session.filler_words_breakdown || {},
      strengths: session.strengths || [],
      improvements: session.improvements || [],
      better_phrases: session.better_phrases || [],
      sample_answer: session.sample_answer || '',
      next_focus_area: session.next_focus_area || '',
      parent_session_id: session.parent_session_id || null,
      time_to_first_word_seconds: session.time_to_first_word_seconds || 0,
      longest_pause_seconds: session.longest_pause_seconds || 0,
      pauses_over_2s_count: session.pauses_over_2s_count || 0,
      // DSA & Core Mode fields
      mode: session.mode || 'general',
      subtopic: session.subtopic || '',
      question_type: session.question_type || '',
      concept_correctness: session.concept_correctness || 0,
      explanation_clarity: session.explanation_clarity || 0,
      structure: session.structure || 0,
      complexity_awareness: session.complexity_awareness || 0,
      edge_case_awareness: session.edge_case_awareness || 0,
      key_points: session.key_points || [],
      covered_points: session.covered_points || [],
      missed_points: session.missed_points || [],
      misconceptions: session.misconceptions || [],
      // CS Core Fundamentals Mode fields
      subject: session.subject || '',
      concept_accuracy: session.concept_accuracy || 0,
      depth: session.depth || 0,
      examples_and_analogies: session.examples_and_analogies || 0,
      refresher: session.refresher || null,
      // Project Mode fields
      project_id: session.project_id || null,
      project_name: session.project_name || '',
      ownership_score: session.ownership_score || 0,
      concrete_details_score: session.concrete_details_score || 0,
      ownership_feedback: session.ownership_feedback || '',
    };

    const updated = [newSession, ...sessions];
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(updated));
    return newSession;
  } catch (err) {
    console.error('Failed to save session to localStorage:', err);
    return null;
  }
}

/**
 * Get recent topic strings to pass to Gemini to avoid duplicates
 */
export function getRecentTopics(limit = 15) {
  const sessions = getSessions();
  const topics = [];
  const seen = new Set();
  for (const s of sessions) {
    if (s.topic && !seen.has(s.topic.toLowerCase())) {
      seen.add(s.topic.toLowerCase());
      topics.push(s.topic);
      if (topics.length >= limit) break;
    }
  }
  return topics;
}

/**
 * Get recent DSA questions to pass to Gemini to avoid duplicates
 */
export function getRecentDsaQuestions(limit = 15) {
  const sessions = getSessions();
  const questions = [];
  const seen = new Set();
  for (const s of sessions) {
    if (s.mode === 'dsa' && s.topic && !seen.has(s.topic.toLowerCase())) {
      seen.add(s.topic.toLowerCase());
      questions.push(s.topic);
      if (questions.length >= limit) break;
    }
  }
  return questions;
}

/**
 * Compute aggregate DSA speaking statistics
 */
export function getDsaStats() {
  const sessions = getSessions().filter(s => s.mode === 'dsa');
  const total = sessions.length;

  if (total === 0) {
    return {
      total_dsa: 0,
      avg_overall_score: 0,
      avg_concept_score: 0,
      avg_clarity_score: 0,
      avg_structure_score: 0,
      avg_complexity_score: 0,
      avg_edge_case_score: 0,
      subtopic_stats: {},
      weakest_subtopics: [],
      recent_dsa_questions: [],
    };
  }

  let totalOverall = 0;
  let totalConcept = 0;
  let totalClarity = 0;
  let totalStructure = 0;
  let totalComplexity = 0;
  let totalEdgeCase = 0;
  const subtopicMap = {};

  for (const s of sessions) {
    totalOverall += s.overall_score || 0;
    totalConcept += s.concept_correctness || 0;
    totalClarity += s.explanation_clarity || 0;
    totalStructure += s.structure || 0;
    totalComplexity += s.complexity_awareness || 0;
    totalEdgeCase += s.edge_case_awareness || 0;

    const sub = s.subtopic || 'General DSA';
    if (!subtopicMap[sub]) {
      subtopicMap[sub] = { count: 0, total_score: 0, total_concept: 0, total_complexity: 0 };
    }
    subtopicMap[sub].count++;
    subtopicMap[sub].total_score += s.overall_score || 0;
    subtopicMap[sub].total_concept += s.concept_correctness || 0;
    subtopicMap[sub].total_complexity += s.complexity_awareness || 0;
  }

  const subtopic_stats = {};
  const subtopicArray = [];

  for (const [sub, data] of Object.entries(subtopicMap)) {
    const avgScore = Number((data.total_score / data.count).toFixed(1));
    subtopic_stats[sub] = {
      count: data.count,
      avg_score: avgScore,
      avg_concept: Number((data.total_concept / data.count).toFixed(1)),
      avg_complexity: Number((data.total_complexity / data.count).toFixed(1)),
    };
    subtopicArray.push({
      subtopic: sub,
      count: data.count,
      avg_score: avgScore,
    });
  }

  // Weakest subtopics (sorted by lowest avg_score)
  subtopicArray.sort((a, b) => a.avg_score - b.avg_score);
  const weakest_subtopics = subtopicArray.slice(0, 3);

  const recent_dsa_questions = sessions.slice(0, 5).map(s => ({
    id: s.id,
    topic: s.topic,
    subtopic: s.subtopic,
    question_type: s.question_type,
    score: s.overall_score,
    timestamp: s.timestamp,
  }));

  return {
    total_dsa: total,
    avg_overall_score: Number((totalOverall / total).toFixed(1)),
    avg_concept_score: Number((totalConcept / total).toFixed(1)),
    avg_clarity_score: Number((totalClarity / total).toFixed(1)),
    avg_structure_score: Number((totalStructure / total).toFixed(1)),
    avg_complexity_score: Number((totalComplexity / total).toFixed(1)),
    avg_edge_case_score: Number((totalEdgeCase / total).toFixed(1)),
    subtopic_stats,
    weakest_subtopics,
    recent_dsa_questions,
  };
}

export const CORE_SUBJECTS = [
  'Operating Systems',
  'DBMS and SQL',
  'Computer Networks',
  'Object-Oriented Programming',
  'Computer Architecture basics',
  'System Design basics',
  'Web, HTTP and APIs',
  'Security basics',
  'Software Engineering and SDLC',
  'Version Control (Git)',
];

/**
 * Get recent CS Core questions to pass to Gemini to avoid duplicates
 */
export function getRecentCoreQuestions(limit = 15) {
  const sessions = getSessions();
  const questions = [];
  const seen = new Set();
  for (const s of sessions) {
    if (s.mode === 'core' && s.topic && !seen.has(s.topic.toLowerCase())) {
      seen.add(s.topic.toLowerCase());
      questions.push(s.topic);
      if (questions.length >= limit) break;
    }
  }
  return questions;
}

/**
 * Compute aggregate CS Core Fundamentals statistics
 */
export function getCoreStats() {
  const sessions = getSessions().filter((s) => s.mode === 'core');
  const total = sessions.length;

  if (total === 0) {
    return {
      total_core: 0,
      avg_overall_score: 0,
      avg_concept_accuracy: 0,
      avg_structure_score: 0,
      avg_depth_score: 0,
      subject_mastery: {},
      weakest_subtopics: [],
      recommended_next_subject: 'Operating Systems',
      recent_core_questions: [],
    };
  }

  let totalOverall = 0;
  let totalAccuracy = 0;
  let totalStructure = 0;
  let totalDepth = 0;
  const subjectMap = {};
  const subtopicMap = {};

  for (const s of sessions) {
    totalOverall += s.overall_score || 0;
    totalAccuracy += s.concept_accuracy || 0;
    totalStructure += s.structure || 0;
    totalDepth += s.depth || 0;

    const subj = s.subject || 'Operating Systems';
    if (!subjectMap[subj]) {
      subjectMap[subj] = { count: 0, total_accuracy: 0, total_score: 0 };
    }
    subjectMap[subj].count++;
    subjectMap[subj].total_accuracy += s.concept_accuracy || 0;
    subjectMap[subj].total_score += s.overall_score || 0;

    const sub = s.subtopic || subj;
    if (!subtopicMap[sub]) {
      subtopicMap[sub] = { subtopic: sub, subject: subj, count: 0, total_accuracy: 0 };
    }
    subtopicMap[sub].count++;
    subtopicMap[sub].total_accuracy += s.concept_accuracy || 0;
  }

  const subject_mastery = {};
  for (const [subj, data] of Object.entries(subjectMap)) {
    subject_mastery[subj] = {
      count: data.count,
      avg_accuracy: Number((data.total_accuracy / data.count).toFixed(1)),
      avg_score: Number((data.total_score / data.count).toFixed(1)),
    };
  }

  // Weakest subtopics sorted ascending by accuracy
  const subtopicList = Object.values(subtopicMap).map((item) => ({
    subtopic: item.subtopic,
    subject: item.subject,
    count: item.count,
    avg_accuracy: Number((item.total_accuracy / item.count).toFixed(1)),
  }));
  subtopicList.sort((a, b) => a.avg_accuracy - b.avg_accuracy);
  const weakest_subtopics = subtopicList.slice(0, 3);

  // Recommended next subject: first unpracticed from CORE_SUBJECTS, or lowest avg_accuracy
  let recommended_next_subject = CORE_SUBJECTS[0];
  const unpracticed = CORE_SUBJECTS.find((s) => !subjectMap[s]);
  if (unpracticed) {
    recommended_next_subject = unpracticed;
  } else {
    const sortedSubjects = Object.entries(subject_mastery).sort(
      (a, b) => a[1].avg_accuracy - b[1].avg_accuracy
    );
    if (sortedSubjects.length > 0) {
      recommended_next_subject = sortedSubjects[0][0];
    }
  }

  const recent_core_questions = sessions.slice(0, 5).map((s) => ({
    id: s.id,
    topic: s.topic,
    subject: s.subject,
    subtopic: s.subtopic,
    score: s.overall_score,
    timestamp: s.timestamp,
  }));

  return {
    total_core: total,
    avg_overall_score: Number((totalOverall / total).toFixed(1)),
    avg_concept_accuracy: Number((totalAccuracy / total).toFixed(1)),
    avg_structure_score: Number((totalStructure / total).toFixed(1)),
    avg_depth_score: Number((totalDepth / total).toFixed(1)),
    subject_mastery,
    weakest_subtopics,
    recommended_next_subject,
    recent_core_questions,
  };
}

/**
 * Compute aggregate progress statistics
 */
export function getStats() {
  const sessions = getSessions();
  const total = sessions.length;

  if (total === 0) {
    return {
      total_sessions: 0,
      sessions_this_week: 0,
      today_sessions_count: 0,
      average_score: 0,
      best_score: 0,
      average_wpm: 0,
      total_speaking_time_seconds: 0,
      most_common_filler: 'None',
      category_breakdown: {},
      today_stats: {
        sessions_completed: 0,
        avg_speaking_time: 0,
        avg_score: 0,
        topics_practiced: 0,
      },
    };
  }

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let totalScore = 0;
  let bestScore = 0;
  let totalWpm = 0;
  let totalSpeakingTime = 0;
  let sessionsThisWeek = 0;
  let todaySessions = 0;
  let todayScoreTotal = 0;
  let todayTimeTotal = 0;
  const todayTopicsSet = new Set();

  const fillerCounts = {};
  const categoryStats = {};

  for (const s of sessions) {
    const sDate = new Date(s.timestamp);
    totalScore += s.overall_score || 0;
    if ((s.overall_score || 0) > bestScore) bestScore = s.overall_score;
    totalWpm += s.words_per_minute || 0;
    totalSpeakingTime += s.duration_seconds || 0;

    if (sDate >= oneWeekAgo) {
      sessionsThisWeek++;
    }

    if (sDate >= startOfToday) {
      todaySessions++;
      todayScoreTotal += s.overall_score || 0;
      todayTimeTotal += s.duration_seconds || 0;
      if (s.topic) todayTopicsSet.add(s.topic);
    }

    // Filler breakdown aggregation
    if (s.filler_words_breakdown) {
      for (const [word, count] of Object.entries(s.filler_words_breakdown)) {
        fillerCounts[word] = (fillerCounts[word] || 0) + count;
      }
    }

    // Category breakdown
    const cat = s.category || 'General';
    if (!categoryStats[cat]) {
      categoryStats[cat] = { count: 0, total_score: 0 };
    }
    categoryStats[cat].count++;
    categoryStats[cat].total_score += s.overall_score || 0;
  }

  let topFiller = 'None';
  let maxFillerCount = 0;
  for (const [word, count] of Object.entries(fillerCounts)) {
    if (count > maxFillerCount) {
      maxFillerCount = count;
      topFiller = `${word} (${count})`;
    }
  }

  const categoryBreakdown = {};
  for (const [cat, data] of Object.entries(categoryStats)) {
    categoryBreakdown[cat] = {
      count: data.count,
      avg_score: Number((data.total_score / data.count).toFixed(1)),
    };
  }

  return {
    total_sessions: total,
    sessions_this_week: sessionsThisWeek,
    today_sessions_count: todaySessions,
    average_score: Number((totalScore / total).toFixed(1)),
    best_score: Number(bestScore.toFixed(1)),
    average_wpm: Math.round(totalWpm / total),
    total_speaking_time_seconds: Math.round(totalSpeakingTime),
    most_common_filler: topFiller,
    category_breakdown: categoryBreakdown,
    today_stats: {
      sessions_completed: todaySessions,
      avg_speaking_time: todaySessions > 0 ? Math.round(todayTimeTotal / todaySessions) : 0,
      avg_score: todaySessions > 0 ? Number((todayScoreTotal / todaySessions).toFixed(1)) : 0,
      topics_practiced: todayTopicsSet.size,
    },
  };
}

/**
 * Compute practice indicators for the Interview Readiness section.
 * Clearly labeled as practice indicators, not scientifically validated.
 */
export function getInterviewReadiness() {
  const sessions = getSessions();
  if (sessions.length === 0) {
    return {
      communication: 0,
      technical_explanation: 0,
      confidence: 0,
      fluency: 0,
      overall_readiness: 0,
      has_data: false,
    };
  }

  // Weight recent sessions slightly more heavily (exponential moving average or last 10)
  const recent = sessions.slice(0, 10);
  const count = recent.length;

  let sumClarity = 0;
  let sumGrammar = 0;
  let sumTech = 0;
  let sumRelevance = 0;
  let sumConfidence = 0;
  let sumFluency = 0;

  for (const s of recent) {
    // Map metrics across General, DSA, and Core modes:
    const clarity = s.clarity_score || s.explanation_clarity || 0;
    const grammar = s.grammar_score || s.explanation_clarity || 0;
    const tech =
      s.technical_depth_score ||
      s.concept_accuracy ||
      s.complexity_awareness ||
      s.concept_correctness ||
      s.depth ||
      0;
    const relevance = s.relevance_score || s.concept_accuracy || s.concept_correctness || 0;
    const confidence = s.confidence_score || s.structure || 0;
    const fluency = s.fluency_score || 0;

    sumClarity += clarity;
    sumGrammar += grammar;
    sumTech += tech;
    sumRelevance += relevance;
    sumConfidence += confidence;
    sumFluency += fluency;
  }

  const avgClarity = sumClarity / count;
  const avgGrammar = sumGrammar / count;
  const avgTech = sumTech / count;
  const avgRelevance = sumRelevance / count;
  const avgConfidence = sumConfidence / count;
  const avgFluency = sumFluency / count;

  // Communication: balance of clarity (60%) & grammar (40%) -> 0 to 10
  const communication = Number((avgClarity * 0.6 + avgGrammar * 0.4).toFixed(1));
  // Technical Explanation: balance of depth (60%) & relevance (40%) -> 0 to 10
  const technicalExplanation = Number((avgTech * 0.6 + avgRelevance * 0.4).toFixed(1));
  // Confidence -> 0 to 10
  const confidence = Number(avgConfidence.toFixed(1));
  // Fluency -> 0 to 10
  const fluency = Number(avgFluency.toFixed(1));

  // Overall readiness composite (0 to 100%)
  const overall = Math.round(
    ((communication * 0.3 + technicalExplanation * 0.3 + confidence * 0.2 + fluency * 0.2) / 10) * 100
  );

  return {
    communication,
    technical_explanation: technicalExplanation,
    confidence,
    fluency,
    overall_readiness: overall,
    has_data: true,
  };
}

/**
 * Theme persistence
 */
export function getStoredTheme() {
  const stored = localStorage.getItem(STORAGE_KEY_THEME);
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function setStoredTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY_THEME, theme);
  } catch (err) {
    console.error('Failed to set theme in localStorage:', err);
  }
}

// ============================================================================
// DSA Journey & Coding Platform Storage
// ============================================================================

const STORAGE_KEY_DSA_PLATFORMS = 'speakprep_dsa_platforms_v1';
const STORAGE_KEY_DSA_JOURNEY = 'speakprep_dsa_journey_v1';
const STORAGE_KEY_DSA_SNAPSHOTS = 'speakprep_dsa_snapshots_v1';

/**
 * Get all connected platforms (LeetCode, Codeforces, or self-reported)
 */
export function getDsaPlatforms() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DSA_PLATFORMS);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to load DSA platforms:', err);
    return [];
  }
}

/**
 * Save or update a coding platform profile
 */
export function saveDsaPlatform(platformData) {
  try {
    const platforms = getDsaPlatforms();
    const existingIndex = platforms.findIndex(
      (p) =>
        p.platform.toLowerCase() === platformData.platform.toLowerCase() &&
        p.handle.toLowerCase() === platformData.handle.toLowerCase()
    );

    if (existingIndex >= 0) {
      platforms[existingIndex] = { ...platforms[existingIndex], ...platformData };
    } else {
      platforms.push(platformData);
    }

    localStorage.setItem(STORAGE_KEY_DSA_PLATFORMS, JSON.stringify(platforms));
    return platforms;
  } catch (err) {
    console.error('Failed to save DSA platform:', err);
    return [];
  }
}

/**
 * Remove a platform profile
 */
export function removeDsaPlatform(platform, handle) {
  try {
    const platforms = getDsaPlatforms().filter(
      (p) =>
        !(
          p.platform.toLowerCase() === platform.toLowerCase() &&
          p.handle.toLowerCase() === handle.toLowerCase()
        )
    );
    localStorage.setItem(STORAGE_KEY_DSA_PLATFORMS, JSON.stringify(platforms));
    return platforms;
  } catch (err) {
    console.error('Failed to remove DSA platform:', err);
    return [];
  }
}

/**
 * Get stored Journey analysis data (calculation + qualitative Gemini mentorship)
 */
export function getDsaJourneyData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DSA_JOURNEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('Failed to load DSA journey data:', err);
    return null;
  }
}

/**
 * Save Journey analysis data and record a snapshot for progress tracking
 */
export function saveDsaJourneyData(journeyData) {
  try {
    const dataWithTimestamp = {
      ...journeyData,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY_DSA_JOURNEY, JSON.stringify(dataWithTimestamp));

    const totalSolved = journeyData?.calculation?.total_solved || 0;
    recordDsaSnapshot(totalSolved);
    return dataWithTimestamp;
  } catch (err) {
    console.error('Failed to save DSA journey data:', err);
    return null;
  }
}

/**
 * Record historical snapshot of total solved problems
 */
export function recordDsaSnapshot(totalSolved) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DSA_SNAPSHOTS);
    const snapshots = raw ? JSON.parse(raw) : [];

    const now = Date.now();
    // Don't record duplicate snapshots in the same hour
    const last = snapshots[snapshots.length - 1];
    if (last && now - last.timestamp < 3600000 && last.totalSolved === totalSolved) {
      return;
    }

    snapshots.push({ timestamp: now, totalSolved });
    // Keep last 30 snapshots
    const trimmed = snapshots.slice(-30);
    localStorage.setItem(STORAGE_KEY_DSA_SNAPSHOTS, JSON.stringify(trimmed));
  } catch (err) {
    console.error('Failed to record DSA snapshot:', err);
  }
}

/**
 * Get progress comparison since last snapshot
 */
export function getDsaSnapshotDiff(currentTotal) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DSA_SNAPSHOTS);
    const snapshots = raw ? JSON.parse(raw) : [];
    if (snapshots.length < 2) return null;

    // Compare with the snapshot immediately preceding the latest
    const prev = snapshots[snapshots.length - 2];
    const diff = currentTotal - prev.totalSolved;
    const dateStr = new Date(prev.timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });

    return {
      diff,
      prevTotal: prev.totalSolved,
      lastCheckDate: dateStr,
    };
  } catch (err) {
    console.error('Failed to compute snapshot diff:', err);
    return null;
  }
}

/**
 * Extract compact journey context to pass to Gemini DSA question generator
 */
export function getDsaJourneyBrief() {
  const data = getDsaJourneyData();
  if (!data?.calculation) return null;

  const calc = data.calculation;
  const analysis = data.analysis;

  return {
    strong_topics: calc.strong_topics || [],
    weak_topics: calc.weak_topics || [],
    recent_problems: (calc.recent_solved_problems || []).map((p) => p.title),
    total_solved: calc.total_solved || 0,
    recommended_focus_topics: analysis?.recommended_focus_topics || [],
  };
}

// ============================================================================
// User Profile Helpers
// ============================================================================

export function getUserProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse user profile:', err);
    return null;
  }
}

export function saveUserProfile(profile) {
  try {
    if (!profile) {
      localStorage.removeItem(STORAGE_KEY_PROFILE);
      return null;
    }
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
    localStorage.setItem(STORAGE_KEY_ONBOARDING, 'true');
    return profile;
  } catch (err) {
    console.error('Failed to save user profile:', err);
    return null;
  }
}

export function isOnboardingCompleted() {
  return localStorage.getItem(STORAGE_KEY_ONBOARDING) === 'true';
}

export function setOnboardingCompleted() {
  localStorage.setItem(STORAGE_KEY_ONBOARDING, 'true');
}

// ============================================================================
// Settings Helpers
// ============================================================================

export function getSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) {
      return { include_projects_in_random_topics: false };
    }
    return JSON.parse(raw);
  } catch (err) {
    return { include_projects_in_random_topics: false };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    return settings;
  } catch (err) {
    console.error('Failed to save settings:', err);
    return null;
  }
}

// ============================================================================
// My Projects Helpers
// ============================================================================

export function getUserProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to parse user projects:', err);
    return [];
  }
}

export function saveUserProject(project) {
  try {
    const projects = getUserProjects();
    const newProject = {
      ...project,
      id: project.id || `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: project.created_at || new Date().toISOString(),
    };
    const updated = [newProject, ...projects];
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(updated));
    return newProject;
  } catch (err) {
    console.error('Failed to save project:', err);
    return null;
  }
}

export function updateUserProject(id, updatedFields) {
  try {
    const projects = getUserProjects();
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) return null;
    projects[index] = { ...projects[index], ...updatedFields };
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
    return projects[index];
  } catch (err) {
    console.error('Failed to update project:', err);
    return null;
  }
}

export function deleteUserProject(id) {
  try {
    const projects = getUserProjects();
    const filtered = projects.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(filtered));
    return true;
  } catch (err) {
    console.error('Failed to delete project:', err);
    return false;
  }
}

export function getProjectStats() {
  const sessions = getSessions().filter((s) => s.mode === 'project');
  if (sessions.length === 0) {
    return {
      totalDrills: 0,
      averageScore: 0,
      averageDepth: 0,
      averageOwnership: 0,
      averageClarity: 0,
      practicedProjects: [],
    };
  }

  const total = sessions.length;
  const avg = (fn) => +(sessions.reduce((acc, s) => acc + (fn(s) || 0), 0) / total).toFixed(1);

  const projectMap = {};
  for (const s of sessions) {
    const name = s.project_name || 'Unnamed Project';
    projectMap[name] = (projectMap[name] || 0) + 1;
  }

  return {
    totalDrills: total,
    averageScore: avg((s) => s.overall_score),
    averageDepth: avg((s) => s.technical_depth || s.technical_depth_score),
    averageOwnership: avg((s) => s.ownership_score),
    averageClarity: avg((s) => s.clarity_score),
    practicedProjects: Object.entries(projectMap).map(([name, count]) => ({ name, count })),
  };
}

export function getRecentProjectQuestions(limit = 10) {
  const sessions = getSessions().filter((s) => s.mode === 'project');
  const questions = [];
  const seen = new Set();
  for (const s of sessions) {
    if (s.topic && !seen.has(s.topic.toLowerCase())) {
      seen.add(s.topic.toLowerCase());
      questions.push(s.topic);
      if (questions.length >= limit) break;
    }
  }
  return questions;
}

// ============================================================================
// Clear All Data
// ============================================================================

export function clearAllUserData() {
  try {
    localStorage.removeItem(STORAGE_KEY_SESSIONS);
    localStorage.removeItem(STORAGE_KEY_PROFILE);
    localStorage.removeItem(STORAGE_KEY_PROJECTS);
    localStorage.removeItem(STORAGE_KEY_SETTINGS);
    localStorage.removeItem(STORAGE_KEY_ONBOARDING);
    localStorage.removeItem(STORAGE_KEY_DSA_PLATFORMS);
    localStorage.removeItem(STORAGE_KEY_DSA_JOURNEY);
    localStorage.removeItem(STORAGE_KEY_DSA_SNAPSHOTS);
    return true;
  } catch (err) {
    console.error('Failed to clear user data:', err);
    return false;
  }
}

