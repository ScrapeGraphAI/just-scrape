# just-scrape

Made with love by the [ScrapeGraphAI team](https://scrapegraphai.com) 💜


![Demo Video](/assets/demo.gif)

Command-line interface for [ScrapeGraph AI](https://scrapegraphai.com) — AI-powered web scraping, data extraction, search, crawling, and monitoring. Uses the **v2 API**.

## Project Structure

```
just-scrape/
├── src/
│   ├── cli.ts                       # Entry point, citty main command + subcommands
│   ├── lib/
│   │   ├── client.ts                # API key resolver
│   │   ├── env.ts                   # Env config (API key, JUST_SCRAPE_* → SGAI_* bridge)
│   │   ├── folders.ts               # API key resolution + interactive prompt
│   │   └── log.ts                   # Logger factory + syntax-highlighted JSON output
│   ├── commands/
│   │   ├── extract.ts
│   │   ├── search.ts
│   │   ├── scrape.ts
│   │   ├── markdownify.ts
│   │   ├── crawl.ts
│   │   ├── monitor.ts
│   │   ├── history.ts
│   │   └── credits.ts
│   └── utils/
│       └── banner.ts                # ASCII banner + version from package.json
├── dist/                            # Build output (git-ignored)
│   └── cli.mjs                      # Bundled ESM with shebang
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
yarn global add just-scrape           # yarn
bun add -g just-scrape               # bun
npx just-scrape --help               # or run without installing
bunx just-scrape --help              # bun equivalent
```

Package: [just-scrape](https://www.npmjs.com/package/just-scrape) on npm.

## Coding Agent Skill

You can use just-scrape as a skill for AI coding agents via [Vercel's skills.sh](https://skills.sh) with tis tutorial.

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
| `SGAI_API_URL` | Override API base URL | `https://api.scrapegraphai.com/api/v2` |
| `SGAI_TIMEOUT` | Request timeout in seconds | `120` |
| `SGAI_DEBUG` | Set to `1` to log requests/responses | — |

Legacy variables are still bridged transparently: `JUST_SCRAPE_API_URL` → `SGAI_API_URL`, `JUST_SCRAPE_TIMEOUT_S` / `SGAI_TIMEOUT_S` → `SGAI_TIMEOUT`, `JUST_SCRAPE_DEBUG` → `SGAI_DEBUG`.

## JSON Mode (`--json`)

All commands support `--json` for machine-readable output. When set, banner, spinners, and interactive prompts are suppressed — only minified JSON on stdout (saves tokens when piped to AI agents).

```bash
just-scrape credits --json | jq '.remaining'
just-scrape extract https://example.com -p "Extract data" --json > result.json
just-scrape history scrape --json | jq '.[].status'
```

---

## Extract

Extract structured data from any URL using AI. [docs](https://docs.scrapegraphai.com/api-reference/extract)

### Usage

```bash
just-scrape extract <url> -p <prompt>                # Extract data with AI
just-scrape extract <url> -p <prompt> --schema <json> # Enforce output schema
just-scrape extract <url> -p <prompt> --mode <mode>   # HTML mode: normal, reader, prune
just-scrape extract <url> -p <prompt> --scrolls <n>   # Infinite scroll (0-100)
just-scrape extract <url> -p <prompt> --mode js --stealth    # Anti-bot bypass
just-scrape extract <url> -p <prompt> --cookies <json> --headers <json>
just-scrape extract <url> -p <prompt> --country <iso> # Geo-targeting
```

### Examples

```bash
# Extract product listings from an e-commerce page
just-scrape extract https://store.example.com/shoes -p "Extract all product names, prices, and ratings"

# Extract with a strict schema, scrolling to load more content
just-scrape extract https://news.example.com -p "Get all article headlines and dates" \
  --schema '{"type":"object","properties":{"articles":{"type":"array","items":{"type":"object","properties":{"title":{"type":"string"},"date":{"type":"string"}}}}}}' \
  --scrolls 5

# Scrape a JS-heavy SPA with stealth mode
just-scrape extract https://app.example.com/dashboard -p "Extract user stats" \
  --stealth
```

## Search

Search the web and extract structured data from results. [docs](https://docs.scrapegraphai.com/api-reference/search)

### Usage

```bash
just-scrape search <query>                                    # AI-powered web search
just-scrape search <query> --num-results <n>                  # Sources to scrape (1-20, default 3)
just-scrape search <query> -p <prompt>                        # Extraction prompt for results
just-scrape search <query> --schema <json>                    # Enforce output schema (requires -p)
just-scrape search <query> --country <code>                   # Geo-target search (e.g. 'us', 'de', 'jp')
just-scrape search <query> --time-range <range>               # past_hour | past_24_hours | past_week | past_month | past_year
just-scrape search <query> --format <markdown|html>           # Result format (default markdown)
just-scrape search <query> --headers <json>
```

### Examples

```bash
# Research a topic across multiple sources
just-scrape search "What are the best Python web frameworks in 2025?" --num-results 10

# Recent news only, scoped to Germany
just-scrape search "EU AI act latest news" --time-range past_week --country de

# Structured output with schema
just-scrape search "Top 5 cloud providers pricing" \
  -p "Extract provider name and free tier details" \
  --schema '{"type":"object","properties":{"providers":{"type":"array","items":{"type":"object","properties":{"name":{"type":"string"},"free_tier":{"type":"string"}}}}}}'
```

## Scrape

Scrape content from a URL in one or more formats. The v2 API supports **8 formats**: `markdown`, `html`, `screenshot`, `branding`, `links`, `images`, `summary`, `json`. [docs](https://docs.scrapegraphai.com/api-reference/scrape)

### Usage

```bash
just-scrape scrape <url>                                  # Markdown (default)
just-scrape scrape <url> -f html                          # Raw HTML
just-scrape scrape <url> -f screenshot                    # Page screenshot
just-scrape scrape <url> -f branding                      # Branding (logos, colors, fonts)
just-scrape scrape <url> -f links                         # Extracted links
just-scrape scrape <url> -f images                        # Extracted images
just-scrape scrape <url> -f summary                       # AI-generated page summary
just-scrape scrape <url> -f json -p <prompt>              # Structured JSON via prompt
just-scrape scrape <url> -f markdown,links,images         # Multi-format (comma-separated)
just-scrape scrape <url> --html-mode reader               # normal (default), reader, or prune
just-scrape scrape <url> --scrolls <n>                    # Infinite scroll (0-100)
just-scrape scrape <url> -m js --stealth                # Anti-bot bypass
just-scrape scrape <url> --country <iso>                  # Geo-targeting
```

### Examples

```bash
# Markdown of a page
just-scrape scrape https://example.com

# Raw HTML with reader-mode extraction
just-scrape scrape https://blog.example.com -f html --html-mode reader

# Multi-format: markdown + links + images in a single call
just-scrape scrape https://example.com -f markdown,links,images

# Structured JSON output with a prompt
just-scrape scrape https://store.example.com -f json -p "Extract product name and price"

# Scrape with stealth mode and geo-targeting
just-scrape scrape https://store.example.com --stealth --country DE
```

## Markdownify

Convert any webpage to clean markdown (convenience wrapper for `scrape --format markdown`). [docs](https://docs.scrapegraphai.com/api-reference/scrape)

### Usage

```bash
just-scrape markdownify <url>                          # Convert to markdown
just-scrape markdownify <url> -m js --stealth        # Anti-bot bypass
just-scrape markdownify <url> --headers <json>         # Custom headers
```

### Examples

```bash
# Convert a blog post to markdown
just-scrape markdownify https://blog.example.com/my-article

# Convert a JS-rendered page behind Cloudflare
just-scrape markdownify https://protected.example.com -m js --stealth

# Pipe markdown to a file
just-scrape markdownify https://docs.example.com/api --json | jq -r '.results.markdown.data[0]' > api-docs.md
```

## Crawl

Crawl multiple pages. The CLI starts the crawl and polls until completion. Supports the same format options as scrape. [docs](https://docs.scrapegraphai.com/api-reference/crawl)

### Usage

```bash
just-scrape crawl <url>                                # Crawl with defaults
just-scrape crawl <url> --max-pages <n>                # Max pages (default 50)
just-scrape crawl <url> --max-depth <n>                # Crawl depth (default 2)
just-scrape crawl <url> --max-links-per-page <n>       # Links per page (default 10)
just-scrape crawl <url> --allow-external               # Allow external domains
just-scrape crawl <url> -f html                        # Page format (default markdown)
just-scrape crawl <url> -f markdown,links              # Multi-format (comma-separated)
just-scrape crawl <url> -m js --stealth              # Anti-bot bypass
```

### Examples

```bash
# Crawl a docs site
just-scrape crawl https://docs.example.com --max-pages 20 --max-depth 3

# Crawl staying within domain
just-scrape crawl https://example.com --max-pages 50

# Get crawl results as JSON
just-scrape crawl https://example.com --json --max-pages 10
```

## Monitor

Create and manage page-change monitors. Monitors periodically scrape a URL and detect changes. [docs](https://docs.scrapegraphai.com/api-reference/monitor)

### Usage

```bash
just-scrape monitor create --url <url> --interval <interval>   # Create a monitor
just-scrape monitor create --url <url> --interval 1h --name "My Monitor"
just-scrape monitor create --url <url> --interval 30m --webhook-url <url>
just-scrape monitor create --url <url> --interval 1d -f markdown,screenshot
just-scrape monitor list                                       # List all monitors
just-scrape monitor get --id <id>                              # Get monitor details
just-scrape monitor update --id <id> --interval 2h             # Update interval
just-scrape monitor pause --id <id>                            # Pause a monitor
just-scrape monitor resume --id <id>                           # Resume a paused monitor
just-scrape monitor delete --id <id>                           # Delete a monitor
just-scrape monitor activity --id <id>                         # Paginated tick history
just-scrape monitor activity --id <id> --limit 50              # Ticks per page (max 100)
just-scrape monitor activity --id <id> --cursor <cursor>       # Paginate with a cursor
```

### Examples

```bash
# Monitor a pricing page every hour
just-scrape monitor create --url https://store.example.com/pricing --interval 1h

# Monitor with webhook notification
just-scrape monitor create --url https://example.com \
  --interval 30m --webhook-url https://hooks.example.com/notify

# Monitor markdown + screenshot changes daily
just-scrape monitor create --url https://example.com \
  --interval 1d -f markdown,screenshot --name "Daily check"

# List all monitors
just-scrape monitor list

# Pause and resume
just-scrape monitor pause --id abc123
just-scrape monitor resume --id abc123

# Inspect recent ticks (checks the monitor performed) with their diffs
just-scrape monitor activity --id abc123 --limit 20
just-scrape monitor activity --id abc123 --json | jq '.ticks[] | select(.hasChanges == true)'
```

## History

Browse request history. Interactive by default — arrow keys to navigate, select to view details, "Load more" for pagination. Service filter is optional.

### Usage

```bash
just-scrape history                                   # All history (interactive)
just-scrape history <service>                         # Filter by service
just-scrape history <service> <request-id>            # Fetch specific request by ID
just-scrape history --page <n>                        # Start from page (default 1)
just-scrape history --page-size <n>                   # Results per page (default 20, max 100)
just-scrape history --json                            # Raw JSON (pipeable)
```

Services: `scrape`, `extract`, `schema`, `search`, `monitor`, `crawl`

### Examples

```bash
# Browse your extract history interactively
just-scrape history extract

# Jump to a specific request by ID
just-scrape history scrape abc123-def456-7890

# Export all history as JSON
just-scrape history --json --page-size 100 | jq '.[].status'
```

## Credits

Check your credit balance.

```bash
just-scrape credits
just-scrape credits --json | jq '.remaining'
```

---

## Migration from v0.2.x

Commands have been renamed to match the v2 API:

| Old command | New command | Notes |
|---|---|---|
| `smart-scraper` | `extract` | Renamed |
| `search-scraper` | `search` | Renamed |
| `markdownify` | `markdownify` | Now wraps `scrape --format markdown` |
| `scrape` | `scrape` | Gains `--format` (markdown, html, screenshot, branding, links, images, summary, json), multi-format via comma, `--html-mode`, `--scrolls`, `--prompt`, `--schema` |
| `crawl` | `crawl` | Now uses `formats` array like scrape, supports multi-format |
| `search` | `search` | New options: `--country`, `--time-range`, `--format` |
| — | `monitor` | **New**: create, list, get, update, delete, pause, resume page-change monitors |
| `--stealth` flag | `--stealth` | Separate boolean flag; fetch mode is now `auto`, `fast`, or `js` |
| `agentic-scraper` | — | Removed from API |
| `generate-schema` | — | Removed from CLI (still available in SDK) |
| `sitemap` | — | Removed from API |
| `validate` | — | Removed from API |

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
```

## License

ISC

---

Made with love by the [ScrapeGraphAI team](https://scrapegraphai.com) 💜
