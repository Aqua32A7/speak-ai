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
    FollowUpRequest,
    FollowUpResponse,
    HealthResponse,
    SpeechAnalysisResponse,
    TopicRequest,
    TopicResponse,
)
from services.gemini_service import gemini_service

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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
