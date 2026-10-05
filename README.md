# SpeakPrep AI 🎙️

**SpeakPrep AI** is a full-stack web application designed to help engineering students and software developers practice English speaking and technical communication through focused **60-second speaking drills**.

Instead of static question lists or canned feedback, SpeakPrep AI connects directly with **Google Gemini** (via the official `google-genai` Python SDK) to generate dynamic, role-tailored interview scenarios and provide constructive, multi-dimensional coaching grounded in actual speech delivery metrics.

---

## Table of Contents
1. [Overview & Core Value](#overview--core-value)
2. [Candidate Profile Context](#candidate-profile-context)
3. [Architecture & Tech Stack](#architecture--tech-stack)
4. [Key Features](#key-features)
5. [Prerequisites & Requirements](#prerequisites--requirements)
6. [Backend Setup & Running](#backend-setup--running)
7. [Frontend Setup & Running](#frontend-setup--running)
8. [Testing & Verification](#testing--verification)
9. [How Gemini Generates Topics](#how-gemini-generates-topics)
10. [How Speech Recognition & Metrics Work](#how-speech-recognition--metrics-work)
11. [How Coaching Feedback is Generated](#how-coaching-feedback-is-generated)
12. [Browser Limitations & Mobile Reliability](#browser-limitations--mobile-reliability)
13. [Future Roadmap](#future-roadmap)

---

## Overview & Core Value

Practicing communication for technical interviews is often intimidating. Candidates struggle with:
- Opening hesitation and structuring thoughts quickly under time limits.
- Over-relying on conversational filler words (*"basically"*, *"like"*, *"you know"*).
- Trailing off before the 60-second mark or rushing too quickly without articulating key trade-offs.

SpeakPrep AI solves this with a structured 4-step loop:
```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐       ┌─────────────┐
│ 1. TOPIC    │  ──▶  │ 2. PREP      │  ──▶  │ 3. SPEAK    │  ──▶  │ 4. FEEDBACK │
│ Fresh       │       │ 10s mental   │       │ Exactly 60s │       │ AI Coach &  │
│ Gemini AI   │       │ countdown    │       │ Live speech │       │ Metrics     │
└─────────────┘       └──────────────┘       └─────────────┘       └─────────────┘
                                                                          │
                                         ┌────────────────────────────────┘
                                         ▼
                               ┌───────────────────┐
                               │ 5. FOLLOW-UP      │
                               │ Linked interviewer│
                               │ follow-up round   │
                               └───────────────────┘
```

---

## Candidate Profile Context

SpeakPrep AI injects a rich candidate persona into every prompt sent to Gemini:
- **Background**: B.Tech student at M.S. Ramaiah Institute of Technology, Information Science / AIML-oriented.
- **DSA Strength**: 400+ problems solved, uses C++ for DSA.
- **Tech Stack**: Learning Python, Machine Learning (NumPy, Pandas, Scikit-learn), interested in GenAI / LLMs / RAG.
- **Experience**: FastAPI experience, knows SQL, built AI/software projects, active in hackathons.
- **Goal**: Preparing for software engineering and AI internship interviews; developing beginner-to-intermediate spoken English fluency, reducing fillers, and delivering concise technical explanations.

Topics and feedback are customized to this profile: questions test real software trade-offs (e.g. C++ memory management, RAG indexing strategies, database connection pooling), and feedback avoids academic grammar jargon in favor of clear, pragmatic phrasing.

---

## Architecture & Tech Stack

```
speak ai/
├── README.md
├── .gitignore
├── backend/
│   ├── .env.example              # Template for API key & configuration
│   ├── .env                      # Local secret variables (gitignored)
│   ├── requirements.txt          # Python dependencies
│   ├── pytest.ini                # Pytest configuration
│   ├── conftest.py               # Root test configuration & path setup
│   ├── main.py                   # FastAPI application & CORS routing
│   ├── models/
│   │   └── schemas.py            # Pydantic schemas (GeminiAnalysis, SpeechAnalysisResponse)
│   ├── services/
│   │   └── gemini_service.py     # Google GenAI service & deterministic metrics
│   └── tests/
│       ├── test_schemas_and_metrics.py  # Unit tests for WPM & filler detection
│       └── test_endpoints.py            # Unit tests for endpoints with mocked Gemini
└── frontend/
    ├── package.json              # NPM dependencies & scripts
    ├── vite.config.js            # Vite configuration with React & Tailwind v4
    ├── index.html                # Entry HTML with custom typography
    └── src/
        ├── index.css             # Tailwind CSS & custom animations
        ├── main.jsx              # React DOM initialization
        ├── App.jsx               # Main controller & navigation state machine
        ├── components/
        │   ├── Navbar.jsx        # Navigation & dark/light theme switch
        │   ├── TopicCard.jsx     # Prompt display & category badge
        │   ├── TimerRing.jsx     # Timestamp-accurate circular SVG progress ring
        │   ├── TranscriptBox.jsx # Real-time speech display & interim stream
        │   ├── ScoreBar.jsx      # Animated 0-10 score bars
        │   ├── FillerChart.jsx   # Approximate filler word breakdown & WPM
        │   ├── StatCard.jsx      # Metric display cards
        │   ├── ErrorBanner.jsx   # Contextual error alerts & recovery actions
        │   └── LoadingState.jsx  # Animated evaluation spinner & speaking tips
        ├── pages/
        │   ├── HomePage.jsx        # Welcome dashboard & today's summary
        │   ├── SetupPage.jsx       # General drill difficulty & category parameters
        │   ├── DsaSetupPage.jsx    # DSA Interview parameters (14 subtopics, 6 question types)
        │   ├── PracticePage.jsx    # 10s prep + 60s drill state machine
        │   ├── FeedbackPage.jsx    # General coach review & follow-up round trigger
        │   ├── DsaFeedbackPage.jsx # DSA evaluation, key points checklist, & chained follow-ups
        │   └── ProgressPage.jsx    # Interview Readiness, DSA Mastery, & session history
        └── services/
            ├── api.js            # Fetch client for backend endpoints (General & DSA)
            ├── storage.js        # LocalStorage persistence & readiness math
            └── useSpeechRecognition.js # Web Speech API continuous recognition hook
```

### Technology Highlights
- **Backend**: Python 3.11+, FastAPI, Pydantic v2, `google-genai` official SDK, Uvicorn.
- **Frontend**: React 19, Vite 6, Tailwind CSS v4, Lucide React icons.
- **Speech Capture**: Browser Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`).
- **Data Persistence**: Client-side `localStorage` (transcripts, scores, and metrics only; raw audio is never recorded or stored).

---

## Key Features

1. **Zero Hardcoded Prompts**: Every topic is generated dynamically by Google Gemini using high-temperature sampling (0.95) and conditioned on the student's recent drill history to prevent repetitions.
2. **DSA Interview Mode (Spoken Explanations)**:
   - Dedicated oral mode designed for candidates with 400+ LeetCode problems (C++ context).
   - 14 Subtopics (Arrays & Strings, Linked Lists, Stacks & Queues, Hashing, Trees & BST, Graphs, Recursion & Backtracking, Dynamic Programming, Sorting & Searching, Heaps, Greedy, Two Pointers / Sliding Window, Bit Manipulation, Surprise Me).
   - 6 Question Types (Theory/Concept, Explain an Approach, Complexity Analysis, Compare Data Structures, Edge Cases & Pitfalls, "Why did you choose X?", Surprise Me).
   - Evaluates spoken answer structure: **Core Idea ➔ Approach / Logic ➔ Time & Space Complexity ➔ Tricky Edge Cases**.
   - Generates hidden `key_points` to produce a rigorous **Covered ✓ vs Missed ✗** checklist.
   - Detects and flags any factual algorithmic **misconceptions**.
   - Supports up to **3 chained interviewer follow-up rounds** linked by `parent_session_id`.
   - Dedicated **DSA Speaking Mastery** analytics and weakest subtopic detection on the Progress dashboard.
3. **Accurate Timestamp Timers**: Both the 10-second mental preparation timer and the 60-second speaking timer calculate real-time elapsed deltas using `Date.now()` and `performance.now()`. Timers do not drift or pause when mobile browsers throttle background tabs.
4. **Deterministic Speech Metrics**: Words per minute (WPM) and filler word occurrences are computed deterministically in Python using strict regex tokenization and duration normalization—Gemini is never trusted for exact arithmetic.
5. **Pause & Hesitation Tracking**: The frontend records timestamps for time-to-first-word, longest gap between speech bursts, and instances of pauses longer than 2 seconds. These delivery metrics are passed to Gemini so pacing feedback is grounded in real data.
6. **Multi-Dimensional Coaching**: 7 scoring dimensions, exactly 3 prioritized improvements, key strengths, professional phrase upgrades, and a realistic college student model answer with highlighted key phrases.
7. **Interviewer Follow-up Rounds**: After feedback, Gemini suggests a natural follow-up question. Clicking *"Answer Follow-up (60s)"* launches a linked round (`parent_session_id`) to simulate real interview back-and-forth.
8. **Interview Readiness Indicators**: Evaluates Communication, Technical Explanation, Confidence, Fluency, and an overall Readiness Index derived from past drills (clearly labeled as practice indicators).
9. **Dark / Light Mode**: Polished UI with full light and dark mode support, persisted in localStorage.

---

## Prerequisites & Requirements

- **Node.js**: v18+ (tested on Node v24).
- **Python**: v3.11+ (tested on Python 3.14).
- **Google Gemini API Key**: Obtain a free API key from [Google AI Studio](https://aistudio.google.com/).
- **Supported Browser**: Google Chrome or Microsoft Edge (for Web Speech API support).

---

## Backend Setup & Running

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   Create a `.env` file in `backend/` from the template:
   ```bash
   cp .env.example .env
   ```
   Edit `backend/.env` with your API key:
   ```env
   GEMINI_API_KEY=AIzaSy...your_gemini_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   CORS_ORIGINS=http://localhost:5173,http://localhost:4173
   ```

5. **Start the backend server**:
   ```bash
   cd backend && uvicorn main:app --reload --port 8000
   ```
   The backend will be live at `http://localhost:8000`. You can inspect API health at `http://localhost:8000/api/health`.

---

## Frontend Setup & Running

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the Vite development server**:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173`.

---

## Testing & Verification

### Backend Unit Tests (Offline / Mocked Gemini)
The backend test suite verifies Pydantic schemas, deterministic WPM calculations, reliable filler detection, and FastAPI route responses. All Gemini client calls are mocked in automated tests so **no API key is needed to run pytest**:

```bash
cd backend
pytest -v
```

Expected output:
```
tests/test_endpoints.py::test_health_endpoint PASSED
tests/test_endpoints.py::test_analyze_rejects_empty_or_short_transcript PASSED
tests/test_endpoints.py::test_topic_endpoint_success PASSED
tests/test_endpoints.py::test_analyze_endpoint_success_with_mocked_gemini PASSED
tests/test_endpoints.py::test_followup_endpoint_success_with_mocked_gemini PASSED
tests/test_schemas_and_metrics.py::test_calculate_speech_metrics_basic PASSED
tests/test_schemas_and_metrics.py::test_calculate_speech_metrics_wpm_accuracy PASSED
tests/test_schemas_and_metrics.py::test_reliable_filler_detection PASSED
tests/test_schemas_and_metrics.py::test_excluded_fillers_not_counted PASSED
tests/test_schemas_and_metrics.py::test_conversational_like_vs_verb_like PASSED
tests/test_schemas_and_metrics.py::test_gemini_analysis_schema_validation PASSED
tests/test_schemas_and_metrics.py::test_gemini_analysis_requires_exactly_three_improvements PASSED
======================== 12 passed in 0.3s ========================
```

### Production Build Verification
To ensure all JSX, Tailwind styles, and imports compile cleanly:
```bash
cd frontend
npm run build
```

---

## How Gemini Generates Topics

When you click *"Generate Topic"*, the frontend sends:
- The chosen **Difficulty** (`Easy`, `Medium`, or `Hard`).
- The chosen **Category Filter** (`Random`, `Interview`, `Technical`, `ML/AI`, `DSA`, `Projects`, `Behavioral`, `Career`).
- A list of recent topic strings retrieved from `localStorage`.

The backend issues a structured prompt to Gemini with:
1. The student background profile.
2. A strict negative constraint: *"Do not generate topics substantially similar to these recent topics: [...] Vary category, angle and format."*
3. Temperature set to `0.95` for creative variety.
4. Structured JSON output schema (`TopicResponse`) enforced via `response_mime_type="application/json"` and `response_schema=TopicResponse`.

---

## How Speech Recognition & Metrics Work

### 1. Web Speech API Integration
- Speech recognition runs directly in the client browser using `webkitSpeechRecognition` / `SpeechRecognition`.
- Continuous listening is enabled, streaming interim results in italics and finalizing phrases as words are confirmed.
- **Auto-restart mechanism**: Web Speech API in Chrome halts whenever there is silence. The custom `useSpeechRecognition` hook listens on `onend` and automatically restarts recognition until the 60 seconds expire.
- **Android deduplication**: On certain Android mobile browsers, restarting recognition re-emits prior phrases. The hook maintains a set of finalized phrases to deduplicate repeated incoming text.

### 2. Pacing & Pause Tracking
The hook measures:
- `time_to_first_word_seconds`: Time between the 60s drill start and the user's first spoken sentence.
- `longest_pause_seconds`: Longest silent gap between speech result events.
- `pauses_over_2s_count`: Number of mid-thought pauses lasting 2 or more seconds.

### 3. Deterministic Filler Word Detection
- In `backend/services/gemini_service.py`, reliable conversational fillers are counted in Python:
  - Multi-word fillers: `"you know"`, `"i mean"`, `"sort of"`, `"kind of"`.
  - Single-word fillers: `"actually"`, `"basically"`, `"literally"`, `"um"`, `"uh"`.
  - Conversational `"like"` (e.g., *"and, like,"*, *"was like,"*), while excluding verb usages like *"I like Python"*.
- Commonly legitimate words such as `"so"`, `"right"`, `"well"`, and `"honestly"` are **not** counted as fillers.
- *UI Disclosure*: In the UI and feedback charts, filler counts are labeled as **"approximate"** because browser speech engines often silently filter out subtle phonetic utterances.

### 4. Deterministic WPM Calculation
Words per minute are calculated from the actual elapsed duration:
$$\text{WPM} = \text{round}\left(\frac{\text{total words}}{\max(\text{duration seconds}, 1.0)} \times 60, 1\right)$$

---

## How Coaching Feedback is Generated

When the drill completes:
1. Transcripts under 5 words are rejected with a 400 Bad Request before calling Gemini.
2. The backend deterministically computes WPM, word count, and filler word breakdown.
3. Gemini receives the candidate transcript alongside the recorded delivery metrics (`duration`, `time_to_first_word`, `longest_pause`, `pauses_over_2s`, `filler_breakdown`).
4. Gemini returns a structured evaluation (`GeminiAnalysis` schema):
   - **7 Dimensional Scores (0 to 10)**.
   - **3 Prioritized Improvements**: Specific, actionable suggestions without academic grammar jargon.
   - **Key Strengths**: Reinforcing what worked well.
   - **Phrase Upgrades**: Replacing hesitant colloquialisms with confident technical phrasing.
   - **Realistic Sample Answer**: A 60-second model answer (~120 words) sounding like a smart engineering student in an interview, with high-impact expressions bracketed in `[...]` and highlighted in yellow.
   - **Next Focus Area**: One clear focal point for the next attempt.
5. The backend merges the deterministic metrics with Gemini's analysis into the final `SpeechAnalysisResponse`.

---

## Browser Limitations & Mobile Reliability

- **Google Chrome & Microsoft Edge**: Recommended browsers with native, high-quality Web Speech API support.
- **Mozilla Firefox**: Does not support the Web Speech API by default. If opened in Firefox, a clear banner warns the user to switch to Chrome or Edge.
- **Apple Safari & iOS**: Safari has restricted Web Speech API behavior. Mobile iOS Safari may pause speech recognition when the screen is touched or backgrounded. Mobile support is provided on a best-effort basis.
- **Microphone Permissions**: If microphone access is blocked or denied, the app surfaces an `ErrorBanner` guiding the user to enable permissions in their browser settings.

---

## Future Roadmap

- [ ] **Custom Audio Pitch & Tone Analysis**: Integrate client-side Web Audio API frequency analysis to measure vocal energy and pitch modulation.
- [ ] **Resume / Project Upload**: Allow candidates to upload their resume PDF or GitHub profile so Gemini can drill them on their specific project repositories.
- [ ] **Mock Interview Rounds (Multi-turn Drill)**: Chain 5 sequential questions together into a continuous 10-minute behavioral + technical mock interview session.
- [ ] **Offline Whisper Fallback**: Provide an optional local or on-device Whisper model for browsers without native Web Speech API support.

---

## License
MIT License. Built for engineering students and interview candidates worldwide.
