/**
 * API client for SpeakPrep AI backend service.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function handleResponse(response) {
  if (!response.ok) {
    let errorDetail = 'Request failed';
    try {
      const errorData = await response.json();
      errorDetail = errorData.detail || errorData.message || JSON.stringify(errorData);
    } catch {
      errorDetail = `Server error (${response.status}: ${response.statusText})`;
    }
    
    // Add specific hints for common status codes
    if (response.status === 429) {
      throw new Error(`Gemini API rate limit reached. Please wait a few moments and try again.`);
    }
    if (response.status === 502) {
      throw new Error(`Gemini service error: ${errorDetail}`);
    }
    
    throw new Error(errorDetail);
  }
  return response.json();
}

/**
 * Health check endpoint
 */
export async function fetchHealth() {
  const response = await fetch(`${API_BASE_URL}/api/health`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse(response);
}

/**
 * Generate a dynamic topic tailored to candidate profile and difficulty
 */
export async function fetchTopic(difficulty = 'Medium', categoryFilter = 'Random', recentTopics = []) {
  const response = await fetch(`${API_BASE_URL}/api/topic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      difficulty,
      category_filter: categoryFilter,
      recent_topics: recentTopics,
    }),
  });
  return handleResponse(response);
}

/**
 * Analyze spoken answer using deterministic metrics and Gemini qualitative evaluation
 */
export async function analyzeSpeech({
  topic,
  transcript,
  durationSeconds,
  timeToFirstWord = 0.0,
  longestPause = 0.0,
  pausesOver2s = 0,
  parentSessionId = null,
}) {
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic,
      transcript,
      duration_seconds: durationSeconds,
      time_to_first_word_seconds: timeToFirstWord,
      longest_pause_seconds: longestPause,
      pauses_over_2s_count: pausesOver2s,
      parent_session_id: parentSessionId,
    }),
  });
  return handleResponse(response);
}

/**
 * Generate a context-aware follow-up question for additional practice
 */
export async function fetchFollowUp(topic, transcript) {
  const response = await fetch(`${API_BASE_URL}/api/followup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic,
      transcript,
    }),
  });
  return handleResponse(response);
}

/**
 * Generate a dynamic verbal DSA interview question with hidden key points
 * Optionally conditioned on user's DSA Journey stats
 */
export async function fetchDsaQuestion({
  difficulty = 'Medium',
  subtopicFilter = 'Surprise Me',
  typeFilter = 'Surprise Me',
  recentQuestions = [],
  recentSubtopics = [],
  journeyContext = null,
}) {
  const response = await fetch(`${API_BASE_URL}/api/dsa/question`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      difficulty,
      subtopic_filter: subtopicFilter,
      type_filter: typeFilter,
      recent_questions: recentQuestions,
      recent_subtopics: recentSubtopics,
      journey_context: journeyContext,
    }),
  });
  return handleResponse(response);
}

/**
 * Fetch verified public statistics from a coding platform (LeetCode, Codeforces)
 */
export async function fetchDsaProfile({ platform, handleOrUrl, forceRefresh = false }) {
  const response = await fetch(`${API_BASE_URL}/api/dsa/profile/fetch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      platform,
      handle_or_url: handleOrUrl,
      force_refresh: forceRefresh,
    }),
  });
  return handleResponse(response);
}

/**
 * Deterministically compute aggregate math across all candidate coding platforms
 */
export async function calculateDsaJourney(platforms) {
  const response = await fetch(`${API_BASE_URL}/api/dsa/profile/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(platforms),
  });
  return handleResponse(response);
}

/**
 * Request Gemini qualitative mentorship insights on the calculated DSA Journey
 */
export async function analyzeDsaJourney(calculation) {
  const response = await fetch(`${API_BASE_URL}/api/dsa/profile/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ calculation }),
  });
  return handleResponse(response);
}

/**
 * Analyze spoken DSA response against expected key points and answer structure
 */
export async function analyzeDsaAnswer({
  question,
  transcript,
  keyPoints = [],
  durationSeconds,
  timeToFirstWord = 0.0,
  longestPause = 0.0,
  pausesOver2s = 0,
  parentSessionId = null,
  followUpChainCount = 0,
}) {
  const response = await fetch(`${API_BASE_URL}/api/dsa/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      transcript,
      key_points: keyPoints,
      duration_seconds: durationSeconds,
      time_to_first_word_seconds: timeToFirstWord,
      longest_pause_seconds: longestPause,
      pauses_over_2s_count: pausesOver2s,
      parent_session_id: parentSessionId,
      follow_up_chain_count: followUpChainCount,
    }),
  });
  return handleResponse(response);
}

/**
 * Generate deeper contextual DSA follow-up question for chained rounds
 */
export async function fetchDsaFollowUp({ question, transcript, chainCount = 1 }) {
  const response = await fetch(`${API_BASE_URL}/api/dsa/followup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      transcript,
      chain_count: chainCount,
    }),
  });
  return handleResponse(response);
}

/**
 * Generate a dynamic CS core fundamentals question (optional 'teach' primer)
 */
export async function fetchCoreQuestion({
  subject = 'Operating Systems',
  difficulty = 'Medium',
  mode = 'test',
  recentQuestions = [],
  weakTopics = [],
}) {
  const response = await fetch(`${API_BASE_URL}/api/core/question`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subject,
      difficulty,
      mode,
      recent_questions: recentQuestions,
      weak_topics: weakTopics,
    }),
  });
  return handleResponse(response);
}

/**
 * Analyze spoken CS core response against 4-part structure, depth, and misconceptions
 */
export async function analyzeCoreAnswer({
  question,
  transcript,
  keyPoints = [],
  durationSeconds,
  timeToFirstWord = 0.0,
  longestPause = 0.0,
  pausesOver2s = 0,
  parentSessionId = null,
  followUpChainCount = 0,
  subject = '',
  subtopic = '',
}) {
  const response = await fetch(`${API_BASE_URL}/api/core/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      transcript,
      key_points: keyPoints,
      duration_seconds: durationSeconds,
      time_to_first_word_seconds: timeToFirstWord,
      longest_pause_seconds: longestPause,
      pauses_over_2s_count: pausesOver2s,
      parent_session_id: parentSessionId,
      follow_up_chain_count: followUpChainCount,
      subject,
      subtopic,
    }),
  });
  return handleResponse(response);
}

/**
 * Generate deeper contextual CS core follow-up question
 */
export async function fetchCoreFollowUp({ question, transcript, chainCount = 1 }) {
  const response = await fetch(`${API_BASE_URL}/api/core/followup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      transcript,
      chain_count: chainCount,
    }),
  });
  return handleResponse(response);
}

