import { defineCommand } from "citty";
import { search } from "scrapegraph-js";
import type { SearchRequest } from "scrapegraph-js";
import { resolveApiKey } from "../lib/folders.js";
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
		"num-results": {
			type: "string",
			description: "Number of results to scrape (1-20, default 3)",
		},
		prompt: {
			type: "string",
			alias: "p",
			description: "Extraction prompt applied to results",
		},
		schema: { type: "string", description: "Output JSON schema (JSON string)" },
		format: { type: "string", description: "Result format: markdown (default) or html" },
		country: {
			type: "string",
			description: "2-letter country code for geo-targeting (e.g. 'us', 'de')",
		},
		"time-range": {
			type: "string",
			description: "Recency filter: past_hour, past_24_hours, past_week, past_month, past_year",
		},
		stealth: { type: "boolean", description: "Enable stealth mode" },
		headers: { type: "string", description: "Custom headers as JSON object string" },
		json: { type: "boolean", description: "Output raw JSON (pipeable)" },
	},
	run: async ({ args }) => {
		const out = log.create(!!args.json);
		out.docs("https://docs.scrapegraphai.com/api-reference/search");
		const apiKey = await resolveApiKey(!!args.json);

		const params: SearchRequest = { query: args.query };
		const mut = params as Record<string, unknown>;
		if (args["num-results"]) mut.numResults = Number(args["num-results"]);
		if (args.prompt) mut.prompt = args.prompt;
		if (args.schema) mut.schema = JSON.parse(args.schema);
		if (args.format) mut.format = args.format;
		if (args.country) mut.locationGeoCode = args.country;
		if (args["time-range"]) mut.timeRange = args["time-range"];

		const fetchConfig: Record<string, unknown> = {};
		if (args.stealth) fetchConfig.stealth = true;
		if (args.headers) fetchConfig.headers = JSON.parse(args.headers);
		if (Object.keys(fetchConfig).length > 0) mut.fetchConfig = fetchConfig;

		out.start("Searching");
		const result = await search(apiKey, params);
		out.stop(result.elapsedMs);

		if (result.data) out.result(result.data);
		else out.error(result.error);
	},
});
