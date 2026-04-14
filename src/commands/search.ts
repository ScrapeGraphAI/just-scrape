import { defineCommand } from "citty";
import { createClient } from "../lib/client.js";
import * as log from "../lib/log.js";

export default defineCommand({
	meta: {
		name: "search",
		description: "Search the web and extract data with AI",
	},
	args: {
		query: {
			type: "positional",
			description: "Search query",
			required: true,
		},
		prompt: {
			type: "string",
			alias: "p",
			description: "Extraction prompt for search results",
		},
		"num-results": {
			type: "string",
			description: "Number of websites to scrape (1-20, default 3)",
		},
		schema: { type: "string", description: "Output JSON schema (as JSON string)" },
		"location-geo-code": {
			type: "string",
			description: "Geo-location code for search (e.g. 'us', 'de', 'jp-tk')",
		},
		"time-range": {
			type: "string",
			description:
				"Filter results by recency: past_hour, past_24_hours, past_week, past_month, past_year",
		},
		format: {
			type: "string",
			description: "Result format: markdown (default) or html",
		},
		headers: { type: "string", description: "Custom headers as JSON object string" },
		json: { type: "boolean", description: "Output raw JSON (pipeable)" },
	},
	run: async ({ args }) => {
		const out = log.create(!!args.json);
		out.docs("https://docs.scrapegraphai.com/api-reference/search");
		const sgai = await createClient(!!args.json);

		const searchOptions: Record<string, unknown> = {};
		if (args["num-results"]) searchOptions.numResults = Number(args["num-results"]);
		if (args.schema) searchOptions.schema = JSON.parse(args.schema);
		if (args.prompt) searchOptions.prompt = args.prompt;
		if (args["location-geo-code"]) searchOptions.locationGeoCode = args["location-geo-code"];
		if (args["time-range"]) searchOptions.timeRange = args["time-range"];
		if (args.format) searchOptions.format = args.format;
		if (args.headers) searchOptions.fetchConfig = { headers: JSON.parse(args.headers) };

		out.start("Searching");
		const t0 = performance.now();
		try {
			const result = await sgai.search(args.query, searchOptions as any);
			out.stop(Math.round(performance.now() - t0));
			out.result(result.data);
		} catch (err) {
			out.stop(Math.round(performance.now() - t0));
			out.error(err instanceof Error ? err.message : String(err));
		}
	},
});
