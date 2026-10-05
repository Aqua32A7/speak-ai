import asyncio
import os
import shutil
from pathlib import Path
from playwright.async_api import async_playwright

BASE_URL = "http://127.0.0.1:5173/?mock=1"
LOCAL_DIR = Path(__file__).resolve().parent / "screenshots"
LOCAL_DIR.mkdir(exist_ok=True)
ARTIFACT_DIR = Path("/Users/aqua32a7/.gemini/antigravity/brain/d8ddf36b-e21f-44b9-a632-bb4b5f652570")

CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

async def save_shot(page, name):
    local_path = LOCAL_DIR / f"{name}.png"
    await page.screenshot(path=str(local_path))
    if ARTIFACT_DIR.exists():
        artifact_path = ARTIFACT_DIR / f"{name}.png"
        shutil.copyfile(local_path, artifact_path)
    print(f"Captured: {name}.png")

async def main():
    print("=== Launching Chrome to capture full website walkthrough screenshots ===")
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            executable_path=CHROME_PATH if os.path.exists(CHROME_PATH) else None,
        )
        context = await browser.new_context(viewport={"width": 1280, "height": 840})
        page = await context.new_page()

        # Prepopulate localStorage with sample profile and sample project so screenshots show rich data
        await page.goto(BASE_URL)
        await page.evaluate("""() => {
            localStorage.setItem('speakprep_onboarding_completed', 'true');
            localStorage.setItem('speakprep_user_profile_v1', JSON.stringify({
                name: 'Alex Chen',
                target_role: 'Full Stack / AI Engineer',
                experience_level: 'New Grad / 0-2 yrs',
                education: 'B.S. in Computer Science',
                languages: ['Python', 'TypeScript', 'Go'],
                skills: ['FastAPI', 'React', 'PostgreSQL', 'Docker', 'Distributed Systems'],
                english_level: 'Upper Intermediate',
                goals: 'Improve conciseness and trade-off articulation in oral technical rounds'
            }));
            localStorage.setItem('speakprep_projects_v1', JSON.stringify([{
                id: 'proj_sample_1',
                name: 'Distributed KV Store',
                description: 'A fault-tolerant distributed key-value store using Raft consensus and WAL.',
                tech_stack: ['Go', 'Raft', 'gRPC', 'RocksDB'],
                what_built: 'Implemented raft leader election, log replication, and atomic snapshotting.',
                challenges: 'Network partition handling and linearizable read latency under load.',
                results: 'Maintained 99.9% uptime during chaos testing with under 15ms p99 latency.',
                github_url: 'https://github.com/alexchen/distributed-kv',
                created_at: new Date().toISOString()
            }]));
        }""")
        await page.reload()
        await page.wait_for_timeout(500)

        # 1. Home Page
        await save_shot(page, "walkthrough_1_home")

        # 2. My Projects Hub
        await page.click("text=Projects")
        await page.wait_for_timeout(400)
        await save_shot(page, "walkthrough_2_projects")

        # 3. Project Interview Setup
        await page.click("text=Start Interview Drill on This Project")
        await page.wait_for_timeout(400)
        await save_shot(page, "walkthrough_3_project_setup")

        # 4. DSA Interview Setup
        await page.click("button:has-text('DSA')")
        await page.wait_for_timeout(400)
        await save_shot(page, "walkthrough_4_dsa_setup")

        # 5. CS Core Fundamentals Setup
        await page.click("button:has-text('CS Core')")
        await page.wait_for_timeout(400)
        await save_shot(page, "walkthrough_5_core_setup")

        # 6. DSA Journey Page
        await page.click("button:has-text('DSA Journey')")
        await page.wait_for_timeout(400)
        await save_shot(page, "walkthrough_6_dsa_journey")

        # 7. Progress & Analytics Dashboard
        await page.click("button:has-text('Progress')")
        await page.wait_for_timeout(400)
        await save_shot(page, "walkthrough_7_progress")

        # 8. Settings & Candidate Profile Page
        await page.click("button[aria-label='Settings']")
        await page.wait_for_timeout(400)
        await save_shot(page, "walkthrough_8_settings")

        # 9. General Drill Setup
        await page.click("button:has-text('Practice')")
        await page.wait_for_timeout(400)
        await save_shot(page, "walkthrough_9_general_setup")

        await browser.close()
        print("=== All walkthrough screenshots captured successfully! ===")

if __name__ == "__main__":
    asyncio.run(main())
