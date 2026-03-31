# just-scrape

Made with love by the [ScrapeGraphAI team](https://scrapegraphai.com) 💜


![Demo Video](/assets/demo.gif)

Command-line interface for [ScrapeGraph AI](https://scrapegraphai.com) — AI-powered web scraping, data extraction, search, and crawling. Uses the **v2 API**.

## Project Structure

```
just-scrape/
├── src/
│   ├── cli.ts                       # Entry point, citty main command + subcommands
│   ├── lib/
│   │   ├── client.ts                # ScrapeGraphAI v2 client factory
│   │   ├── env.ts                   # Env config (API key, JUST_SCRAPE_* → SGAI_* bridge)
│   │   ├── folders.ts               # API key resolution + interactive prompt
│   │   └── log.ts                   # Logger factory + syntax-highlighted JSON output
│   ├── commands/
│   │   ├── extract.ts
│   │   ├── search.ts
│   │   ├── scrape.ts
│   │   ├── markdownify.ts
│   │   ├── crawl.ts
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
| `SGAI_API_URL` | Override API base URL | `https://api.scrapegraphai.com` |
| `SGAI_TIMEOUT_S` | Request timeout in seconds | `30` |

Legacy variables (`JUST_SCRAPE_API_URL`, `JUST_SCRAPE_TIMEOUT_S`, `JUST_SCRAPE_DEBUG`) are still bridged.

## JSON Mode (`--json`)

All commands support `--json` for machine-readable output. When set, banner, spinners, and interactive prompts are suppressed — only minified JSON on stdout (saves tokens when piped to AI agents).

```bash
just-scrape credits --json | jq '.remainingCredits'
just-scrape extract https://example.com -p "Extract data" --json > result.json
just-scrape history extract --json | jq '.[].status'
```

---

## Extract

Extract structured data from any URL using AI (replaces `smart-scraper`). [docs](https://docs.scrapegraphai.com/api-reference/extract)

### Usage

```bash
just-scrape extract <url> -p <prompt>                # Extract data with AI
just-scrape extract <url> -p <prompt> --schema <json> # Enforce output schema
just-scrape extract <url> -p <prompt> --scrolls <n>   # Infinite scroll (0-100)
just-scrape extract <url> -p <prompt> --stealth       # Anti-bot bypass (+4 credits)
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

# Scrape a JS-heavy SPA behind anti-bot protection
just-scrape extract https://app.example.com/dashboard -p "Extract user stats" \
  --stealth
```

## Search

Search the web and extract structured data from results (replaces `search-scraper`). [docs](https://docs.scrapegraphai.com/api-reference/search)

### Usage

```bash
just-scrape search <query>                            # AI-powered web search
just-scrape search <query> --num-results <n>          # Sources to scrape (1-20, default 3)
just-scrape search <query> -p <prompt>                # Extraction prompt for results
just-scrape search <query> --schema <json>            # Enforce output schema
just-scrape search <query> --headers <json>
```

### Examples

```bash
# Research a topic across multiple sources
just-scrape search "What are the best Python web frameworks in 2025?" --num-results 10

# Structured output with schema
just-scrape search "Top 5 cloud providers pricing" \
  --schema '{"type":"object","properties":{"providers":{"type":"array","items":{"type":"object","properties":{"name":{"type":"string"},"free_tier":{"type":"string"}}}}}}'
```

## Scrape

Scrape content from a URL in various formats: markdown (default), html, screenshot, or branding. [docs](https://docs.scrapegraphai.com/api-reference/scrape)

### Usage

```bash
just-scrape scrape <url>                               # Markdown (default)
just-scrape scrape <url> -f html                       # Raw HTML
just-scrape scrape <url> -f screenshot                 # Screenshot
just-scrape scrape <url> -f branding                   # Extract branding info
just-scrape scrape <url> --stealth                     # Anti-bot bypass (+4 credits)
just-scrape scrape <url> --country <iso>               # Geo-targeting
```

### Examples

```bash
# Get markdown of a page
just-scrape scrape https://example.com

# Get raw HTML
just-scrape scrape https://example.com -f html

# Scrape with anti-bot bypass and geo-targeting
just-scrape scrape https://store.example.com --stealth --country DE

# Extract branding info (logos, colors, fonts)
just-scrape scrape https://example.com -f branding
```

## Markdownify

Convert any webpage to clean markdown (convenience wrapper for `scrape --format markdown`). [docs](https://docs.scrapegraphai.com/api-reference/scrape)

### Usage

```bash
just-scrape markdownify <url>                          # Convert to markdown
just-scrape markdownify <url> --stealth                # Anti-bot bypass (+4 credits)
just-scrape markdownify <url> --headers <json>         # Custom headers
```

### Examples

```bash
# Convert a blog post to markdown
just-scrape markdownify https://blog.example.com/my-article

# Convert a JS-rendered page behind Cloudflare
just-scrape markdownify https://protected.example.com --stealth

# Pipe markdown to a file
just-scrape markdownify https://docs.example.com/api --json | jq -r '.markdown' > api-docs.md
```

## Crawl

Crawl multiple pages. The CLI starts the crawl and polls until completion. [docs](https://docs.scrapegraphai.com/api-reference/crawl)

### Usage

```bash
just-scrape crawl <url>                                # Crawl with defaults
just-scrape crawl <url> --max-pages <n>                # Max pages (default 50)
just-scrape crawl <url> --max-depth <n>                # Crawl depth (default 2)
just-scrape crawl <url> --max-links-per-page <n>       # Links per page (default 10)
just-scrape crawl <url> --allow-external               # Allow external domains
just-scrape crawl <url> --stealth                      # Anti-bot bypass
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

## History

Browse request history for any service. Interactive by default — arrow keys to navigate, select to view details, "Load more" for pagination.

### Usage

```bash
just-scrape history <service>                          # Interactive browser
just-scrape history <service> <request-id>             # Fetch specific request
just-scrape history <service> --page <n>               # Start from page (default 1)
just-scrape history <service> --page-size <n>          # Results per page (default 20, max 100)
just-scrape history <service> --json                   # Raw JSON (pipeable)
```

Services: `scrape`, `extract`, `search`, `monitor`, `crawl`

### Examples

```bash
# Browse your extract history interactively
just-scrape history extract

# Jump to a specific request by ID
just-scrape history extract abc123-def456-7890

# Export crawl history as JSON
just-scrape history crawl --json --page-size 100 | jq '.[].status'
```

## Credits

Check your credit balance.

```bash
just-scrape credits
just-scrape credits --json | jq '.remainingCredits'
```

---

## Migration from v0.2.x

Commands have been renamed to match the v2 API:

| Old command | New command | Notes |
|---|---|---|
| `smart-scraper` | `extract` | Renamed |
| `search-scraper` | `search` | Renamed |
| `markdownify` | `markdownify` | Now wraps `scrape --format markdown` |
| `scrape` | `scrape` | Gains `--format` flag (markdown, html, screenshot, branding) |
| `crawl` | `crawl` | New options: `--max-depth`, `--max-links-per-page`, `--allow-external` |
| `agentic-scraper` | — | Removed from API |
| `generate-schema` | — | Removed from API |
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
