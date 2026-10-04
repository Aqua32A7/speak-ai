from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class DifficultyLevel(str, Enum):
    EASY = "Easy"
    MEDIUM = "Medium"
    HARD = "Hard"


class TopicRequest(BaseModel):
    difficulty: str = Field(default="Medium", description="Easy, Medium, or Hard")
    category_filter: str = Field(default="Random", description="Category filter label or Surprise Me/Random")
    recent_topics: List[str] = Field(default_factory=list, description="List of recently generated topics to prevent duplicates")


class TopicResponse(BaseModel):
    topic: str = Field(..., description="The generated speaking drill topic/prompt")
    category: str = Field(..., description="Category label")
    difficulty: str = Field(..., description="Easy, Medium, or Hard")
    follow_up_question: str = Field(..., description="A natural follow-up question related to the topic")


class AnalyzeRequest(BaseModel):
    topic: str = Field(..., description="Topic of the speaking session")
    transcript: str = Field(..., description="Speech transcript from the user")
    duration_seconds: float = Field(..., ge=1.0, description="Actual speaking duration in seconds")
    time_to_first_word_seconds: float = Field(default=0.0, ge=0.0, description="Time until the first speech event")
    longest_pause_seconds: float = Field(default=0.0, ge=0.0, description="Longest pause detected between speech chunks")
    pauses_over_2s_count: int = Field(default=0, ge=0, description="Number of pauses exceeding 2 seconds")
    parent_session_id: Optional[str] = Field(default=None, description="Optional parent session ID if this is a follow-up answer")


class BetterPhrase(BaseModel):
    original: str = Field(..., description="Original phrase spoken or common conversational phrase")
    suggested: str = Field(..., description="Professional, concise interview-appropriate alternative")
    reason: str = Field(..., description="Short explanation of why the suggestion sounds better")


class GeminiAnalysis(BaseModel):
    """
    Schema used strictly as Gemini's structured response_schema.
    Contains qualitative evaluation without dict types.
    """
    overall_score: float = Field(..., ge=0, le=10, description="Overall score between 0 and 10")
    fluency_score: float = Field(..., ge=0, le=10, description="Fluency score between 0 and 10")
    clarity_score: float = Field(..., ge=0, le=10, description="Clarity and structure score between 0 and 10")
    grammar_score: float = Field(..., ge=0, le=10, description="Grammar and sentence construction score between 0 and 10")
    relevance_score: float = Field(..., ge=0, le=10, description="Topic relevance score between 0 and 10")
    confidence_score: float = Field(..., ge=0, le=10, description="Perceived confidence score between 0 and 10")
    technical_depth_score: float = Field(..., ge=0, le=10, description="Technical depth/accuracy score between 0 and 10")
    strengths: List[str] = Field(..., description="2-4 bullet points highlighting what the user did well")
    improvements: List[str] = Field(..., min_length=3, max_length=3, description="Exactly 3 specific, actionable suggestions for improvement")
    better_phrases: List[BetterPhrase] = Field(..., description="Alternative phrases replacing conversational or clunky expressions")
    sample_answer: str = Field(..., description="Realistic 60-second college student interview answer with bracketed useful phrases")
    next_focus_area: str = Field(..., description="Single highest-leverage skill to focus on in the next drill")


class SpeechAnalysisResponse(BaseModel):
    """
    Final API response returned to the frontend.
    Merges qualitative Gemini analysis with deterministic code-computed speech metrics.
    """
    overall_score: float
    fluency_score: float
    clarity_score: float
    grammar_score: float
    relevance_score: float
    confidence_score: float
    technical_depth_score: float
    strengths: List[str]
    improvements: List[str]
    better_phrases: List[BetterPhrase]
    sample_answer: str
    next_focus_area: str
    # Deterministic metrics computed in code
    words_per_minute: float = Field(..., description="Deterministically calculated WPM based on transcript word count and duration")
    word_count: int = Field(..., description="Total word count of the transcript")
    duration_seconds: float = Field(..., description="Elapsed duration in seconds")
    filler_words_count: int = Field(..., description="Total approximate filler words detected")
    filler_words_breakdown: Dict[str, int] = Field(..., description="Breakdown of detected filler words")
    # Hesitation & pause metrics
    time_to_first_word_seconds: float
    longest_pause_seconds: float
    pauses_over_2s_count: int


class FollowUpRequest(BaseModel):
    topic: str = Field(..., description="Original topic")
    transcript: str = Field(..., description="User's response transcript")


class FollowUpResponse(BaseModel):
    follow_up_question: str = Field(..., description="One related interview follow-up question")


class HealthResponse(BaseModel):
    status: str
    gemini_configured: bool
    model: str
