---
name: just-scrape
description: "CLI tool for AI-powered web scraping, data extraction, search, and crawling via ScrapeGraph AI v2 API. Use when the user needs to scrape websites, extract structured data from URLs, convert pages to markdown, crawl multi-page sites, or search the web for information. Triggers on tasks involving: (1) extracting data from websites, (2) web scraping or crawling, (3) converting webpages to markdown, (4) AI-powered web search with extraction. The CLI is just-scrape (npm package just-scrape)."
---

# Web Scraping with just-scrape

AI-powered web scraping CLI by [ScrapeGraph AI](https://scrapegraphai.com). Get an API key at [dashboard.scrapegraphai.com](https://dashboard.scrapegraphai.com).

## Setup

Always install or run the `@latest` version to ensure you have the most recent features and fixes.

```bash
npm install -g just-scrape@latest           # npm
pnpm add -g just-scrape@latest              # pnpm
yarn global add just-scrape@latest          # yarn
bun add -g just-scrape@latest               # bun
npx just-scrape@latest --help               # run without installing
bunx just-scrape@latest --help              # run without installing (bun)
```

```bash
export SGAI_API_KEY="sgai-..."
```

API key resolution order: `SGAI_API_KEY` env var → `.env` file → `~/.scrapegraphai/config.json` → interactive prompt (saves to config).

## Command Selection

| Need | Command |
|---|---|
| Extract structured data from a known URL | `extract` |
| Search the web and extract from results | `search` |
| Scrape a page (markdown, html, screenshot, branding) | `scrape` |
| Convert a page to clean markdown | `markdownify` |
| Crawl multiple pages from a site | `crawl` |
| Check credit balance | `credits` |
| Browse past requests | `history` |

## Common Flags

All commands support `--json` for machine-readable output (suppresses banner, spinners, prompts).

Scraping commands share these optional flags:
- `--mode <mode>` / `-m <mode>` — fetch mode: `auto` (default), `fast`, `js`, `direct+stealth`, `js+stealth`
- `--headers <json>` — custom HTTP headers as JSON string
- `--schema <json>` — enforce output JSON schema
- `--country <iso>` — ISO country code for geo-targeting

## Commands

### Extract

Extract structured data from any URL using AI.

```bash
just-scrape extract <url> -p <prompt>
just-scrape extract <url> -p <prompt> --schema <json>
just-scrape extract <url> -p <prompt> --scrolls <n>     # infinite scroll (0-100)
just-scrape extract <url> -p <prompt> --mode js+stealth  # anti-bot bypass
just-scrape extract <url> -p <prompt> --cookies <json> --headers <json>
just-scrape extract <url> -p <prompt> --country <iso>    # geo-targeting
```

```bash
# E-commerce extraction
just-scrape extract https://store.example.com/shoes -p "Extract all product names, prices, and ratings"

# Strict schema + scrolling
just-scrape extract https://news.example.com -p "Get headlines and dates" \
  --schema '{"type":"object","properties":{"articles":{"type":"array","items":{"type":"object","properties":{"title":{"type":"string"},"date":{"type":"string"}}}}}}' \
  --scrolls 5

# JS-heavy SPA behind anti-bot
just-scrape extract https://app.example.com/dashboard -p "Extract user stats" \
  --mode js+stealth
```

### Search

Search the web and extract structured data from results.

```bash
just-scrape search <query>
just-scrape search <query> --num-results <n>     # sources to scrape (1-20, default 3)
just-scrape search <query> -p <prompt>           # extraction prompt
just-scrape search <query> --schema <json>
just-scrape search <query> --headers <json>
```

```bash
# Research across sources
just-scrape search "Best Python web frameworks in 2025" --num-results 10

# Structured output
just-scrape search "Top 5 cloud providers pricing" \
  --schema '{"type":"object","properties":{"providers":{"type":"array","items":{"type":"object","properties":{"name":{"type":"string"},"free_tier":{"type":"string"}}}}}}'
```

### Scrape

Scrape content from a URL in various formats.

```bash
just-scrape scrape <url>                         # markdown (default)
just-scrape scrape <url> -f html                 # raw HTML
just-scrape scrape <url> -f screenshot           # screenshot
just-scrape scrape <url> -f branding             # extract branding info
just-scrape scrape <url> -m direct+stealth       # anti-bot bypass
just-scrape scrape <url> --country <iso>         # geo-targeting
```

```bash
just-scrape scrape https://example.com
just-scrape scrape https://example.com -f html
just-scrape scrape https://store.example.com -m direct+stealth --country DE
just-scrape scrape https://example.com -f branding
```

### Markdownify

Convert any webpage to clean markdown (convenience wrapper for `scrape --format markdown`).

```bash
just-scrape markdownify <url>
just-scrape markdownify <url> -m direct+stealth
just-scrape markdownify <url> --headers <json>
```

```bash
just-scrape markdownify https://blog.example.com/my-article
just-scrape markdownify https://protected.example.com -m js+stealth
just-scrape markdownify https://docs.example.com/api --json | jq -r '.markdown' > api-docs.md
```

### Crawl

Crawl multiple pages. The CLI starts the crawl and polls until completion.

```bash
just-scrape crawl <url>
just-scrape crawl <url> --max-pages <n>              # default 50
just-scrape crawl <url> --max-depth <n>              # default 2
just-scrape crawl <url> --max-links-per-page <n>     # default 10
just-scrape crawl <url> --allow-external             # allow external domains
just-scrape crawl <url> -m direct+stealth            # anti-bot bypass
```

```bash
# Crawl docs site
just-scrape crawl https://docs.example.com --max-pages 20 --max-depth 3

# Crawl staying within domain
just-scrape crawl https://example.com --max-pages 50

# Get crawl results as JSON
just-scrape crawl https://example.com --json --max-pages 10
```

### History

Browse request history. Interactive by default (arrow keys to navigate, select to view details).

```bash
just-scrape history <service>                     # interactive browser
just-scrape history <service> <request-id>        # specific request
just-scrape history <service> --page <n>
just-scrape history <service> --page-size <n>     # default 20, max 100
just-scrape history <service> --json
```

Services: `scrape`, `extract`, `search`, `monitor`, `crawl`

```bash
just-scrape history extract
just-scrape history crawl --json --page-size 100 | jq '.[].status'
```

### Credits

```bash
just-scrape credits
just-scrape credits --json | jq '.remainingCredits'
```

## Common Patterns

### Pipe JSON for scripting

```bash
just-scrape extract https://example.com -p "Extract all links" --json | jq '.data'
```

### Protected sites

```bash
# JS-heavy SPA behind Cloudflare
just-scrape extract https://protected.example.com -p "Extract data" --mode js+stealth

# With custom cookies/headers
just-scrape extract https://example.com -p "Extract data" \
  --cookies '{"session":"abc123"}' --headers '{"Authorization":"Bearer token"}'
```

## Fetch Modes

| Mode | Description |
|---|---|
| `auto` | Automatic selection (default) |
| `fast` | Fastest, no JS rendering |
| `js` | Full JS rendering |
| `direct+stealth` | Direct fetch with anti-bot bypass |
| `js+stealth` | JS rendering with anti-bot bypass |

## Environment Variables

```bash
SGAI_API_KEY=sgai-...              # API key
SGAI_API_URL=...                   # Override API base URL (default: https://api.scrapegraphai.com)
SGAI_TIMEOUT_S=30                  # Request timeout in seconds (default 30)
```

Legacy variables (`JUST_SCRAPE_API_URL`, `JUST_SCRAPE_TIMEOUT_S`, `JUST_SCRAPE_DEBUG`) are still bridged.
