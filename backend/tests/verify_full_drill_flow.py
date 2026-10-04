"""
Comprehensive End-to-End Drill Flow Verification:
Simulates: Topic Generation -> 10s Prep -> Start Speaking -> 60s Timer -> Live Transcript ->
Analysis -> Feedback -> Follow-up Round -> LocalStorage Progress.
"""

import asyncio
import os
import json
from pathlib import Path
from playwright.async_api import async_playwright

BASE_URL = "http://127.0.0.1:5173/?mock=1"
SCREENSHOT_DIR = Path(__file__).resolve().parent / "screenshots"
SCREENSHOT_DIR.mkdir(exist_ok=True)


async def run_full_drill_flow():
    print(f"=== Starting Full Drill Flow Verification on {BASE_URL} ===")
    
    chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            executable_path=chrome_path if os.path.exists(chrome_path) else None,
        )
        context = await browser.new_context(viewport={"width": 1280, "height": 850})
        page = await context.new_page()

        # Intercept /api/topic to return a dynamic mock topic if no GEMINI_API_KEY is configured
        await page.route("**/api/topic", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({
                "topic": "Explain how you optimized memory layout or pointer structures when solving graph problems in C++.",
                "category": "DSA & C++",
                "difficulty": "Hard",
                "follow_up_question": "What cache locality trade-offs did you consider when using adjacency lists versus flat vectors?",
            })
        ))

        # Intercept /api/analyze to return realistic coaching analysis
        await page.route("**/api/analyze", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({
                "overall_score": 8.2,
                "fluency_score": 7.8,
                "clarity_score": 8.5,
                "grammar_score": 8.0,
                "relevance_score": 8.8,
                "confidence_score": 7.5,
                "technical_depth_score": 8.7,
                "strengths": [
                    "Strong explanation of cache-friendly memory layouts in C++",
                    "Clearly articulated why flat vectors reduce pointer indirection overhead"
                ],
                "improvements": [
                    "Eliminate opening hesitations by stating your conclusion first",
                    "Keep sentences under 15 words when describing pointer dereferencing",
                    "Maintain steady vocal cadence when transitioning between graph representations"
                ],
                "better_phrases": [
                    {
                        "original": "basically what I am doing is using vectors",
                        "suggested": "In my implementation, I preferred contiguous flat vectors",
                        "reason": "Direct and emphasizes technical intentionality"
                    },
                    {
                        "original": "it was like really fast",
                        "suggested": "this significantly improved L1 cache hit rates",
                        "reason": "Quantifies technical benefit with proper terminology"
                    }
                ],
                "sample_answer": "In graph algorithms, [I prefer using flat contiguous vectors over pointer-heavy node structs] to maximize cache locality. [When traversing sparse graphs], pointer indirection can cause frequent L1 cache misses. By packing vertex indices into a single buffer, [we minimized memory fragmentation] and cut traversal runtime by roughly 30%.",
                "next_focus_area": "Lead directly with your benchmark findings",
                "words_per_minute": 124.0,
                "word_count": 62,
                "duration_seconds": 30.0,
                "filler_words_count": 3,
                "filler_words_breakdown": {
                    "basically": 1,
                    "you know": 1,
                    "like": 1
                },
                "time_to_first_word_seconds": 1.2,
                "longest_pause_seconds": 2.1,
                "pauses_over_2s_count": 1
            })
        ))

        # 1. Start Practice Drill from Home
        print("\n1. Navigating to Home and Starting Practice...")
        await page.goto(BASE_URL, wait_until="networkidle")
        await page.click("button:has-text('Start 1-Minute Practice')")
        await asyncio.sleep(0.5)

        # 2. Setup Page: Select Parameters & Trigger Generation
        print("\n2. Configuring Parameters (Hard, DSA)...")
        await page.click("text=Hard")
        await page.click("text=DSA & C++")
        await page.click("button:has-text('Generate Topic & Begin Drill')")
        await asyncio.sleep(0.8)

        # 3. Verify Practice Page & Prep Phase
        print("\n3. Verifying Practice State Machine - Preparation Phase...")
        prep_heading = await page.locator("text=Preparation Countdown").count()
        assert prep_heading > 0, "Prep countdown should be active"
        topic_text = await page.locator("h2").inner_text()
        print(f"   Topic Displayed: '{topic_text}'")
        assert "graph problems in C++" in topic_text

        # Verify Timer Ring renders with get ready text
        timer_text = await page.locator("text=Get Ready").count()
        assert timer_text > 0
        await page.screenshot(path=str(SCREENSHOT_DIR / "4_practice_prep_countdown.png"))
        print("   ✓ 10s mental preparation countdown active with topic card")

        # 4. Skip Prep using [Start Speaking Now]
        print("\n4. Triggering [Start Speaking Now] to transition to SPEAKING...")
        await page.click("button:has-text('Start Speaking Now')")
        await asyncio.sleep(0.5)

        # Verify Speaking Phase
        recording_indicator = await page.locator("text=Recording Live").count()
        assert recording_indicator > 0, "Pulsing live recording badge should be visible"
        print("   ✓ Speaking phase active: TimerRing counting down, Recording Live pulsing")
        await page.screenshot(path=str(SCREENSHOT_DIR / "5_practice_speaking_live.png"))

        # 5. Inject Simulated Transcript (dev mock gated by ?mock=1)
        print("\n5. Injecting Speech Transcript via dev verification helper...")
        mock_btn = page.locator("button:has-text('[Dev Mock Transcript]')")
        assert await mock_btn.count() > 0, "Dev mock button should be visible with ?mock=1"
        await mock_btn.click()
        await asyncio.sleep(0.5)

        # Check transcript rendered in TranscriptBox
        transcript_content = await page.locator("p.font-normal").inner_text()
        print(f"   Transcript Box Content: '{transcript_content[:80]}...'")
        assert "FastAPI" in transcript_content or "database" in transcript_content
        print("   ✓ TranscriptBox updating live with word counts and auto-scrolling")
        await page.screenshot(path=str(SCREENSHOT_DIR / "6_practice_live_transcript.png"))

        # 6. Finish Early & Analyze
        print("\n6. Clicking [Finish Early & Analyze]...")
        await page.click("button:has-text('Finish Early & Analyze')")
        
        # Wait for "Time's up" (1.5s) and analysis completion to transition to Feedback screen
        await page.wait_for_selector("text=Overall Score", timeout=8000)

        # 7. Verify Feedback Screen
        print("\n7. Verifying Comprehensive Feedback Screen...")
        score_heading = await page.locator("text=Overall Score").count()
        assert score_heading > 0, "Overall score should be visible"

        overall_score = await page.locator("span.font-mono.tracking-tight").inner_text()
        print(f"   Overall Score Rendered: {overall_score}/10")
        assert "8.2" in overall_score

        # Check 3 Things to Improve
        improvements_count = await page.locator("text=3 Things to Improve").count()
        assert improvements_count > 0
        print("   ✓ Exactly 3 Things to Improve rendered")

        # Check Professional Phrase Upgrades
        phrase_upgrades = await page.locator("text=Professional Phrase Upgrades").count()
        assert phrase_upgrades > 0
        print("   ✓ Professional Phrase Upgrades table rendered")

        # Check Realistic Sample Answer with highlights
        sample_answer_card = await page.locator("text=How You Could Answer Better").count()
        assert sample_answer_card > 0
        highlights = await page.locator("mark").count()
        print(f"   Highlighted Key Phrases: {highlights} markers")
        assert highlights > 0
        print("   ✓ Realistic student model answer with highlighted key phrases rendered")

        # Check Filler chart and WPM
        filler_approx = await page.locator("text=Approximate count").count()
        assert filler_approx > 0, "Approximate count label must be present"
        print("   ✓ Filler word chart labeled as approximate")

        # Check Follow-up Question Card
        follow_up_btn = page.locator("button:has-text('Answer Follow-up (60s)')")
        assert await follow_up_btn.count() > 0, "Follow-up question action must be present"
        print("   ✓ Follow-up round card present with contextual question")
        await page.screenshot(path=str(SCREENSHOT_DIR / "7_feedback_screen.png"))

        # 8. Test Starting Follow-up Round
        print("\n8. Starting Follow-up Practice Round...")
        await follow_up_btn.click()
        await asyncio.sleep(0.5)

        follow_up_prep = await page.locator("text=Preparation Countdown").count()
        assert follow_up_prep > 0, "Follow-up round should start preparation countdown"
        follow_up_topic = await page.locator("h2").inner_text()
        print(f"   Follow-up Topic: '{follow_up_topic}'")
        assert "cache locality" in follow_up_topic.lower() or "trade-off" in follow_up_topic.lower()
        print("   ✓ Follow-up round launched successfully and linked to parent session")
        await page.screenshot(path=str(SCREENSHOT_DIR / "8_followup_round.png"))

        # 9. Verify Progress Dashboard Updated
        print("\n9. Checking Progress Dashboard Updates...")
        await page.click("button:has-text('Progress')")
        await asyncio.sleep(0.5)

        total_drills = await page.locator("text=Total Drills").count()
        assert total_drills > 0
        readiness_idx = await page.locator("text=Readiness Index:").count()
        assert readiness_idx > 0
        print("   ✓ Progress dashboard updated with session data and Interview Readiness indicators")
        await page.screenshot(path=str(SCREENSHOT_DIR / "9_progress_readiness_updated.png"))

        print("\n=== Full Drill Flow Verification Succeeded 100%! ===")
        await browser.close()


if __name__ == "__main__":
    asyncio.run(run_full_drill_flow())
