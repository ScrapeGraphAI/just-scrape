# just-scrape

Made with love by the [ScrapeGraphAI team](https://scrapegraphai.com?utm_source=github&utm_medium=readme&utm_campaign=skill) 💜

![Demo Video](/assets/demo.gif)

Command-line interface for [ScrapeGraph AI](https://scrapegraphai.com?utm_source=github&utm_medium=readme&utm_campaign=skill) — AI-powered web scraping, data extraction, search, crawling, and page-change monitoring.

> **v1.0.0 — SDK v2 migration.** This release migrates the CLI to the [scrapegraph-js v2 SDK](https://github.com/ScrapeGraphAI/scrapegraph-js/pull/13). The v1 endpoints (`smart-scraper`, `search-scraper`, `markdownify`, `sitemap`, `agentic-scraper`, `generate-schema`) have been removed. Use `scrape --format …` for multi-format output, `extract` for structured data, and the new `monitor` command for page-change tracking.

## Project Structure

```id="h3g1v7"
just-scrape/
├── src/
│   ├── cli.ts
│   ├── lib/
│   │   ├── env.ts
│   │   ├── folders.ts
│   │   └── log.ts
│   ├── commands/
│   │   ├── scrape.ts
│   │   ├── extract.ts
│   │   ├── search.ts
│   │   ├── crawl.ts
│   │   ├── monitor.ts
│   │   ├── history.ts
│   │   ├── credits.ts
│   │   └── validate.ts
│   └── utils/
│       └── banner.ts
├── dist/
├── tests/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── biome.json
└── .gitignore
```

## Installation

```bash id="6u63tz"
npm install -g just-scrape
pnpm add -g just-scrape
yarn global add just-scrape
bun add -g just-scrape
npx just-scrape --help
bunx just-scrape --help
```

Package: [just-scrape](https://www.npmjs.com/package/just-scrape?utm_source=github&utm_medium=readme&utm_campaign=skill) on npm.

## Coding Agent Skill

You can use just-scrape as a skill for AI coding agents via [Vercel's skills.sh](https://skills.sh?utm_source=github&utm_medium=readme&utm_campaign=skill).

Or you can manually install it:

```bash id="1ot4sn"
bunx skills add https://github.com/ScrapeGraphAI/just-scrape
```

Browse the skill: [skills.sh/scrapegraphai/just-scrape/just-scrape](https://skills.sh/scrapegraphai/just-scrape/just-scrape?utm_source=github&utm_medium=readme&utm_campaign=skill)

## Configuration

The CLI needs a ScrapeGraph API key. Get one at [dashboard.scrapegraphai.com](https://dashboard.scrapegraphai.com?utm_source=github&utm_medium=readme&utm_campaign=skill).

Four ways to provide it:

1. **Environment variable**: `export SGAI_API_KEY="sgai-..."`
2. **`.env` file**: `SGAI_API_KEY=sgai-...`
3. **Config file**: `~/.scrapegraphai/config.json`
4. **Interactive prompt**

### Environment Variables

| Variable       | Description           | Default                                |
| -------------- | --------------------- | -------------------------------------- |
| `SGAI_API_KEY` | ScrapeGraph API key   | —                                      |
| `SGAI_API_URL` | Override API base URL | `https://api.scrapegraphai.com/api/v2` |
| `SGAI_TIMEOUT` | Timeout (seconds)     | `120`                                  |
| `SGAI_DEBUG`   | Debug logs            | `0`                                    |

## JSON Mode (`--json`)

```bash id="f7r5mx"
just-scrape credits --json | jq '.remaining'
just-scrape scrape https://example.com --json > result.json
just-scrape history scrape --json | jq '.[].id'
```

---

## Scrape

[docs](https://docs.scrapegraphai.com/api-reference/scrape?utm_source=github&utm_medium=readme&utm_campaign=skill)

## Extract

[docs](https://docs.scrapegraphai.com/api-reference/extract?utm_source=github&utm_medium=readme&utm_campaign=skill)

## Search

[docs](https://docs.scrapegraphai.com/api-reference/search?utm_source=github&utm_medium=readme&utm_campaign=skill)

## Crawl

[docs](https://docs.scrapegraphai.com/api-reference/crawl?utm_source=github&utm_medium=readme&utm_campaign=skill)

## Monitor

[docs](https://docs.scrapegraphai.com/api-reference/monitor?utm_source=github&utm_medium=readme&utm_campaign=skill)

## History

[docs](https://docs.scrapegraphai.com/api-reference/history?utm_source=github&utm_medium=readme&utm_campaign=skill)

## Credits

```bash id="m6c9tb"
just-scrape credits
```

## Validate

```bash id="c2a2f9"
just-scrape validate
```

---

## Contributing

```bash id="0c7uvy"
git clone https://github.com/ScrapeGraphAI/just-scrape
cd just-scrape
bun install
bun run dev --help
```

---

Made with love by the [ScrapeGraphAI team](https://scrapegraphai.com?utm_source=github&utm_medium=readme&utm_campaign=skill) 💜
