import logging
import os
import time
from pathlib import Path
from typing import Dict, List
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Load environment variables from backend/.env or root .env
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

from models.schemas import (
    AnalyzeRequest,
    CoreAnalyzeRequest,
    CoreFollowUpRequest,
    CoreFollowUpResponse,
    CoreQuestionRequest,
    CoreQuestionResponse,
    CoreSpeechAnalysisResponse,
    DsaAnalyzeRequest,
    DsaFollowUpRequest,
    DsaFollowUpResponse,
    DsaJourneyAnalyzeRequest,
    DsaJourneyCalculation,
    DsaJourneyResponse,
    DsaQuestionRequest,
    DsaQuestionResponse,
    DsaSpeechAnalysisResponse,
    FollowUpRequest,
    FollowUpResponse,
    HealthResponse,
    NormalizedPlatformStats,
    ProfileFetchRequest,
    ProjectAnalyzeRequest,
    ProjectAnswerAnalyzeRequest,
    ProjectBrief,
    ProjectFollowUpRequest,
    ProjectFollowUpResponse,
    ProjectQuestionRequest,
    ProjectQuestionResponse,
    ProjectSpeechAnalysisResponse,
    SpeechAnalysisResponse,
    TopicRequest,
    TopicResponse,
)
from services.gemini_service import gemini_service
from services.github_fetcher import (
    fetch_github_repository_data,
    parse_and_validate_github_url,
)
from services.platform_fetcher import (
    calculate_dsa_journey,
    fetch_platform_profile,
)

# Configure logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("speakprep_backend")

app = FastAPI(
    title="SpeakPrep AI API",
    description="Backend service for English speaking and interview communication practice with Google Gemini",
    version="1.0.0",
)

# Setup CORS
allowed_origins_env = os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://localhost:4173")
origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]
# Also allow local 127.0.0.1 variants
origins.extend(["http://127.0.0.1:5173", "http://127.0.0.1:4173"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory sliding window rate limiter: client_ip -> list of timestamps
_RATE_LIMITS: Dict[str, List[float]] = {}
RATE_LIMIT_PER_MINUTE = 30


def check_rate_limit(request: Request):
    """Enforces per-IP sliding window rate limit for public API safety."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    now = time.time()
    cutoff = now - 60.0
    history = _RATE_LIMITS.setdefault(client_ip, [])
    _RATE_LIMITS[client_ip] = [ts for ts in history if ts > cutoff]
    if len(_RATE_LIMITS[client_ip]) >= RATE_LIMIT_PER_MINUTE:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please wait a moment before sending more requests.",
        )
    _RATE_LIMITS[client_ip].append(now)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"An unexpected error occurred: {str(exc)}"},
    )


@app.get("/", tags=["Root"])
async def root():
    """Root status endpoint for monitoring and uptime probes."""
    return {
        "service": "SpeakPrep AI API",
        "status": "online",
        "docs": "/docs",
        "health": "/api/health",
    }


@app.get("/api/health", response_model=HealthResponse)
async def get_health():
    """Health check endpoint to verify API and Gemini configuration status."""
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    model = gemini_service.get_model_name()
    return HealthResponse(
        status="healthy",
        gemini_configured=bool(api_key and len(api_key) > 5),
        model=model,
    )


# ============================================================================
# General Practice Endpoints
# ============================================================================

@app.post("/api/topic", response_model=TopicResponse)
async def generate_topic_endpoint(req: TopicRequest, request: Request):
    """Generates a dynamic 60-second speaking drill topic based on user preferences and profile."""
    check_rate_limit(request)
    return await gemini_service.generate_topic(
        difficulty=req.difficulty,
        category_filter=req.category_filter,
        recent_topics=req.recent_topics,
        profile=req.profile,
        project_brief=req.project_brief,
    )


@app.post("/api/analyze", response_model=SpeechAnalysisResponse)
async def analyze_speech_endpoint(req: AnalyzeRequest, request: Request):
    """
    Evaluates spoken transcript combining deterministic metrics (WPM, fillers, hesitation)
    with Gemini qualitative evaluation.
    """
    check_rate_limit(request)
    words = req.transcript.strip().split()
    if len(words) < 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transcript contains fewer than 5 words. Please record a complete 60-second answer to evaluate.",
        )

    return await gemini_service.analyze_speech(
        topic=req.topic,
        transcript=req.transcript,
        duration_seconds=req.duration_seconds,
        time_to_first_word=req.time_to_first_word_seconds,
        longest_pause=req.longest_pause_seconds,
        pauses_over_2s=req.pauses_over_2s_count,
        profile=req.profile,
    )


@app.post("/api/followup", response_model=FollowUpResponse)
async def generate_followup_endpoint(req: FollowUpRequest, request: Request):
    """Generates an interviewer follow-up question for follow-up drill rounds."""
    check_rate_limit(request)
    follow_up_q = await gemini_service.generate_followup(
        topic=req.topic,
        transcript=req.transcript,
        profile=req.profile,
    )
    return FollowUpResponse(follow_up_question=follow_up_q)


# ============================================================================
# DSA Interview Mode Endpoints
# ============================================================================

@app.post("/api/dsa/question", response_model=DsaQuestionResponse)
async def generate_dsa_question_endpoint(req: DsaQuestionRequest, request: Request):
    """Generates a verbal DSA interview question with key evaluation points."""
    check_rate_limit(request)
    return await gemini_service.generate_dsa_question(
        difficulty=req.difficulty,
        subtopic_filter=req.subtopic_filter,
        type_filter=req.type_filter,
        recent_questions=req.recent_questions,
        recent_subtopics=req.recent_subtopics,
        journey_context=req.journey_context,
        profile=req.profile,
    )


@app.post("/api/dsa/analyze", response_model=DsaSpeechAnalysisResponse)
async def analyze_dsa_endpoint(req: DsaAnalyzeRequest, request: Request):
    """
    Evaluates spoken DSA response comparing against expected key points,
    verifying algorithmic accuracy and answer structure.
    """
    check_rate_limit(request)
    words = req.transcript.strip().split()
    if len(words) < 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transcript contains fewer than 5 words. Please record a complete answer to evaluate.",
        )

    return await gemini_service.analyze_dsa_speech(
        question=req.question,
        transcript=req.transcript,
        key_points=req.key_points,
        duration_seconds=req.duration_seconds,
        time_to_first_word=req.time_to_first_word_seconds,
        longest_pause=req.longest_pause_seconds,
        pauses_over_2s=req.pauses_over_2s_count,
        profile=req.profile,
    )


@app.post("/api/dsa/followup", response_model=DsaFollowUpResponse)
async def generate_dsa_followup_endpoint(req: DsaFollowUpRequest, request: Request):
    """Generates a deeper contextual follow-up question for chained DSA rounds."""
    check_rate_limit(request)
    follow_up_q = await gemini_service.generate_dsa_followup(
        question=req.question,
        transcript=req.transcript,
        chain_count=req.chain_count,
        profile=req.profile,
    )
    return DsaFollowUpResponse(follow_up_question=follow_up_q)


# ============================================================================
# DSA Profile & Journey Endpoints
# ============================================================================

@app.post("/api/dsa/profile/fetch", response_model=NormalizedPlatformStats)
async def fetch_dsa_profile_endpoint(req: ProfileFetchRequest, request: Request):
    """
    Fetches public stats from LeetCode or Codeforces with SSRF protection,
    rate limiting, and in-memory caching.
    """
    check_rate_limit(request)
    client_ip = request.client.host if request.client else "127.0.0.1"
    return await fetch_platform_profile(
        platform=req.platform,
        handle_or_url=req.handle_or_url,
        client_ip=client_ip,
        force_refresh=req.force_refresh,
    )


@app.post("/api/dsa/profile/calculate", response_model=DsaJourneyCalculation)
async def calculate_dsa_journey_endpoint(platforms: list[NormalizedPlatformStats]):
    """
    Computes deterministic aggregate math (totals, difficulty splits, 14-topic coverage)
    across all attached platforms (auto-fetched or self-reported).
    """
    return calculate_dsa_journey(platforms)


@app.post("/api/dsa/profile/analyze", response_model=DsaJourneyResponse)
async def analyze_dsa_journey_endpoint(req: DsaJourneyAnalyzeRequest, request: Request):
    """
    Provides Gemini mentorship insights (readiness assessment, strengths, gaps,
    recommended focus topics, interviewer perspective) based on pre-calculated metrics.
    """
    check_rate_limit(request)
    analysis = await gemini_service.analyze_dsa_journey(
        calculation=req.calculation,
        profile=req.profile,
    )
    return DsaJourneyResponse(calculation=req.calculation, analysis=analysis)


# ============================================================================
# CS Core Fundamentals Endpoints
# ============================================================================

@app.post("/api/core/question", response_model=CoreQuestionResponse)
async def generate_core_question_endpoint(req: CoreQuestionRequest, request: Request):
    """
    Generates a spoken-only conceptual CS interview question.
    In 'teach' mode, provides a beginner-friendly 150-200 word primer before the question.
    """
    check_rate_limit(request)
    return await gemini_service.generate_core_question(
        subject=req.subject,
        difficulty=req.difficulty,
        mode=req.mode,
        recent_questions=req.recent_questions,
        weak_topics=req.weak_topics,
        profile=req.profile,
    )


@app.post("/api/core/analyze", response_model=CoreSpeechAnalysisResponse)
async def analyze_core_endpoint(req: CoreAnalyzeRequest, request: Request):
    """
    Evaluates spoken explanation of CS fundamental concept.
    Assesses 4-part structure, depth, concrete examples, and builds a Concept Refresher.
    """
    check_rate_limit(request)
    words = req.transcript.strip().split()
    if len(words) < 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transcript contains fewer than 5 words. Please record a complete answer to evaluate.",
        )

    return await gemini_service.analyze_core_answer(
        question=req.question,
        transcript=req.transcript,
        key_points=req.key_points,
        duration_seconds=req.duration_seconds,
        time_to_first_word=req.time_to_first_word_seconds,
        longest_pause=req.longest_pause_seconds,
        pauses_over_2s=req.pauses_over_2s_count,
        subject=req.subject,
        subtopic=req.subtopic,
        profile=req.profile,
    )


@app.post("/api/core/followup", response_model=CoreFollowUpResponse)
async def generate_core_followup_endpoint(req: CoreFollowUpRequest, request: Request):
    """Generates a deeper contextual interview follow-up on core CS concepts."""
    check_rate_limit(request)
    follow_up_q = await gemini_service.generate_core_followup(
        question=req.question,
        transcript=req.transcript,
        chain_count=req.chain_count,
        profile=req.profile,
    )
    return CoreFollowUpResponse(follow_up_question=follow_up_q)


# ============================================================================
# My Projects Endpoints
# ============================================================================

@app.post("/api/project/analyze", response_model=ProjectBrief)
async def analyze_project_endpoint(req: ProjectAnalyzeRequest, request: Request):
    """
    Synthesizes a project into an editable ProjectBrief.
    Accepts either a public GitHub repo URL or manual project details.
    """
    check_rate_limit(request)
    if req.github_url and req.github_url.strip():
        owner, repo = parse_and_validate_github_url(req.github_url)
        repo_data = await fetch_github_repository_data(owner, repo)
        return await gemini_service.analyze_project_repo_or_manual(
            github_data=repo_data,
            profile=req.profile,
        )
    elif req.manual_details:
        return await gemini_service.analyze_project_repo_or_manual(
            manual_details=req.manual_details,
            profile=req.profile,
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide either a valid github_url or manual_details for the project.",
        )


@app.post("/api/project/question", response_model=ProjectQuestionResponse)
async def generate_project_question_endpoint(req: ProjectQuestionRequest, request: Request):
    """Generates an oral interview question grounded strictly in the project brief."""
    check_rate_limit(request)
    return await gemini_service.generate_project_question(req)


@app.post("/api/project/answer/analyze", response_model=ProjectSpeechAnalysisResponse)
async def analyze_project_answer_endpoint(req: ProjectAnswerAnalyzeRequest, request: Request):
    """
    Evaluates spoken answer about a project.
    Assesses technical depth, key points checklist, clarity, fluency, and ownership agency ("I built..." vs "we did...").
    """
    check_rate_limit(request)
    words = req.transcript.strip().split()
    if len(words) < 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transcript contains fewer than 5 words. Please record a complete answer to evaluate.",
        )

    return await gemini_service.analyze_project_answer(req)


@app.post("/api/project/followup", response_model=ProjectFollowUpResponse)
async def generate_project_followup_endpoint(req: ProjectFollowUpRequest, request: Request):
    """Generates a deeper interview follow-up question on the candidate's project answer."""
    check_rate_limit(request)
    follow_up_q = await gemini_service.generate_project_followup(req)
    return ProjectFollowUpResponse(follow_up_question=follow_up_q)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
