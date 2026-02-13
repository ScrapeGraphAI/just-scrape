# ScrapeGraph CLI

![Demo](./assets/demo.gif)

Command-line interface for [ScrapeGraph AI](https://scrapegraphai.com) — AI-powered web scraping, data extraction, search, and crawling.

## Project Structure

```
just-scrape/
├── src/
│   ├── cli.ts                       # Entry point, citty main command + subcommands
│   ├── lib/
│   │   ├── env.ts                   # Zod-parsed env config (API key, debug, timeout)
│   │   ├── folders.ts               # API key resolution + interactive prompt
│   │   ├── scrapegraphai.ts         # SDK layer — all API functions
│   │   ├── schemas.ts               # Zod validation schemas
│   │   └── log.ts                   # Logger factory + syntax-highlighted JSON output
│   ├── types/
│   │   └── index.ts                 # Zod-derived types + ApiResult
│   ├── commands/
│   │   ├── smart-scraper.ts
│   │   ├── search-scraper.ts
│   │   ├── markdownify.ts
│   │   ├── crawl.ts
│   │   ├── sitemap.ts
│   │   ├── scrape.ts
│   │   ├── agentic-scraper.ts
│   │   ├── generate-schema.ts
│   │   ├── history.ts
│   │   ├── credits.ts
│   │   └── validate.ts
│   └── utils/
│       └── banner.ts                # ASCII banner + version from package.json
├── tests/
│   └── scrapegraphai.test.ts        # SDK layer tests (mocked fetch)
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
```

Package: [just-scrape](https://www.npmjs.com/package/just-scrape) on npm.

## Configuration

The CLI needs a ScrapeGraph API key. Get one at [dashboard.scrapegraphai.com](https://dashboard.scrapegraphai.com).

Four ways to provide it (checked in order):

1. **Environment variable**: `export SGAI_API_KEY="sgai-..."`
2. **`.env` file**: `SGAI_API_KEY=sgai-...` in project root
3. **Config file**: `~/.scrapegraphai/config.json`
4. **Interactive prompt**: the CLI asks and saves to config

```bash
export JUST_SCRAPE_TIMEOUT_S=300     # Request/polling timeout in seconds (default: 120)
JUST_SCRAPE_DEBUG=1 just-scrape ...  # Debug logging to stderr
```

## JSON Mode (`--json`)

All commands support `--json` for machine-readable output. When set, banner, spinners, and interactive prompts are suppressed — only raw JSON on stdout.

```bash
just-scrape credits --json | jq '.remaining_credits'
just-scrape smart-scraper https://example.com -p "Extract data" --json > result.json
just-scrape history smartscraper --json | jq '.requests[].status'
```

---

## Smart Scraper

Extract structured data from any URL using AI. [docs](https://docs.scrapegraphai.com/services/smartscraper)

### Usage

```bash
just-scrape smart-scraper <url> -p <prompt>                # Extract data with AI
just-scrape smart-scraper <url> -p <prompt> --schema <json> # Enforce output schema
just-scrape smart-scraper <url> -p <prompt> --scrolls <n>  # Infinite scroll (0-100)
just-scrape smart-scraper <url> -p <prompt> --pages <n>    # Multi-page (1-100)
just-scrape smart-scraper <url> -p <prompt> --stealth      # Anti-bot bypass (+4 credits)
just-scrape smart-scraper <url> -p <prompt> --cookies <json> --headers <json>
just-scrape smart-scraper <url> -p <prompt> --plain-text   # Plain text instead of JSON
```

### Examples

```bash
# Extract product listings from an e-commerce page
just-scrape smart-scraper https://store.example.com/shoes -p "Extract all product names, prices, and ratings"

# Extract with a strict schema, scrolling to load more content
just-scrape smart-scraper https://news.example.com -p "Get all article headlines and dates" \
  --schema '{"type":"object","properties":{"articles":{"type":"array","items":{"type":"object","properties":{"title":{"type":"string"},"date":{"type":"string"}}}}}}' \
  --scrolls 5

# Scrape a JS-heavy SPA behind anti-bot protection
just-scrape smart-scraper https://app.example.com/dashboard -p "Extract user stats" \
  --render-js --stealth
```

## Search Scraper

Search the web and extract structured data from results. [docs](https://docs.scrapegraphai.com/services/searchscraper)

### Usage

```bash
just-scrape search-scraper <prompt>                        # AI-powered web search
just-scrape search-scraper <prompt> --num-results <n>      # Sources to scrape (3-20, default 3)
just-scrape search-scraper <prompt> --no-extraction        # Markdown only (2 credits vs 10)
just-scrape search-scraper <prompt> --schema <json>        # Enforce output schema
just-scrape search-scraper <prompt> --stealth --headers <json>
```

### Examples

```bash
# Research a topic across multiple sources
just-scrape search-scraper "What are the best Python web frameworks in 2025?" --num-results 10

# Get raw markdown from search results (cheaper)
just-scrape search-scraper "React vs Vue comparison" --no-extraction --num-results 5

# Structured output with schema
just-scrape search-scraper "Top 5 cloud providers pricing" \
  --schema '{"type":"object","properties":{"providers":{"type":"array","items":{"type":"object","properties":{"name":{"type":"string"},"free_tier":{"type":"string"}}}}}}'
```

## Markdownify

Convert any webpage to clean markdown. [docs](https://docs.scrapegraphai.com/services/markdownify)

### Usage

```bash
just-scrape markdownify <url>                              # Convert to markdown
just-scrape markdownify <url> --render-js                  # JS rendering (+1 credit)
just-scrape markdownify <url> --stealth                    # Anti-bot bypass (+4 credits)
just-scrape markdownify <url> --headers <json>             # Custom headers
```

### Examples

```bash
# Convert a blog post to markdown
just-scrape markdownify https://blog.example.com/my-article

# Convert a JS-rendered page behind Cloudflare
just-scrape markdownify https://protected.example.com --render-js --stealth

# Pipe markdown to a file
just-scrape markdownify https://docs.example.com/api --json | jq -r '.result' > api-docs.md
```

## Crawl

Crawl multiple pages and extract data from each. [docs](https://docs.scrapegraphai.com/services/smartcrawler)

### Usage

```bash
just-scrape crawl <url> -p <prompt>                        # Crawl + extract
just-scrape crawl <url> -p <prompt> --max-pages <n>        # Max pages (default 10)
just-scrape crawl <url> -p <prompt> --depth <n>            # Crawl depth (default 1)
just-scrape crawl <url> --no-extraction --max-pages <n>    # Markdown only (2 credits/page)
just-scrape crawl <url> -p <prompt> --schema <json>        # Enforce output schema
just-scrape crawl <url> -p <prompt> --rules <json>         # Crawl rules (include_paths, same_domain)
just-scrape crawl <url> -p <prompt> --no-sitemap           # Skip sitemap discovery
just-scrape crawl <url> -p <prompt> --render-js --stealth  # JS + anti-bot
```

### Examples

```bash
# Crawl a docs site and extract all code examples
just-scrape crawl https://docs.example.com -p "Extract all code snippets with their language" \
  --max-pages 20 --depth 3

# Crawl only blog pages, skip everything else
just-scrape crawl https://example.com -p "Extract article titles and summaries" \
  --rules '{"include_paths":["/blog/*"],"same_domain":true}' --max-pages 50

# Get raw markdown from all pages (no AI extraction, cheaper)
just-scrape crawl https://example.com --no-extraction --max-pages 10
```

## Sitemap

Get all URLs from a website's sitemap. [docs](https://docs.scrapegraphai.com/services/sitemap)

### Usage

```bash
just-scrape sitemap <url>
```

### Examples

```bash
# List all pages on a site
just-scrape sitemap https://example.com

# Pipe URLs to another tool
just-scrape sitemap https://example.com --json | jq -r '.urls[]'
```

## Scrape

Get raw HTML content from a URL. [docs](https://docs.scrapegraphai.com/services/scrape)

### Usage

```bash
just-scrape scrape <url>                                   # Raw HTML
just-scrape scrape <url> --render-js                       # JS rendering (+1 credit)
just-scrape scrape <url> --stealth                         # Anti-bot bypass (+4 credits)
just-scrape scrape <url> --branding                        # Extract branding (+2 credits)
just-scrape scrape <url> --country-code <iso>              # Geo-targeting
```

### Examples

```bash
# Get raw HTML of a page
just-scrape scrape https://example.com

# Scrape a geo-restricted page with anti-bot bypass
just-scrape scrape https://store.example.com --stealth --country-code DE

# Extract branding info (logos, colors, fonts)
just-scrape scrape https://example.com --branding
```

## Agentic Scraper

Browser automation with AI — login, click, navigate, fill forms. [docs](https://docs.scrapegraphai.com/services/agenticscraper)

### Usage

```bash
just-scrape agentic-scraper <url> -s <steps>               # Run browser steps
just-scrape agentic-scraper <url> -s <steps> --ai-extraction -p <prompt>
just-scrape agentic-scraper <url> -s <steps> --schema <json>
just-scrape agentic-scraper <url> -s <steps> --use-session # Persist browser session
```

### Examples

```bash
# Log in and extract dashboard data
just-scrape agentic-scraper https://app.example.com/login \
  -s "Fill email with user@test.com,Fill password with secret,Click Sign In" \
  --ai-extraction -p "Extract all dashboard metrics"

# Navigate through a multi-step form
just-scrape agentic-scraper https://example.com/wizard \
  -s "Click Next,Select Premium plan,Fill name with John,Click Submit"

# Persistent session across multiple runs
just-scrape agentic-scraper https://app.example.com \
  -s "Click Settings" --use-session
```

## Generate Schema

Generate a JSON schema from a natural language description.

### Usage

```bash
just-scrape generate-schema <prompt>                       # AI generates a schema
just-scrape generate-schema <prompt> --existing-schema <json>
```

### Examples

```bash
# Generate a schema for product data
just-scrape generate-schema "E-commerce product with name, price, ratings, and reviews array"

# Refine an existing schema
just-scrape generate-schema "Add an availability field" \
  --existing-schema '{"type":"object","properties":{"name":{"type":"string"},"price":{"type":"number"}}}'
```

## History

Browse request history for any service. Interactive by default — arrow keys to navigate, select to view details, "Load more" for infinite scroll.

### Usage

```bash
just-scrape history <service>                              # Interactive browser
just-scrape history <service> <request-id>                 # Fetch specific request
just-scrape history <service> --page <n>                   # Start from page (default 1)
just-scrape history <service> --page-size <n>              # Results per page (default 10, max 100)
just-scrape history <service> --json                       # Raw JSON (pipeable)
```

Services: `markdownify`, `smartscraper`, `searchscraper`, `scrape`, `crawl`, `agentic-scraper`, `sitemap`

### Examples

```bash
# Browse your smart-scraper history interactively
just-scrape history smartscraper

# Jump to a specific request by ID
just-scrape history smartscraper abc123-def456-7890

# Export crawl history as JSON
just-scrape history crawl --json --page-size 100 | jq '.requests[] | {id: .request_id, status}'
```

## Credits

Check your credit balance.

```bash
just-scrape credits
just-scrape credits --json | jq '.remaining_credits'
```

## Validate

Validate your API key (health check).

```bash
just-scrape validate
```

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
| Validation | **zod** v4 |
| Env | **dotenv** |
| Lint / Format | **Biome** |
| Testing | **Bun test** (built-in) |
| Target | **Node.js 22+**, ESM-only |

### Scripts

```bash
bun run dev                          # Run CLI from TS source
bun run build                        # Bundle ESM to dist/cli.mjs
bun run lint                         # Lint + format check
bun run format                       # Auto-format
bun test                             # Run tests
bun run check                        # Type-check + lint
```

### Testing

Tests mock all API calls via `spyOn(globalThis, "fetch")` — no network, no API key needed.

Covers: success paths, polling, HTTP error mapping (401/402/422/429/500), Zod validation, timeouts, and network failures.

## License

ISC

---

Made with love by the [ScrapeGraphAI](https://scrapegraphai.com) team.
