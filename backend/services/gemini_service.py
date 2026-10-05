import json
import logging
import os
import re
from typing import Any, Dict, List, Tuple
from fastapi import HTTPException
from pydantic import ValidationError

from models.schemas import (
    BetterPhrase,
    DsaQuestionResponse,
    DsaSpeechAnalysisResponse,
    GeminiAnalysis,
    GeminiDsaAnalysis,
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

    async def generate_dsa_question(
        self,
        difficulty: str = "Medium",
        subtopic_filter: str = "Surprise Me",
        type_filter: str = "Surprise Me",
        recent_questions: List[str] = None,
        recent_subtopics: List[str] = None,
    ) -> DsaQuestionResponse:
        """
        Generates a verbal DSA interview question tailored to the student candidate.
        Ensures strictly spoken explanation format (no 'write the code' questions).
        """
        if recent_questions is None:
            recent_questions = []
        if recent_subtopics is None:
            recent_subtopics = []

        client = self._get_client()
        model_name = self._get_model_name()
        from google.genai import types, errors

        recent_questions_clause = ""
        if recent_questions:
            formatted_recent = "\n".join([f"- {q}" for q in recent_questions[-10:]])
            recent_questions_clause = f"""
DO NOT generate questions substantially similar to these recent DSA questions:
{formatted_recent}
Vary subtopic, question type, problem angle, and scenario significantly.
"""

        prompt = f"""{USER_PROFILE_PROMPT}

You are a senior software engineer conducting a technical DSA communication interview.
Generate an engaging, verbal DSA interview question for this candidate.

PARAMETERS:
- Difficulty Level: {difficulty}
  * Easy: Foundational data structures (arrays, linked lists, stacks), basic algorithmic intuition, two pointers, simple time complexity.
  * Medium: Trees & BST traversals, hashing collisions, graph BFS/DFS, recursion vs iteration, heaps, sorting algorithms, dynamic programming intuition.
  * Hard: Advanced graph algorithms (Dijkstra, topological sort), DP state transitions & memoization, monotonic stacks, union-find, bit manipulation, amortized complexity, cache locality trade-offs in C++.
- Subtopic Filter: {subtopic_filter}
  * If "Surprise Me", pick any suitable subtopic from:
    [Arrays & Strings, Linked Lists, Stacks & Queues, Hashing, Trees & BST, Graphs, Recursion & Backtracking, Dynamic Programming, Sorting & Searching, Heaps, Greedy, Two Pointers / Sliding Window, Bit Manipulation].
  * If a specific subtopic is requested, formulate a question strictly on that subtopic.
- Question Type Filter: {type_filter}
  * If "Surprise Me", pick any suitable type from:
    [Theory/Concept, Explain an Approach, Complexity Analysis, Compare Data Structures, Edge Cases & Pitfalls, "Why did you choose X?"].
  * If a specific type is requested, formulate the question to match that style.

{recent_questions_clause}

CRITICAL RULES:
1. STRICTLY SPOKEN EXPLANATION ONLY: Do NOT ask the candidate to write code. Ask them to explain the concept, intuition, algorithmic approach, time/space complexity, trade-offs, or edge cases in words.
2. The question must sound like an authentic interviewer asking a verbal question in a technical interview (e.g. "How does a hash map handle collisions?", "Walk me through how you'd detect a cycle in a linked list and explain the space complexity.", "Why would you choose a min-heap over sorting to find the Kth largest element?").
3. 'key_points': Provide a list of 3 to 5 core technical points that a strong answer must touch upon (e.g. ['Two pointers approach (slow and fast)', 'Slow moves 1 step, fast moves 2 steps', 'If pointers meet, cycle exists', 'O(N) time and O(1) auxiliary space']). This is stored for evaluation and never shown before answering.
4. 'follow_up_question': A natural deeper follow-up question (e.g. "What if we also need to find the starting node of the cycle?").
"""

        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=DsaQuestionResponse,
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
                return DsaQuestionResponse.model_validate(data)
            except errors.APIError as e:
                logger.error(f"Gemini API error during generate_dsa_question: {e}")
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
                logger.warning(f"JSON validation failed in generate_dsa_question (attempt {attempt + 1}): {e}")
                if attempt == 1:
                    raise HTTPException(
                        status_code=500,
                        detail="Received invalid structured response from Gemini after retry.",
                    )
            except Exception as e:
                logger.error(f"Unexpected error during generate_dsa_question: {e}")
                if attempt == 1:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Failed to generate DSA question: {str(e)}",
                    )

        raise HTTPException(status_code=500, detail="Failed to generate DSA question.")

    async def analyze_dsa_answer(
        self,
        question: str,
        transcript: str,
        key_points: List[str],
        duration_seconds: float,
        time_to_first_word: float = 0.0,
        longest_pause: float = 0.0,
        pauses_over_2s: int = 0,
    ) -> DsaSpeechAnalysisResponse:
        """
        Evaluates a candidate's verbal DSA response.
        Compares against key_points, verifies algorithmic correctness, evaluates 4-step structure,
        and accounts for delivery pacing metrics.
        """
        clean_transcript = transcript.strip()
        words = re.findall(r"\b[A-Za-z0-9'-]+\b", clean_transcript)

        if len(words) < 5 or len(clean_transcript) < 15:
            raise HTTPException(
                status_code=400,
                detail="Your response was too brief (fewer than 5 words). Please explain your approach more thoroughly and try again!",
            )

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

        key_points_str = "\n".join([f"- {kp}" for kp in key_points]) if key_points else "None provided."

        prompt = f"""{USER_PROFILE_PROMPT}

You are an expert technical interviewer evaluating a student candidate's verbal DSA response.

QUESTION ASKED:
"{question}"

EXPECTED KEY POINTS FOR A STRONG ANSWER:
{key_points_str}

CANDIDATE'S SPOKEN TRANSCRIPT:
"{clean_transcript}"

RECORDED DELIVERY TIMING:
- Speaking Duration: {duration_seconds:.1f}s | Word Count: {word_count} words | Pacing: {wpm} WPM
- Time before first word: {time_to_first_word:.1f}s | Longest pause: {longest_pause:.1f}s | Pauses > 2s: {pauses_over_2s}
- Conversational Fillers: {filler_count} occurrences ({json.dumps(filler_breakdown)})

DSA EVALUATION GUIDELINES:
1. STRUCTURE COACHING:
   Teach the optimal verbal answer structure: Intuition/Idea ➔ Approach ➔ Time & Space Complexity ➔ Edge Cases & Constraints.
   Identify clearly in your feedback which of these components the candidate covered and which were skipped.
2. TECHNICAL SPEECH TRANSCRIPTION LENIENCE:
   The browser speech recognizer frequently transcribes technical notation phonetically (e.g. "O of n log n" as "oh of n log in", "hash table" as "hashtable", "std unordered map" as "standard an ordered map").
   DO NOT penalize these phonetic transcription errors as grammar mistakes or technical errors. Interpret the engineering intent.
3. FACTUAL ACCURACY & MISCONCEPTIONS:
   If the candidate made a factually wrong claim (e.g. wrong asymptotic complexity, incorrect data structure behavior, or impossible invariant), list it in 'misconceptions' constructively and gently explain the correct concept in simple terms. If there are no factual errors, return an empty list.
4. KEY POINTS COVERAGE:
   Compare the candidate's transcript against the EXPECTED KEY POINTS.
   - 'covered_points': Key points that the candidate adequately explained.
   - 'missed_points': Key points that the candidate skipped or missed.
5. SCORING (0 to 10 scale):
   - overall_score: Balanced score reflecting overall DSA verbal interview performance
   - concept_correctness: Algorithmic accuracy and understanding
   - explanation_clarity: Conciseness and clear verbal flow
   - structure: Adherence to Intuition -> Approach -> Complexity -> Edge Cases
   - complexity_awareness: Accuracy in stating Big-O time and space bounds
   - edge_case_awareness: Mentioning empty inputs, null pointers, bounds, duplicates
   - fluency: Delivery flow and continuity
6. IMPROVEMENTS: Exactly 3 specific, actionable recommendations for the candidate's next DSA drill.
7. STRENGTHS: 2 to 4 positive highlights.
8. SAMPLE ANSWER: A realistic 60-second verbal answer (~110-140 words) in the style of a strong college candidate, with high-impact phrases in brackets [like this].
9. NEXT FOCUS AREA: One single highest-priority skill for the next round.
"""

        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=GeminiDsaAnalysis,
            temperature=0.7,
        )

        gemini_result: GeminiDsaAnalysis | None = None

        for attempt in range(2):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=config,
                )
                raw_text = response.text
                data = json.loads(raw_text)
                gemini_result = GeminiDsaAnalysis.model_validate(data)
                break
            except errors.APIError as e:
                logger.error(f"Gemini API error during analyze_dsa_answer: {e}")
                if "schema" in str(e).lower() and config.response_schema is not None:
                    logger.warning("Gemini rejected response_schema; falling back to JSON-in-prompt with Pydantic validation.")
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
                logger.warning(f"JSON validation failed in analyze_dsa_answer (attempt {attempt + 1}): {e}")
                if attempt == 1:
                    raise HTTPException(
                        status_code=500,
                        detail="Received invalid structured response from Gemini after retry.",
                    )
            except Exception as e:
                logger.error(f"Unexpected error during analyze_dsa_answer: {e}")
                if attempt == 1:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Failed to analyze DSA speech: {str(e)}",
                    )

        if not gemini_result:
            raise HTTPException(status_code=500, detail="Failed to produce DSA speech analysis.")

        return DsaSpeechAnalysisResponse(
            overall_score=round(gemini_result.overall_score, 1),
            concept_correctness=round(gemini_result.concept_correctness, 1),
            explanation_clarity=round(gemini_result.explanation_clarity, 1),
            structure=round(gemini_result.structure, 1),
            complexity_awareness=round(gemini_result.complexity_awareness, 1),
            edge_case_awareness=round(gemini_result.edge_case_awareness, 1),
            fluency=round(gemini_result.fluency, 1),
            covered_points=gemini_result.covered_points,
            missed_points=gemini_result.missed_points,
            misconceptions=gemini_result.misconceptions or [],
            improvements=gemini_result.improvements[:3],
            strengths=gemini_result.strengths,
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

    async def generate_dsa_followup(self, question: str, transcript: str, chain_count: int = 1) -> str:
        """
        Generates ONE deeper, natural technical follow-up question for round chain_count (1 to 3).
        """
        client = self._get_client()
        model_name = self._get_model_name()
        from google.genai import types, errors

        prompt = f"""{USER_PROFILE_PROMPT}

You are an interviewer conducting a DSA interview.
Original Question: "{question}"
Candidate's Spoken Answer: "{transcript}"
Current Follow-up Round: {chain_count} of 3

Generate ONE deeper, natural follow-up question testing:
- Round 1: Edge cases, constraint changes (e.g. duplicates, negative numbers, empty arrays).
- Round 2: Space or time optimization (e.g. can we do this in O(1) auxiliary space? what if input does not fit in memory?).
- Round 3: Real-world trade-offs, alternative data structures (e.g. comparing with a hash table, cache locality in C++).

Keep the question concise, verbal, and realistic. Return only the question string.
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
                logger.error(f"Gemini API error during generate_dsa_followup: {e}")
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
                logger.error(f"Error in generate_dsa_followup: {e}")
                if attempt == 1:
                    raise HTTPException(status_code=500, detail=str(e))

        raise HTTPException(status_code=500, detail="Failed to generate DSA follow-up question.")


# Global singleton instance
gemini_service = GeminiService()

