import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient

from main import app
from models.schemas import (
    DsaJourneyBrief,
    DsaJourneyCalculation,
    GeminiDsaJourneyAnalysis,
    NormalizedPlatformStats,
    RecentProblem,
    TopicCoverageItem,
)
from services.platform_fetcher import (
    calculate_dsa_journey,
    sanitize_and_extract_handle,
)

client = TestClient(app)


def test_sanitize_and_extract_handle_valid():
    # LeetCode profile URL variants
    h1, u1 = sanitize_and_extract_handle("leetcode", "https://leetcode.com/u/aqua_coder-1/")
    assert h1 == "aqua_coder-1"
    assert u1 == "https://leetcode.com/u/aqua_coder-1/"

    h2, u2 = sanitize_and_extract_handle("leetcode", "https://leetcode.com/neal_wu")
    assert h2 == "neal_wu"
    assert u2 == "https://leetcode.com/u/neal_wu/"

    # Codeforces profile URL
    h3, u3 = sanitize_and_extract_handle("codeforces", "https://codeforces.com/profile/tourist")
    assert h3 == "tourist"
    assert u3 == "https://codeforces.com/profile/tourist"

    # Bare handles
    h4, u4 = sanitize_and_extract_handle("leetcode", "my_handle_123")
    assert h4 == "my_handle_123"
    assert u4 == "https://leetcode.com/u/my_handle_123/"


def test_sanitize_and_extract_handle_ssrf_rejection():
    # Untrusted external domain
    with pytest.raises(Exception) as exc_info:
        sanitize_and_extract_handle("leetcode", "https://attacker.com/malicious_user")
    assert "not supported" in str(exc_info.value).lower()

    # Localhost / Internal IP
    with pytest.raises(Exception):
        sanitize_and_extract_handle("leetcode", "http://127.0.0.1:8000/admin")

    with pytest.raises(Exception):
        sanitize_and_extract_handle("codeforces", "http://localhost/profile/admin")

    # Invalid handle characters
    with pytest.raises(Exception):
        sanitize_and_extract_handle("leetcode", "user$name#hack")


def test_calculate_dsa_journey_deterministic_math():
    p1 = NormalizedPlatformStats(
        platform="leetcode",
        handle="algo_pro",
        profile_url="https://leetcode.com/u/algo_pro/",
        is_self_reported=False,
        total_solved=400,
        easy_solved=100,
        medium_solved=250,
        hard_solved=50,
        topic_counts={
            "Arrays & Strings": 80,
            "Trees & BST": 45,
            "Dynamic Programming": 30,
            "Graphs": 12,
            "Heaps": 3,
        },
        recent_problems=[
            RecentProblem(title="Two Sum", platform="leetcode"),
            RecentProblem(title="Course Schedule", platform="leetcode"),
        ],
        fetched_at="2026-10-05T12:00:00Z",
    )

    p2 = NormalizedPlatformStats(
        platform="codeforces",
        handle="algo_cf",
        profile_url="https://codeforces.com/profile/algo_cf",
        is_self_reported=False,
        total_solved=150,
        easy_solved=50,
        medium_solved=80,
        hard_solved=20,
        topic_counts={
            "Graphs": 15,  # 12 + 15 = 27 -> Becomes Strong
            "Sorting & Searching": 25,
            "Bit Manipulation": 6,  # 0 + 6 = 6 -> Becomes Moderate
        },
        recent_problems=[
            RecentProblem(title="Watermelon", platform="codeforces"),
        ],
        fetched_at="2026-10-05T12:00:00Z",
    )

    calculation = calculate_dsa_journey([p1, p2])

    assert calculation.total_solved == 550
    assert calculation.easy_solved == 150
    assert calculation.medium_solved == 330
    assert calculation.hard_solved == 70

    # Check Strong topics (>= 20)
    assert "Arrays & Strings" in calculation.strong_topics  # 80
    assert "Trees & BST" in calculation.strong_topics      # 45
    assert "Dynamic Programming" in calculation.strong_topics # 30
    assert "Graphs" in calculation.strong_topics           # 27 (12 + 15)
    assert "Sorting & Searching" in calculation.strong_topics # 25

    # Check Moderate topics (5 - 19)
    assert "Bit Manipulation" in calculation.moderate_topics # 6

    # Check Untouched / Weak topics (< 5)
    assert "Heaps" in calculation.weak_topics               # 3
    assert "Linked Lists" in calculation.weak_topics        # 0

    # Check recent problems
    titles = [p.title for p in calculation.recent_solved_problems]
    assert "Two Sum" in titles
    assert "Course Schedule" in titles
    assert "Watermelon" in titles


@pytest.mark.anyio
async def test_fetch_dsa_profile_endpoint_mocked():
    mock_stats = NormalizedPlatformStats(
        platform="leetcode",
        handle="testuser",
        profile_url="https://leetcode.com/u/testuser/",
        is_self_reported=False,
        total_solved=420,
        easy_solved=120,
        medium_solved=240,
        hard_solved=60,
        contest_rating=1850.5,
        global_rank="15234",
        topic_counts={"Arrays & Strings": 95, "Dynamic Programming": 35},
        recent_problems=[RecentProblem(title="3Sum", platform="leetcode")],
        fetched_at="2026-10-05T12:00:00Z",
    )

    with patch("main.fetch_platform_profile", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = mock_stats

        response = client.post(
            "/api/dsa/profile/fetch",
            json={"platform": "leetcode", "handle_or_url": "testuser", "force_refresh": True},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["handle"] == "testuser"
        assert data["total_solved"] == 420
        assert data["contest_rating"] == 1850.5


@pytest.mark.anyio
async def test_analyze_dsa_journey_endpoint_mocked():
    p = NormalizedPlatformStats(
        platform="leetcode",
        handle="testuser",
        profile_url="https://leetcode.com/u/testuser/",
        total_solved=300,
        easy_solved=100,
        medium_solved=170,
        hard_solved=30,
        fetched_at="2026-10-05T12:00:00Z",
    )
    calc = calculate_dsa_journey([p])

    mock_analysis = GeminiDsaJourneyAnalysis(
        readiness_assessment="Candidate exhibits strong problem-solving breadth and solid mid-level proficiency.",
        strengths=[
            "Excellent mastery of foundational arrays and hash maps with 80+ problems solved.",
            "Healthy ratio of Medium to Easy problems demonstrating progression beyond trivial implementations.",
        ],
        gaps=[
            "Graph traversal and topological sort coverage is critically low (<5 solved).",
            "Lack of Hard-tier dynamic programming practice for top-tier tech bar.",
        ],
        recommended_focus_topics=[
            "Graphs",
            "Dynamic Programming",
            "Heaps",
        ],
        interviewer_perspective="Candidate will pass initial screenings easily but needs deeper graph and DP defense for on-site loops.",
    )

    with patch("main.gemini_service.analyze_dsa_journey", new_callable=AsyncMock) as mock_analyze:
        mock_analyze.return_value = mock_analysis

        response = client.post(
            "/api/dsa/profile/analyze",
            json={"calculation": calc.model_dump()},
        )
        assert response.status_code == 200
        data = response.json()
        assert "calculation" in data
        assert data["calculation"]["total_solved"] == 300
        assert "analysis" in data
        assert len(data["analysis"]["strengths"]) == 2
        assert len(data["analysis"]["recommended_focus_topics"]) == 3
        assert data["analysis"]["recommended_focus_topics"][0] == "Graphs"


@pytest.mark.anyio
async def test_dsa_question_with_journey_context():
    from models.schemas import DsaQuestionResponse

    mock_res = DsaQuestionResponse(
        question="Explain how you solved 'Course Schedule' and describe how you detected cycles in the graph.",
        subtopic="Graphs",
        question_type="Explain an Approach",
        difficulty="Medium",
        key_points=[
            "Graph representation using adjacency list",
            "Cycle detection using topological sort (Kahn's algorithm) or DFS 3-color state",
            "In-degree array initialization and queue processing",
            "Time complexity O(V + E) and Space complexity O(V + E)",
        ],
        follow_up_question="How would your approach change if you also need to return the exact course order?",
    )

    with patch("main.gemini_service.generate_dsa_question", new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = mock_res

        payload = {
            "difficulty": "Medium",
            "subtopic_filter": "Surprise Me",
            "type_filter": "Surprise Me",
            "journey_context": {
                "strong_topics": ["Arrays & Strings", "Trees & BST"],
                "weak_topics": ["Graphs", "Heaps"],
                "recent_problems": ["Course Schedule", "Two Sum"],
                "total_solved": 350,
                "recommended_focus_topics": ["Graphs", "Dynamic Programming", "Heaps"],
            },
        }

        response = client.post("/api/dsa/question", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "Course Schedule" in data["question"]
        assert data["subtopic"] == "Graphs"
        assert len(data["key_points"]) == 4
