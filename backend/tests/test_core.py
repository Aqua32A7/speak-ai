import json
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient

from main import app
from models.schemas import (
    CoreConceptRefresher,
    CoreQuestionResponse,
    GeminiCoreAnalysis,
)

client = TestClient(app)


def test_core_analyze_rejects_short_transcript():
    """Verify that speech transcript with fewer than 5 words is rejected with 400 Bad Request."""
    response = client.post(
        "/api/core/analyze",
        json={
            "question": "Explain how virtual memory works.",
            "transcript": "Memory paging.",
            "key_points": ["Definition", "Page tables", "Translation", "Overhead"],
            "duration_seconds": 10.0,
        },
    )
    assert response.status_code == 400
    assert "fewer than 5 words" in response.json()["detail"].lower()


@patch("services.gemini_service.gemini_service.generate_core_question")
def test_core_question_endpoint_test_mode(mock_gen_core):
    """Verify core question endpoint in 'test' mode."""
    mock_gen_core.return_value = CoreQuestionResponse(
        question="Explain the difference between a process and a thread.",
        subject="Operating Systems",
        subtopic="Processes & Threads",
        question_type="Compare A vs B",
        difficulty="Medium",
        key_points=[
            "Process has its own virtual address space; thread shares address space",
            "Creation and context switching overhead is much higher for processes",
            "Example: Multi-tab browser architecture vs worker threads",
            "Trade-off: Isolation/safety vs inter-thread communication efficiency",
        ],
        primer=None,
        follow_up_question="What happens if a thread experiences a segmentation fault?",
    )

    response = client.post(
        "/api/core/question",
        json={
            "subject": "Operating Systems",
            "difficulty": "Medium",
            "mode": "test",
            "recent_questions": [],
            "weak_topics": [],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["subject"] == "Operating Systems"
    assert data["subtopic"] == "Processes & Threads"
    assert data["primer"] is None
    assert len(data["key_points"]) == 4
    assert "process" in data["question"].lower()


@patch("services.gemini_service.gemini_service.generate_core_question")
def test_core_question_endpoint_teach_mode(mock_gen_core):
    """Verify core question endpoint in 'teach' mode returns primer."""
    mock_gen_core.return_value = CoreQuestionResponse(
        question="Now explain in your own words: What is a deadlock and what are its four necessary conditions?",
        subject="Operating Systems",
        subtopic="Deadlocks",
        question_type="Explain a concept",
        difficulty="Medium",
        key_points=[
            "Definition: Permanent blocking of a set of threads waiting for held resources",
            "Coffman conditions: Mutual exclusion, Hold & wait, No preemption, Circular wait",
            "Concrete example: Traffic gridlock at a four-way intersection",
            "Trade-off: Prevention causes underutilized resources, detection adds runtime overhead",
        ],
        primer="Think of a deadlock like a traffic gridlock at a narrow bridge where two cars approach from opposite sides...",
        follow_up_question="How does the Banker's algorithm prevent circular wait?",
    )

    response = client.post(
        "/api/core/question",
        json={
            "subject": "Operating Systems",
            "difficulty": "Medium",
            "mode": "teach",
            "recent_questions": [],
            "weak_topics": [],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["primer"] is not None
    assert "traffic gridlock" in data["primer"].lower()


@patch("services.gemini_service.gemini_service._get_client")
def test_core_analyze_endpoint_with_mocked_gemini(mock_get_client):
    """Verify analysis endpoint returns 4-part structure, refresher, and deterministic metrics."""
    mock_client = MagicMock()
    mock_model_response = MagicMock()

    analysis_data = {
        "overall_score": 8.5,
        "concept_accuracy": 9.0,
        "explanation_clarity": 8.5,
        "structure": 8.0,
        "depth": 8.0,
        "examples_and_analogies": 8.5,
        "fluency": 9.0,
        "covered_points": [
            "Part 1 Definition: Virtual memory creates an illusion of contiguous large memory",
            "Part 2 Mechanism: Translates virtual addresses to physical frames using page tables",
            "Part 3 Example: Multiple applications running simultaneously without memory collisions",
        ],
        "missed_points": [
            "Part 4 Trade-off: Page faults incur substantial disk I/O latency overhead",
        ],
        "misconceptions": [],
        "improvements": [
            "Explicitly emphasize the performance cost of page faults.",
            "Mention the TLB (Translation Lookaside Buffer) to demonstrate depth on caching translations.",
            "Conclude with a clear summary sentence on why OS designers accept the page fault trade-off.",
        ],
        "strengths": [
            "Clear analogy comparing virtual addresses to house numbers.",
            "Accurate breakdown of the MMU role.",
            "Steady verbal pacing with minimal pauses.",
        ],
        "sample_answer": "Virtual memory is [an OS memory management capability] that abstracts physical RAM into an illusion of isolated address spaces...",
        "refresher": {
            "explanation": "Virtual memory allows an OS to execute processes that require more memory than physically available RAM by using secondary storage as backing swap space.",
            "remember_points": [
                "MMU and Page Tables perform the hardware address translation.",
                "TLB caches page translations to avoid a memory lookup on every access.",
                "Page faults occur when requested data is swapped out to disk.",
            ],
        },
        "next_focus_area": "Articulating Trade-offs and Cache Latency",
    }

    mock_model_response.text = json.dumps(analysis_data)
    mock_client.models.generate_content.return_value = mock_model_response
    mock_get_client.return_value = mock_client

    response = client.post(
        "/api/core/analyze",
        json={
            "question": "Explain what virtual memory is and why modern operating systems rely on it.",
            "transcript": "Virtual memory is basically an abstraction provided by the operating system so that each process feels like it has its own dedicated address space. It maps virtual pages to physical frames using page tables and the MMU. For example, if you run multiple Chrome tabs, they do not overwrite each other.",
            "key_points": ["Definition", "Page tables and MMU", "Isolation example", "Page fault trade-offs"],
            "duration_seconds": 45.0,
            "time_to_first_word_seconds": 1.5,
            "longest_pause_seconds": 1.2,
            "pauses_over_2s_count": 0,
            "subject": "Operating Systems",
            "subtopic": "Virtual Memory",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["overall_score"] == 8.5
    assert data["concept_accuracy"] == 9.0
    assert len(data["covered_points"]) == 3
    assert len(data["missed_points"]) == 1
    assert "refresher" in data
    assert len(data["refresher"]["remember_points"]) == 3
    assert data["words_per_minute"] > 0
    assert "filler_words_count" in data


@patch("services.gemini_service.gemini_service._get_client")
def test_core_followup_endpoint_with_mocked_gemini(mock_get_client):
    """Verify follow-up question endpoint for CS Core."""
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "How does the OS handle thrashing when physical memory is severely overcommitted?"
    mock_client.models.generate_content.return_value = mock_response
    mock_get_client.return_value = mock_client

    response = client.post(
        "/api/core/followup",
        json={
            "question": "Explain virtual memory.",
            "transcript": "Virtual memory abstracts memory into pages and frames.",
            "chain_count": 1,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "thrashing" in data["follow_up_question"].lower()
