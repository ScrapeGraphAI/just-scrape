---
name: just-scrape
description: "CLI tool for AI-powered web scraping, data extraction, search, crawling, and page-change monitoring via ScrapeGraph AI (SDK v2). Use when the user needs to scrape webpages into one or more formats (markdown, html, screenshot, links, images, summary, branding, structured json), extract structured data from a URL with AI, search the web with optional AI extraction, crawl multi-page sites, monitor pages for changes on a schedule, or browse request history. The CLI is just-scrape (npm package just-scrape)."
---

# Web Scraping with just-scrape

AI-powered web scraping CLI by [ScrapeGraph AI](https://scrapegraphai.com). Get an API key at [dashboard.scrapegraphai.com](https://dashboard.scrapegraphai.com).

> **v1.0+ uses the scrapegraph-js v2 SDK.** The legacy commands `smart-scraper`, `search-scraper`, `markdownify`, `sitemap`, `agentic-scraper`, and `generate-schema` have been removed. Use `scrape --format ...` for multi-format output, `extract` for structured data, and `monitor` for page-change tracking.

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
| Convert a page to markdown / HTML / screenshot / links / images / summary / branding | `scrape` |
| Extract structured JSON from a known URL with AI | `extract` (or `scrape --format json -p ...`) |
| Search the web (optionally extract from results) | `search` |
| Crawl multiple pages from a site | `crawl` |
| Watch a page for changes on a schedule (cron / webhook) | `monitor` |
| Browse past requests | `history` |
| Check credit balance | `credits` |
| Validate API key / health check | `validate` |

## Common Flags

All commands support `--json` for machine-readable output (suppresses banner, spinners, prompts).

Most scraping commands share these optional flags:
- `--stealth` — bypass anti-bot detection
- `--mode <auto|fast|js>` (`-m`) — fetch mode (`js` for JS-heavy SPAs)
- `--scrolls <n>` — infinite-scroll passes (0–100, where supported)
- `--country <iso>` — geo-target by ISO country code
- `--headers <json>` / `--cookies <json>` — custom HTTP headers / cookies (where supported)
- `--schema <json>` — enforce output JSON schema (for AI-extraction commands / `--format json`)
- `--html-mode <normal|reader|prune>` — HTML/markdown extraction mode

## Output Formats (for `scrape` / `crawl` / `monitor`)

`--format` (`-f`) accepts one or a comma-separated list:

`markdown`, `html`, `screenshot`, `branding`, `links`, `images`, `summary`, and (for `scrape` only) `json`.

Default: `markdown`.

## Commands

### Scrape

Fetch a URL and return one or more formats.

```bash
just-scrape scrape <url>                                 # markdown (default)
just-scrape scrape <url> -f html
just-scrape scrape <url> -f markdown,links,images
just-scrape scrape <url> -f screenshot
just-scrape scrape <url> -f branding                     # logos, colors, fonts
just-scrape scrape <url> -f summary
just-scrape scrape <url> -f json -p "Extract all products"
just-scrape scrape <url> -f json -p <prompt> --schema <json>
just-scrape scrape <url> --html-mode reader              # cleaner article extraction
just-scrape scrape <url> --mode js --stealth --scrolls 5
just-scrape scrape <url> --country DE
```

```bash
# Page → markdown
just-scrape scrape https://blog.example.com/article

# Multi-format in one call
just-scrape scrape https://example.com -f markdown,html,links --json > page.json

# Structured JSON via scrape (no separate extract call)
just-scrape scrape https://store.example.com -f json \
  -p "Extract all product names and prices" \
  --schema '{"type":"object","properties":{"products":{"type":"array","items":{"type":"object","properties":{"name":{"type":"string"},"price":{"type":"number"}}}}}}'

# JS-heavy SPA behind anti-bot
just-scrape scrape https://app.example.com/dashboard --mode js --stealth
```

### Extract

Extract structured data from a URL using AI. Equivalent to `scrape -f json` but with a dedicated endpoint optimized for extraction.

```bash
just-scrape extract <url> -p <prompt>
just-scrape extract <url> -p <prompt> --schema <json>
just-scrape extract <url> -p <prompt> --scrolls <n>             # 0-100
just-scrape extract <url> -p <prompt> --stealth --mode js
just-scrape extract <url> -p <prompt> --cookies <json> --headers <json>
just-scrape extract <url> -p <prompt> --html-mode reader
just-scrape extract <url> -p <prompt> --country <iso>
```

```bash
# E-commerce
just-scrape extract https://store.example.com/shoes \
  -p "Extract all product names, prices, and ratings"

# Strict schema + scrolling
just-scrape extract https://news.example.com -p "Get headlines and dates" \
  --schema '{"type":"object","properties":{"articles":{"type":"array","items":{"type":"object","properties":{"title":{"type":"string"},"date":{"type":"string"}}}}}}' \
  --scrolls 5

# Authenticated request via cookies
just-scrape extract https://app.example.com/dashboard -p "Extract user stats" \
  --cookies '{"session":"abc123"}' --stealth
```

### Search

Search the web; optionally extract structured data from the results.

```bash
just-scrape search <query>                                  # markdown by default
just-scrape search <query> --num-results <n>                # 1-20, default 3
just-scrape search <query> -p <prompt>                      # AI extraction over results
just-scrape search <query> -p <prompt> --schema <json>
just-scrape search <query> --format html                    # markdown (default) or html
just-scrape search <query> --country us                     # 2-letter geo code
just-scrape search <query> --time-range past_week           # past_hour | past_24_hours | past_week | past_month | past_year
just-scrape search <query> --stealth --headers <json>
```

```bash
# Plain web search, top 10 results
just-scrape search "Best Python web frameworks in 2026" --num-results 10

# Search + structured extraction
just-scrape search "Top 5 cloud providers pricing" \
  -p "Extract provider name and free-tier details" \
  --schema '{"type":"object","properties":{"providers":{"type":"array","items":{"type":"object","properties":{"name":{"type":"string"},"free_tier":{"type":"string"}}}}}}'

# Recent news only
just-scrape search "AI regulation EU" --time-range past_week --country eu
```

### Crawl

Crawl pages starting from a URL. Returns a job that's polled until completion.

```bash
just-scrape crawl <url>
just-scrape crawl <url> -f markdown,links
just-scrape crawl <url> --max-pages <n>            # default 50, max 1000
just-scrape crawl <url> --max-depth <n>            # default 2
just-scrape crawl <url> --max-links-per-page <n>   # default 10
just-scrape crawl <url> --allow-external           # follow off-domain links
just-scrape crawl <url> --include-patterns <json>  # JSON array of regex strings
just-scrape crawl <url> --exclude-patterns <json>
just-scrape crawl <url> --mode js --stealth
```

```bash
# Crawl docs site to depth 3, get markdown
just-scrape crawl https://docs.example.com --max-pages 50 --max-depth 3

# Same-domain crawl, blog only
just-scrape crawl https://example.com \
  --include-patterns '["^https://example\\.com/blog/.*"]' \
  --exclude-patterns '[".*\\.pdf$"]' \
  --max-pages 100

# Multi-format per page
just-scrape crawl https://example.com -f markdown,links,images --max-pages 20
```

### Monitor

Schedule a page to be re-scraped on a cron interval and (optionally) post diffs to a webhook.

Actions: `create`, `list`, `get`, `update`, `delete`, `pause`, `resume`, `activity`.

```bash
just-scrape monitor create --url <url> --interval <cron|shorthand> [--name <name>] [-f <formats>] [--webhook-url <url>] [--mode js] [--stealth]
just-scrape monitor list
just-scrape monitor get      --id <cronId>
just-scrape monitor update   --id <cronId> [--name ...] [--interval ...] [-f ...] [--webhook-url ...]
just-scrape monitor pause    --id <cronId>
just-scrape monitor resume   --id <cronId>
just-scrape monitor delete   --id <cronId>
just-scrape monitor activity --id <cronId> [--limit <n>] [--cursor <token>]    # max 100/page
```

`--interval` accepts a cron expression (`0 * * * *`) or a shorthand (`1h`, `30m`, `1d`).

```bash
# Watch a pricing page hourly, alert via webhook
just-scrape monitor create \
  --url https://store.example.com/pricing \
  --interval 1h \
  --name "Pricing tracker" \
  -f markdown \
  --webhook-url https://hooks.example.com/pricing

# Inspect recent ticks
just-scrape monitor activity --id mon_abc123 --limit 50 --json | jq '.ticks[]'

# Pause / resume / delete
just-scrape monitor pause  --id mon_abc123
just-scrape monitor resume --id mon_abc123
just-scrape monitor delete --id mon_abc123
```

### History

Browse request history. Interactive by default (arrow keys to navigate, select to view details). Pass an ID after the service to view a specific request.

```bash
just-scrape history                                    # all services, interactive
just-scrape history <service>                          # filter by service
just-scrape history <service> <request-id>             # specific request
just-scrape history <service> --page <n>
just-scrape history <service> --page-size <n>          # default 20, max 100
just-scrape history <service> --json
```

Services: `scrape`, `extract`, `search`, `crawl`, `monitor`.

```bash
just-scrape history extract
just-scrape history crawl --json --page-size 100 | jq '.[] | {id, status}'
just-scrape history scrape req_abc123 --json
```

### Credits & Validate

```bash
just-scrape credits
just-scrape credits --json | jq '.remaining'
just-scrape validate                                    # health check + key validation
```

## Common Patterns

### Pipe JSON for scripting

```bash
# Crawl, then re-extract structured data per page
just-scrape crawl https://example.com -f links --max-pages 20 --json \
  | jq -r '.pages[].url' \
  | while read url; do
      just-scrape extract "$url" -p "Extract title and author" --json >> results.jsonl
    done
```

### Multi-format snapshot

```bash
just-scrape scrape https://example.com \
  -f markdown,html,screenshot,links,images,branding \
  --json > snapshot.json
```

### Authenticated / protected sites

```bash
# Session cookie + custom headers
just-scrape extract https://app.example.com -p "Extract data" \
  --cookies '{"session":"abc123"}' \
  --headers '{"Authorization":"Bearer token"}' \
  --stealth

# JS-heavy SPA
just-scrape scrape https://protected.example.com --mode js --stealth
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `SGAI_API_KEY` | ScrapeGraph API key | — |
| `SGAI_API_URL` | Override API base URL | `https://v2-api.scrapegraphai.com` |
| `SGAI_TIMEOUT` | Request timeout (seconds) | `120` |
| `SGAI_DEBUG` | Debug logging to stderr (`1` to enable) | `0` |

Legacy aliases (still bridged for back-compat): `JUST_SCRAPE_API_URL` → `SGAI_API_URL`, `JUST_SCRAPE_TIMEOUT_S` / `SGAI_TIMEOUT_S` → `SGAI_TIMEOUT`, `JUST_SCRAPE_DEBUG` → `SGAI_DEBUG`.
