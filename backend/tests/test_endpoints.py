import json
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from fastapi.testclient import TestClient

from main import app
from models.schemas import GeminiAnalysis, TopicResponse

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "gemini_configured" in data
    assert "model" in data


def test_analyze_rejects_empty_or_short_transcript():
    # Fewer than 5 words should be rejected with 400 Bad Request
    response = client.post(
        "/api/analyze",
        json={
            "topic": "Explain how Dijkstra's algorithm works.",
            "transcript": "I am thinking.",
            "duration_seconds": 15.0,
        },
    )
    assert response.status_code == 400
    assert "fewer than 5 words" in response.json()["detail"].lower()


@patch("services.gemini_service.gemini_service.generate_topic")
def test_topic_endpoint_success(mock_generate_topic):
    mock_generate_topic.return_value = TopicResponse(
        topic="Explain how you used dynamic programming to solve a challenging problem.",
        category="DSA",
        difficulty="Medium",
        follow_up_question="What was the time and space complexity trade-off?",
    )

    response = client.post(
        "/api/topic",
        json={
            "difficulty": "Medium",
            "category_filter": "DSA",
            "recent_topics": [],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "DSA"
    assert data["difficulty"] == "Medium"
    assert "dynamic programming" in data["topic"].lower()
    assert "complexity" in data["follow_up_question"].lower()


@patch("services.gemini_service.GeminiService._get_client")
def test_analyze_endpoint_success_with_mocked_gemini(mock_get_client):
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client

    gemini_mock_output = {
        "overall_score": 8.0,
        "fluency_score": 7.5,
        "clarity_score": 8.5,
        "grammar_score": 8.0,
        "relevance_score": 9.0,
        "confidence_score": 7.5,
        "technical_depth_score": 8.5,
        "strengths": ["Clear explanation of two pointers technique", "Accurate time complexity analysis"],
        "improvements": [
            "Start with the core idea before describing the loop",
            "Maintain consistent speaking pace throughout",
            "Pause briefly when transitioning between test cases",
        ],
        "better_phrases": [
            {
                "original": "basically we just move pointers",
                "suggested": "we adjust the left and right pointers towards the center",
                "reason": "Clear and technically specific",
            }
        ],
        "sample_answer": "In this problem, [we maintain two pointers at both ends of the sorted array] to find pairs.",
        "next_focus_area": "Direct problem summary in opening sentence",
    }

    mock_response = MagicMock()
    mock_response.text = json.dumps(gemini_mock_output)
    mock_client.models.generate_content.return_value = mock_response

    transcript = (
        "In this problem we basically use two pointers. Actually you know it gives an O of N time complexity. "
        "We start at opposite ends and move toward each other."
    )

    response = client.post(
        "/api/analyze",
        json={
            "topic": "Explain the Two Pointers pattern in C++.",
            "transcript": transcript,
            "duration_seconds": 30.0,
            "time_to_first_word_seconds": 1.2,
            "longest_pause_seconds": 2.5,
            "pauses_over_2s_count": 1,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["overall_score"] == 8.0
    assert len(data["improvements"]) == 3
    # Check deterministic metrics are populated
    assert data["words_per_minute"] > 0
    assert data["word_count"] > 10
    assert "actually" in data["filler_words_breakdown"]
    assert data["filler_words_count"] >= 2
    assert data["time_to_first_word_seconds"] == 1.2
    assert data["pauses_over_2s_count"] == 1


@patch("services.gemini_service.GeminiService._get_client")
def test_followup_endpoint_success_with_mocked_gemini(mock_get_client):
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client

    mock_response = MagicMock()
    mock_response.text = "How would you handle duplicate values in the sorted array?"
    mock_client.models.generate_content.return_value = mock_response

    response = client.post(
        "/api/followup",
        json={
            "topic": "Explain the Two Pointers pattern.",
            "transcript": "We initialized two pointers at indices 0 and n-1 and checked their sum.",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "duplicate" in data["follow_up_question"].lower()
