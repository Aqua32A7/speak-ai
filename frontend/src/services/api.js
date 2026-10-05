/**
 * API client for SpeakPrep AI backend service.
 */

import { getUserProfile } from './storage';

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
      throw new Error(`API rate limit reached. Please wait a few moments and try again.`);
    }
    if (response.status === 502) {
      throw new Error(`Service error: ${errorDetail}`);
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
export async function fetchTopic(difficulty = 'Medium', categoryFilter = 'Random', recentTopics = [], projectBrief = null) {
  const profile = getUserProfile();
  const response = await fetch(`${API_BASE_URL}/api/topic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      difficulty,
      category_filter: categoryFilter,
      recent_topics: recentTopics,
      profile,
      project_brief: projectBrief,
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
  const profile = getUserProfile();
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
      profile,
    }),
  });
  return handleResponse(response);
}

/**
 * Generate a context-aware follow-up question for additional practice
 */
export async function fetchFollowUp(topic, transcript) {
  const profile = getUserProfile();
  const response = await fetch(`${API_BASE_URL}/api/followup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic,
      transcript,
      profile,
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
  const profile = getUserProfile();
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
      profile,
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
  const profile = getUserProfile();
  const response = await fetch(`${API_BASE_URL}/api/dsa/profile/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      calculation,
      profile,
    }),
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
  const profile = getUserProfile();
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
      profile,
    }),
  });
  return handleResponse(response);
}

/**
 * Generate deeper contextual DSA follow-up question for chained rounds
 */
export async function fetchDsaFollowUp({ question, transcript, chainCount = 1 }) {
  const profile = getUserProfile();
  const response = await fetch(`${API_BASE_URL}/api/dsa/followup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      transcript,
      chain_count: chainCount,
      profile,
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
  const profile = getUserProfile();
  const response = await fetch(`${API_BASE_URL}/api/core/question`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subject,
      difficulty,
      mode,
      recent_questions: recentQuestions,
      weak_topics: weakTopics,
      profile,
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
  const profile = getUserProfile();
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
      profile,
    }),
  });
  return handleResponse(response);
}

/**
 * Generate deeper contextual CS core follow-up question
 */
export async function fetchCoreFollowUp({ question, transcript, chainCount = 1 }) {
  const profile = getUserProfile();
  const response = await fetch(`${API_BASE_URL}/api/core/followup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      transcript,
      chain_count: chainCount,
      profile,
    }),
  });
  return handleResponse(response);
}

// ============================================================================
// My Projects API Calls
// ============================================================================

/**
 * Analyze a project repository or manual details to generate a ProjectBrief
 */
export async function analyzeProjectRepoOrManual({ github_url = null, manual_details = null }) {
  const profile = getUserProfile();
  const response = await fetch(`${API_BASE_URL}/api/project/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      github_url,
      manual_details,
      profile,
    }),
  });
  return handleResponse(response);
}

/**
 * Generate an oral interview question grounded in a candidate's ProjectBrief
 */
export async function fetchProjectQuestion({
  projectBrief,
  difficulty = 'Medium',
  recentQuestions = [],
  questionType = 'Surprise Me',
}) {
  const profile = getUserProfile();
  const response = await fetch(`${API_BASE_URL}/api/project/question`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      project_brief: projectBrief,
      difficulty,
      recent_questions: recentQuestions,
      question_type: questionType,
      profile,
    }),
  });
  return handleResponse(response);
}

/**
 * Analyze a spoken response to a project interview question
 */
export async function analyzeProjectAnswer({
  question,
  questionType = 'Project Architecture',
  projectBrief,
  keyPoints = [],
  transcript,
  durationSeconds,
  timeToFirstWord = 0.0,
  longestPause = 0.0,
  pausesOver2s = 0,
  parentSessionId = null,
  followUpChainCount = 0,
}) {
  const profile = getUserProfile();
  const response = await fetch(`${API_BASE_URL}/api/project/answer/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      question_type: questionType,
      project_brief: projectBrief,
      key_points: keyPoints,
      transcript,
      duration_seconds: durationSeconds,
      time_to_first_word_seconds: timeToFirstWord,
      longest_pause_seconds: longestPause,
      pauses_over_2s_count: pausesOver2s,
      parent_session_id: parentSessionId,
      follow_up_chain_count: followUpChainCount,
      profile,
    }),
  });
  return handleResponse(response);
}

/**
 * Generate deeper contextual project follow-up question
 */
export async function fetchProjectFollowUp({
  question,
  transcript,
  projectBrief,
  chainCount = 1,
}) {
  const profile = getUserProfile();
  const response = await fetch(`${API_BASE_URL}/api/project/followup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      transcript,
      project_brief: projectBrief,
      chain_count: chainCount,
      profile,
    }),
  });
  return handleResponse(response);
}
