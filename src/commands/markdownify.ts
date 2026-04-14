import { defineCommand } from "citty";
import type { ApiScrapeOptions } from "scrapegraph-js";
import { createClient } from "../lib/client.js";
import * as log from "../lib/log.js";

export default defineCommand({
	meta: {
		name: "markdownify",
		description: "Convert a webpage to clean markdown",
	},
	args: {
		url: {
			type: "positional",
			description: "Website URL to convert",
			required: true,
		},
		mode: { type: "string", alias: "m", description: "Fetch mode: auto (default), fast, js" },
		stealth: { type: "boolean", description: "Enable stealth mode" },
		headers: { type: "string", description: "Custom headers as JSON object string" },
		json: { type: "boolean", description: "Output raw JSON (pipeable)" },
	},
	run: async ({ args }) => {
		const out = log.create(!!args.json);
		out.docs("https://docs.scrapegraphai.com/api-reference/scrape");
		const sgai = await createClient(!!args.json);

		const fetchConfig: Record<string, unknown> = {};
		if (args.mode) fetchConfig.mode = args.mode;
		if (args.stealth) fetchConfig.stealth = true;
		if (args.headers) fetchConfig.headers = JSON.parse(args.headers);

		const scrapeOptions: ApiScrapeOptions = { format: "markdown" };
		if (Object.keys(fetchConfig).length > 0) scrapeOptions.fetchConfig = fetchConfig;

		out.start("Converting to markdown");
		const t0 = performance.now();
		try {
			const result = await sgai.scrape(args.url, scrapeOptions);
			out.stop(Math.round(performance.now() - t0));
			out.result(result.data);
		} catch (err) {
			out.stop(Math.round(performance.now() - t0));
			out.error(err instanceof Error ? err.message : String(err));
		}
	},
});
