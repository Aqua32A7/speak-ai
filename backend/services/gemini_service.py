import json
import logging
import os
import re
from typing import Any, Dict, List, Tuple
from fastapi import HTTPException
from pydantic import ValidationError

from models.schemas import (
    BetterPhrase,
    GeminiAnalysis,
    SpeechAnalysisResponse,
    TopicResponse,
)

logger = logging.getLogger(__name__)

USER_PROFILE_PROMPT = """
STUDENT CANDIDATE PROFILE (Tailor all questions, tone, and feedback specifically to this student):
- B.Tech student at M.S. Ramaiah Institute of Technology, Information Science / AIML-oriented.
- Strong DSA focus: 400+ problems solved, uses C++ for DSA.
- Learning Python, Machine Learning (NumPy, Pandas, Scikit-learn), interested in GenAI/LLMs/RAG.
- Has FastAPI experience, knows SQL, has built AI/software projects, has participated in hackathons.
- Preparing for tech internships and software/AI engineering interviews.
- Spoken English level: Beginner-to-intermediate confidence. Key goals: fluency, minimizing filler words, articulating technical explanations clearly, and speaking smoothly for a full 60 seconds without trailing off.
"""

# Reliable filler words and phrases to search deterministically.
# Excludes "so", "right", and "well" as instructed.
MULTI_WORD_FILLERS = [
    "you know",
    "i mean",
    "sort of",
    "kind of",
]

SINGLE_WORD_FILLERS = [
    "actually",
    "basically",
    "literally",
    "um",
    "uh",
]

# Patterns for conversational "like" fillers (e.g. "and, like,", "was like,", "like, you know")
# rather than verb usages ("I like", "would like", "looks like", "acts like")
LIKE_FILLER_REGEX = re.compile(
    r"(?:\b(?:and|it|was|just|is|were|are|be|then|so)\s+like\b|\blike\s+(?:um|uh|you know|actually|basically)\b|\b,\s*like\s*,?\b)",
    re.IGNORECASE,
)


def calculate_speech_metrics(
    transcript: str,
    duration_seconds: float,
    time_to_first_word: float = 0.0,
    longest_pause: float = 0.0,
    pauses_over_2s: int = 0,
) -> Tuple[int, float, int, Dict[str, int]]:
    """
    Deterministically computes word count, WPM, and filler-word metrics from the transcript and timing.
    Returns: (word_count, words_per_minute, filler_words_count, filler_words_breakdown)
    """
    clean_text = transcript.strip()
    words = re.findall(r"\b[A-Za-z0-9'-]+\b", clean_text)
    word_count = len(words)

    effective_duration = max(duration_seconds, 1.0)
    wpm = round((word_count / effective_duration) * 60.0, 1)

    breakdown: Dict[str, int] = {}
    lower_text = f" {clean_text.lower()} "

    # 1. Multi-word fillers
    working_text = lower_text
    for phrase in MULTI_WORD_FILLERS:
        pattern = rf"\b{re.escape(phrase)}\b"
        matches = len(re.findall(pattern, working_text))
        if matches > 0:
            breakdown[phrase] = matches
            # remove to prevent double counting components
            working_text = re.sub(pattern, " ", working_text)

    # 2. Single word fillers
    for word in SINGLE_WORD_FILLERS:
        pattern = rf"\b{re.escape(word)}\b"
        matches = len(re.findall(pattern, working_text))
        if matches > 0:
            breakdown[word] = matches

    # 3. Conversational "like" filler detection
    like_matches = len(LIKE_FILLER_REGEX.findall(clean_text))
    # Also check standalone conversational instances if transcript contains comma-separated or isolated "like"
    standalone_like = len(re.findall(r"(?:^|[.,?!])\s*like\b", clean_text, re.IGNORECASE))
    total_like = like_matches + standalone_like
    if total_like > 0:
        breakdown["like"] = total_like

    total_fillers = sum(breakdown.values())

    return word_count, wpm, total_fillers, breakdown


class GeminiService:
    def __init__(self):
        self._client = None
        self._model = None

    def _get_model_name(self) -> str:
        return os.environ.get("GEMINI_MODEL", "gemini-3-flash-preview").strip()

    def _get_client(self):
        api_key = os.environ.get("GEMINI_API_KEY", "").strip()
        if not api_key:
            raise HTTPException(
                status_code=500,
                detail="Gemini API key is not configured. Please add GEMINI_API_KEY to backend/.env and restart the backend.",
            )
        try:
            from google import genai
            if self._client is None:
                self._client = genai.Client(api_key=api_key)
            return self._client
        except ImportError:
            raise HTTPException(
                status_code=500,
                detail="google-genai SDK is not installed. Please run 'pip install -r requirements.txt'.",
            )
        except Exception as e:
            logger.error(f"Error initializing Gemini client: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to initialize Gemini client: {str(e)}",
            )

    async def generate_topic(
        self,
        difficulty: str = "Medium",
        category_filter: str = "Random",
        recent_topics: List[str] = None,
    ) -> TopicResponse:
        """
        Generates a fresh speaking prompt tailored to the student candidate.
        Uses structured outputs and high temperature for maximum variety.
        """
        if recent_topics is None:
            recent_topics = []

        client = self._get_client()
        model_name = self._get_model_name()
        from google.genai import types, errors

        recent_topics_clause = ""
        if recent_topics:
            formatted_recent = "\n".join([f"- {t}" for t in recent_topics[-10:]])
            recent_topics_clause = f"""
DO NOT generate topics substantially similar to these recent topics:
{formatted_recent}
Vary category, angle, scenario, and question format significantly.
"""

        prompt = f"""{USER_PROFILE_PROMPT}

You are an expert technical interviewer and communication coach conducting a 60-second speaking drill.
Generate an engaging, realistic interview question or speaking drill prompt for this candidate.

PARAMETERS:
- Difficulty Level: {difficulty}
  * Easy: General tech conversation, college project background, simple introductory interview questions.
  * Medium: Explaining a data structure concept, describing an ML workflow, debugging experience, teamwork challenge, or behavioral scenario.
  * Hard: In-depth technical explanation (e.g. C++ memory management, RAG architecture trade-offs, handling merge conflicts in production, edge cases in algorithms), complex behavioral situation.
- Category Preference: {category_filter}
  * If "Random" or "Surprise Me", select the best category that fits the candidate's profile from:
    [HR Interview, Technical Interview, DSA, Machine Learning, Python, Backend, Projects, College Experience, Internship, Leadership, Teamwork, Problem Solving, Career, General Technology, AI, Behavioral Interview].
  * If a specific category is requested, stay strictly within that domain.

{recent_topics_clause}

INSPIRATION TOPIC TYPES (Do NOT copy verbatim, create a fresh angle every time):
- Explaining a DSA problem you solved (e.g. graph traversal, two pointers, dynamic programming)
- Why choosing C++ for DSA gave you deeper insight into memory/pointers
- Your journey learning machine learning and data pipelines
- A project challenge you tackled in FastAPI or web development
- Explaining what an API or client-server model is to a non-technical interviewer
- Why you are passionate about Generative AI / RAG
- A time you collaborated with peers during a hackathon under time pressure

REQUIREMENTS:
1. 'topic': A clear, direct 1-to-2 sentence prompt that can be answered in a 60-second response.
2. 'category': The exact matching category label.
3. 'difficulty': Must be "{difficulty}".
4. 'follow_up_question': A natural, relevant follow-up question the interviewer would ask immediately after this response.
"""

        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=TopicResponse,
            temperature=0.95,
        )

        for attempt in range(2):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=config,
                )
                raw_text = response.text
                data = json.loads(raw_text)
                return TopicResponse.model_validate(data)
            except errors.APIError as e:
                logger.error(f"Gemini API error during generate_topic: {e}")
                if getattr(e, "code", None) == 429 or "quota" in str(e).lower():
                    raise HTTPException(
                        status_code=429,
                        detail="Gemini API rate limit exceeded. Please wait a moment before trying again.",
                    )
                if attempt == 1:
                    raise HTTPException(
                        status_code=502,
                        detail=f"Gemini service error: {str(e)}",
                    )
            except (json.JSONDecodeError, ValidationError) as e:
                logger.warning(f"JSON validation failed in generate_topic (attempt {attempt + 1}): {e}")
                if attempt == 1:
                    raise HTTPException(
                        status_code=500,
                        detail="Received invalid structured response from Gemini after retry.",
                    )
            except Exception as e:
                logger.error(f"Unexpected error during generate_topic: {e}")
                if attempt == 1:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Failed to generate topic: {str(e)}",
                    )

        raise HTTPException(status_code=500, detail="Failed to generate topic.")

    async def analyze_speech(
        self,
        topic: str,
        transcript: str,
        duration_seconds: float,
        time_to_first_word: float = 0.0,
        longest_pause: float = 0.0,
        pauses_over_2s: int = 0,
    ) -> SpeechAnalysisResponse:
        """
        Analyzes the user's 60-second speech.
        Combines deterministic WPM, filler word, and hesitation calculations with
        Gemini's qualitative coaching analysis.
        """
        clean_transcript = transcript.strip()
        words = re.findall(r"\b[A-Za-z0-9'-]+\b", clean_transcript)

        # Immediate validation: reject empty or very short answers without calling Gemini
        if len(words) < 5 or len(clean_transcript) < 15:
            raise HTTPException(
                status_code=400,
                detail="Your response was too brief (fewer than 5 words). Please speak for the full 60 seconds and try again!",
            )

        # 1. Deterministic metric calculation
        word_count, wpm, filler_count, filler_breakdown = calculate_speech_metrics(
            clean_transcript,
            duration_seconds,
            time_to_first_word,
            longest_pause,
            pauses_over_2s,
        )

        client = self._get_client()
        model_name = self._get_model_name()
        from google.genai import types, errors

        # 2. Gemini qualitative analysis with GeminiAnalysis schema
        prompt = f"""{USER_PROFILE_PROMPT}

You are an encouraging, pragmatic speaking coach evaluating a 60-second spoken answer from an engineering student.

CONTEXT & TOPIC:
"{topic}"

CANDIDATE TRANSCRIPT:
"{clean_transcript}"

RECORDED DELIVERY TIMING:
- Actual Speaking Duration: {duration_seconds:.1f} seconds
- Total Word Count: {word_count} words
- Delivery Pace: {wpm} words per minute
- Time before first spoken word: {time_to_first_word:.1f} seconds
- Longest pause between speech events: {longest_pause:.1f} seconds
- Pauses exceeding 2 seconds: {pauses_over_2s}
- Detected conversational fillers: {filler_count} occurrences ({json.dumps(filler_breakdown)})

COACHING GUIDELINES:
1. Tone: Beginner-friendly, constructive, encouraging, without technical grammar jargon (e.g. avoid phrases like "subordinate clauses" or "gerunds"). Use straightforward explanations like "You explained the concept clearly", "Try shorter, punchy sentences", or "Lead directly with your answer before providing context".
2. Delivery Pacing Feedback: Use the actual recorded timing metrics (time to first word, pauses, WPM) to evaluate whether the speaker hesitated before beginning or lost momentum mid-way.
3. Scoring (0 to 10 scale):
   - overall_score: Balanced score reflecting interview effectiveness
   - fluency_score: Smoothness and continuity of flow
   - clarity_score: Logical structure and concise phrasing
   - grammar_score: Natural spoken phrasing and clean sentence boundaries
   - relevance_score: Directness in addressing the specific question
   - confidence_score: Authoritative tone and conviction
   - technical_depth_score: Accurate use of technical concepts and depth
4. Improvements: Exactly 3 specific, highly actionable recommendations for this student's next drill.
5. Strengths: 2 to 4 positive aspects of this attempt.
6. Better Phrases: Provide 2 to 4 concrete upgrades replacing clunky, hesitant, or colloquial student phrasing with polished, natural interview phrasing.
   Example:
   - original: "Basically what I am doing is..."
   - suggested: "In my recent project, I implemented..."
   - reason: "Direct and conveys active ownership."
7. Sample Answer: Provide a realistic 60-second response (~110-140 words) that sounds like a smart college student in an interview, NOT a canned robotic executive. Surround particularly useful power phrases in brackets like [In my experience with...] or [The key trade-off here was...].
8. Next Focus Area: One single clear priority skill to practice on the next 60-second attempt.
"""

        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=GeminiAnalysis,
            temperature=0.7,
        )

        gemini_result: GeminiAnalysis | None = None

        for attempt in range(2):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=config,
                )
                raw_text = response.text
                data = json.loads(raw_text)
                gemini_result = GeminiAnalysis.model_validate(data)
                break
            except errors.APIError as e:
                logger.error(f"Gemini API error during analyze_speech: {e}")
                # If Gemini API rejects nested schema, fallback to JSON mode with prompt schema & Pydantic validation
                if "schema" in str(e).lower() and config.response_schema is not None:
                    logger.warning("Gemini rejected response_schema (likely nested BetterPhrase model); falling back to JSON-in-prompt with Pydantic validation.")
                    config = types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.7,
                    )
                    continue
                if getattr(e, "code", None) == 429 or "quota" in str(e).lower():
                    raise HTTPException(
                        status_code=429,
                        detail="Gemini API rate limit reached. Please wait a few seconds and try again.",
                    )
                if attempt == 1:
                    raise HTTPException(
                        status_code=502,
                        detail=f"Gemini evaluation error: {str(e)}",
                    )
            except (json.JSONDecodeError, ValidationError) as e:
                logger.warning(f"JSON validation failed in analyze_speech (attempt {attempt + 1}): {e}")
                if attempt == 1:
                    raise HTTPException(
                        status_code=500,
                        detail="Received invalid structured response from Gemini after retry.",
                    )
            except Exception as e:
                logger.error(f"Unexpected error during analyze_speech: {e}")
                if attempt == 1:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Failed to analyze speech: {str(e)}",
                    )

        if not gemini_result:
            raise HTTPException(status_code=500, detail="Failed to produce speech analysis.")

        # 3. Merge deterministic metrics with Gemini qualitative analysis into SpeechAnalysisResponse
        return SpeechAnalysisResponse(
            overall_score=round(gemini_result.overall_score, 1),
            fluency_score=round(gemini_result.fluency_score, 1),
            clarity_score=round(gemini_result.clarity_score, 1),
            grammar_score=round(gemini_result.grammar_score, 1),
            relevance_score=round(gemini_result.relevance_score, 1),
            confidence_score=round(gemini_result.confidence_score, 1),
            technical_depth_score=round(gemini_result.technical_depth_score, 1),
            strengths=gemini_result.strengths,
            improvements=gemini_result.improvements[:3],
            better_phrases=gemini_result.better_phrases,
            sample_answer=gemini_result.sample_answer,
            next_focus_area=gemini_result.next_focus_area,
            words_per_minute=wpm,
            word_count=word_count,
            duration_seconds=round(duration_seconds, 1),
            filler_words_count=filler_count,
            filler_words_breakdown=filler_breakdown,
            time_to_first_word_seconds=round(time_to_first_word, 2),
            longest_pause_seconds=round(longest_pause, 2),
            pauses_over_2s_count=pauses_over_2s,
        )

    async def generate_followup(self, topic: str, transcript: str) -> str:
        """
        Generates ONE contextual interview follow-up question based on the student's answer.
        """
        client = self._get_client()
        model_name = self._get_model_name()
        from google.genai import types, errors

        prompt = f"""{USER_PROFILE_PROMPT}

You are an interviewer listening to this student's 60-second response:
Original Question: "{topic}"
Student Response: "{transcript}"

Generate ONE targeted, natural interview follow-up question that tests their depth, reasoning, or real-world practical trade-offs.
Keep the question clear, engaging, and realistic for a software engineering or AI intern interview.
Return only the question text as a string.
"""

        for attempt in range(2):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                )
                text = response.text.strip().strip('"').strip("'")
                if text:
                    return text
            except errors.APIError as e:
                logger.error(f"Gemini API error during generate_followup: {e}")
                if getattr(e, "code", None) == 429 or "quota" in str(e).lower():
                    raise HTTPException(
                        status_code=429,
                        detail="Gemini API rate limit exceeded.",
                    )
                if attempt == 1:
                    raise HTTPException(
                        status_code=502,
                        detail=f"Gemini service error: {str(e)}",
                    )
            except Exception as e:
                logger.error(f"Error in generate_followup: {e}")
                if attempt == 1:
                    raise HTTPException(status_code=500, detail=str(e))

        raise HTTPException(status_code=500, detail="Failed to generate follow-up question.")


# Global singleton instance
gemini_service = GeminiService()
