import { defineCommand } from "citty";
import { createClient } from "../lib/client.js";
import * as log from "../lib/log.js";

export default defineCommand({
	meta: {
		name: "scrape",
		description: "Scrape content from a URL (markdown, html, screenshot, or branding)",
	},
	args: {
		url: {
			type: "positional",
			description: "Website URL to scrape",
			required: true,
		},
		format: {
			type: "string",
			alias: "f",
			description: "Output format: markdown (default), html, screenshot, branding",
		},
		mode: { type: "string", alias: "m", description: "Fetch mode: auto (default), fast, js, direct+stealth, js+stealth" },
		country: { type: "string", description: "ISO country code for geo-targeting" },
		json: { type: "boolean", description: "Output raw JSON (pipeable)" },
	},
	run: async ({ args }) => {
		const out = log.create(!!args.json);
		out.docs("https://docs.scrapegraphai.com/api-reference/scrape");
		const sgai = await createClient(!!args.json);

		const fetchConfig: Record<string, unknown> = {};
		if (args.mode) fetchConfig.mode = args.mode;
		if (args.country) fetchConfig.country = args.country;

		const scrapeOptions: Record<string, unknown> = {};
		if (args.format) scrapeOptions.format = args.format;
		if (Object.keys(fetchConfig).length > 0) scrapeOptions.fetchConfig = fetchConfig;

		out.start("Scraping");
		const t0 = performance.now();
		try {
			const result = await sgai.scrape(args.url, scrapeOptions as any);
			out.stop(Math.round(performance.now() - t0));
			out.result(result.data);
		} catch (err) {
			out.stop(Math.round(performance.now() - t0));
			out.error(err instanceof Error ? err.message : String(err));
		}
	},
});
