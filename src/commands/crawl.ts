import { defineCommand } from "citty";
import { createClient } from "../lib/client.js";
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
				"Page format: markdown (default), html, screenshot, branding, links, images, summary",
		},
		mode: {
			type: "string",
			alias: "m",
			description: "Fetch mode: auto (default), fast, js, direct+stealth, js+stealth",
		},
		json: { type: "boolean", description: "Output raw JSON (pipeable)" },
	},
	run: async ({ args }) => {
		const out = log.create(!!args.json);
		out.docs("https://docs.scrapegraphai.com/api-reference/crawl");
		const sgai = await createClient(!!args.json);

		const crawlOptions: Record<string, unknown> = {};
		if (args["max-pages"]) crawlOptions.maxPages = Number(args["max-pages"]);
		if (args["max-depth"]) crawlOptions.maxDepth = Number(args["max-depth"]);
		if (args["max-links-per-page"])
			crawlOptions.maxLinksPerPage = Number(args["max-links-per-page"]);
		if (args["allow-external"]) crawlOptions.allowExternal = true;
		if (args.format) crawlOptions.format = args.format;
		if (args.mode) crawlOptions.fetchConfig = { mode: args.mode };

		out.start("Crawling");
		const t0 = performance.now();
		try {
			const job = await sgai.crawl.start(args.url, crawlOptions as any);
			const jobId = (job.data as { id: string }).id;

			if (!jobId) {
				out.stop(Math.round(performance.now() - t0));
				out.result(job.data);
				return;
			}

			// Poll until the crawl completes
			while (true) {
				await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
				const status = await sgai.crawl.status(jobId);
				const statusData = status.data as { status: string; [key: string]: unknown };
				out.poll(statusData.status);

				if (
					statusData.status === "completed" ||
					statusData.status === "failed" ||
					statusData.status === "cancelled"
				) {
					out.stop(Math.round(performance.now() - t0));
					out.result(status.data);
					return;
				}
			}
		} catch (err) {
			out.stop(Math.round(performance.now() - t0));
			out.error(err instanceof Error ? err.message : String(err));
		}
	},
});
