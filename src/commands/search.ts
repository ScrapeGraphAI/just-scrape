import { defineCommand } from "citty";
import { search } from "scrapegraph-js";
import { getApiKey } from "../lib/client.js";
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
		country: {
			type: "string",
			description: "Country code for geo-targeted search (e.g. 'us', 'de', 'jp')",
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
		const apiKey = await getApiKey(!!args.json);

		const params: Record<string, unknown> = { query: args.query };
		if (args["num-results"]) params.numResults = Number(args["num-results"]);
		if (args.schema) params.schema = JSON.parse(args.schema);
		if (args.prompt) params.prompt = args.prompt;
		if (args.country) params.country = args.country;
		if (args["time-range"]) params.timeRange = args["time-range"];
		if (args.format) params.format = args.format;
		if (args.headers) params.fetchConfig = { headers: JSON.parse(args.headers) };

		out.start("Searching");
		try {
			const result = await search(apiKey, params as any);
			out.stop(result.elapsedMs);
			out.result(result.data);
		} catch (err) {
			out.stop(0);
			out.error(err instanceof Error ? err.message : String(err));
		}
	},
});
