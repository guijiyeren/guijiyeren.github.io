# -*- coding: utf-8 -*-
"""云端公开情报更新：GitHub Actions 定时运行，写入 intel/data/live.json。"""
import json, os, re, time, urllib.request, urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from html import unescape

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "intel", "data", "live.json")
UA = "guijiyeren-site-intel-bot/1.0 (+https://guijiyeren.github.io/)"
items = []

def get(url, timeout=25):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    return urllib.request.urlopen(req, timeout=timeout).read()

def add(source, title, url, summary="", score="", t=""):
    title = unescape(re.sub(r"<[^>]+>", "", str(title or ""))).strip()
    url = str(url or "").strip()
    if not title or not url:
        return
    if any(x["url"] == url for x in items):
        return
    items.append({"source": source, "title": title[:180], "url": url, "summary": str(summary or "")[:180], "score": score, "time": t})

try:
    data = json.loads(get("https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=18"))
    for h in data.get("hits", [])[:12]:
        add("Hacker News", h.get("title") or h.get("story_title"), h.get("url") or ("https://news.ycombinator.com/item?id=" + str(h.get("objectID"))), "", str(h.get("points") or "") + " points", (h.get("created_at") or "")[:10])
except Exception as e:
    print("HN failed:", e)

try:
    headers = {"User-Agent": UA, "Accept": "application/vnd.github+json"}
    tok = os.environ.get("GITHUB_TOKEN")
    if tok:
        headers["Authorization"] = "Bearer " + tok
    req = urllib.request.Request("https://api.github.com/search/repositories?q=" + urllib.parse.quote("created:>2026-01-01 stars:>100") + "&sort=stars&order=desc&per_page=8", headers=headers)
    data = json.loads(urllib.request.urlopen(req, timeout=25).read())
    for r in data.get("items", [])[:8]:
        add("GitHub", r.get("full_name") + " — " + (r.get("description") or ""), r.get("html_url"), "", "★ " + str(r.get("stargazers_count")), (r.get("created_at") or "")[:10])
except Exception as e:
    print("GitHub failed:", e)

try:
    raw = get("https://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.CL&sortBy=submittedDate&sortOrder=descending&max_results=8")
    ns = {"a": "http://www.w3.org/2005/Atom"}
    root = ET.fromstring(raw)
    for e in root.findall("a:entry", ns)[:8]:
        title = e.findtext("a:title", default="", namespaces=ns)
        link = e.findtext("a:id", default="", namespaces=ns)
        summary = e.findtext("a:summary", default="", namespaces=ns)
        add("arXiv", title, link, summary[:180])
except Exception as e:
    print("arXiv failed:", e)

feeds = [
    ("OpenAI", "https://openai.com/news/rss.xml"),
    ("Google AI", "https://blog.google/technology/ai/rss/"),
    ("Simon Willison", "https://simonwillison.net/atom/everything/"),
    ("Hugging Face", "https://huggingface.co/blog/feed.xml"),
]
for source, url in feeds:
    try:
        raw = get(url)
        root = ET.fromstring(raw)
        entries = root.findall(".//item") or root.findall("{http://www.w3.org/2005/Atom}entry")
        for e in entries[:3]:
            title = e.findtext("title") or e.findtext("{http://www.w3.org/2005/Atom}title") or ""
            link_el = e.find("link")
            link = (link_el.text if link_el is not None else "") or e.findtext("{http://www.w3.org/2005/Atom}link") or ""
            if not link:
                le = e.find("{http://www.w3.org/2005/Atom}link")
                link = le.get("href") if le is not None else ""
            add(source, title, link)
    except Exception as e:
        print(source + " failed:", e)

# 按来源轮转，避免单一来源占满
by = {}
for x in items:
    by.setdefault(x["source"], []).append(x)
out = []
while len(out) < 16 and any(by.values()):
    for k in list(by.keys()):
        if by[k]:
            out.append(by[k].pop(0))
        if len(out) >= 16:
            break
    if not any(by.values()):
        break

now = datetime.now(timezone(timedelta(hours=8))).strftime("%Y-%m-%d %H:%M")
payload = {"updated_at": now, "source_count": len(set(x["source"] for x in out)), "items": out}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)
print("wrote", OUT, len(out), "items")
