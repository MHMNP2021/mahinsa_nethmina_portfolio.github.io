#!/usr/bin/env python3
"""
Facebook Auto-Poster Agent — Generates trending actress/film news posts
using Groq (free LLM) + DuckDuckGo search, then publishes to your Facebook Page.
"""

import os
import re
import json
import hashlib
import sys
from datetime import datetime, timezone

import requests
from duckduckgo_search import DDGS

# ─── Configuration ───────────────────────────────────────────────────────────

FACEBOOK_PAGE_ID = os.environ.get("FB_PAGE_ID", "")
FACEBOOK_ACCESS_TOKEN = os.environ.get("FB_ACCESS_TOKEN", "")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = "llama-3.3-70b-versatile"

SEARCH_TOPICS = [
    "trending actress news today 2026",
    "hollywood film industry latest news 2026",
    "bollywood actress trending 2026",
    "upcoming movies 2026 cast",
    "box office top grossing films 2026",
    "film festival awards news 2026",
    "celebrity entertainment news today 2026",
    "netflix amazon prime new releases 2026",
]


# ─── LLM Client ──────────────────────────────────────────────────────────────

def query_groq(prompt: str, system: str = "") -> str:
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    resp = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers=headers,
        json={"model": GROQ_MODEL, "messages": messages, "temperature": 0.8},
        timeout=120,
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


# ─── Web Search ──────────────────────────────────────────────────────────────

def search_news(query: str, max_results: int = 6) -> list:
    results = []
    try:
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=max_results):
                results.append({"title": r["title"], "body": r.get("body", ""), "href": r.get("href", "")})
    except Exception as e:
        print(f"[WARN] DuckDuckGo search failed: {e}")
    return results


def pick_topic() -> str:
    idx = int(hashlib.md5(datetime.now(timezone.utc).strftime("%Y-%U").encode()).hexdigest(), 16) % len(SEARCH_TOPICS)
    return SEARCH_TOPICS[idx]


# ─── Content Generation ──────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are a social media manager for a celebrity entertainment news page.
You write short, engaging Facebook posts about actresses, actors, and films worldwide.
Style: catchy hook, 2-3 short paragraphs, 3-5 relevant emojis, 3-5 hashtags.
Tone: exciting, gossipy but respectful, accessible.
Output must be valid JSON with keys:
  - post_text: str (the FULL Facebook post, 100-250 words, with emojis and hashtags)
  - topic: str (short topic label e.g. "Margot Robbie new film")
  - hashtags: list[str] (3-5 hashtags without #)"""


def generate_post(search_results: list) -> dict:
    search_text = "\n\n".join(
        f"Title: {r['title']}\nSnippet: {r['body']}"
        for r in search_results[:5]
    )

    prompt = f"""Based on these recent entertainment news articles, write an engaging Facebook post:

--- NEWS ---
{search_text}
--- END NEWS ---

Requirements:
- Write about the MOST interesting/relevant story
- Hook in the first line
- 100-250 words
- Include emojis and hashtags
- Output ONLY valid JSON (escape newlines properly)"""

    raw = query_groq(prompt, system=SYSTEM_PROMPT)
    raw = re.sub(r"^```(?:json)?\s*", "", raw.strip())
    raw = re.sub(r"\s*```$", "", raw.strip())
    raw = re.sub(r"(?<!\\)\\(?![\"\\/bfnrtu])", "\\\\", raw)
    # Try strict parse first, then fallback to cleaning newlines in strings
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # Escape unescaped newlines inside string values
        raw = re.sub(r"(?<!\")\n(?!\s*[\"}\]])", "\\n", raw)
        raw = re.sub(r"(?<=[^\\])\n", "\\n", raw)
        return json.loads(raw)


# ─── Facebook Publisher ───────────────────────────────────────────────────────

def post_to_facebook(message: str) -> bool:
    url = f"https://graph.facebook.com/v25.0/{FACEBOOK_PAGE_ID}/feed"
    payload = {
        "message": message,
        "access_token": FACEBOOK_ACCESS_TOKEN,
    }
    resp = requests.post(url, data=payload, timeout=30)
    if resp.status_code == 200:
        post_id = resp.json().get("id", "unknown")
        print(f"[OK] Posted to Facebook! Post ID: {post_id}")
        return True
    else:
        print(f"[ERROR] Facebook API error {resp.status_code}: {resp.text[:500]}")
        return False


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    missing = []
    if not GROQ_API_KEY: missing.append("GROQ_API_KEY")
    if not FACEBOOK_PAGE_ID: missing.append("FB_PAGE_ID")
    if not FACEBOOK_ACCESS_TOKEN: missing.append("FB_ACCESS_TOKEN")
    if missing:
        print(f"[ERROR] Missing env vars: {', '.join(missing)}")
        sys.exit(1)

    topic = pick_topic()
    print(f"[*] Searching for: {topic}")
    results = search_news(topic)
    if not results:
        print("[!] No results. Trying fallback...")
        results = search_news("celebrity entertainment news 2026")

    print("[*] Generating Facebook post with Groq...")
    post = generate_post(results)
    print(f"  Topic: {post.get('topic', 'N/A')}")
    print(f"  Hashtags: {', '.join(post.get('hashtags', []))}")

    post_text = post.get("post_text", "")
    if not post_text:
        print("[ERROR] No post text generated.")
        sys.exit(1)

    safe_text = post_text.encode("utf-8", errors="replace").decode("utf-8", errors="replace")
    print(f"\n--- POST PREVIEW ---\n{safe_text}\n--------------------")

    # For GitHub Actions — post automatically
    if os.environ.get("CI") == "true" or os.environ.get("FB_AUTO_POST") == "1":
        post_to_facebook(post_text)
    else:
        print("\n[DRY RUN] Set FB_AUTO_POST=1 or CI=true to actually post.")
        print("Run this in GitHub Actions for live posting.")

    print("[DONE]")


if __name__ == "__main__":
    main()
