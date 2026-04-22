import { defineCommand } from "citty";
import { crawl } from "scrapegraph-js";
import type { CrawlRequest, FetchConfig } from "scrapegraph-js";
import { resolveApiKey } from "../lib/folders.js";
import { BASE_FORMATS, type BaseFormat, buildBaseFormat } from "../lib/formats.js";
import * as log from "../lib/log.js";
import { parseIntArg, parseJsonArg } from "../lib/parse.js";

const POLL_INTERVAL_MS = 3000;

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
			description: `Per-page format(s), comma-separated: ${BASE_FORMATS.join(", ")} (default: markdown)`,
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
			if (!BASE_FORMATS.includes(f as BaseFormat))
				out.error(`Unknown format: ${f}. Valid: ${BASE_FORMATS.join(", ")}`);
		}
		const formats = requested.map((f) => buildBaseFormat(f as BaseFormat));

		const fetchConfig: Record<string, unknown> = {};
		if (args.mode) fetchConfig.mode = args.mode;
		if (args.stealth) fetchConfig.stealth = true;

		const params: CrawlRequest = {
			url: args.url,
			formats,
			...(args["max-pages"] && { maxPages: parseIntArg(args["max-pages"], "max-pages", out) }),
			...(args["max-depth"] && { maxDepth: parseIntArg(args["max-depth"], "max-depth", out) }),
			...(args["max-links-per-page"] && {
				maxLinksPerPage: parseIntArg(args["max-links-per-page"], "max-links-per-page", out),
			}),
			...(args["allow-external"] && { allowExternal: true }),
			...(args["include-patterns"] && {
				includePatterns: parseJsonArg(
					args["include-patterns"],
					"include-patterns",
					out,
				) as string[],
			}),
			...(args["exclude-patterns"] && {
				excludePatterns: parseJsonArg(
					args["exclude-patterns"],
					"exclude-patterns",
					out,
				) as string[],
			}),
			...(Object.keys(fetchConfig).length > 0 && { fetchConfig: fetchConfig as FetchConfig }),
		};

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
