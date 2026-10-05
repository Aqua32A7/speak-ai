from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class DifficultyLevel(str, Enum):
    EASY = "Easy"
    MEDIUM = "Medium"
    HARD = "Hard"


# ============================================================================
# User Profile Schema
# ============================================================================

class UserProfile(BaseModel):
    name: Optional[str] = Field(default=None, max_length=100, description="Candidate name")
    education: Optional[str] = Field(default=None, max_length=150, description="University / College / School")
    experience_level: Optional[str] = Field(default=None, max_length=100, description="Year or experience level")
    field_of_study: Optional[str] = Field(default=None, max_length=100, description="Field of study / Major")
    target_role: Optional[str] = Field(default=None, max_length=100, description="Target job title or role")
    languages: Optional[List[str]] = Field(default_factory=list, description="Primary programming languages")
    skills: Optional[List[str]] = Field(default_factory=list, description="Key skills and interests")
    english_level: Optional[str] = Field(default=None, max_length=50, description="Spoken English level: beginner, intermediate, advanced")
    goals: Optional[str] = Field(default=None, max_length=300, description="Candidate practice goals")

    def has_content(self) -> bool:
        return any([
            self.name,
            self.education,
            self.experience_level,
            self.field_of_study,
            self.target_role,
            bool(self.languages),
            bool(self.skills),
            self.english_level,
            self.goals,
        ])


# ============================================================================
# General Speaking Practice Schemas
# ============================================================================

class ProjectBrief(BaseModel):
    id: Optional[str] = Field(default=None, description="Unique client-side ID")
    name: str = Field(..., max_length=150, description="Project name")
    summary: str = Field(..., max_length=2000, description="Overview of the project and problem solved")
    tech_stack: List[str] = Field(default_factory=list, description="Technologies, libraries, and frameworks")
    key_features: List[str] = Field(default_factory=list, description="Key features built")
    architecture_overview: str = Field(..., max_length=2000, description="System architecture and structure")
    notable_challenges: List[str] = Field(default_factory=list, description="Technical challenges encountered")
    what_user_built: str = Field(..., max_length=2000, description="What the candidate specifically authored")
    likely_interview_angles: List[str] = Field(default_factory=list, description="Likely interview questions / discussion angles")
    source: str = Field(default="manual", description="'github' or 'manual'")
    confidence_notes: str = Field(default="", max_length=1000, description="Notes on inference certainty or gaps")
    created_at: Optional[str] = Field(default=None, description="Timestamp created")


class TopicRequest(BaseModel):
    difficulty: str = Field(default="Medium", description="Easy, Medium, or Hard")
    category_filter: str = Field(default="Random", description="Category filter label or Surprise Me/Random")
    recent_topics: List[str] = Field(default_factory=list, description="List of recently generated topics to prevent duplicates")
    profile: Optional[UserProfile] = Field(default=None, description="Optional candidate profile")
    project_brief: Optional[ProjectBrief] = Field(default=None, description="Optional project brief if practicing a project topic")


class TopicResponse(BaseModel):
    topic: str = Field(..., description="The generated speaking drill topic/prompt")
    category: str = Field(..., description="Category label")
    difficulty: str = Field(..., description="Easy, Medium, or Hard")
    follow_up_question: str = Field(..., description="A natural follow-up question related to the topic")


class AnalyzeRequest(BaseModel):
    topic: str = Field(..., max_length=1000, description="Topic of the speaking session")
    transcript: str = Field(..., max_length=5000, description="Speech transcript from the user")
    duration_seconds: float = Field(..., ge=1.0, description="Actual speaking duration in seconds")
    time_to_first_word_seconds: float = Field(default=0.0, ge=0.0, description="Time until the first speech event")
    longest_pause_seconds: float = Field(default=0.0, ge=0.0, description="Longest pause detected between speech chunks")
    pauses_over_2s_count: int = Field(default=0, ge=0, description="Number of pauses exceeding 2 seconds")
    parent_session_id: Optional[str] = Field(default=None, description="Optional parent session ID if this is a follow-up answer")
    profile: Optional[UserProfile] = Field(default=None, description="Optional candidate profile")


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
    sample_answer: str = Field(..., description="Realistic 60-second interview answer with bracketed useful phrases")
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
    topic: str = Field(..., max_length=1000, description="Original topic")
    transcript: str = Field(..., max_length=5000, description="User's response transcript")
    profile: Optional[UserProfile] = Field(default=None, description="Optional candidate profile")


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
    profile: Optional[UserProfile] = Field(default=None, description="Optional candidate profile")


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
    profile: Optional[UserProfile] = Field(default=None, description="Optional candidate profile")


class DsaQuestionResponse(BaseModel):
    question: str = Field(..., description="The verbal DSA question prompt")
    subtopic: str = Field(..., description="Data structure or algorithm subtopic")
    question_type: str = Field(..., description="Type of question (e.g. Theory/Concept, Explain an Approach)")
    difficulty: str = Field(..., description="Easy, Medium, or Hard")
    key_points: List[str] = Field(..., description="Key points a strong answer should cover (hidden until feedback)")
    follow_up_question: str = Field(..., description="An initial follow-up question related to this problem")


class DsaAnalyzeRequest(BaseModel):
    question: str = Field(..., max_length=1000, description="The DSA interview question")
    transcript: str = Field(..., max_length=5000, description="User's spoken answer transcript")
    key_points: List[str] = Field(default_factory=list, description="The key points associated with this question")
    duration_seconds: float = Field(..., ge=1.0, description="Actual speaking duration in seconds")
    time_to_first_word_seconds: float = Field(default=0.0, ge=0.0, description="Time until the first speech event")
    longest_pause_seconds: float = Field(default=0.0, ge=0.0, description="Longest pause detected between speech chunks")
    pauses_over_2s_count: int = Field(default=0, ge=0, description="Number of pauses exceeding 2 seconds")
    parent_session_id: Optional[str] = Field(default=None, description="Optional parent session ID for chained follow-ups")
    follow_up_chain_count: int = Field(default=0, ge=0, le=3, description="Chained follow-up round number (0 to 3)")
    profile: Optional[UserProfile] = Field(default=None, description="Optional candidate profile")


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
    sample_answer: str = Field(..., description="Model 60-second answer in the tone of a strong candidate with bracketed highlights")
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
    question: str = Field(..., max_length=1000, description="Current DSA question")
    transcript: str = Field(..., max_length=5000, description="User's spoken answer")
    chain_count: int = Field(default=1, description="Current follow-up depth (1, 2, or 3)")
    profile: Optional[UserProfile] = Field(default=None, description="Optional candidate profile")


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
    profile: Optional[UserProfile] = Field(default=None, description="Optional candidate profile context")


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
    question: str = Field(..., max_length=1000, description="The CS fundamentals question")
    subject: str = Field(default="", max_length=150, description="Subject category")
    subtopic: str = Field(default="", max_length=150, description="Subtopic name")
    key_points: List[str] = Field(default_factory=list, description="Expected key points")
    transcript: str = Field(..., max_length=5000, description="Spoken transcript")
    duration_seconds: float = Field(..., ge=1.0, description="Actual speaking duration in seconds")
    time_to_first_word_seconds: float = Field(default=0.0, ge=0.0, description="Time until the first speech event")
    longest_pause_seconds: float = Field(default=0.0, ge=0.0, description="Longest pause between speech chunks")
    pauses_over_2s_count: int = Field(default=0, ge=0, description="Number of pauses exceeding 2 seconds")
    parent_session_id: Optional[str] = Field(default=None, description="Optional parent session ID for chained follow-ups")
    follow_up_chain_count: int = Field(default=0, ge=0, le=3, description="Chained round number (0 to 3)")
    profile: Optional[UserProfile] = Field(default=None, description="Optional candidate profile")


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
    sample_answer: str = Field(..., description="Realistic 60s candidate answer with bracketed highlights")
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
    question: str = Field(..., max_length=1000, description="Current CS core question")
    transcript: str = Field(..., max_length=5000, description="User's spoken answer")
    chain_count: int = Field(default=1, description="Current follow-up depth (1, 2, or 3)")
    profile: Optional[UserProfile] = Field(default=None, description="Optional candidate profile")


class CoreFollowUpResponse(BaseModel):
    follow_up_question: str = Field(..., description="One deeper, contextual CS interview follow-up question")


# ============================================================================
# My Projects & Project-Based Interview Schemas
# ============================================================================

class ManualProjectDetails(BaseModel):
    name: str = Field(..., max_length=150, description="Project name")
    description: str = Field(..., max_length=3000, description="Description of the project and problem solved")
    tech_stack: Optional[str] = Field(default="", max_length=500, description="Technologies, frameworks, and libraries used")
    what_user_built: Optional[str] = Field(default="", max_length=3000, description="What the candidate specifically authored")
    challenges_faced: Optional[str] = Field(default="", max_length=3000, description="Notable challenges, bugs, or bottlenecks faced")
    results_impact: Optional[str] = Field(default="", max_length=2000, description="Results, impact, or outcomes achieved")


class GeminiProjectBrief(BaseModel):
    """
    Schema strictly for Gemini's structured response_schema.
    Contains qualitative evaluation without dict types.
    """
    name: str = Field(..., description="Project name")
    summary: str = Field(..., description="2-3 sentence overview of what the application does and problem solved")
    tech_stack: List[str] = Field(default_factory=list, description="4-8 specific technologies and tools used")
    key_features: List[str] = Field(default_factory=list, description="3-5 concrete functional features")
    architecture_overview: str = Field(..., description="2-3 sentence explanation of system design and data flow")
    notable_challenges: List[str] = Field(default_factory=list, description="2-3 realistic technical challenges")
    what_user_built: str = Field(..., description="Concise summary of what the candidate built and configured")
    likely_interview_angles: List[str] = Field(default_factory=list, description="3-5 likely interview angles")
    confidence_notes: str = Field(default="", description="Notes on missing details, inference confidence, or areas to clarify")


class ProjectAnalyzeRequest(BaseModel):
    github_url: Optional[str] = Field(default=None, max_length=500, description="Public GitHub repository URL")
    manual_details: Optional[ManualProjectDetails] = Field(default=None, description="Manual project details if not using GitHub URL")
    profile: Optional[UserProfile] = Field(default=None, description="Optional candidate profile")


class ProjectQuestionRequest(BaseModel):
    project_brief: ProjectBrief = Field(..., description="The project brief")
    profile: Optional[UserProfile] = Field(default=None, description="Optional candidate profile")
    difficulty: str = Field(default="Medium", description="Easy, Medium, or Hard")
    recent_questions: List[str] = Field(default_factory=list, description="Recent questions to avoid repetition")
    question_type: Optional[str] = Field(default="Surprise Me", description="Specific interview angle or Surprise Me")


class ProjectQuestionResponse(BaseModel):
    question: str = Field(..., description="The oral project interview question prompt")
    question_type: str = Field(..., description="The interview angle")
    difficulty: str = Field(..., description="Easy, Medium, or Hard")
    key_points: List[str] = Field(..., description="Key points a strong answer should address (hidden until feedback)")
    follow_up_question: str = Field(..., description="An initial follow-up question related to this project aspect")
    project_name: str = Field(..., description="Name of the project")


class ProjectAnswerAnalyzeRequest(BaseModel):
    question: str = Field(..., max_length=1000, description="The project interview question")
    question_type: str = Field(default="Project Architecture", max_length=150, description="The interview angle")
    project_brief: ProjectBrief = Field(..., description="The project brief")
    key_points: List[str] = Field(default_factory=list, description="Expected key points")
    transcript: str = Field(..., max_length=5000, description="Spoken transcript")
    duration_seconds: float = Field(..., ge=1.0, description="Actual speaking duration in seconds")
    time_to_first_word_seconds: float = Field(default=0.0, ge=0.0, description="Time until the first speech event")
    longest_pause_seconds: float = Field(default=0.0, ge=0.0, description="Longest pause between speech chunks")
    pauses_over_2s_count: int = Field(default=0, ge=0, description="Number of pauses exceeding 2 seconds")
    parent_session_id: Optional[str] = Field(default=None, description="Optional parent session ID for chained follow-ups")
    follow_up_chain_count: int = Field(default=0, ge=0, le=3, description="Chained round number (0 to 3)")
    profile: Optional[UserProfile] = Field(default=None, description="Optional candidate profile")


class GeminiProjectAnswerAnalysis(BaseModel):
    """
    Schema strictly for Gemini's structured response_schema.
    Contains qualitative evaluation without dict types.
    """
    overall_score: float = Field(..., ge=0, le=10, description="Overall answer score between 0 and 10")
    technical_depth: float = Field(..., ge=0, le=10, description="Technical depth and engineering accuracy")
    clarity_score: float = Field(..., ge=0, le=10, description="Clarity and conciseness of oral explanation")
    ownership_score: float = Field(..., ge=0, le=10, description="Personal agency and ownership: 'I built...' vs passive 'we did...'")
    concrete_details_score: float = Field(..., ge=0, le=10, description="Specificity: metrics, libraries, architecture vs hand-waving")
    fluency: float = Field(..., ge=0, le=10, description="Smooth verbal flow and rhythm")
    covered_points: List[str] = Field(..., description="Key points from the question that the candidate addressed")
    missed_points: List[str] = Field(..., description="Key points from the question that were omitted")
    ownership_feedback: str = Field(..., description="Feedback specifically assessing personal agency and active ownership")
    improvements: List[str] = Field(..., min_length=3, max_length=3, description="Exactly 3 specific, actionable recommendations")
    strengths: List[str] = Field(..., description="2-4 positive highlights from the candidate's explanation")
    sample_answer: str = Field(..., description="Realistic 60s candidate answer with bracketed highlights")
    next_focus_area: str = Field(..., description="Highest-leverage skill or angle to focus on in next drill")


class ProjectSpeechAnalysisResponse(BaseModel):
    """
    Final API response for Project speech evaluation.
    Merges qualitative Gemini evaluation with deterministic speech metrics.
    """
    overall_score: float
    technical_depth: float
    clarity_score: float
    ownership_score: float
    concrete_details_score: float
    fluency: float
    covered_points: List[str]
    missed_points: List[str]
    ownership_feedback: str
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


class ProjectFollowUpRequest(BaseModel):
    question: str = Field(..., max_length=1000, description="Current project interview question")
    transcript: str = Field(..., max_length=5000, description="User's spoken answer")
    project_brief: ProjectBrief = Field(..., description="The project brief")
    chain_count: int = Field(default=1, ge=1, le=3, description="Current follow-up depth (1, 2, or 3)")
    profile: Optional[UserProfile] = Field(default=None, description="Optional candidate profile")


class ProjectFollowUpResponse(BaseModel):
    follow_up_question: str = Field(..., description="One deeper, contextual project interview follow-up question")
