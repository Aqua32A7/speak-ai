import json
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient

from main import app
from models.schemas import (
    DsaQuestionResponse,
    GeminiDsaAnalysis,
    DsaSpeechAnalysisResponse,
)

client = TestClient(app)


def test_dsa_analyze_rejects_short_transcript():
    response = client.post(
        "/api/dsa/analyze",
        json={
            "question": "How does a hash map handle collisions?",
            "transcript": "Hashing table.",
            "key_points": ["Separate chaining", "Open addressing"],
            "duration_seconds": 15.0,
        },
    )
    assert response.status_code == 400
    assert "fewer than 5 words" in response.json()["detail"].lower()


@patch("services.gemini_service.gemini_service.generate_dsa_question")
def test_dsa_question_endpoint(mock_gen_dsa):
    mock_gen_dsa.return_value = DsaQuestionResponse(
        question="Walk me through how you detect a cycle in a singly linked list.",
        subtopic="Linked Lists",
        question_type="Explain an Approach",
        difficulty="Medium",
        key_points=[
            "Slow and fast pointer (Floyd's cycle-finding)",
            "Slow advances by 1, fast advances by 2",
            "Pointers meet if and only if a cycle exists",
            "Time complexity O(N) and space complexity O(1)",
        ],
        follow_up_question="How would you determine the starting node of the cycle?",
    )

    response = client.post(
        "/api/dsa/question",
        json={
            "difficulty": "Medium",
            "subtopic_filter": "Linked Lists",
            "type_filter": "Explain an Approach",
            "recent_questions": [],
            "recent_subtopics": [],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["subtopic"] == "Linked Lists"
    assert data["question_type"] == "Explain an Approach"
    assert len(data["key_points"]) == 4
    assert "cycle" in data["question"].lower()


@patch("services.gemini_service.GeminiService._get_client")
def test_dsa_analyze_endpoint_with_mocked_gemini(mock_get_client):
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client

    gemini_mock_output = {
        "overall_score": 8.5,
        "concept_correctness": 9.0,
        "explanation_clarity": 8.5,
        "structure": 8.0,
        "complexity_awareness": 9.0,
        "edge_case_awareness": 8.0,
        "fluency": 8.0,
        "covered_points": [
            "Slow and fast pointer (Floyd's cycle-finding)",
            "Pointers meet if cycle exists",
            "O(N) time and O(1) space",
        ],
        "missed_points": [
            "Explicit check for null head or single node",
        ],
        "misconceptions": [],
        "improvements": [
            "State your initial edge case check (empty list) before explaining the pointers",
            "Conclude decisively once you mention the space complexity",
            "Keep the definition of step sizes concise in the opening sentence",
        ],
        "strengths": [
            "Clear explanation of Floyd's Tortoise and Hare algorithm",
            "Accurately stated O(1) auxiliary space advantage over a hash set",
        ],
        "sample_answer": "To detect a cycle in a linked list, [I use Floyd's Tortoise and Hare algorithm with slow and fast pointers]. [Slow moves one step while fast moves two]. If they meet, a cycle exists. This operates in [O(N) time and O(1) space], which is more memory-efficient than storing visited nodes in a hash set.",
        "next_focus_area": "Cover edge cases before diving into the core loop",
    }

    mock_response = MagicMock()
    mock_response.text = json.dumps(gemini_mock_output)
    mock_client.models.generate_content.return_value = mock_response

    transcript = (
        "To detect a cycle in a linked list, we can basically use two pointers, a slow pointer and a fast pointer. "
        "The slow pointer moves by one step and the fast pointer moves by two steps. If they ever intersect, that proves there is a cycle. "
        "Actually, the time complexity is O of N and space is O of 1."
    )

    response = client.post(
        "/api/dsa/analyze",
        json={
            "question": "Walk me through how you detect a cycle in a linked list.",
            "transcript": transcript,
            "key_points": [
                "Slow and fast pointer (Floyd's cycle-finding)",
                "Slow advances by 1, fast advances by 2",
                "Pointers meet if cycle exists",
                "Explicit check for null head or single node",
                "O(N) time and O(1) space",
            ],
            "duration_seconds": 40.0,
            "time_to_first_word_seconds": 1.0,
            "longest_pause_seconds": 1.5,
            "pauses_over_2s_count": 0,
            "parent_session_id": None,
            "follow_up_chain_count": 0,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["overall_score"] == 8.5
    assert data["concept_correctness"] == 9.0
    assert len(data["covered_points"]) == 3
    assert len(data["missed_points"]) == 1
    assert len(data["improvements"]) == 3
    assert data["words_per_minute"] > 0
    assert data["duration_seconds"] == 40.0


@patch("services.gemini_service.GeminiService._get_client")
def test_dsa_followup_endpoint_with_mocked_gemini(mock_get_client):
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client

    mock_response = MagicMock()
    mock_response.text = "How would you find the starting node of the cycle once detected?"
    mock_client.models.generate_content.return_value = mock_response

    response = client.post(
        "/api/dsa/followup",
        json={
            "question": "Walk me through cycle detection.",
            "transcript": "We use slow and fast pointers.",
            "chain_count": 1,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "starting node" in data["follow_up_question"].lower()
