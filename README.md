# ScrapeGraph CLI

![Demo](./assets/demo.gif)

Command-line interface for [ScrapeGraph AI](https://scrapegraphai.com) — AI-powered web scraping, data extraction, search, and crawling.

### Install (npm)

```bash
npm install -g just-scrape
```

Package: [just-scrape](https://www.npmjs.com/package/just-scrape) on npm.

## Tech Stack

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

## Setup

```bash
bun install
```

## Configuration

The CLI needs a ScrapeGraph API key. Get one at [dashboard.scrapegraphai.com](https://dashboard.scrapegraphai.com).

Four ways to provide it (checked in order):

1. **Environment variable**: `export SGAI_API_KEY="sgai-..."`
2. **`.env` file**: create a `.env` file in the project root with `SGAI_API_KEY=sgai-...`
3. **Config file**: stored in `~/.scrapegraphai/config.json`
4. **Interactive prompt**: if none of the above are set, the CLI prompts you and saves it to the config file

### Timeout

Set `SGAI_CLI_TIMEOUT_S` to override the default 120s request/polling timeout:

```bash
export SGAI_CLI_TIMEOUT_S=300
```

### Debug Logging

Set `SGAI_CLI_DEBUG=1` to enable debug logging (outputs to stderr):

```bash
SGAI_CLI_DEBUG=1 just-scrape smart-scraper https://example.com -p "Extract data"
```

## Commands

### `smart-scraper` — Extract structured data from a URL  [docs](https://docs.scrapegraphai.com/services/smartscraper)

```bash
just-scrape smart-scraper <url> -p "Extract all product names and prices"

# With JSON schema
just-scrape smart-scraper https://example.com/products -p "Extract products" \
  --schema '{"type":"object","properties":{"products":{"type":"array","items":{"type":"object","properties":{"name":{"type":"string"},"price":{"type":"number"}}}}}}'

# With options
just-scrape smart-scraper https://example.com -p "Extract data" \
  --stealth --render-js --scrolls 10 --pages 5
```

| Option | Description |
|---|---|
| `-p, --prompt` | Extraction prompt (required) |
| `--schema` | Output JSON schema (JSON string) |
| `--scrolls` | Infinite scroll count (0-100) |
| `--pages` | Total pages to scrape (1-100) |
| `--render-js` | Enable JS rendering (+1 credit) |
| `--stealth` | Bypass bot detection (+4 credits) |
| `--cookies` | Cookies as JSON object string |
| `--headers` | Custom headers as JSON object string |
| `--plain-text` | Return plain text instead of JSON |

### `search-scraper` — Search the web and extract data  [docs](https://docs.scrapegraphai.com/services/searchscraper)

```bash
just-scrape search-scraper "What are the top Python web frameworks?"

# Markdown only (cheaper)
just-scrape search-scraper "Python frameworks" --no-extraction --num-results 5
```

| Option | Description |
|---|---|
| `--num-results` | Number of websites (3-20, default 3) |
| `--no-extraction` | Markdown only (2 credits/site vs 10) |
| `--schema` | Output JSON schema (JSON string) |
| `--stealth` | Bypass bot detection (+4 credits) |
| `--headers` | Custom headers as JSON object string |

### `markdownify` — Convert a webpage to markdown  [docs](https://docs.scrapegraphai.com/services/markdownify)

```bash
just-scrape markdownify https://example.com/article
just-scrape markdownify https://example.com --render-js --stealth
```

| Option | Description |
|---|---|
| `--render-js` | Enable JS rendering (+1 credit) |
| `--stealth` | Bypass bot detection (+4 credits) |
| `--headers` | Custom headers as JSON object string |

### `crawl` — Crawl and extract from multiple pages  [docs](https://docs.scrapegraphai.com/services/smartcrawler)

```bash
just-scrape crawl https://example.com -p "Extract article titles" --max-pages 5 --depth 2

# Markdown only
just-scrape crawl https://example.com --no-extraction --max-pages 10

# With crawl rules
just-scrape crawl https://example.com -p "Extract data" \
  --rules '{"include_paths":["/blog/*"],"same_domain":true}'
```

| Option | Description |
|---|---|
| `-p, --prompt` | Extraction prompt (required when extraction is on) |
| `--no-extraction` | Markdown only (2 credits/page vs 10) |
| `--max-pages` | Max pages to crawl (default 10) |
| `--depth` | Crawl depth (default 1) |
| `--schema` | Output JSON schema (JSON string) |
| `--rules` | Crawl rules as JSON object string |
| `--no-sitemap` | Disable sitemap-based discovery |
| `--render-js` | Enable JS rendering (+1 credit/page) |
| `--stealth` | Bypass bot detection (+4 credits) |

### `sitemap` — Get all URLs from a website's sitemap  [docs](https://docs.scrapegraphai.com/services/sitemap)

```bash
just-scrape sitemap https://example.com
```

### `scrape` — Get raw HTML content  [docs](https://docs.scrapegraphai.com/services/scrape)

```bash
just-scrape scrape https://example.com
just-scrape scrape https://example.com --stealth --branding --country-code US
```

| Option | Description |
|---|---|
| `--render-js` | Enable JS rendering (+1 credit) |
| `--stealth` | Bypass bot detection (+4 credits) |
| `--branding` | Extract branding info (+2 credits) |
| `--country-code` | ISO country code for geo-targeting |

### `agentic-scraper` — Browser automation with AI  [docs](https://docs.scrapegraphai.com/services/agenticscraper)

```bash
just-scrape agentic-scraper https://example.com/login \
  -s "Fill email with user@test.com,Fill password with pass123,Click Sign In" \
  --ai-extraction -p "Extract dashboard data"
```

| Option | Description |
|---|---|
| `-s, --steps` | Comma-separated browser steps |
| `-p, --prompt` | Extraction prompt (with `--ai-extraction`) |
| `--schema` | Output JSON schema (JSON string) |
| `--ai-extraction` | Enable AI extraction after steps |
| `--use-session` | Persist browser session |

### `generate-schema` — Generate JSON schema from a prompt

```bash
just-scrape generate-schema "Schema for an e-commerce product with name, price, and reviews"
```

| Option | Description |
|---|---|
| `--existing-schema` | Existing schema to modify (JSON string) |

### `credits` — Check credit balance

```bash
just-scrape credits
```

### `validate` — Validate your API key

```bash
just-scrape validate
```

## Testing

Tests use Bun's built-in test runner with `spyOn(globalThis, "fetch")` to mock all API calls — no network requests, no API key needed.

```bash
bun test
```

Covers all SDK functions: success paths, polling, HTTP error mapping (401/402/422/429/500), Zod validation, timeouts, and network failures.

## Project Structure

```
scrapegraph-cli/
├── src/
│   ├── cli.ts                       # Entry point, citty main command + subcommands
│   ├── lib/
│   │   ├── env.ts                  # Zod-parsed env config (API key, debug, timeout)
│   │   ├── folders.ts               # API key resolution + interactive prompt
│   │   ├── scrapegraphai.ts         # SDK layer — all API functions
│   │   ├── schemas.ts              # Zod validation schemas
│   │   └── log.ts                  # Syntax-highlighted JSON output
│   ├── types/
│   │   └── index.ts                # Zod-derived types + ApiResult
│   ├── commands/
│   │   ├── smart-scraper.ts
│   │   ├── search-scraper.ts
│   │   ├── markdownify.ts
│   │   ├── crawl.ts
│   │   ├── sitemap.ts
│   │   ├── scrape.ts
│   │   ├── agentic-scraper.ts
│   │   ├── generate-schema.ts
│   │   ├── credits.ts
│   │   └── validate.ts
│   └── utils/
│       └── banner.ts               # ASCII banner + version from package.json
├── tests/
│   └── scrapegraphai.test.ts      # SDK layer tests (mocked fetch)
├── dist/                            # Build output (git-ignored)
│   └── cli.mjs                     # Bundled ESM with shebang
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── biome.json
└── .gitignore
```

## Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `bun run src/cli.ts` | Run CLI from TS source |
| `build` | `tsup` | Bundle ESM to `dist/cli.mjs` |
| `lint` | `biome check .` | Lint + format check |
| `format` | `biome format . --write` | Auto-format |
| `test` | `bun test` | Run tests |
| `check` | `tsc --noEmit && biome check .` | Type-check + lint |

## Output

All commands output pretty-printed JSON to stdout (pipeable). Errors go to stderr via `@clack/prompts`.

```bash
# Pipe output to jq
just-scrape credits | jq '.remaining_credits'

# Save to file
just-scrape smart-scraper https://example.com -p "Extract data" > result.json
```

## License

ISC
