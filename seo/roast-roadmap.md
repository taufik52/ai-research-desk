# SEO Roast Roadmap: ai-research-desk-c60c1.web.app (2026-11-22)

Verdict: Google could crawl you, but every typo URL was a copy of your homepage — and no crawler could find a sitemap.

Note: this is a hackathon demo, not a money site. There is no pricing, no signup, and one page. "Revenue impact" below means discovery + judging impact: whether Google, Bing, and AI assistants can find, read, and recommend the demo at all.

| # | Tier | Issue | Impact | Fix | Owner | Status |
|---|---|---|---|---|---|---|
| 1 | FATAL | Catch-all Firebase rewrite (`**` → `/index.html`) made every URL return HTTP 200 with the homepage HTML — soft 404 on all typo/crawler-probed URLs | Every bad URL was an indexable duplicate of the homepage; sitemap/robots URLs served HTML | Removed the rewrite from `firebase.json` (the app has no client-side routes) | agent | shipped in PR |
| 2 | FATAL | No `robots.txt` — request returned SPA HTML with HTTP 200 | Crawlers got no crawl rules and no sitemap pointer | Added `public/robots.txt` (default-allow + `Sitemap:` line) | agent | shipped in PR |
| 3 | FATAL | No `sitemap.xml` — request returned SPA HTML with HTTP 200 | No URL inventory for any crawler to discover | Added `public/sitemap.xml` (homepage, weekly, 1.0) | agent | shipped in PR |
| 4 | REVENUE | No canonical, Open Graph, Twitter card, or JSON-LD anywhere on the page | Shares and AI answers had no structured facts; canonical missing on the only page | Added canonical + OG + Twitter card + `WebApplication` JSON-LD to `index.html` | agent | shipped in PR |
| 5 | REVENUE | No 404 page — unknown URLs rendered the app instead of an error | Users and crawlers could not tell a dead link from the real page | Added `public/404.html` (branded, `noindex`, self-contained styles) | agent | shipped in PR |
| 6 | COMPOUNDING | No `llms.txt` — AI assistants only see the one page, not what the demo does or how to run it | ChatGPT/Perplexity/Claude cannot describe the demo accurately | Add `public/llms.txt` with a plain-text summary + setup steps from README | agent | next |
| 7 | COMPOUNDING | Zero known inbound links; setup docs live only in the GitHub README, not on the site | Nothing vouches for the page; docs invisible to site crawlers | Link the live URL from the repo README, Devpost page, and video description; consider a short About section on the page | founder | next |
| 8 | COMPOUNDING | Indexation never verified (no Search Console access in this run) | Unknown whether Google has the page indexed at all | Verify in Search Console after deploy; submit the sitemap there | founder | next |

## What passed (no action)

- **AI-crawler readability:** GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, and Bingbot all get HTTP 200 with real text in the HTML (the page is server-rendered, not JS-only). No WAF/challenge blocks them.
- **Above the fold:** the tool itself is the first viewport — a visitor gets value (paste notes, summarize) in under 30 seconds with no account. No demo wall.
- **Locale:** single locale, no i18n sprawl, no hreflang needed.
- **SafeSearch/UGC:** no user-uploaded media, no user-generated pages.
- **Programmatic traps:** no dynamic routes, no thin pages, no contradictory counts (one page, one set of facts).
- **Title/meta:** title and description are present and descriptive.

## Fluff (ignore until rows above ship)

- No images, so no alt-text work. Heading order is clean (one H1, H2 sections).

## Verify (after deploy — NOT done in this PR)

Deploy is deliberately held: the site is under Firebase hackathon judging until 16 Dec 2026. After deploy, run:

- `curl -s https://ai-research-desk-c60c1.web.app/robots.txt` — must print the robots file, not HTML
- `curl -s https://ai-research-desk-c60c1.web.app/sitemap.xml` — must print XML, not HTML
- `curl -s -o /dev/null -w '%{http_code}\n' https://ai-research-desk-c60c1.web.app/no-such-page-xyz` — must print 404
- `curl -s -A Bingbot https://ai-research-desk-c60c1.web.app/robots.txt` — must print the robots file
- Submit the sitemap in Search Console and confirm the homepage is indexed

Local build verification (done in this PR): `npm run build` passes, `dist/` contains `robots.txt`, `sitemap.xml`, `404.html`, and the built `index.html` carries the canonical/OG/JSON-LD tags. Repo tests (`npm test`) pass.
