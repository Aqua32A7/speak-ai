import ipaddress
import re
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse

import httpx
from fastapi import HTTPException

from models.schemas import (
    DsaJourneyCalculation,
    NormalizedPlatformStats,
    RecentProblem,
    TopicCoverageItem,
)

# ============================================================================
# Security & Rate Limiting Configurations
# ============================================================================

HANDLE_REGEX = re.compile(r"^[a-zA-Z0-9_\-]{1,64}$")
ALLOWED_HOSTS = {"leetcode.com", "www.leetcode.com", "codeforces.com", "www.codeforces.com"}
CACHE_TTL_SECONDS = 3600  # 1 hour
MAX_RESPONSE_BYTES = 5 * 1024 * 1024  # 5 MB
REQUEST_TIMEOUT = 8.0  # seconds
RATE_LIMIT_WINDOW = 60.0  # 1 minute
MAX_REQUESTS_PER_WINDOW = 10

USER_AGENT = "SpeakPrepAI/1.0 (+https://github.com/Aqua32A7/speak-ai)"

# In-memory storage: (platform, handle_lower) -> (timestamp, NormalizedPlatformStats)
_CACHE: Dict[Tuple[str, str], Tuple[float, NormalizedPlatformStats]] = {}

# Sliding window rate limiter: client_ip -> list of timestamps
_RATE_LIMITS: Dict[str, List[float]] = {}


# ============================================================================
# Standard 14 DSA Topics & Mapping
# ============================================================================

STANDARD_14_DSA_TOPICS = [
    "Arrays & Strings",
    "Linked Lists",
    "Stacks & Queues",
    "Hashing",
    "Trees & BST",
    "Graphs",
    "Recursion & Backtracking",
    "Dynamic Programming",
    "Sorting & Searching",
    "Heaps",
    "Greedy",
    "Two Pointers / Sliding Window",
    "Bit Manipulation",
    "Complexity Analysis",
]

# Mapping tag slugs/keywords to standard topics
TAG_TO_STANDARD_TOPIC = {
    # Arrays & Strings
    "array": "Arrays & Strings",
    "arrays": "Arrays & Strings",
    "string": "Arrays & Strings",
    "strings": "Arrays & Strings",
    "string-matching": "Arrays & Strings",
    # Linked Lists
    "linked-list": "Linked Lists",
    "doubly-linked-list": "Linked Lists",
    # Stacks & Queues
    "stack": "Stacks & Queues",
    "queue": "Stacks & Queues",
    "monotonic-stack": "Stacks & Queues",
    "monotonic-queue": "Stacks & Queues",
    "data structures": "Stacks & Queues",
    # Hashing
    "hash-table": "Hashing",
    "hash function": "Hashing",
    "hashing": "Hashing",
    # Trees & BST
    "tree": "Trees & BST",
    "trees": "Trees & BST",
    "binary-tree": "Trees & BST",
    "binary-search-tree": "Trees & BST",
    "trie": "Trees & BST",
    "segment-tree": "Trees & BST",
    # Graphs
    "graph": "Graphs",
    "graphs": "Graphs",
    "depth-first-search": "Graphs",
    "breadth-first-search": "Graphs",
    "dfs and similar": "Graphs",
    "union-find": "Graphs",
    "dsu": "Graphs",
    "shortest-path": "Graphs",
    "topological-sort": "Graphs",
    "minimum-spanning-tree": "Graphs",
    # Recursion & Backtracking
    "recursion": "Recursion & Backtracking",
    "backtracking": "Recursion & Backtracking",
    # Dynamic Programming
    "dynamic-programming": "Dynamic Programming",
    "dp": "Dynamic Programming",
    "memoization": "Dynamic Programming",
    # Sorting & Searching
    "sorting": "Sorting & Searching",
    "sortings": "Sorting & Searching",
    "binary-search": "Sorting & Searching",
    "binary search": "Sorting & Searching",
    "quickselect": "Sorting & Searching",
    # Heaps
    "heap-priority-queue": "Heaps",
    "heap": "Heaps",
    # Greedy
    "greedy": "Greedy",
    # Two Pointers / Sliding Window
    "two-pointers": "Two Pointers / Sliding Window",
    "two pointers": "Two Pointers / Sliding Window",
    "sliding-window": "Two Pointers / Sliding Window",
    # Bit Manipulation
    "bit-manipulation": "Bit Manipulation",
    "bitmasks": "Bit Manipulation",
    # Complexity / Math
    "math": "Complexity Analysis",
    "number theory": "Complexity Analysis",
    "combinatorics": "Complexity Analysis",
    "game theory": "Complexity Analysis",
}


# ============================================================================
# Security & SSRF Protection Utilities
# ============================================================================

def check_rate_limit(client_ip: str) -> None:
    """Enforce sliding-window rate limit per IP."""
    now = time.time()
    timestamps = _RATE_LIMITS.get(client_ip, [])
    # Filter out entries older than the window
    timestamps = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW]
    if len(timestamps) >= MAX_REQUESTS_PER_WINDOW:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Maximum {MAX_REQUESTS_PER_WINDOW} requests per minute. Please try again later.",
        )
    timestamps.append(now)
    _RATE_LIMITS[client_ip] = timestamps


def sanitize_and_extract_handle(platform: str, handle_or_url: str) -> Tuple[str, str]:
    """
    Validate input, ensure domain is allowed if URL, and extract clean handle.
    Returns: (cleaned_handle, canonical_profile_url)
    """
    cleaned = handle_or_url.strip()
    if not cleaned:
        raise HTTPException(status_code=400, detail="Handle or profile URL cannot be empty.")

    # Check if input looks like a URL
    if "://" in cleaned or cleaned.startswith("www."):
        if not cleaned.startswith("http://") and not cleaned.startswith("https://"):
            cleaned = "https://" + cleaned

        parsed = urlparse(cleaned)
        if parsed.scheme not in ("http", "https"):
            raise HTTPException(status_code=400, detail="Invalid URL scheme. Only HTTP/HTTPS allowed.")

        host = (parsed.hostname or "").lower()
        if host not in ALLOWED_HOSTS:
            raise HTTPException(
                status_code=400,
                detail=f"Domain '{host}' is not supported for automatic stats fetching. Only leetcode.com and codeforces.com are supported.",
            )

        # Extract handle from path
        path_parts = [p for p in parsed.path.split("/") if p]
        if not path_parts:
            raise HTTPException(status_code=400, detail="Could not extract username from profile URL.")

        if platform == "leetcode":
            # https://leetcode.com/u/username/ or https://leetcode.com/username/
            if path_parts[0] == "u" and len(path_parts) > 1:
                handle = path_parts[1]
            else:
                handle = path_parts[0]
        elif platform == "codeforces":
            # https://codeforces.com/profile/username
            if path_parts[0] == "profile" and len(path_parts) > 1:
                handle = path_parts[1]
            else:
                handle = path_parts[0]
        else:
            handle = path_parts[-1]
    else:
        # Bare handle
        handle = cleaned.lstrip("@").strip()

    if not HANDLE_REGEX.match(handle):
        raise HTTPException(
            status_code=400,
            detail="Invalid handle format. Must be 1-64 alphanumeric characters, underscores, or dashes.",
        )

    # Build canonical public profile URL
    if platform == "leetcode":
        canonical_url = f"https://leetcode.com/u/{handle}/"
    elif platform == "codeforces":
        canonical_url = f"https://codeforces.com/profile/{handle}"
    else:
        canonical_url = f"https://{platform}.com/{handle}"

    return handle, canonical_url


# ============================================================================
# Upstream Fetchers
# ============================================================================

async def fetch_leetcode_stats(handle: str, profile_url: str) -> NormalizedPlatformStats:
    """Fetch public LeetCode stats via official GraphQL endpoint."""
    graphql_endpoint = "https://leetcode.com/graphql"
    query = """
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          ranking
          reputation
        }
        submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
        tagProblemCounts {
          advanced {
            tagName
            tagSlug
            problemsSolved
          }
          intermediate {
            tagName
            tagSlug
            problemsSolved
          }
          fundamental {
            tagName
            tagSlug
            problemsSolved
          }
        }
      }
      userContestRanking(username: $username) {
        rating
        globalRanking
        topPercentage
      }
      recentAcSubmissionList(username: $username, limit: 15) {
        title
        titleSlug
        timestamp
      }
    }
    """

    headers = {
        "User-Agent": USER_AGENT,
        "Content-Type": "application/json",
        "Referer": f"https://leetcode.com/u/{handle}/",
    }
    payload = {"query": query, "variables": {"username": handle}}

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT, follow_redirects=False) as client:
        try:
            resp = await client.post(graphql_endpoint, json=payload, headers=headers)
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="LeetCode API request timed out (8s limit).")
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail=f"Failed to connect to LeetCode API: {str(exc)}")

    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=f"LeetCode API returned status {resp.status_code}.")

    if len(resp.content) > MAX_RESPONSE_BYTES:
        raise HTTPException(status_code=502, detail="LeetCode response exceeded 5MB size limit.")

    data = resp.json().get("data", {})
    matched_user = data.get("matchedUser")
    if not matched_user:
        raise HTTPException(
            status_code=404,
            detail=f"LeetCode user '{handle}' not found or profile is completely private.",
        )

    # Parse solved counts by difficulty
    submit_stats = matched_user.get("submitStatsGlobal", {}).get("acSubmissionNum", [])
    total_solved = 0
    easy_solved = 0
    medium_solved = 0
    hard_solved = 0

    for item in submit_stats:
        diff = item.get("difficulty")
        count = item.get("count", 0)
        if diff == "All":
            total_solved = count
        elif diff == "Easy":
            easy_solved = count
        elif diff == "Medium":
            medium_solved = count
        elif diff == "Hard":
            hard_solved = count

    # Contest ranking
    contest_ranking = data.get("userContestRanking") or {}
    contest_rating = contest_ranking.get("rating")
    if contest_rating is not None:
        contest_rating = round(float(contest_rating), 1)

    profile_info = matched_user.get("profile") or {}
    global_rank = str(profile_info.get("ranking")) if profile_info.get("ranking") else None

    # Tag counts mapped to standard 14 topics
    topic_counts: Dict[str, int] = {t: 0 for t in STANDARD_14_DSA_TOPICS}
    tag_counts = matched_user.get("tagProblemCounts") or {}
    all_tags = []
    for tier in ("fundamental", "intermediate", "advanced"):
        all_tags.extend(tag_counts.get(tier) or [])

    for tag_item in all_tags:
        slug = (tag_item.get("tagSlug") or "").lower()
        name = (tag_item.get("tagName") or "").lower()
        solved = tag_item.get("problemsSolved", 0)
        matched_std = TAG_TO_STANDARD_TOPIC.get(slug) or TAG_TO_STANDARD_TOPIC.get(name)
        if matched_std:
            topic_counts[matched_std] = topic_counts.get(matched_std, 0) + solved

    # Recent submissions
    recent_list = data.get("recentAcSubmissionList") or []
    recent_problems: List[RecentProblem] = []
    seen_titles = set()
    for sub in recent_list:
        title = sub.get("title")
        if title and title not in seen_titles:
            seen_titles.add(title)
            recent_problems.append(
                RecentProblem(
                    title=title,
                    platform="leetcode",
                    timestamp=int(sub.get("timestamp")) if sub.get("timestamp") else None,
                )
            )

    return NormalizedPlatformStats(
        platform="leetcode",
        handle=handle,
        profile_url=profile_url,
        is_self_reported=False,
        total_solved=total_solved,
        easy_solved=easy_solved,
        medium_solved=medium_solved,
        hard_solved=hard_solved,
        contest_rating=contest_rating,
        global_rank=global_rank,
        topic_counts=topic_counts,
        recent_problems=recent_problems[:10],
        fetched_at=datetime.now(timezone.utc).isoformat(),
    )


async def fetch_codeforces_stats(handle: str, profile_url: str) -> NormalizedPlatformStats:
    """Fetch public Codeforces stats via official API."""
    headers = {"User-Agent": USER_AGENT}

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT, follow_redirects=False) as client:
        # 1. Fetch user info
        user_info_url = f"https://codeforces.com/api/user.info?handles={handle}"
        try:
            info_resp = await client.get(user_info_url, headers=headers)
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Codeforces API request timed out (8s limit).")
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail=f"Failed to connect to Codeforces: {str(exc)}")

        if info_resp.status_code != 200:
            raise HTTPException(
                status_code=info_resp.status_code,
                detail=f"Codeforces user '{handle}' not found or API error.",
            )

        info_data = info_resp.json()
        if info_data.get("status") != "OK" or not info_data.get("result"):
            raise HTTPException(status_code=404, detail=f"Codeforces user '{handle}' not found.")

        cf_user = info_data["result"][0]
        contest_rating = float(cf_user.get("rating")) if cf_user.get("rating") else None
        rank_str = cf_user.get("rank")

        # 2. Fetch user status / submissions
        status_url = f"https://codeforces.com/api/user.status?handle={handle}&from=1&count=200"
        try:
            status_resp = await client.get(status_url, headers=headers)
        except Exception:
            status_resp = None

    easy_solved = 0
    medium_solved = 0
    hard_solved = 0
    topic_counts: Dict[str, int] = {t: 0 for t in STANDARD_14_DSA_TOPICS}
    recent_problems: List[RecentProblem] = []
    seen_problems = set()

    if status_resp and status_resp.status_code == 200:
        submissions = status_resp.json().get("result", [])
        for sub in submissions:
            if sub.get("verdict") == "OK":
                prob = sub.get("problem", {})
                name = prob.get("name")
                cid = prob.get("contestId")
                idx = prob.get("index")
                unique_key = f"{cid}_{idx}" if cid else name

                if name and unique_key not in seen_problems:
                    seen_problems.add(unique_key)
                    # Rating based difficulty split (<1200 Easy, 1200-1600 Med, >1600 Hard)
                    rating = prob.get("rating")
                    diff_label = "Medium"
                    if rating is not None:
                        if rating < 1200:
                            easy_solved += 1
                            diff_label = "Easy"
                        elif rating <= 1600:
                            medium_solved += 1
                            diff_label = "Medium"
                        else:
                            hard_solved += 1
                            diff_label = "Hard"
                    else:
                        medium_solved += 1

                    recent_problems.append(
                        RecentProblem(
                            title=name,
                            platform="codeforces",
                            difficulty=diff_label,
                            timestamp=int(sub.get("creationTimeSeconds")) if sub.get("creationTimeSeconds") else None,
                        )
                    )

                    # Map Codeforces tags
                    tags = prob.get("tags", [])
                    for t in tags:
                        t_lower = t.lower()
                        std_topic = TAG_TO_STANDARD_TOPIC.get(t_lower)
                        if std_topic:
                            topic_counts[std_topic] = topic_counts.get(std_topic, 0) + 1

    total_solved = len(seen_problems)

    return NormalizedPlatformStats(
        platform="codeforces",
        handle=handle,
        profile_url=profile_url,
        is_self_reported=False,
        total_solved=total_solved,
        easy_solved=easy_solved,
        medium_solved=medium_solved,
        hard_solved=hard_solved,
        contest_rating=contest_rating,
        global_rank=rank_str,
        topic_counts=topic_counts,
        recent_problems=recent_problems[:10],
        fetched_at=datetime.now(timezone.utc).isoformat(),
    )


# ============================================================================
# Main Service Entry Points
# ============================================================================

async def fetch_platform_profile(
    platform: str,
    handle_or_url: str,
    client_ip: str,
    force_refresh: bool = False,
) -> NormalizedPlatformStats:
    """
    Fetch and normalize user profile statistics from a supported coding platform.
    Uses rate limiting, SSRF allowlisting, and caching.
    """
    check_rate_limit(client_ip)
    platform_key = platform.lower().strip()

    handle, canonical_url = sanitize_and_extract_handle(platform_key, handle_or_url)
    cache_key = (platform_key, handle.lower())

    if not force_refresh and cache_key in _CACHE:
        cached_time, cached_stats = _CACHE[cache_key]
        if time.time() - cached_time < CACHE_TTL_SECONDS:
            return cached_stats

    if platform_key == "leetcode":
        stats = await fetch_leetcode_stats(handle, canonical_url)
    elif platform_key == "codeforces":
        stats = await fetch_codeforces_stats(handle, canonical_url)
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Platform '{platform}' cannot be fetched automatically. Please use self-reported entry.",
        )

    _CACHE[cache_key] = (time.time(), stats)
    return stats


def calculate_dsa_journey(platforms: List[NormalizedPlatformStats]) -> DsaJourneyCalculation:
    """
    Deterministic math engine for DSA Journey:
    - Computes totals across all attached platforms (auto-fetched or self-reported)
    - Computes aggregate difficulty distribution
    - Maps into 14 standard DSA topics:
        >=20 solved: Strong
        5-19 solved: Moderate
        <5 solved: Untouched / Weak
    """
    total_solved = 0
    easy_solved = 0
    medium_solved = 0
    hard_solved = 0
    agg_topic_counts: Dict[str, int] = {t: 0 for t in STANDARD_14_DSA_TOPICS}
    recent_problems: List[RecentProblem] = []
    seen_problem_titles = set()

    for p in platforms:
        total_solved += p.total_solved
        easy_solved += p.easy_solved
        medium_solved += p.medium_solved
        hard_solved += p.hard_solved

        for topic, count in (p.topic_counts or {}).items():
            if topic in agg_topic_counts:
                agg_topic_counts[topic] += count

        for rp in (p.recent_problems or []):
            if rp.title not in seen_problem_titles:
                seen_problem_titles.add(rp.title)
                recent_problems.append(rp)

    # Build topic coverage matrix
    topic_coverage: List[TopicCoverageItem] = []
    strong_topics: List[str] = []
    moderate_topics: List[str] = []
    weak_topics: List[str] = []

    for topic in STANDARD_14_DSA_TOPICS:
        cnt = agg_topic_counts.get(topic, 0)
        if cnt >= 20:
            status = "Strong"
            strong_topics.append(topic)
        elif cnt >= 5:
            status = "Moderate"
            moderate_topics.append(topic)
        else:
            status = "Untouched"
            weak_topics.append(topic)

        topic_coverage.append(TopicCoverageItem(topic=topic, count=cnt, status=status))

    # Sort topics coverage by count descending for cleaner presentation
    topic_coverage.sort(key=lambda x: x.count, reverse=True)

    return DsaJourneyCalculation(
        total_solved=total_solved,
        easy_solved=easy_solved,
        medium_solved=medium_solved,
        hard_solved=hard_solved,
        topic_coverage=topic_coverage,
        strong_topics=strong_topics,
        moderate_topics=moderate_topics,
        weak_topics=weak_topics,
        recent_solved_problems=recent_problems[:10],
        platforms=platforms,
    )
