import json
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from main import app
from models.schemas import (
    GeminiProjectAnswerAnalysis,
    GeminiProjectBrief,
    ManualProjectDetails,
    ProjectBrief,
    ProjectQuestionResponse,
    ProjectSpeechAnalysisResponse,
)
from services.github_fetcher import parse_and_validate_github_url

client = TestClient(app)


def test_parse_and_validate_github_url_valid():
    assert parse_and_validate_github_url("https://github.com/facebook/react") == ("facebook", "react")
    assert parse_and_validate_github_url("github.com/torvalds/linux.git") == ("torvalds", "linux")
    assert parse_and_validate_github_url("http://github.com/tiangolo/fastapi/") == ("tiangolo", "fastapi")
    assert parse_and_validate_github_url("https://www.github.com/golang/go") == ("golang", "go")


def test_parse_and_validate_github_url_ssrf_rejection():
    # External non-github hosts must be rejected
    with pytest.raises(HTTPException) as exc1:
        parse_and_validate_github_url("https://gitlab.com/owner/repo")
    assert exc1.value.status_code == 400
    assert "only public github.com repositories are supported" in exc1.value.detail.lower()

    with pytest.raises(HTTPException) as exc2:
        parse_and_validate_github_url("https://evil.com/facebook/react")
    assert exc2.value.status_code == 400

    # Localhost / internal IP rejection
    with pytest.raises(HTTPException) as exc3:
        parse_and_validate_github_url("http://127.0.0.1:8000/repo")
    assert exc3.value.status_code == 400

    with pytest.raises(HTTPException) as exc4:
        parse_and_validate_github_url("http://169.254.169.254/latest/meta-data")
    assert exc4.value.status_code == 400


def test_parse_and_validate_github_url_malformed():
    with pytest.raises(HTTPException):
        parse_and_validate_github_url("")

    with pytest.raises(HTTPException):
        parse_and_validate_github_url("https://github.com/only-owner")


def test_project_brief_schema_validation():
    brief = ProjectBrief(
        name="EventFlow",
        summary="A real-time distributed event notification system.",
        tech_stack=["Go", "Kafka", "PostgreSQL", "Docker"],
        key_features=["WebSocket push notifications", "Dead-letter queue handling", "Partition rebalancing"],
        architecture_overview="Producer-consumer event streaming pipeline with consumer groups.",
        notable_challenges=["Handling bursty traffic", "Preventing head-of-line blocking"],
        what_user_built="Implemented the consumer workers, partition health checks, and metrics exporter.",
        likely_interview_angles=["Kafka partitioning strategy", "How failures in consumers are isolated"],
        source="github",
        confidence_notes="Clear Docker Compose topology present in repository.",
    )
    assert brief.name == "EventFlow"
    assert len(brief.tech_stack) == 4
    assert brief.source == "github"

    # Verify Gemini schema has no dict types
    for field_name, field_info in GeminiProjectBrief.model_fields.items():
        annotation_str = str(field_info.annotation)
        assert "dict" not in annotation_str.lower(), f"GeminiProjectBrief field {field_name} must not contain dict types"


@patch("main.fetch_github_repository_data", new_callable=AsyncMock)
@patch("services.gemini_service.GeminiService._get_client")
def test_project_analyze_github_endpoint_mocked(mock_get_client, mock_fetch_repo):
    mock_fetch_repo.return_value = {
        "owner": "testuser",
        "repo": "tasktracker",
        "description": "A collaborative task manager.",
        "stars": 12,
        "topics": ["react", "fastapi"],
        "languages": ["TypeScript", "Python"],
        "readme_text": "# TaskTracker\nCollaborative tasks with Kanban boards.",
        "file_tree": ["frontend/src/App.tsx", "backend/main.py"],
        "file_snippets": {"backend/main.py": "from fastapi import FastAPI"},
    }

    mock_client = MagicMock()
    mock_get_client.return_value = mock_client

    gemini_output = {
        "name": "TaskTracker",
        "summary": "Collaborative project management app featuring kanban boards and real-time updates.",
        "tech_stack": ["React", "FastAPI", "TypeScript", "Python"],
        "key_features": ["Kanban boards", "User authentication", "Task filtering"],
        "architecture_overview": "SPA frontend talking to a REST FastAPI backend.",
        "notable_challenges": ["State sync across multiple clients", "Optimistic UI updates"],
        "what_user_built": "Built the backend REST API endpoints and state management on the client.",
        "likely_interview_angles": ["How task ordering is maintained", "State management pattern choice"],
        "confidence_notes": "Identified standard FastAPI and React patterns.",
    }

    mock_resp = MagicMock()
    mock_resp.text = json.dumps(gemini_output)
    mock_client.models.generate_content.return_value = mock_resp

    res = client.post(
        "/api/project/analyze",
        json={"github_url": "https://github.com/testuser/tasktracker"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "TaskTracker"
    assert data["source"] == "github"
    assert "FastAPI" in data["tech_stack"]


@patch("services.gemini_service.GeminiService._get_client")
def test_project_analyze_manual_endpoint_mocked(mock_get_client):
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client

    gemini_output = {
        "name": "CacheProxy",
        "summary": "An in-memory LRU caching HTTP proxy.",
        "tech_stack": ["Go", "HTTP", "Mutex Locks"],
        "key_features": ["LRU eviction", "Concurrent thread-safe map", "TTL expiry"],
        "architecture_overview": "Forward proxy server with in-memory doubly linked list and hashmap.",
        "notable_challenges": ["Lock contention under high concurrency"],
        "what_user_built": "Authored the eviction policy and benchmark suite.",
        "likely_interview_angles": ["How lock granularity was minimized"],
        "confidence_notes": "Candidate reported high concurrency challenges.",
    }

    mock_resp = MagicMock()
    mock_resp.text = json.dumps(gemini_output)
    mock_client.models.generate_content.return_value = mock_resp

    res = client.post(
        "/api/project/analyze",
        json={
            "manual_details": {
                "name": "CacheProxy",
                "description": "An in-memory LRU cache in Go.",
                "tech_stack": "Go",
                "what_user_built": "Eviction logic",
            }
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "CacheProxy"
    assert data["source"] == "manual"


@patch("services.gemini_service.GeminiService._get_client")
def test_project_question_endpoint_mocked(mock_get_client):
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client

    gemini_output = {
        "question": "In your CacheProxy project, why did you decide to build your own LRU cache instead of using Redis?",
        "question_type": "Why you chose this tech",
        "difficulty": "Medium",
        "key_points": [
            "In-process memory latency versus network hops",
            "Simplicity of single-binary deployment",
            "Trade-offs in cross-process cache sharing",
        ],
        "follow_up_question": "How did you benchmark the memory footprint?",
        "project_name": "CacheProxy",
    }

    mock_resp = MagicMock()
    mock_resp.text = json.dumps(gemini_output)
    mock_client.models.generate_content.return_value = mock_resp

    sample_brief = {
        "name": "CacheProxy",
        "summary": "In-memory proxy",
        "tech_stack": ["Go"],
        "key_features": ["LRU"],
        "architecture_overview": "Forward proxy",
        "notable_challenges": ["Locks"],
        "what_user_built": "Core proxy",
        "likely_interview_angles": ["Tech choice"],
        "source": "manual",
    }

    res = client.post(
        "/api/project/question",
        json={
            "project_brief": sample_brief,
            "difficulty": "Medium",
            "question_type": "Why you chose this tech",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert "CacheProxy" in data["question"]
    assert len(data["key_points"]) == 3


@patch("services.gemini_service.GeminiService._get_client")
def test_project_answer_analyze_endpoint_mocked(mock_get_client):
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client

    gemini_output = {
        "overall_score": 8.5,
        "technical_depth": 8.2,
        "clarity_score": 8.8,
        "ownership_score": 9.0,
        "concrete_details_score": 8.0,
        "fluency": 8.5,
        "covered_points": ["In-process memory latency versus network hops", "Simplicity of single binary"],
        "missed_points": ["Cross-process sharing trade-off"],
        "ownership_feedback": "Strong ownership demonstrated; you clearly explained why you personally chose an in-process cache.",
        "improvements": [
            "Mention the specific microsecond latency numbers you measured",
            "Briefly note what would trigger migrating to Redis",
            "Slow down slightly during technical transitions",
        ],
        "strengths": ["Excellent ownership using 'I designed'", "Clear architecture explanation"],
        "sample_answer": "In CacheProxy, [I chose an in-process LRU cache] to eliminate network hops for sub-millisecond lookups.",
        "next_focus_area": "Quantifying architectural trade-offs with numbers",
    }

    mock_resp = MagicMock()
    mock_resp.text = json.dumps(gemini_output)
    mock_client.models.generate_content.return_value = mock_resp

    sample_brief = {
        "name": "CacheProxy",
        "summary": "In-memory proxy",
        "tech_stack": ["Go"],
        "key_features": ["LRU"],
        "architecture_overview": "Forward proxy",
        "notable_challenges": ["Locks"],
        "what_user_built": "Core proxy",
        "likely_interview_angles": ["Tech choice"],
        "source": "manual",
    }

    res = client.post(
        "/api/project/answer/analyze",
        json={
            "question": "Why did you build your own cache?",
            "question_type": "Why you chose this tech",
            "project_brief": sample_brief,
            "key_points": ["In-process latency", "Single binary"],
            "transcript": "In this project I personally decided to implement an in-process LRU cache in Go because avoiding external roundtrips was critical.",
            "duration_seconds": 45.0,
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["overall_score"] == 8.5
    assert data["ownership_score"] == 9.0
    assert "words_per_minute" in data
    assert len(data["improvements"]) == 3


@patch("services.gemini_service.GeminiService._get_client")
def test_project_followup_endpoint_mocked(mock_get_client):
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client

    mock_resp = MagicMock()
    mock_resp.text = "How did you prevent lock contention when concurrent requests hit the cache simultaneously?"
    mock_client.models.generate_content.return_value = mock_resp

    sample_brief = {
        "name": "CacheProxy",
        "summary": "In-memory proxy",
        "tech_stack": ["Go"],
        "key_features": ["LRU"],
        "architecture_overview": "Forward proxy",
        "notable_challenges": ["Locks"],
        "what_user_built": "Core proxy",
        "likely_interview_angles": ["Tech choice"],
        "source": "manual",
    }

    res = client.post(
        "/api/project/followup",
        json={
            "question": "Why did you build your own cache?",
            "transcript": "I built an in-process cache to save latency.",
            "project_brief": sample_brief,
            "chain_count": 1,
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert "lock contention" in data["follow_up_question"]
