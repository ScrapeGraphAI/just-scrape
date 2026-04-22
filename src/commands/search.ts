import { defineCommand } from "citty";
import { search } from "scrapegraph-js";
import type { FetchConfig, SearchRequest } from "scrapegraph-js";
import { resolveApiKey } from "../lib/folders.js";
import * as log from "../lib/log.js";
import { parseIntArg, parseJsonArg } from "../lib/parse.js";

type TimeRange = NonNullable<SearchRequest["timeRange"]>;
type SearchFormat = NonNullable<SearchRequest["format"]>;

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

		const fetchConfig: Record<string, unknown> = {};
		if (args.stealth) fetchConfig.stealth = true;
		if (args.headers) fetchConfig.headers = parseJsonArg(args.headers, "headers", out);

		const params: SearchRequest = {
			query: args.query,
			...(args["num-results"] && {
				numResults: parseIntArg(args["num-results"], "num-results", out),
			}),
			...(args.prompt && { prompt: args.prompt }),
			...(args.schema && {
				schema: parseJsonArg(args.schema, "schema", out) as Record<string, unknown>,
			}),
			...(args.format && { format: args.format as SearchFormat }),
			...(args.country && { locationGeoCode: args.country }),
			...(args["time-range"] && { timeRange: args["time-range"] as TimeRange }),
			...(Object.keys(fetchConfig).length > 0 && { fetchConfig: fetchConfig as FetchConfig }),
		};

		out.start("Searching");
		const result = await search(apiKey, params);
		out.stop(result.elapsedMs);

		if (result.data) out.result(result.data);
		else out.error(result.error);
	},
});
