// DuckDuckGo search for Edge Runtime
// Uses DDG Instant Answer API (no auth required)

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export async function search(query: string, maxResults = 4): Promise<SearchResult[]> {
  try {
    const encoded = encodeURIComponent(query);
    const url = `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1&no_redirect=1`;
    const res = await fetch(url, { headers: { "User-Agent": "FeasiFlowAI/1.0" } });
    if (!res.ok) return [];
    const data = await res.json() as any;

    const results: SearchResult[] = [];

    // Abstract
    if (data.AbstractText) {
      results.push({ title: data.Heading || query, url: data.AbstractURL || "", snippet: data.AbstractText });
    }

    // Related topics
    if (Array.isArray(data.RelatedTopics)) {
      for (const t of data.RelatedTopics) {
        if (results.length >= maxResults) break;
        if (t.Text && t.FirstURL) {
          results.push({ title: t.Text.slice(0, 80), url: t.FirstURL, snippet: t.Text });
        }
        if (t.Topics) {
          for (const sub of t.Topics) {
            if (results.length >= maxResults) break;
            if (sub.Text && sub.FirstURL) {
              results.push({ title: sub.Text.slice(0, 80), url: sub.FirstURL, snippet: sub.Text });
            }
          }
        }
      }
    }

    // News results
    if (Array.isArray(data.News)) {
      for (const n of data.News) {
        if (results.length >= maxResults) break;
        results.push({ title: n.Title || "", url: n.URL || "", snippet: n.Excerpt || n.Title || "" });
      }
    }

    return results.slice(0, maxResults);
  } catch {
    return [];
  }
}

export function formatResults(results: SearchResult[]): string {
  if (!results.length) return "Tidak ada hasil pencarian yang tersedia.";
  return results
    .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.snippet}`)
    .join("\n\n");
}
