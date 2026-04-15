# just-scrape

Made with love by the [ScrapeGraphAI team](https://scrapegraphai.com) 💜


![Demo Video](/assets/demo.gif)

Command-line interface for [ScrapeGraph AI](https://scrapegraphai.com) — AI-powered web scraping, data extraction, search, crawling, and page-change monitoring.

> **v1.0.0 — SDK v2 migration.** This release migrates the CLI to the [scrapegraph-js v2 SDK](https://github.com/ScrapeGraphAI/scrapegraph-js/pull/13). The v1 endpoints (`smart-scraper`, `search-scraper`, `markdownify`, `sitemap`, `agentic-scraper`, `generate-schema`) have been removed. Use `scrape --format …` for multi-format output, `extract` for structured data, and the new `monitor` command for page-change tracking.

## Project Structure

```
just-scrape/
├── src/
│   ├── cli.ts                       # Entry point, citty main command + subcommands
│   ├── lib/
│   │   ├── env.ts                   # Env config (API key, JUST_SCRAPE_* → SGAI_* bridge)
│   │   ├── folders.ts               # API key resolution + interactive prompt
│   │   └── log.ts                   # Logger factory + syntax-highlighted JSON output
│   ├── commands/
│   │   ├── scrape.ts                # scrape — multi-format (markdown/html/screenshot/json/…)
│   │   ├── extract.ts               # extract — structured extraction with prompt + schema
│   │   ├── search.ts                # search — web search + extraction
│   │   ├── crawl.ts                 # crawl — multi-page crawling (polls until done)
│   │   ├── monitor.ts               # monitor — create/list/get/update/delete/pause/resume/activity
│   │   ├── history.ts               # history — paginated browser for past requests
│   │   ├── credits.ts               # credits — balance + job quotas
│   │   └── validate.ts              # validate — API key health check
│   └── utils/
│       └── banner.ts                # ASCII banner + version from package.json
├── dist/                            # Build output (git-ignored)
│   └── cli.mjs                      # Bundled ESM with shebang
├── tests/
│   └── smoke.test.ts                # SDK export smoke test
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── biome.json
└── .gitignore
```

## Installation

```bash
npm install -g just-scrape           # npm (recommended)
pnpm add -g just-scrape              # pnpm
yarn global add just-scrape          # yarn
bun add -g just-scrape               # bun
npx just-scrape --help               # or run without installing
bunx just-scrape --help              # bun equivalent
```

Package: [just-scrape](https://www.npmjs.com/package/just-scrape) on npm.

## Coding Agent Skill

You can use just-scrape as a skill for AI coding agents via [Vercel's skills.sh](https://skills.sh) with this tutorial.

Or you can manually install it:
```bash
bunx skills add https://github.com/ScrapeGraphAI/just-scrape
```

Browse the skill: [skills.sh/scrapegraphai/just-scrape/just-scrape](https://skills.sh/scrapegraphai/just-scrape/just-scrape)

## Configuration

The CLI needs a ScrapeGraph API key. Get one at [dashboard.scrapegraphai.com](https://dashboard.scrapegraphai.com).

Four ways to provide it (checked in order):

1. **Environment variable**: `export SGAI_API_KEY="sgai-..."`
2. **`.env` file**: `SGAI_API_KEY=sgai-...` in project root
3. **Config file**: `~/.scrapegraphai/config.json`
4. **Interactive prompt**: the CLI asks and saves to config

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `SGAI_API_KEY` | ScrapeGraph API key | — |
| `SGAI_API_URL` | Override API base URL (also `JUST_SCRAPE_API_URL`) | `https://api.scrapegraphai.com/api/v2` |
| `SGAI_TIMEOUT` | Request timeout in seconds (also legacy `SGAI_TIMEOUT_S` / `JUST_SCRAPE_TIMEOUT_S`) | `120` |
| `SGAI_DEBUG` | Set to `1` to enable debug logging to stderr (also `JUST_SCRAPE_DEBUG`) | `0` |

## JSON Mode (`--json`)

All commands support `--json` for machine-readable output. When set, banner, spinners, and interactive prompts are suppressed — only minified JSON on stdout (saves tokens when piped to AI agents).

```bash
just-scrape credits --json | jq '.remaining'
just-scrape scrape https://example.com --json > result.json
just-scrape history scrape --json | jq '.[].id'
```

---

## Scrape

Multi-format scraping from a URL. Supports `markdown`, `html`, `screenshot`, `branding`, `links`, `images`, `summary`, `json` — comma-separated for multi-format output. [docs](https://docs.scrapegraphai.com/api-reference/scrape)

### Usage

```bash
just-scrape scrape <url>                                   # markdown (default)
just-scrape scrape <url> -f html                           # raw HTML
just-scrape scrape <url> -f markdown,screenshot,links      # multi-format
just-scrape scrape <url> -f json -p "<prompt>"             # AI extraction
just-scrape scrape <url> -f json -p "..." --schema '<json>'# enforce schema
just-scrape scrape <url> --html-mode reader                # readable-view cleanup
just-scrape scrape <url> -m js --stealth                   # JS rendering + anti-bot
just-scrape scrape <url> --country us --scrolls 3          # geo + infinite scroll
```

### Examples

```bash
# Replace legacy markdownify
just-scrape scrape https://blog.example.com/post

# Replace legacy smart-scraper (AI extraction)
just-scrape scrape https://store.example.com -f json \
  -p "Extract product name, price, and rating"

# Multi-format: markdown + screenshot in one request
just-scrape scrape https://example.com -f markdown,screenshot

# Structured extraction with schema
just-scrape scrape https://news.example.com -f json \
  -p "All articles" \
  --schema '{"type":"object","properties":{"articles":{"type":"array","items":{"type":"object","properties":{"title":{"type":"string"},"date":{"type":"string"}}}}}}'
```

## Extract

Structured data extraction from a URL using a prompt (and optional schema). [docs](https://docs.scrapegraphai.com/api-reference/extract)

### Usage

```bash
just-scrape extract <url> -p <prompt>                      # AI extraction
just-scrape extract <url> -p <prompt> --schema <json>      # enforce schema
just-scrape extract <url> -p <prompt> --html-mode reader   # content-only mode
just-scrape extract <url> -p <prompt> --stealth --scrolls 5
just-scrape extract <url> -p <prompt> --cookies <json> --headers <json>
```

### Examples

```bash
# Extract product data
just-scrape extract https://store.example.com/shoes \
  -p "Extract all product names, prices, and ratings"

# Behind a login (pass cookies)
just-scrape extract https://app.example.com/dashboard \
  -p "Extract user stats" \
  --cookies '{"session":"abc123"}'
```

## Search

Web search + AI extraction across multiple result pages. [docs](https://docs.scrapegraphai.com/api-reference/search)

### Usage

```bash
just-scrape search "<query>"                               # default 3 results, markdown
just-scrape search "<query>" --num-results 10              # 1-20 results
just-scrape search "<query>" -p "<extract prompt>"         # extract across results
just-scrape search "<query>" -p "..." --schema <json>      # structured output
just-scrape search "<query>" --country us --time-range past_week
just-scrape search "<query>" --format html                 # raw HTML per result
```

### Examples

```bash
# Research a topic across multiple sources
just-scrape search "best Python web frameworks 2025" --num-results 10

# Structured comparison
just-scrape search "Top 5 cloud providers pricing" \
  -p "Extract provider name, free tier, and starting price" \
  --schema '{"type":"object","properties":{"providers":{"type":"array","items":{"type":"object","properties":{"name":{"type":"string"},"free_tier":{"type":"string"},"price":{"type":"string"}}}}}}'
```

## Crawl

Multi-page crawl starting from a URL. Polls until the job reaches a terminal state. [docs](https://docs.scrapegraphai.com/api-reference/crawl)

### Usage

```bash
just-scrape crawl <url>                                    # markdown, defaults (50 pages, depth 2)
just-scrape crawl <url> -f markdown,links                  # multi-format per page
just-scrape crawl <url> --max-pages 200 --max-depth 4
just-scrape crawl <url> --max-links-per-page 25
just-scrape crawl <url> --allow-external                   # follow cross-domain links
just-scrape crawl <url> --include-patterns '["/blog/.*"]' --exclude-patterns '["/tag/.*"]'
just-scrape crawl <url> -m js --stealth
```

### Examples

```bash
# Crawl a docs site and collect all markdown
just-scrape crawl https://docs.example.com --max-pages 100

# Only crawl blog posts
just-scrape crawl https://example.com \
  --include-patterns '["/blog/.*"]' --max-pages 50
```

## Monitor

Create and manage page-change monitors. Each monitor re-scrapes a URL on a schedule and diffs the result against the previous tick. [docs](https://docs.scrapegraphai.com/api-reference/monitor)

### Actions

```bash
just-scrape monitor create --url <url> --interval <cron> [-f <formats>] [--webhook-url <url>]
just-scrape monitor list                                   # all monitors
just-scrape monitor get --id <cronId>
just-scrape monitor update --id <cronId> [--interval ...] [--name ...] [-f <formats>] [--webhook-url ...]
just-scrape monitor delete --id <cronId>
just-scrape monitor pause --id <cronId>
just-scrape monitor resume --id <cronId>
just-scrape monitor activity --id <cronId> [--limit <n>] [--cursor <c>]
```

### Examples

```bash
# Monitor a price page hourly, webhook on change
just-scrape monitor create \
  --url https://store.example.com/product/42 \
  --interval "0 * * * *" \
  -f markdown,screenshot \
  --webhook-url https://hooks.example.com/price-change

# List active monitors
just-scrape monitor list

# Pause a monitor temporarily
just-scrape monitor pause --id <cronId>

# Paginate tick history
just-scrape monitor activity --id <cronId> --limit 20
```

## History

Browse request history across all services. Interactive by default — arrow keys to navigate, select to view details, "Load more" for pagination. [docs](https://docs.scrapegraphai.com/api-reference/history)

### Usage

```bash
just-scrape history                                        # all services, interactive
just-scrape history <service>                              # scrape | extract | search | monitor | crawl
just-scrape history <service> <request-id>                 # fetch specific request
just-scrape history <service> --page <n> --page-size <n>
just-scrape history <service> --json                       # raw JSON (pipeable)
```

### Examples

```bash
# Browse scrape history interactively
just-scrape history scrape

# Fetch a specific request by id
just-scrape history scrape 550e8400-e29b-41d4-a716-446655440000

# Export crawl history
just-scrape history crawl --json --page-size 100 | jq '.[].id'
```

## Credits

Check your credit balance and per-job quotas (crawl, monitor).

```bash
just-scrape credits
just-scrape credits --json | jq '.remaining'
just-scrape credits --json | jq '.jobs.monitor'
```

## Validate

Validate your API key (calls the SDK's `checkHealth` / `/health` endpoint).

```bash
just-scrape validate
```

---

## Migration from v0.x (v1 API) to v1.0 (v2 API)

The v2 API consolidates and renames endpoints. The CLI now reflects that:

| v0.x command | v1.0 equivalent |
|---|---|
| `smart-scraper <url> -p "..."` | `scrape <url> -f json -p "..."` (or `extract <url> -p "..."`) |
| `markdownify <url>` | `scrape <url>` (markdown is the default format) |
| `search-scraper "..."` | `search "..."` (query now positional, `-p` for extraction) |
| `scrape <url>` (raw HTML) | `scrape <url> -f html` |
| `crawl <url> -p "..."` | `crawl <url> -f markdown` (crawl no longer runs AI extraction; run `extract`/`scrape` on the pages) |
| `sitemap <url>` | Removed (fetch sitemap XML directly, or use `crawl` with `--include-patterns`) |
| `agentic-scraper` | Removed |
| `generate-schema` | Removed |

`credits` and `validate` work the same; response shapes changed (see SDK v2 types).

---

## Contributing

### From Source

Requires [Bun](https://bun.sh) and Node.js 22+.

```bash
git clone https://github.com/ScrapeGraphAI/just-scrape.git
cd just-scrape
bun install
bun run dev --help
```

### Tech Stack

| Concern | Tool |
|---|---|
| Language | **TypeScript 5.8** |
| Dev Runtime | **Bun** |
| Build | **tsup** (esbuild) |
| CLI Framework | **citty** (unjs) |
| Prompts | **@clack/prompts** |
| Styling | **chalk** v5 (ESM) |
| SDK | **scrapegraph-js** v2 |
| Env | **dotenv** |
| Lint / Format | **Biome** |
| Target | **Node.js 22+**, ESM-only |

### Scripts

```bash
bun run dev                          # Run CLI from TS source
bun run build                        # Bundle ESM to dist/cli.mjs
bun run lint                         # Lint + format check
bun run format                       # Auto-format
bun run check                        # Type-check + lint
bun test                             # Run unit tests
```

## License

ISC

---

Made with love by the [ScrapeGraphAI team](https://scrapegraphai.com) 💜
