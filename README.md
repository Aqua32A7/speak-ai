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

## Candidate Profile & Universal Neutrality

SpeakPrep AI is built for **any candidate**:
- **Dynamic Profile Storage**: Candidate profiles (target role, experience level, education, languages, skills, English fluency, goals) are persisted client-side in browser `localStorage` and sent with API requests.
- **Stateless Backend**: The backend stores no personal profiles or raw audio in a database.
- **Neutral Default**: When no profile is configured, Gemini uses a strictly neutral default: *"a student or early-career candidate preparing for technical interviews, English level unknown."*
- **No Hardcoded Assumptions**: Gemini never assumes a candidate attended a specific college, solved a certain number of problems, codes in a specific language, or built particular frameworks unless explicitly provided in their profile or project brief.
- **Configurable Settings**: Candidate settings include profile customization, toggling whether projects are included in random general drills, viewing data storage stats, and a 1-click **"Clear all my data"** option.

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
│   ├── main.py                   # FastAPI app, per-IP rate limiting & routing
│   ├── models/
│   │   └── schemas.py            # Pydantic schemas (General, DSA, Core, Project, Profile)
│   ├── services/
│   │   ├── gemini_service.py     # Neutralized Gemini prompts & deterministic metrics
│   │   ├── github_fetcher.py     # SSRF-protected GitHub repo fetcher
│   │   └── platform_fetcher.py   # SSRF-protected LeetCode & Codeforces fetcher
│   └── tests/
│       ├── test_profile_neutrality.py   # Neutral default & hardcoding exclusion checks
│       ├── test_project.py              # GitHub URL validation, SSRF defense & project drills
│       ├── test_schemas_and_metrics.py  # Unit tests for WPM & filler detection
│       ├── test_endpoints.py            # Unit tests for general endpoints
│       ├── test_dsa.py                  # Unit tests for DSA oral drills
│       ├── test_core.py                 # Unit tests for CS Core mode
│       └── test_journey.py              # Unit tests for DSA Journey & SSRF protections
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
        │   ├── LoadingState.jsx  # Animated evaluation spinner & speaking tips
        │   └── OnboardingModal.jsx # First-time candidate profile modal
        ├── pages/
        │   ├── HomePage.jsx        # Welcome dashboard & today's summary
        │   ├── SetupPage.jsx       # General drill difficulty & category parameters
        │   ├── ProjectsPage.jsx    # Project Hub, GitHub analyzer & manual entry
        │   ├── ProjectSetupPage.jsx# Project drill angles (Architecture, Bugs, Trade-offs)
        │   ├── ProjectFeedbackPage.jsx # Ownership, technical depth & key points review
        │   ├── SettingsPage.jsx    # Candidate profile editor & data management
        │   ├── DsaSetupPage.jsx    # DSA Interview parameters (14 subtopics, 6 question types)
        │   ├── DsaJourneyPage.jsx  # Multi-platform profile manager & AI mentorship
        │   ├── CoreSetupPage.jsx   # CS Core setup (10 subjects, Teach me vs Test me)
        │   ├── PracticePage.jsx    # 10s prep + 60s drill state machine
        │   ├── FeedbackPage.jsx    # General coach review & follow-up round trigger
        │   ├── DsaFeedbackPage.jsx # DSA evaluation, key points checklist, & chained follow-ups
        │   ├── CoreFeedbackPage.jsx# 4-part structure evaluation, misconceptions, & Concept Refresher
        │   └── ProgressPage.jsx    # Readiness, DSA Mastery, Core Mastery, & Project Mastery
        ├── services/
        │   ├── api.js            # Fetch client with profile injection
        │   ├── storage.js        # LocalStorage persistence, voice settings, & deterministic metrics
        │   ├── useSpeechRecognition.js # Web Speech API continuous recognition hook
        │   └── useSpeechSynthesis.js   # Browser SpeechSynthesis hook with sentence chunking
        ├── utils/
        │   └── speechSummary.js  # TTS text cleaner (Big-O, math), spoken summary builder, & chunker
        └── tests/
            └── speechSummary.test.js # Unit tests for speech utilities and chunking
```

### Technology Highlights
- **Backend**: Python 3.11+, FastAPI, Pydantic v2, `google-genai` official SDK, Uvicorn, HTTPX.
- **Frontend**: React 19, Vite 6, Tailwind CSS v4, Lucide React icons.
- **Speech Capture**: Browser Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`).
- **Voice Interviewer**: Browser-native `SpeechSynthesis` API with sentence chunking (<140 chars) to bypass Chrome 15s cutoff bugs.
- **Data Persistence**: Client-side `localStorage` (transcripts, scores, and metrics only; raw audio is never recorded, saved, or transmitted).
- **Security & Privacy**: Per-IP sliding-window rate limiting (30 req/min), SSRF domain allowlisting (`api.github.com`), prompt injection defense (`<untrusted_repo_content>`), and input length validation.

---

## Key Features

1. **Zero Hardcoded Prompts & Universal Candidate Neutrality**: Every topic is generated dynamically by Google Gemini using high-temperature sampling and conditioned on the user's customized profile and recent drill history.
2. **Voice Interviewer & Spoken Feedback**:
   - **Spoken Question Delivery**: The AI interviewer reads the question or follow-up aloud before your 10-second preparation countdown begins across all 4 modes (General, DSA, CS Core, My Projects).
   - **Strict Preparation Sequencing**: The 10-second mental preparation countdown begins only after question speech ends or if the candidate clicks "Skip Voice & Start Prep", backed by a 16s safety timeout.
   - **Microphone Conflict Safeguard**: Speech synthesis is unconditionally stopped (`speechSynthesis.cancel()`) before the microphone recording starts. All speech playback buttons are disabled while speaking.
   - **Spoken Feedback Summary**: Auto-speaks a concise 3-5 sentence coaching summary when evaluation completes, with dedicated buttons to replay or listen to model sample answers.
   - **Voice Customization**: Candidate settings allow toggling question reading, toggling feedback speech, picking an English voice (`en-IN`, natural, system), adjusting pace (0.8x deliberate, 1.0x normal, 1.2x fast), previewing with "Test Voice", and toggling mute instantly from the Navbar.
3. **My Projects Feature & Oral Architecture Drills**:
   - **GitHub Repo Analyzer**: Connects any public GitHub repository URL (`https://github.com/owner/repo`). Securely extracts README and top root source files via `api.github.com` (capped to 5 files, 8KB per file).
   - **Manual Project Entry**: Support for closed-source, hackathon, or private projects by describing what was built, challenges faced, and results.
   - **Review & Edit Brief**: Users can inspect and edit the generated brief before saving, with a clear warning: *"Check this summary. Your questions will be based on it."*
   - **9 Architectural Angles**: Questions target "Why you chose this tech", "Architecture decisions", "A hard bug and how you fixed it", "Trade-offs", "Scaling & Performance", "Testing & Reliability", "Teamwork & Collaboration", "What you'd improve", and "Explain a feature end to end" (plus "Surprise Me").
   - **Personal Ownership & Agency Coaching**: Evaluates whether the candidate speaks in the first person (*"I architected/implemented..."* vs vague passive *"we did..."*) and highlights concrete engineering details.
4. **DSA Interview Mode (Spoken Explanations)**:
   - 14 Subtopics (Arrays & Strings, Linked Lists, Stacks & Queues, Hashing, Trees & BST, Graphs, Recursion & Backtracking, Dynamic Programming, Sorting & Searching, Heaps, Greedy, Two Pointers / Sliding Window, Bit Manipulation, Surprise Me).
   - 6 Question Types (Theory/Concept, Explain an Approach, Complexity Analysis, Compare Data Structures, Edge Cases & Pitfalls, "Why did you choose X?", Surprise Me).
   - Evaluates spoken answer structure: **Core Idea ➔ Approach / Logic ➔ Time & Space Complexity ➔ Tricky Edge Cases**.
   - Generates hidden `key_points` to produce a rigorous **Covered ✓ vs Missed ✗** checklist.
   - Detects and flags any factual algorithmic **misconceptions**.
   - Supports up to **3 chained interviewer follow-up rounds** linked by `parent_session_id`.
   - Dedicated **DSA Speaking Mastery** analytics and weakest subtopic detection on the Progress dashboard.
5. **CS Core Fundamentals Mode**:
   - Covers 10 foundational subjects: Operating Systems, DBMS & SQL, Computer Networks, Object-Oriented Programming, Computer Architecture, System Design basics, Web/HTTP & APIs, Security basics, Software Engineering & SDLC, and Git Version Control.
   - **"Teach me first" vs "Test me directly"**: In teach mode, Gemini generates an engaging 150-200 word conceptual primer with real-world analogies before the drill starts.
   - **4-Part Spoken Answer Structure**: Evaluates adherence to **Definition ➔ Mechanism ➔ Example ➔ Trade-off**, showing clear visual checkmarks for covered vs omitted components.
   - **Concept Refresher**: Provides concise explanations, corrects gentle misconceptions, and offers an *"Explain it again"* 1-click retry.
   - **Mastery Matrix**: Progress dashboard tracks per-subject accuracy across all 10 subjects and suggests the next highest-leverage subject.
5. **DSA Profile Analysis & Journey**:
   - Connects live statistics from **LeetCode** (public GraphQL) and **Codeforces** (official API).
   - Full manual entry fallback for platforms without public APIs with explicit *"Self-reported"* indicators.
   - **Strict SSRF Protection**: Domain allowlisting (`leetcode.com`, `codeforces.com`), strict handle sanitization, hardcoded upstream endpoints, 8-second timeout, 5MB response cap, and in-memory caching.
   - **Deterministic Arithmetic**: Code calculates all totals, difficulty splits, and the 14-topic coverage matrix (Strong: ≥20, Moderate: 5–19, Untouched: <5).
6. **Accurate Timestamp Timers**: Both the 10-second mental preparation timer and the 60-second speaking timer calculate real-time elapsed deltas using `Date.now()` and `performance.now()`.
7. **Deterministic Speech Metrics**: Words per minute (WPM) and filler word occurrences are computed deterministically in Python using strict regex tokenization and duration normalization.
8. **Pause & Hesitation Tracking**: Records time-to-first-word, longest gap between speech bursts, and instances of pauses longer than 2 seconds.
9. **Multi-Dimensional Coaching**: 7 general scoring dimensions + project ownership scoring, prioritized improvements, key strengths, professional phrase upgrades, and realistic model answers.
10. **Dark / Light Mode & Complete Privacy**: Client-side localStorage persistence; raw audio is never recorded or stored.

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
   GEMINI_MODEL=gemini-flash-lite-latest
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
tests/test_core.py::test_core_analyze_rejects_short_transcript PASSED
tests/test_core.py::test_core_question_endpoint_test_mode PASSED
tests/test_core.py::test_core_question_endpoint_teach_mode PASSED
tests/test_core.py::test_core_analyze_endpoint_with_mocked_gemini PASSED
tests/test_core.py::test_core_followup_endpoint_with_mocked_gemini PASSED
tests/test_dsa.py::test_dsa_analyze_rejects_short_transcript PASSED
tests/test_dsa.py::test_dsa_question_endpoint PASSED
tests/test_dsa.py::test_dsa_analyze_endpoint_with_mocked_gemini PASSED
tests/test_dsa.py::test_dsa_followup_endpoint_with_mocked_gemini PASSED
tests/test_endpoints.py::test_health_endpoint PASSED
tests/test_endpoints.py::test_analyze_rejects_empty_or_short_transcript PASSED
tests/test_endpoints.py::test_topic_endpoint_success PASSED
tests/test_endpoints.py::test_analyze_endpoint_success_with_mocked_gemini PASSED
tests/test_endpoints.py::test_followup_endpoint_success_with_mocked_gemini PASSED
tests/test_journey.py::test_sanitize_and_extract_handle_valid PASSED
tests/test_journey.py::test_sanitize_and_extract_handle_ssrf_rejection PASSED
tests/test_journey.py::test_calculate_dsa_journey_deterministic_math PASSED
tests/test_journey.py::test_fetch_dsa_profile_endpoint_mocked[asyncio] PASSED
tests/test_journey.py::test_analyze_dsa_journey_endpoint_mocked[asyncio] PASSED
tests/test_journey.py::test_dsa_question_with_journey_context[asyncio] PASSED
tests/test_schemas_and_metrics.py::test_calculate_speech_metrics_basic PASSED
tests/test_schemas_and_metrics.py::test_calculate_speech_metrics_wpm_accuracy PASSED
tests/test_schemas_and_metrics.py::test_reliable_filler_detection PASSED
tests/test_schemas_and_metrics.py::test_excluded_fillers_not_counted PASSED
tests/test_schemas_and_metrics.py::test_conversational_like_vs_verb_like PASSED
tests/test_schemas_and_metrics.py::test_gemini_analysis_schema_validation PASSED
tests/test_schemas_and_metrics.py::test_gemini_analysis_requires_exactly_three_improvements PASSED
======================== 39 passed in 0.4s ========================
```

### Frontend Unit Tests (Speech Utilities & Sentence Chunking)
The frontend uses Node's native test runner to verify speech sanitization (Big-O translation, bracket stripping), score formatting, and Chrome sentence chunking:

```bash
cd frontend
npm test
```

Expected output:
```
✔ formatScoreInWords handles integers and decimals
✔ cleanTextForSpeech translates Big-O notation
✔ cleanTextForSpeech strips markdown formatting and brackets
✔ cleanTextForSpeech handles score fractions
✔ buildSpokenSummary prioritizes analysis.spoken_summary if available
✔ buildSpokenSummary builds structured fallback when spoken_summary is missing
✔ buildSpokenSummary handles missing fields without crashing
✔ chunkTextForTTS splits text into chunks under maxLen
ℹ pass 8
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
