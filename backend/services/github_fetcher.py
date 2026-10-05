import base64
import logging
import os
import re
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse

import httpx
from fastapi import HTTPException, status

logger = logging.getLogger("speakprep_github_fetcher")

# Security & Constraints
ALLOWED_HOSTS = {"github.com", "www.github.com"}
OWNER_REPO_REGEX = re.compile(r"^[a-zA-Z0-9_\-\.]{1,100}$")

MAX_FILES_TO_FETCH = 5
MAX_BYTES_PER_FILE = 8 * 1024  # 8 KB
MAX_README_CHARS = 10000
MAX_TOTAL_SNIPPETS_CHARS = 30000
REQUEST_TIMEOUT = 10.0

MANIFEST_FILENAMES = {
    "package.json",
    "requirements.txt",
    "pyproject.toml",
    "dockerfile",
    "docker-compose.yml",
    "docker-compose.yaml",
    "go.mod",
    "cargo.toml",
    "pom.xml",
    "build.gradle",
    "gemfile",
    "setup.py",
}

ENTRY_FILENAMES = {
    "main.py",
    "app.py",
    "index.js",
    "index.ts",
    "server.js",
    "src/app.jsx",
    "src/app.tsx",
    "src/main.jsx",
    "src/main.tsx",
    "src/index.js",
    "src/index.ts",
    "src/server.ts",
}


def parse_and_validate_github_url(raw_url: str) -> Tuple[str, str]:
    """
    Strictly parse and validate a GitHub repository URL.
    Enforces that the host is github.com (preventing SSRF to internal services).
    Returns (owner, repo).
    """
    cleaned = raw_url.strip()
    if not cleaned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub URL cannot be empty.",
        )

    # Normalize schemes
    if not cleaned.startswith(("http://", "https://")):
        cleaned = "https://" + cleaned

    try:
        parsed = urlparse(cleaned)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid URL structure: {str(exc)}",
        )

    host = (parsed.netloc or "").lower().split(":")[0]
    if host not in ALLOWED_HOSTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Invalid host '{host}'. Only public github.com repositories are supported. "
                "For other code repositories or platforms, please use the manual project entry form."
            ),
        )

    path = parsed.path.strip("/")
    if path.endswith(".git"):
        path = path[:-4]
    segments = [s for s in path.split("/") if s]
    if len(segments) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid GitHub repository URL. Expected format: https://github.com/owner/repository",
        )

    owner = segments[0]
    repo = segments[1]

    if not OWNER_REPO_REGEX.match(owner) or not OWNER_REPO_REGEX.match(repo):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid characters in GitHub owner or repository name.",
        )

    return owner, repo


def _get_github_headers() -> Dict[str, str]:
    headers = {
        "User-Agent": "SpeakPrepAI/1.0 (+https://github.com/Aqua32A7/speak-ai)",
        "Accept": "application/vnd.github.v3+json",
    }
    token = os.environ.get("GITHUB_TOKEN", "").strip()
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


async def fetch_github_repository_data(owner: str, repo: str) -> Dict[str, any]:
    """
    Fetch repository metadata, README, file tree, and key manifests/entry files
    directly from api.github.com.
    """
    headers = _get_github_headers()
    api_base = f"https://api.github.com/repos/{owner}/{repo}"

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT, follow_redirects=True) as client:
        # 1. Fetch Repo Metadata
        try:
            repo_res = await client.get(api_base, headers=headers)
        except httpx.TimeoutException:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="GitHub API timed out while fetching repository metadata. Please try again or use the manual form.",
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Network error communicating with GitHub API: {str(exc)}",
            )

        if repo_res.status_code == 404:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    f"GitHub repository '{owner}/{repo}' was not found or is private. "
                    "Make sure the repository exists and is public, or add your project manually."
                ),
            )
        elif repo_res.status_code in (403, 429):
            rate_limit_msg = (
                "GitHub API rate limit exceeded. Please use the manual project form, "
                "or configure a GITHUB_TOKEN in backend/.env for higher rate limits."
            )
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=rate_limit_msg)
        elif repo_res.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"GitHub API returned unexpected status {repo_res.status_code}.",
            )

        repo_data = repo_res.json()
        default_branch = repo_data.get("default_branch", "main")
        description = repo_data.get("description") or "No description provided."
        stars = repo_data.get("stargazers_count", 0)
        topics = repo_data.get("topics", [])
        primary_language = repo_data.get("language") or "Not specified"

        # 2. Fetch Languages Breakdown
        languages = []
        try:
            lang_res = await client.get(f"{api_base}/languages", headers=headers)
            if lang_res.status_code == 200:
                lang_json = lang_res.json()
                languages = list(lang_json.keys())[:8]
        except Exception as e:
            logger.warning(f"Error fetching languages for {owner}/{repo}: {e}")

        # 3. Fetch README
        readme_text = ""
        try:
            readme_res = await client.get(f"{api_base}/readme", headers=headers)
            if readme_res.status_code == 200:
                readme_json = readme_res.json()
                content_b64 = readme_json.get("content", "")
                if content_b64:
                    raw_bytes = base64.b64decode(content_b64)
                    readme_text = raw_bytes.decode("utf-8", errors="replace")[:MAX_README_CHARS]
        except Exception as e:
            logger.warning(f"Error fetching README for {owner}/{repo}: {e}")

        # 4. Fetch File Tree (Top levels)
        tree_paths = []
        files_to_inspect = []
        try:
            tree_res = await client.get(
                f"{api_base}/git/trees/{default_branch}?recursive=1",
                headers=headers,
            )
            if tree_res.status_code == 200:
                tree_json = tree_res.json()
                tree_items = tree_json.get("tree", [])
                for item in tree_items:
                    p = item.get("path", "")
                    t = item.get("type", "")
                    if t == "blob":
                        p_lower = p.lower()
                        tree_paths.append(p)
                        if p_lower in MANIFEST_FILENAMES or any(p_lower.endswith("/" + m) for m in MANIFEST_FILENAMES):
                            files_to_inspect.append(p)
                        elif p_lower in ENTRY_FILENAMES:
                            files_to_inspect.append(p)
        except Exception as e:
            logger.warning(f"Error fetching file tree for {owner}/{repo}: {e}")

        # Cap files to inspect
        selected_files = files_to_inspect[:MAX_FILES_TO_FETCH]

        # 5. Fetch Key File Snippets
        file_snippets: Dict[str, str] = {}
        for path_to_fetch in selected_files:
            try:
                file_res = await client.get(
                    f"{api_base}/contents/{path_to_fetch}?ref={default_branch}",
                    headers=headers,
                )
                if file_res.status_code == 200:
                    file_json = file_res.json()
                    content_b64 = file_json.get("content", "")
                    if content_b64:
                        content_str = base64.b64decode(content_b64).decode("utf-8", errors="replace")
                        file_snippets[path_to_fetch] = content_str[:MAX_BYTES_PER_FILE]
            except Exception as e:
                logger.warning(f"Failed to fetch content for {path_to_fetch}: {e}")

        # Summarize tree for prompt
        sample_tree = tree_paths[:60]
        if len(tree_paths) > 60:
            sample_tree.append(f"... and {len(tree_paths) - 60} more files")

        return {
            "owner": owner,
            "repo": repo,
            "description": description,
            "stars": stars,
            "topics": topics,
            "primary_language": primary_language,
            "languages": languages,
            "readme_text": readme_text,
            "file_tree": sample_tree,
            "file_snippets": file_snippets,
        }
