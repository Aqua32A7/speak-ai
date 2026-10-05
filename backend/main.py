import logging
import os
from pathlib import Path
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
    SpeechAnalysisResponse,
    TopicRequest,
    TopicResponse,
)
from services.gemini_service import gemini_service
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


@app.get("/api/health", response_model=HealthResponse)
async def get_health():
    """Health check endpoint to verify API and Gemini configuration status."""
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash").strip()
    return HealthResponse(
        status="healthy",
        gemini_configured=bool(api_key and len(api_key) > 5),
        model=model,
    )


@app.post("/api/topic", response_model=TopicResponse)
async def generate_topic_endpoint(req: TopicRequest):
    """Generates a dynamic 60-second speaking drill topic based on user preferences."""
    return await gemini_service.generate_topic(
        difficulty=req.difficulty,
        category_filter=req.category_filter,
        recent_topics=req.recent_topics,
    )


@app.post("/api/analyze", response_model=SpeechAnalysisResponse)
async def analyze_speech_endpoint(req: AnalyzeRequest):
    """
    Evaluates spoken transcript combining deterministic metrics (WPM, fillers, hesitation)
    with Gemini qualitative evaluation.
    """
    return await gemini_service.analyze_speech(
        topic=req.topic,
        transcript=req.transcript,
        duration_seconds=req.duration_seconds,
        time_to_first_word=req.time_to_first_word_seconds,
        longest_pause=req.longest_pause_seconds,
        pauses_over_2s=req.pauses_over_2s_count,
    )


@app.post("/api/followup", response_model=FollowUpResponse)
async def generate_followup_endpoint(req: FollowUpRequest):
    """Generates an interviewer follow-up question for follow-up drill rounds."""
    follow_up_q = await gemini_service.generate_followup(
        topic=req.topic,
        transcript=req.transcript,
    )
    return FollowUpResponse(follow_up_question=follow_up_q)


# ============================================================================
# DSA Interview Mode Endpoints
# ============================================================================

@app.post("/api/dsa/question", response_model=DsaQuestionResponse)
async def generate_dsa_question_endpoint(req: DsaQuestionRequest):
    """Generates a verbal DSA interview question with key evaluation points."""
    return await gemini_service.generate_dsa_question(
        difficulty=req.difficulty,
        subtopic_filter=req.subtopic_filter,
        type_filter=req.type_filter,
        recent_questions=req.recent_questions,
        recent_subtopics=req.recent_subtopics,
        journey_context=req.journey_context,
    )


@app.post("/api/dsa/analyze", response_model=DsaSpeechAnalysisResponse)
async def analyze_dsa_endpoint(req: DsaAnalyzeRequest):
    """
    Evaluates spoken DSA response comparing against expected key points,
    verifying algorithmic accuracy and answer structure.
    """
    return await gemini_service.analyze_dsa_answer(
        question=req.question,
        transcript=req.transcript,
        key_points=req.key_points,
        duration_seconds=req.duration_seconds,
        time_to_first_word=req.time_to_first_word_seconds,
        longest_pause=req.longest_pause_seconds,
        pauses_over_2s=req.pauses_over_2s_count,
    )


@app.post("/api/dsa/followup", response_model=DsaFollowUpResponse)
async def generate_dsa_followup_endpoint(req: DsaFollowUpRequest):
    """Generates a deeper contextual follow-up question for chained DSA rounds."""
    follow_up_q = await gemini_service.generate_dsa_followup(
        question=req.question,
        transcript=req.transcript,
        chain_count=req.chain_count,
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
async def analyze_dsa_journey_endpoint(req: DsaJourneyAnalyzeRequest):
    """
    Provides Gemini mentorship insights (readiness assessment, strengths, gaps,
    recommended focus topics, interviewer perspective) based on pre-calculated metrics.
    """
    analysis = await gemini_service.analyze_dsa_journey(req.calculation)
    return DsaJourneyResponse(calculation=req.calculation, analysis=analysis)


# ============================================================================
# CS Core Fundamentals Endpoints
# ============================================================================

@app.post("/api/core/question", response_model=CoreQuestionResponse)
async def generate_core_question_endpoint(req: CoreQuestionRequest):
    """
    Generates a spoken-only conceptual CS interview question.
    In 'teach' mode, provides a beginner-friendly 150-200 word primer before the question.
    """
    return await gemini_service.generate_core_question(
        subject=req.subject,
        difficulty=req.difficulty,
        mode=req.mode,
        recent_questions=req.recent_questions,
        weak_topics=req.weak_topics,
        user_profile=req.user_profile,
    )


@app.post("/api/core/analyze", response_model=CoreSpeechAnalysisResponse)
async def analyze_core_endpoint(req: CoreAnalyzeRequest):
    """
    Evaluates spoken explanation of CS fundamental concept.
    Assesses 4-part structure, depth, concrete examples, and builds a Concept Refresher.
    """
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
    )


@app.post("/api/core/followup", response_model=CoreFollowUpResponse)
async def generate_core_followup_endpoint(req: CoreFollowUpRequest):
    """Generates a deeper contextual interview follow-up on core CS concepts."""
    follow_up_q = await gemini_service.generate_core_followup(
        question=req.question,
        transcript=req.transcript,
        chain_count=req.chain_count,
    )
    return CoreFollowUpResponse(follow_up_question=follow_up_q)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
