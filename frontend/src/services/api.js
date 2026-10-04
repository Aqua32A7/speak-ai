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
