import time
import requests
from typing import List, Dict
from bs4 import BeautifulSoup
from duckduckgo_search import DDGS


def search_duckduckgo(query: str, max_results: int = 5) -> List[Dict]:
    """Search DuckDuckGo and return list of results."""
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
        return [
            {
                "title": r.get("title", ""),
                "url": r.get("href", ""),
                "snippet": r.get("body", "")[:500],
            }
            for r in results
        ]
    except Exception as e:
        return [{"error": str(e), "query": query, "title": "", "url": "", "snippet": ""}]


def search_news(query: str, max_results: int = 3) -> List[Dict]:
    """Search DuckDuckGo News for recent articles."""
    try:
        with DDGS() as ddgs:
            results = list(ddgs.news(query, max_results=max_results))
        return results
    except Exception:
        return []


def scrape_page(url: str, max_chars: int = 2000) -> str:
    """Scrape text content from a web page."""
    try:
        headers = {"User-Agent": "Mozilla/5.0 (FeasiFlow research bot)"}
        response = requests.get(url, timeout=10, headers=headers)
        soup = BeautifulSoup(response.text, "html.parser")
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()
        text = soup.get_text(separator=" ", strip=True)
        return text[:max_chars]
    except Exception as e:
        return f"[Scraping error: {e}]"


def format_search_results(results: List[Dict]) -> str:
    """Format search results into a readable string for LLM prompts."""
    parts = []
    for i, r in enumerate(results, 1):
        if r.get("error"):
            continue
        parts.append(
            f"[Sumber {i}]\n"
            f"Judul: {r.get('title', 'N/A')}\n"
            f"URL: {r.get('url', 'N/A')}\n"
            f"Konten: {r.get('snippet', '')[:300]}\n"
        )
    return "\n".join(parts) if parts else "Tidak ada data dari pencarian web."


def safe_search(query: str, max_results: int = 5, delay: float = 1.0) -> List[Dict]:
    """Search with rate-limit protection and delay."""
    time.sleep(delay)
    return search_duckduckgo(query, max_results)
