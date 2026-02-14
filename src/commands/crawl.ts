import { defineCommand } from "citty";
import { resolveApiKey } from "../lib/folders.js";
import * as log from "../lib/log.js";
import * as scrapegraphai from "../lib/scrapegraphai.js";

export default defineCommand({
	meta: {
		name: "crawl",
		description: "Crawl and extract data from multiple pages",
	},
	args: {
		url: {
			type: "positional",
			description: "Starting URL to crawl",
			required: true,
		},
		prompt: {
			type: "string",
			alias: "p",
			description: "Extraction prompt (required when extraction mode is on)",
		},
		"no-extraction": {
			type: "boolean",
			description: "Return markdown only (2 credits/page instead of 10)",
		},
		"max-pages": { type: "string", description: "Maximum pages to crawl (default 10)" },
		depth: { type: "string", description: "Crawl depth (default 1)" },
		schema: { type: "string", description: "Output JSON schema (as JSON string)" },
		rules: { type: "string", description: "Crawl rules as JSON object string" },
		"no-sitemap": { type: "boolean", description: "Disable sitemap-based URL discovery" },
		stealth: { type: "boolean", description: "Bypass bot detection (+4 credits)" },
		json: { type: "boolean", description: "Output raw JSON (pipeable)" },
	},
	run: async ({ args }) => {
		const out = log.create(!!args.json);
		out.docs("https://docs.scrapegraphai.com/services/smartcrawler");
		const key = await resolveApiKey(!!args.json);

		const params: scrapegraphai.CrawlParams = { url: args.url };

		if (args.prompt) params.prompt = args.prompt;
		if (args["no-extraction"]) params.extraction_mode = false;
		if (args["max-pages"]) params.max_pages = Number(args["max-pages"]);
		if (args.depth) params.depth = Number(args.depth);
		if (args.schema) params.schema = JSON.parse(args.schema);
		if (args.rules) params.rules = JSON.parse(args.rules);
		if (args["no-sitemap"]) params.sitemap = false;
		if (args.stealth) params.stealth = true;

		out.start("Crawling");
		const result = await scrapegraphai.crawl(key, params, out.poll);
		out.stop(result.elapsedMs);

		if (result.data) out.result(result.data);
		else out.error(result.error);
	},
});
