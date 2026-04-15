import { defineCommand } from "citty";
import { crawl } from "scrapegraph-js";
import type { ApiCrawlRequest, ApiScrapeFormatEntry } from "scrapegraph-js";
import { resolveApiKey } from "../lib/folders.js";
import * as log from "../lib/log.js";

const FORMATS = [
	"markdown",
	"html",
	"screenshot",
	"branding",
	"links",
	"images",
	"summary",
] as const;
type Format = (typeof FORMATS)[number];

const POLL_INTERVAL_MS = 3000;

function buildFormat(f: Format): ApiScrapeFormatEntry {
	if (f === "markdown" || f === "html") return { type: f, mode: "normal" };
	return { type: f } as ApiScrapeFormatEntry;
}

export default defineCommand({
	meta: {
		name: "crawl",
		description: "Crawl pages starting from a URL",
	},
	args: {
		url: {
			type: "positional",
			description: "Starting URL",
			required: true,
		},
		format: {
			type: "string",
			alias: "f",
			description: `Per-page format(s), comma-separated: ${FORMATS.join(", ")} (default: markdown)`,
		},
		"max-pages": { type: "string", description: "Maximum pages to crawl (default 50, max 1000)" },
		"max-depth": { type: "string", description: "Crawl depth (default 2)" },
		"max-links-per-page": { type: "string", description: "Max links per page (default 10)" },
		"allow-external": { type: "boolean", description: "Allow crawling external domains" },
		"include-patterns": {
			type: "string",
			description: "JSON array of regex patterns to include",
		},
		"exclude-patterns": {
			type: "string",
			description: "JSON array of regex patterns to exclude",
		},
		mode: { type: "string", alias: "m", description: "Fetch mode: auto (default), fast, js" },
		stealth: { type: "boolean", description: "Enable stealth mode" },
		json: { type: "boolean", description: "Output raw JSON (pipeable)" },
	},
	run: async ({ args }) => {
		const out = log.create(!!args.json);
		out.docs("https://docs.scrapegraphai.com/api-reference/crawl");
		const apiKey = await resolveApiKey(!!args.json);

		const requested = (args.format ?? "markdown")
			.split(",")
			.map((f) => f.trim())
			.filter(Boolean);
		for (const f of requested) {
			if (!FORMATS.includes(f as Format))
				out.error(`Unknown format: ${f}. Valid: ${FORMATS.join(", ")}`);
		}
		const formats = requested.map((f) => buildFormat(f as Format));

		const params: ApiCrawlRequest = { url: args.url, formats };
		const mut = params as Record<string, unknown>;
		if (args["max-pages"]) mut.maxPages = Number(args["max-pages"]);
		if (args["max-depth"]) mut.maxDepth = Number(args["max-depth"]);
		if (args["max-links-per-page"]) mut.maxLinksPerPage = Number(args["max-links-per-page"]);
		if (args["allow-external"]) mut.allowExternal = true;
		if (args["include-patterns"]) mut.includePatterns = JSON.parse(args["include-patterns"]);
		if (args["exclude-patterns"]) mut.excludePatterns = JSON.parse(args["exclude-patterns"]);

		const fetchConfig: Record<string, unknown> = {};
		if (args.mode) fetchConfig.mode = args.mode;
		if (args.stealth) fetchConfig.stealth = true;
		if (Object.keys(fetchConfig).length > 0) mut.fetchConfig = fetchConfig;

		out.start("Starting crawl");
		const job = await crawl.start(apiKey, params);
		if (!job.data) {
			out.error(job.error);
			return;
		}
		const jobId = job.data.id;
		let totalElapsed = job.elapsedMs;

		while (true) {
			await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
			const status = await crawl.get(apiKey, jobId);
			totalElapsed += status.elapsedMs;
			if (!status.data) {
				out.error(status.error);
				return;
			}
			out.poll(`${status.data.status} (${status.data.finished}/${status.data.total})`);
			if (
				status.data.status === "completed" ||
				status.data.status === "failed" ||
				status.data.status === "deleted"
			) {
				out.stop(totalElapsed);
				out.result(status.data);
				return;
			}
		}
	},
});
