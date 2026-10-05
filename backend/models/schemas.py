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


# ============================================================================
# DSA Interview Mode Schemas
# ============================================================================

class DsaQuestionRequest(BaseModel):
    difficulty: str = Field(default="Medium", description="Easy, Medium, or Hard")
    subtopic_filter: str = Field(default="Surprise Me", description="Subtopic name or Surprise Me")
    type_filter: str = Field(default="Surprise Me", description="Question type name or Surprise Me")
    recent_questions: List[str] = Field(default_factory=list, description="Recent DSA questions to avoid repeating")
    recent_subtopics: List[str] = Field(default_factory=list, description="Recent subtopics to ensure variety")


class DsaQuestionResponse(BaseModel):
    question: str = Field(..., description="The verbal DSA question prompt")
    subtopic: str = Field(..., description="Data structure or algorithm subtopic")
    question_type: str = Field(..., description="Type of question (e.g. Theory/Concept, Explain an Approach)")
    difficulty: str = Field(..., description="Easy, Medium, or Hard")
    key_points: List[str] = Field(..., description="Key points a strong answer should cover (hidden until feedback)")
    follow_up_question: str = Field(..., description="An initial follow-up question related to this problem")


class DsaAnalyzeRequest(BaseModel):
    question: str = Field(..., description="The DSA interview question")
    transcript: str = Field(..., description="User's spoken answer transcript")
    key_points: List[str] = Field(default_factory=list, description="The key points associated with this question")
    duration_seconds: float = Field(..., ge=1.0, description="Actual speaking duration in seconds")
    time_to_first_word_seconds: float = Field(default=0.0, ge=0.0, description="Time until the first speech event")
    longest_pause_seconds: float = Field(default=0.0, ge=0.0, description="Longest pause detected between speech chunks")
    pauses_over_2s_count: int = Field(default=0, ge=0, description="Number of pauses exceeding 2 seconds")
    parent_session_id: Optional[str] = Field(default=None, description="Optional parent session ID for chained follow-ups")
    follow_up_chain_count: int = Field(default=0, ge=0, le=3, description="Chained follow-up round number (0 to 3)")


class GeminiDsaAnalysis(BaseModel):
    """
    Schema strictly for Gemini's structured response_schema.
    Contains qualitative DSA evaluation without dict types.
    """
    overall_score: float = Field(..., ge=0, le=10, description="Overall DSA explanation score between 0 and 10")
    concept_correctness: float = Field(..., ge=0, le=10, description="Accuracy of algorithmic concepts and mechanics")
    explanation_clarity: float = Field(..., ge=0, le=10, description="Clarity and conciseness of spoken articulation")
    structure: float = Field(..., ge=0, le=10, description="Adherence to Intuition -> Approach -> Complexity -> Edge Cases")
    complexity_awareness: float = Field(..., ge=0, le=10, description="Time and space complexity analysis accuracy")
    edge_case_awareness: float = Field(..., ge=0, le=10, description="Identification of critical constraints, null checks, overflows")
    fluency: float = Field(..., ge=0, le=10, description="Smoothness and flow of verbal communication")
    covered_points: List[str] = Field(..., description="Key points from the question that the candidate successfully explained")
    missed_points: List[str] = Field(..., description="Key points from the question that the candidate omitted or skipped")
    misconceptions: List[str] = Field(default_factory=list, description="Any factually incorrect statements, explained gently and constructively")
    improvements: List[str] = Field(..., min_length=3, max_length=3, description="Exactly 3 specific, actionable suggestions for improvement")
    strengths: List[str] = Field(..., description="2-4 positive highlights from the candidate's explanation")
    sample_answer: str = Field(..., description="Model 60-second answer in the tone of a strong college student with bracketed highlights")
    next_focus_area: str = Field(..., description="The single highest-leverage skill to focus on in the next DSA drill")


class DsaSpeechAnalysisResponse(BaseModel):
    """
    Final API response for DSA speech evaluation.
    Merges qualitative Gemini analysis with deterministic code-computed speech metrics.
    """
    overall_score: float
    concept_correctness: float
    explanation_clarity: float
    structure: float
    complexity_awareness: float
    edge_case_awareness: float
    fluency: float
    covered_points: List[str]
    missed_points: List[str]
    misconceptions: List[str]
    improvements: List[str]
    strengths: List[str]
    sample_answer: str
    next_focus_area: str
    # Deterministic metrics
    words_per_minute: float
    word_count: int
    duration_seconds: float
    filler_words_count: int
    filler_words_breakdown: Dict[str, int]
    # Hesitation & pause metrics
    time_to_first_word_seconds: float
    longest_pause_seconds: float
    pauses_over_2s_count: int


class DsaFollowUpRequest(BaseModel):
    question: str = Field(..., description="Current DSA question")
    transcript: str = Field(..., description="User's spoken answer")
    chain_count: int = Field(default=1, description="Current follow-up depth (1, 2, or 3)")


class DsaFollowUpResponse(BaseModel):
    follow_up_question: str = Field(..., description="One deeper, contextual DSA interview follow-up question")

