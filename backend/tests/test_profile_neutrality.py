import inspect
from pathlib import Path
import pytest
from models.schemas import UserProfile
from services.gemini_service import build_profile_prompt, GeminiService


def test_build_profile_prompt_empty_returns_neutral_default():
    # When profile is None
    prompt_none = build_profile_prompt(None)
    assert "student or early-career candidate" in prompt_none
    assert "English level unknown" in prompt_none
    assert "Do not assume any specific university" in prompt_none

    # When profile has empty fields
    empty_profile = UserProfile()
    prompt_empty = build_profile_prompt(empty_profile)
    assert "student or early-career candidate" in prompt_empty
    assert "Do not assume any specific university" in prompt_empty


def test_build_profile_prompt_populated_sanitized_and_capped():
    profile = UserProfile(
        name="Alex Rivera",
        education="University of Technology",
        experience_level="Final year student",
        field_of_study="Computer Systems",
        target_role="Full Stack Engineer",
        languages=["Python", "TypeScript", "Go"],
        skills=["React", "PostgreSQL", "Docker"],
        english_level="Intermediate",
        goals="Improve speaking clarity and avoid filler words",
    )
    prompt = build_profile_prompt(profile)

    assert "Alex Rivera" in prompt
    assert "University of Technology" in prompt
    assert "Full Stack Engineer" in prompt
    assert "Python, TypeScript, Go" in prompt
    assert "React, PostgreSQL, Docker" in prompt
    assert "Intermediate" in prompt
    assert "Improve speaking clarity" in prompt
    assert "Never assume tools, college background, or projects beyond what is explicitly listed" in prompt


def test_no_hardcoded_personal_details_in_gemini_service():
    """
    Scans backend/services/gemini_service.py to ensure zero traces of the original
    hardcoded student profile (Ramaiah, 400+, M.S.) remain in code or prompts.
    """
    service_path = Path(__file__).resolve().parent.parent / "services" / "gemini_service.py"
    content = service_path.read_text(encoding="utf-8")

    forbidden_tokens = [
        "Ramaiah",
        "M.S.",
        "400+",
        "400 +",
        "USER_PROFILE_PROMPT",
    ]

    for token in forbidden_tokens:
        assert token.lower() not in content.lower(), f"Found forbidden hardcoded token '{token}' in gemini_service.py"
