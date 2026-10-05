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
# DSA Journey & Profile Schemas
# ============================================================================

class RecentProblem(BaseModel):
    title: str = Field(..., description="Problem title")
    platform: str = Field(..., description="Platform name: leetcode, codeforces, etc.")
    difficulty: Optional[str] = Field(default=None, description="Problem difficulty: Easy, Medium, Hard, or rating")
    timestamp: Optional[int] = Field(default=None, description="Timestamp of submission if known")


class TopicCoverageItem(BaseModel):
    topic: str = Field(..., description="One of the 14 standard DSA topics")
    count: int = Field(default=0, description="Number of problems solved in this topic")
    status: str = Field(..., description="Strong (>=20), Moderate (5-19), or Untouched (<5)")


class NormalizedPlatformStats(BaseModel):
    platform: str = Field(..., description="Platform identifier: leetcode, codeforces, gfg, codechef, etc.")
    handle: str = Field(..., description="Username or handle")
    profile_url: str = Field(..., description="Public profile URL")
    is_self_reported: bool = Field(default=False, description="True if self-reported due to no public API")
    total_solved: int = Field(default=0, description="Total problems solved")
    easy_solved: int = Field(default=0, description="Easy problems solved")
    medium_solved: int = Field(default=0, description="Medium problems solved")
    hard_solved: int = Field(default=0, description="Hard problems solved")
    contest_rating: Optional[float] = Field(default=None, description="Contest rating if available")
    global_rank: Optional[str] = Field(default=None, description="Global ranking if available")
    topic_counts: Dict[str, int] = Field(default_factory=dict, description="Counts mapped to 14 standard DSA topics")
    recent_problems: List[RecentProblem] = Field(default_factory=list, description="Recent accepted problems")
    fetched_at: str = Field(..., description="ISO 8601 timestamp of when stats were retrieved or updated")


class DsaJourneyCalculation(BaseModel):
    total_solved: int = Field(default=0, description="Aggregate total problems solved across platforms")
    easy_solved: int = Field(default=0, description="Aggregate easy problems solved")
    medium_solved: int = Field(default=0, description="Aggregate medium problems solved")
    hard_solved: int = Field(default=0, description="Aggregate hard problems solved")
    topic_coverage: List[TopicCoverageItem] = Field(default_factory=list, description="Coverage across standard 14 topics")
    strong_topics: List[str] = Field(default_factory=list, description="Topics with >= 20 solved")
    moderate_topics: List[str] = Field(default_factory=list, description="Topics with 5-19 solved")
    weak_topics: List[str] = Field(default_factory=list, description="Topics with < 5 solved")
    recent_solved_problems: List[RecentProblem] = Field(default_factory=list, description="Deduplicated recent solved problems")
    platforms: List[NormalizedPlatformStats] = Field(default_factory=list, description="Individual platform stats")


class ProfileFetchRequest(BaseModel):
    platform: str = Field(..., description="leetcode or codeforces")
    handle_or_url: str = Field(..., description="User handle or profile URL")
    force_refresh: bool = Field(default=False, description="Bypass cache if true")


class GeminiDsaJourneyAnalysis(BaseModel):
    """
    Schema strictly for Gemini's structured response_schema.
    Contains qualitative evaluation without dict types.
    """
    readiness_assessment: str = Field(..., description="Overall qualitative assessment of interview readiness (2-3 sentences)")
    strengths: List[str] = Field(..., min_length=2, max_length=3, description="2-3 specific algorithmic strengths based on data")
    gaps: List[str] = Field(..., min_length=2, max_length=3, description="2-3 specific gaps or blind spots needing attention")
    recommended_focus_topics: List[str] = Field(..., min_length=3, max_length=3, description="Exactly 3 high-priority topics to practice next")
    interviewer_perspective: str = Field(..., description="A 1-2 sentence candid perspective from a tech interviewer")


class DsaJourneyAnalyzeRequest(BaseModel):
    calculation: DsaJourneyCalculation = Field(..., description="Deterministic pre-calculated journey metrics")


class DsaJourneyResponse(BaseModel):
    calculation: DsaJourneyCalculation = Field(..., description="Deterministic metrics")
    analysis: GeminiDsaJourneyAnalysis = Field(..., description="Qualitative Gemini insights")


class DsaJourneyBrief(BaseModel):
    """
    Compact journey context passed to DSA question generator.
    """
    strong_topics: List[str] = Field(default_factory=list)
    weak_topics: List[str] = Field(default_factory=list)
    recent_problems: List[str] = Field(default_factory=list)
    total_solved: int = Field(default=0)
    recommended_focus_topics: List[str] = Field(default_factory=list)


# ============================================================================
# DSA Interview Mode Schemas
# ============================================================================

class DsaQuestionRequest(BaseModel):
    difficulty: str = Field(default="Medium", description="Easy, Medium, or Hard")
    subtopic_filter: str = Field(default="Surprise Me", description="Subtopic name or Surprise Me")
    type_filter: str = Field(default="Surprise Me", description="Question type name or Surprise Me")
    recent_questions: List[str] = Field(default_factory=list, description="Recent DSA questions to avoid repeating")
    recent_subtopics: List[str] = Field(default_factory=list, description="Recent subtopics to ensure variety")
    journey_context: Optional[DsaJourneyBrief] = Field(default=None, description="Optional user DSA journey stats to drive personalized questions")


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


# ============================================================================
# CS Core Fundamentals Mode Schemas
# ============================================================================

class CoreQuestionRequest(BaseModel):
    subject: str = Field(default="Operating Systems", description="Core CS subject or Surprise Me")
    difficulty: str = Field(default="Medium", description="Easy, Medium, or Hard")
    mode: str = Field(default="test", description="'test' (direct question) or 'teach' (primer + question)")
    recent_questions: List[str] = Field(default_factory=list, description="Recent questions to avoid repetition")
    weak_topics: List[str] = Field(default_factory=list, description="Topics with lower mastery scores to prioritize")
    user_profile: Optional[str] = Field(default=None, description="Optional custom candidate profile context")


class CoreQuestionResponse(BaseModel):
    question: str = Field(..., description="Spoken-only conceptual CS interview question")
    subject: str = Field(..., description="The subject area")
    subtopic: str = Field(..., description="Specific subtopic dynamically selected")
    question_type: str = Field(..., description="Style: Concept, Compare A vs B, Walkthrough, Analogy, etc.")
    difficulty: str = Field(..., description="Easy, Medium, or Hard")
    key_points: List[str] = Field(..., description="Core expected elements: Definition, Mechanism, Example, Trade-off")
    primer: Optional[str] = Field(default=None, description="Beginner-friendly 150-200 word primer with analogy (only in teach mode)")
    follow_up_question: str = Field(..., description="Interviewer follow-up question")


class CoreAnalyzeRequest(BaseModel):
    question: str = Field(..., description="The CS fundamentals question")
    subject: str = Field(default="", description="Subject category")
    subtopic: str = Field(default="", description="Subtopic name")
    key_points: List[str] = Field(default_factory=list, description="Expected key points")
    transcript: str = Field(..., description="Spoken transcript")
    duration_seconds: float = Field(..., ge=1.0, description="Actual speaking duration in seconds")
    time_to_first_word_seconds: float = Field(default=0.0, ge=0.0, description="Time until the first speech event")
    longest_pause_seconds: float = Field(default=0.0, ge=0.0, description="Longest pause between speech chunks")
    pauses_over_2s_count: int = Field(default=0, ge=0, description="Number of pauses exceeding 2 seconds")
    parent_session_id: Optional[str] = Field(default=None, description="Optional parent session ID for chained follow-ups")
    follow_up_chain_count: int = Field(default=0, ge=0, le=3, description="Chained round number (0 to 3)")


class CoreConceptRefresher(BaseModel):
    explanation: str = Field(..., description="Concise, crystal-clear conceptual explanation of the topic")
    remember_points: List[str] = Field(..., min_length=2, max_length=3, description="2-3 key takeaway bullet points to remember")


class GeminiCoreAnalysis(BaseModel):
    """
    Schema strictly for Gemini's structured response_schema in Core mode.
    Contains qualitative evaluation without dict types.
    """
    overall_score: float = Field(..., ge=0, le=10, description="Overall answer score between 0 and 10")
    concept_accuracy: float = Field(..., ge=0, le=10, description="Technical and factual accuracy of CS concept")
    explanation_clarity: float = Field(..., ge=0, le=10, description="Clarity and conciseness of oral explanation")
    structure: float = Field(..., ge=0, le=10, description="4-part structure adherence: Definition -> How it works -> Example -> Trade-off")
    depth: float = Field(..., ge=0, le=10, description="Depth of technical mechanics and internals")
    examples_and_analogies: float = Field(..., ge=0, le=10, description="Quality and appropriateness of concrete examples or analogies")
    fluency: float = Field(..., ge=0, le=10, description="Verbal fluency, steady rhythm, minimal hesitations")
    covered_points: List[str] = Field(..., description="Key points from the question that the candidate successfully explained")
    missed_points: List[str] = Field(..., description="Key points from the question that the candidate omitted or skipped")
    misconceptions: List[str] = Field(default_factory=list, description="Factual inaccuracies gently and constructively corrected")
    improvements: List[str] = Field(..., min_length=3, max_length=3, description="Exactly 3 specific, actionable recommendations")
    strengths: List[str] = Field(..., description="2-4 positive highlights from the candidate's explanation")
    sample_answer: str = Field(..., description="Realistic 60s college student answer with bracketed highlights")
    refresher: CoreConceptRefresher = Field(..., description="Post-drill concept refresher with concise explanation and remember points")
    next_focus_area: str = Field(..., description="Highest-leverage topic or skill to focus on next")


class CoreSpeechAnalysisResponse(BaseModel):
    """
    Final API response for CS Core speech evaluation.
    Merges qualitative Gemini evaluation with deterministic speech metrics.
    """
    overall_score: float
    concept_accuracy: float
    explanation_clarity: float
    structure: float
    depth: float
    examples_and_analogies: float
    fluency: float
    covered_points: List[str]
    missed_points: List[str]
    misconceptions: List[str]
    improvements: List[str]
    strengths: List[str]
    sample_answer: str
    refresher: CoreConceptRefresher
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


class CoreFollowUpRequest(BaseModel):
    question: str = Field(..., description="Current CS core question")
    transcript: str = Field(..., description="User's spoken answer")
    chain_count: int = Field(default=1, description="Current follow-up depth (1, 2, or 3)")


class CoreFollowUpResponse(BaseModel):
    follow_up_question: str = Field(..., description="One deeper, contextual CS interview follow-up question")


