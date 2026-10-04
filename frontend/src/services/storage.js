/**
 * LocalStorage helpers for SpeakPrep AI.
 * Stores only transcripts, scores, feedback, topics, and metrics.
 * NEVER stores raw audio.
 */

const STORAGE_KEY_SESSIONS = 'speakprep_sessions_v1';
const STORAGE_KEY_THEME = 'speakprep_theme';

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
    sumClarity += s.clarity_score || 0;
    sumGrammar += s.grammar_score || 0;
    sumTech += s.technical_depth_score || 0;
    sumRelevance += s.relevance_score || 0;
    sumConfidence += s.confidence_score || 0;
    sumFluency += s.fluency_score || 0;
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
