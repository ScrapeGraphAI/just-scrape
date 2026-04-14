import { defineCommand } from "citty";
import { crawl } from "scrapegraph-js";
import { getApiKey } from "../lib/client.js";
import * as log from "../lib/log.js";

const POLL_INTERVAL_MS = 3000;

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
		"max-pages": { type: "string", description: "Maximum pages to crawl (default 50)" },
		"max-depth": { type: "string", description: "Crawl depth (default 2)" },
		"max-links-per-page": { type: "string", description: "Max links per page (default 10)" },
		"allow-external": { type: "boolean", description: "Allow crawling external domains" },
		format: {
			type: "string",
			alias: "f",
			description:
				"Page format: markdown (default), html, screenshot, branding, links, images, summary. Comma-separate for multi-format.",
		},
		mode: {
			type: "string",
			alias: "m",
			description: "Fetch mode: auto (default), fast, js",
		},
		stealth: { type: "boolean", description: "Enable stealth mode" },
		json: { type: "boolean", description: "Output raw JSON (pipeable)" },
	},
	run: async ({ args }) => {
		const out = log.create(!!args.json);
		out.docs("https://docs.scrapegraphai.com/api-reference/crawl");
		const apiKey = await getApiKey(!!args.json);

		const requestedFormats = (args.format ?? "markdown")
			.split(",")
			.map((f) => f.trim())
			.filter(Boolean);

		const formats = requestedFormats.map((f) => {
			if (f === "markdown" || f === "html") return { type: f as "markdown" | "html", mode: "normal" as const };
			return { type: f };
		});

		const params: Record<string, unknown> = { url: args.url, formats };
		if (args["max-pages"]) params.maxPages = Number(args["max-pages"]);
		if (args["max-depth"]) params.maxDepth = Number(args["max-depth"]);
		if (args["max-links-per-page"]) params.maxLinksPerPage = Number(args["max-links-per-page"]);
		if (args["allow-external"]) params.allowExternal = true;

		const fetchConfig: Record<string, unknown> = {};
		if (args.mode) fetchConfig.mode = args.mode;
		if (args.stealth) fetchConfig.stealth = true;
		if (Object.keys(fetchConfig).length > 0) params.fetchConfig = fetchConfig;

		out.start("Crawling");
		try {
			const job = await crawl.start(apiKey, params as any);
			const jobData = job.data as { id: string; status: string } | null;

			if (!jobData?.id) {
				out.stop(job.elapsedMs);
				out.result(job.data);
				return;
			}

			while (true) {
				await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
				const status = await crawl.get(apiKey, jobData.id);
				const statusData = status.data as { status: string; [key: string]: unknown } | null;
				out.poll(statusData?.status ?? "unknown");

				if (
					statusData?.status === "completed" ||
					statusData?.status === "failed" ||
					statusData?.status === "deleted"
				) {
					out.stop(job.elapsedMs + status.elapsedMs);
					out.result(status.data);
					return;
				}
			}
		} catch (err) {
			out.stop(0);
			out.error(err instanceof Error ? err.message : String(err));
		}
	},
});
