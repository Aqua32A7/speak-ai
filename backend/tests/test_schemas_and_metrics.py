import pytest
from pydantic import ValidationError

from models.schemas import (
    BetterPhrase,
    DifficultyLevel,
    GeminiAnalysis,
    SpeechAnalysisResponse,
    TopicRequest,
    TopicResponse,
)
from services.gemini_service import calculate_speech_metrics


def test_calculate_speech_metrics_basic():
    transcript = "In my project I built a FastAPI backend with PostgreSQL."
    word_count, wpm, filler_count, breakdown = calculate_speech_metrics(
        transcript=transcript,
        duration_seconds=60.0,
    )
    assert word_count == 10
    assert wpm == 10.0
    assert filler_count == 0
    assert breakdown == {}


def test_calculate_speech_metrics_wpm_accuracy():
    # 20 words in 10 seconds => 120 WPM
    words = "word " * 20
    word_count, wpm, _, _ = calculate_speech_metrics(words, duration_seconds=10.0)
    assert word_count == 20
    assert wpm == 120.0


def test_reliable_filler_detection():
    # Includes multiple fillers: "actually", "basically", "you know", "kind of"
    transcript = (
        "Actually I basically worked on machine learning and you know it was sort of kind of challenging."
    )
    word_count, wpm, filler_count, breakdown = calculate_speech_metrics(
        transcript=transcript,
        duration_seconds=30.0,
    )
    assert breakdown.get("actually") == 1
    assert breakdown.get("basically") == 1
    assert breakdown.get("you know") == 1
    assert breakdown.get("sort of") == 1
    assert breakdown.get("kind of") == 1
    assert filler_count >= 5


def test_excluded_fillers_not_counted():
    # "so", "right", and "well" must NOT be counted by default
    transcript = "So we picked the right architecture and it went well."
    _, _, filler_count, breakdown = calculate_speech_metrics(
        transcript=transcript,
        duration_seconds=15.0,
    )
    assert "so" not in breakdown
    assert "right" not in breakdown
    assert "well" not in breakdown
    assert filler_count == 0


def test_conversational_like_vs_verb_like():
    # Verb "like" should not be counted as filler
    verb_transcript = "I like Python and I like using C++ for DSA."
    _, _, verb_fillers, verb_breakdown = calculate_speech_metrics(
        transcript=verb_transcript,
        duration_seconds=10.0,
    )
    assert verb_fillers == 0

    # Conversational "like"
    filler_transcript = "It was, like, really hard to optimize the query and was like difficult."
    _, _, conversational_fillers, conversational_breakdown = calculate_speech_metrics(
        transcript=filler_transcript,
        duration_seconds=10.0,
    )
    assert conversational_breakdown.get("like", 0) >= 1


def test_gemini_analysis_schema_validation():
    valid_data = {
        "overall_score": 7.5,
        "fluency_score": 7.0,
        "clarity_score": 8.0,
        "grammar_score": 7.5,
        "relevance_score": 8.5,
        "confidence_score": 7.0,
        "technical_depth_score": 8.0,
        "strengths": ["Structured explanation", "Good technical vocabulary"],
        "improvements": [
            "Reduce pauses between thoughts",
            "State your conclusion more directly",
            "Use active voice instead of passive phrasing",
        ],
        "better_phrases": [
            {
                "original": "Basically what I did",
                "suggested": "In my implementation, I focused on",
                "reason": "Direct and professional",
            }
        ],
        "sample_answer": "In my recent project, I implemented a [FastAPI backend with Redis caching].",
        "next_focus_area": "Eliminate opening hesitations",
    }
    analysis = GeminiAnalysis.model_validate(valid_data)
    assert analysis.overall_score == 7.5
    assert len(analysis.improvements) == 3


def test_gemini_analysis_requires_exactly_three_improvements():
    invalid_data = {
        "overall_score": 7.0,
        "fluency_score": 7.0,
        "clarity_score": 7.0,
        "grammar_score": 7.0,
        "relevance_score": 7.0,
        "confidence_score": 7.0,
        "technical_depth_score": 7.0,
        "strengths": ["Good start"],
        "improvements": ["Only one improvement"],  # must be 3
        "better_phrases": [],
        "sample_answer": "Sample",
        "next_focus_area": "Fluency",
    }
    with pytest.raises(ValidationError):
        GeminiAnalysis.model_validate(invalid_data)
