#!/usr/bin/env python3
"""
AI Blog Agent — Generates short finance/actuarial blog posts using Groq (free LLM)
+ DuckDuckGo search, then publishes them to the portfolio.
"""

import os
import re
import json
import hashlib
from datetime import datetime, timezone
from pathlib import Path

import requests
from duckduckgo_search import DDGS

# ─── Configuration ───────────────────────────────────────────────────────────

BLOG_DIR = Path(__file__).resolve().parent.parent / "blog"
BLOG_LISTING = Path(__file__).resolve().parent.parent / "blog.html"
IMAGES = [
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
    "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&q=80",
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
    "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&q=80",
]

CATEGORY_MAP = {
    "finance": "Finance",
    "actuarial": "Actuarial",
    "economic": "Economics",
    "data-science": "Data Science",
    "statistics": "Statistics",
    "trading": "Trading",
    "business": "Business",
    "management": "Management",
}

SEARCH_TOPICS = [
    "latest finance actuarial news 2026",
    "insurance risk management trends 2026",
    "portfolio optimization quantitative finance 2026",
    "actuarial science data analytics 2026",
    "central bank policy interest rates 2026",
    "inflation financial markets outlook 2026",
    "investment banking fintech innovation 2026",
    "retirement pension fund actuarial 2026",
]

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GROQ_MODEL = "llama-3.3-70b-versatile"  # Free tier on Groq


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
        json={"model": GROQ_MODEL, "messages": messages, "temperature": 0.7},
        timeout=120,
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


# ─── Web Search ──────────────────────────────────────────────────────────────

def search_finance_news(query: str, max_results: int = 6) -> list:
    results = []
    try:
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=max_results):
                results.append({"title": r["title"], "body": r.get("body", ""), "href": r.get("href", "")})
    except Exception as e:
        print(f"[WARN] DuckDuckGo search failed: {e}")
    return results


def pick_search_topic() -> str:
    idx = int(hashlib.md5(datetime.now(timezone.utc).strftime("%Y-%U").encode()).hexdigest(), 16) % len(SEARCH_TOPICS)
    return SEARCH_TOPICS[idx]


# ─── Content Generation ──────────────────────────────────────────────────────

GENERATION_SYSTEM_PROMPT = """You are a financial analyst and actuarial blogger.
You write short, sharp, time-aligned blog posts about finance and actuarial topics.
Posts must be fact-based, reference current events, and be written in an accessible but professional tone.
Output must be valid JSON with these keys:
  - title: str (catchy, under 80 chars)
  - slug: str (url-friendly, lowercase with hyphens)
  - category: str (one of: finance, actuarial, economic, data-science, statistics, trading, business, management)
  - tags: list[str] (2-4 tags, short)
  - summary: str (1-2 sentences, ~150 chars max)
  - sections: list[dict] each with "heading" and "body" (2-4 sections)
  - body_paragraphs: list[str] (intro + closing paragraphs, 2-4 total)"""


def get_existing_titles() -> list:
    html = BLOG_LISTING.read_text(encoding="utf-8")
    titles = []
    for m in re.finditer(r'<h2><a href="blog/[^"]+\.html">([^<]+)</a></h2>', html):
        titles.append(m.group(1))
    return titles


def generate_post(search_results: list, existing_titles: list) -> dict:
    search_text = "\n\n".join(
        f"Title: {r['title']}\nSnippet: {r['body']}\nURL: {r['href']}"
        for r in search_results[:4]
    )

    existing_block = ""
    if existing_titles:
        existing_block = "\nAlready published topics (AVOID these):\n" + "\n".join(f"  - {t}" for t in existing_titles)

    prompt = f"""Based on these recent financial news articles, write a short blog post on a DIFFERENT topic than anything already published:

--- NEWS ---
{search_text}
--- END NEWS ---{existing_block}

Requirements:
- Topic must NOT overlap with any already-published topics listed above
- Short and punchy (300-500 words total)
- Time-aligned: reference current events/market conditions
- Focus on finance or actuarial topics
- Output ONLY valid JSON, no markdown wrapping"""

    raw = query_groq(prompt, system=GENERATION_SYSTEM_PROMPT)
    raw = re.sub(r"^```(?:json)?\s*", "", raw.strip())
    raw = re.sub(r"\s*```$", "", raw.strip())
    return json.loads(raw)


# ─── HTML Template ───────────────────────────────────────────────────────────

def render_post_html(post: dict) -> str:
    date_str = datetime.now(timezone.utc).strftime("%B %d, %Y")
    iso_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    tags_html = "".join(f'<a href="#">{t.strip()}</a>' for t in post.get("tags", []))

    toc_items = "".join(
        f'<li><a href="#{slugify(s["heading"])}">{s["heading"]}</a></li>'
        for s in post.get("sections", [])
    )

    sections_html = ""
    for i, sec in enumerate(post.get("sections", [])):
        hid = slugify(sec["heading"])
        icon = ["fa-info-circle", "fa-chart-line", "fa-calculator", "fa-lightbulb"][i % 4]
        sections_html += f"""
        <section id="{hid}">
            <h2><i class="fas {icon}"></i> {sec["heading"]}</h2>
            <p>{sec["body"]}</p>
        </section>"""

    body_paras = "".join(f"<p>{p}</p>" for p in post.get("body_paragraphs", []))

    return f"""<!DOCTYPE html>
<html lang="en" class="light-mode">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{post["title"]} | My Portfolio</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
<style>
:root {{
    --bg-primary: #1a202c; --bg-secondary: #2d3748; --text-primary: #e2e8f0;
    --text-secondary: #a0aec0; --accent-primary: #4299e1; --accent-secondary: #3182ce;
    --accent-highlight: #63b3ed; --border-color: #4a5568; --card-shadow: 0 2px 15px rgba(0,0,0,0.2);
    --header-bg: #2d3748; --header-shadow: 0 2px 10px rgba(0,0,0,0.3);
    --footer-bg: #1a202c; --footer-text: #e2e8f0; --toc-bg: #2d3748;
    --example-bg: #3a4a5e; --key-points-bg: #2c4a52; --table-header-bg: #3182ce;
    --table-header-text: #e2e8f0; --table-row-even: #3a4a5e; --table-row-hover: #2c4a52;
    --code-bg: #2d3748; --back-to-top-bg: #4299e1; --back-to-top-hover: #3182ce;
    --category-bg: #2c4a52; --category-text: #63b3ed; --comment-bg: #2d3748;
    --comment-border: #4a5568; --comment-highlight: #2c4a52; --button-primary: #4299e1;
    --button-hover: #3182ce; --button-text: #1a202c; --reference-bg: #2d3748;
    --reference-border: #4a5568;
}}
.light-mode {{
    --bg-primary: #f9f9f9; --bg-secondary: #ffffff; --text-primary: #333333;
    --text-secondary: #555555; --accent-primary: #3182ce; --accent-secondary: #4299e1;
    --accent-highlight: #63b3ed; --border-color: #dddddd; --card-shadow: 0 4px 6px rgba(0,0,0,0.1);
    --header-bg: #ffffff; --header-shadow: 0 2px 10px rgba(0,0,0,0.1);
    --footer-bg: #1a365d; --footer-text: #ffffff; --toc-bg: #f0f8ff;
    --example-bg: #f8f9fa; --key-points-bg: #e6fffa; --table-header-bg: #3182ce;
    --table-header-text: #ffffff; --table-row-even: #f2f2f2; --table-row-hover: #e6fffa;
    --code-bg: #f5f5f5; --back-to-top-bg: #4299e1; --back-to-top-hover: #3182ce;
    --category-bg: #e6fffa; --category-text: #3182ce; --comment-bg: #f8f9fa;
    --comment-border: #e2e8f0; --comment-highlight: #e6fffa; --button-primary: #4299e1;
    --button-hover: #3182ce; --button-text: #ffffff;
}}
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ font-family:'Roboto',sans-serif; background:var(--bg-primary); color:var(--text-primary); line-height:1.8; }}
a {{ color:var(--accent-primary); text-decoration:none; }}
a:hover {{ color:var(--accent-highlight); }}
.progress-container {{ position:fixed; top:0; left:0; width:100%; height:4px; z-index:1000; background:transparent; }}
.progress-bar {{ height:100%; width:0%; background:linear-gradient(90deg,var(--accent-primary),var(--accent-highlight)); transition:width .2s; }}
header {{ background:var(--header-bg); box-shadow:var(--header-shadow); position:sticky; top:0; z-index:100; padding:0 24px; }}
nav {{ max-width:1100px; margin:0 auto; display:flex; justify-content:space-between; align-items:center; height:64px; }}
.logo a {{ font-family:'Playfair Display',serif; font-size:1.4rem; color:var(--text-primary); }}
.logo span {{ color:var(--accent-primary); }}
nav ul {{ display:flex; list-style:none; gap:24px; }}
nav ul li a {{ color:var(--text-secondary); font-weight:500; font-size:.92rem; transition:color .3s; }}
nav ul li a:hover, nav ul li a.active {{ color:var(--accent-primary); }}
.mobile-menu-toggle {{ display:none; background:none; border:none; color:var(--text-primary); font-size:1.4rem; cursor:pointer; }}
.blog-content {{ max-width:860px; margin:0 auto; padding:40px 24px 80px; }}
.article-header {{ text-align:center; margin-bottom:40px; }}
.article-header h1 {{ font-family:'Playfair Display',serif; font-size:clamp(1.8rem,4vw,2.6rem); margin-bottom:16px; line-height:1.3; }}
.post-meta {{ color:var(--text-secondary); font-size:.9rem; display:flex; justify-content:center; gap:20px; flex-wrap:wrap; }}
.post-meta .categories a {{ display:inline-block; padding:4px 12px; border-radius:50px; background:var(--category-bg); color:var(--category-text); font-size:.78rem; margin:0 4px; }}
.toc {{ background:var(--toc-bg); border-radius:12px; padding:24px 28px; margin-bottom:40px; border:1px solid var(--border-color); }}
.toc h2 {{ font-size:1.1rem; margin-bottom:12px; }}
.toc ul {{ list-style:none; padding-left:0; columns:2; column-gap:24px; }}
.toc ul li {{ margin-bottom:6px; }}
.toc ul li a {{ font-size:.9rem; }}
section {{ margin-bottom:36px; }}
section h2 {{ font-family:'Playfair Display',serif; font-size:1.4rem; margin-bottom:14px; padding-bottom:8px; border-bottom:2px solid var(--accent-primary); display:inline-block; }}
section p {{ color:var(--text-secondary); margin-bottom:14px; }}
.example {{ background:var(--example-bg); border-left:4px solid var(--accent-primary); padding:16px 20px; border-radius:0 8px 8px 0; margin:16px 0; }}
.key-points {{ background:var(--key-points-bg); border-radius:8px; padding:16px 20px; margin:16px 0; }}
.key-points ul {{ padding-left:20px; }}
.key-points li {{ margin-bottom:4px; }}
footer {{ background:var(--footer-bg); color:var(--footer-text); text-align:center; padding:32px 24px; }}
.back-to-top {{ position:fixed; bottom:24px; right:24px; width:44px; height:44px; border-radius:50%; background:var(--back-to-top-bg); color:#fff; display:flex; align-items:center; justify-content:center; font-size:1.2rem; transition:all .3s; opacity:0; visibility:hidden; }}
.back-to-top.visible {{ opacity:1; visibility:visible; }}
.back-to-top:hover {{ background:var(--back-to-top-hover); transform:translateY(-3px); }}
@media(max-width:768px) {{ .toc ul {{ columns:1; }} nav ul {{ display:none; }} .mobile-menu-toggle {{ display:block; }} nav ul.active {{ display:flex; flex-direction:column; position:absolute; top:64px; left:0; width:100%; background:var(--header-bg); padding:20px 24px; gap:12px; }} }}
</style>
</head>
<body>
<div class="progress-container"><div class="progress-bar" id="progressBar"></div></div>

<header>
    <nav>
        <div class="logo"><a href="../index.html">MHMN<span>Perera</span></a></div>
        <button class="mobile-menu-toggle" id="mobileMenuToggle"><i class="fas fa-bars"></i></button>
        <ul id="navLinks">
            <li><a href="../index.html">Home</a></li>
            <li><a href="../blog.html" class="active">Blog</a></li>
            <li><a href="../index.html#about">About</a></li>
            <li><a href="../index.html#contact">Contact</a></li>
        </ul>
    </nav>
</header>

<main class="blog-content">
    <article>
        <div class="article-header">
            <h1>{post["title"]}</h1>
            <div class="post-meta">
                <span class="date"><i class="fas fa-calendar-alt"></i> Published on: <time datetime="{iso_date}">{date_str}</time></span>
                <span class="categories">{tags_html}</span>
            </div>
        </div>

        <div class="toc">
            <h2><i class="fas fa-list"></i> Table of Contents</h2>
            <ul>{toc_items}</ul>
        </div>

        {body_paras}

        {sections_html}

    </article>
</main>

<div class="theme-toggle" style="position:fixed;top:80px;right:20px;z-index:100;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;cursor:pointer;" id="themeToggle">
    <i class="fas fa-moon"></i>
</div>

<a href="#" class="back-to-top" id="backToTop"><i class="fas fa-arrow-up"></i></a>

<footer><p>&copy; {datetime.now(timezone.utc).year} M Nethmina Perera. All Rights Reserved.</p></footer>

<script>
document.getElementById('mobileMenuToggle')?.addEventListener('click',()=>{{document.getElementById('navLinks').classList.toggle('active');}});
window.addEventListener('scroll',()=>{{const b=document.getElementById('backToTop');if(b){{b.classList.toggle('visible',window.scrollY>400);}}}});
document.getElementById('backToTop')?.addEventListener('click',e=>{{e.preventDefault();window.scrollTo({{top:0,behavior:'smooth'}});}});
const bar=document.getElementById('progressBar');if(bar){{window.addEventListener('scroll',()=>{{const h=document.documentElement;const p=(h.scrollTop/(h.scrollHeight-h.clientHeight))*100;bar.style.width=p+'%';}});}}
const toggle=document.getElementById('themeToggle');if(toggle){{const html=document.documentElement;const icon=toggle.querySelector('i');if(localStorage.getItem('theme')==='light'){{html.classList.add('light-mode');if(icon)icon.className='fas fa-sun';}}toggle.addEventListener('click',()=>{{html.classList.toggle('light-mode');const isLight=html.classList.contains('light-mode');localStorage.setItem('theme',isLight?'light':'dark');if(icon)icon.className=isLight?'fas fa-sun':'fas fa-moon';}});}}
</script>
</body>
</html>"""


# ─── Helpers ─────────────────────────────────────────────────────────────────

def slugify(text: str) -> str:
    s = text.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_]+", "-", s)
    s = re.sub(r"-+", "-", s)
    return s.strip("-")


def pick_image(title: str) -> str:
    idx = int(hashlib.md5(title.encode()).hexdigest(), 16) % len(IMAGES)
    return IMAGES[idx]


def tag_to_filter(tag: str) -> str:
    t = tag.lower().strip()
    for key, val in CATEGORY_MAP.items():
        if t == val.lower() or t == key:
            return key
    return "finance"


# ─── Update blog.html ────────────────────────────────────────────────────────

def update_blog_listing(post: dict, slug: str) -> None:
    date_str = datetime.now(timezone.utc).strftime("%B %d, %Y")
    img = pick_image(post["title"])
    tags = post.get("tags", [])
    cat = post.get("category", "finance")

    filter_tag = tag_to_filter(cat)
    all_tags = "all " + " ".join(tag_to_filter(t) for t in tags)

    card_html = f"""          <article class="blog-post-card" data-tags="{all_tags}">
            <div class="post-img">
              <img src="{img}" alt="{post["title"]}" loading="lazy">
            </div>
            <div class="post-body">
              <div class="post-date"><i class="far fa-calendar-alt"></i> {date_str}</div>
              <h2><a href="blog/{slug}.html">{post["title"]}</a></h2>
              <div class="post-tags">
                {"".join(f'<span class="tag">{t}</span>' for t in tags)}
              </div>
              <p>{post.get("summary", "")}</p>
              <a href="blog/{slug}.html" class="read-more">Read More <i class="fas fa-arrow-right"></i></a>
            </div>
          </article>
"""

    html = BLOG_LISTING.read_text(encoding="utf-8")

    marker = '<div class="blog-posts-grid" id="blogPosts">'
    idx = html.find(marker)
    if idx == -1:
        print("[ERROR] Could not find blog-posts-grid in blog.html")
        return

    insert_pos = html.index(">", idx) + 1
    new_html = html[:insert_pos] + "\n" + card_html + html[insert_pos:]
    BLOG_LISTING.write_text(new_html, encoding="utf-8")
    print(f"[OK] Inserted card into blog.html for '{post['title']}'")


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    if not GROQ_API_KEY:
        print("[ERROR] GROQ_API_KEY environment variable not set.")
        print("Get a free key at https://console.groq.com")
        sys.exit(1)

    BLOG_DIR.mkdir(parents=True, exist_ok=True)

    topic = pick_search_topic()
    print(f"[*] Searching for: {topic}")
    results = search_finance_news(topic)
    if not results:
        print("[!] No search results. Using fallback topic...")
        results = search_finance_news("financial markets 2026")

    existing_titles = get_existing_titles()
    print(f"[*] Found {len(existing_titles)} existing posts")

    print("[*] Generating blog post with Groq...")
    post = generate_post(results, existing_titles)
    print(f"  Title: {post.get('title', 'N/A')}")
    print(f"  Category: {post.get('category', 'N/A')}")
    print(f"  Tags: {', '.join(post.get('tags', []))}")

    slug = post.get("slug", slugify(post.get("title", "untitled")))
    slug = slug[:60]
    out_path = BLOG_DIR / f"{slug}.html"

    if out_path.exists():
        print(f"[!] {out_path} already exists. Appending hash...")
        slug += "-" + hashlib.md5(slug.encode()).hexdigest()[:6]
        out_path = BLOG_DIR / f"{slug}.html"

    html = render_post_html(post)
    out_path.write_text(html, encoding="utf-8")
    print(f"[OK] Created blog/{slug}.html")

    update_blog_listing(post, slug)
    print("[DONE] Blog post published successfully!")


if __name__ == "__main__":
    import sys
    main()
