import * as p from "@clack/prompts";
import { defineCommand } from "citty";
import { resolveApiKey } from "../lib/folders.js";
import * as log from "../lib/log.js";
import * as scrapegraphai from "../lib/scrapegraphai.js";

export default defineCommand({
	meta: {
		name: "search-scraper",
		description: "Search the web and extract data with AI",
	},
	args: {
		prompt: {
			type: "positional",
			description: "Search query and extraction instructions",
			required: true,
		},
		"num-results": {
			type: "string",
			description: "Number of websites to scrape (3-20, default 3)",
		},
		"no-extraction": {
			type: "boolean",
			description: "Return markdown only (2 credits/site instead of 10)",
		},
		schema: {
			type: "string",
			description: "Output JSON schema (as JSON string)",
		},
		stealth: {
			type: "boolean",
			description: "Bypass bot detection (+4 credits)",
		},
		headers: {
			type: "string",
			description: "Custom headers as JSON object string",
		},
	},
	run: async ({ args }) => {
		const key = await resolveApiKey();

		const params: scrapegraphai.SearchScraperParams = {
			user_prompt: args.prompt,
		};

		if (args["num-results"]) params.num_results = Number(args["num-results"]);
		if (args["no-extraction"]) params.extraction_mode = false;
		if (args.schema) params.output_schema = JSON.parse(args.schema);
		if (args.stealth) params.stealth = true;
		if (args.headers) params.headers = JSON.parse(args.headers);

		const s = p.spinner();
		s.start("Searching");
		const result = await scrapegraphai.searchScraper(key, params, (status) => {
			s.message(`Status: ${status}`);
		});
		s.stop(`Done in ${log.elapsed(result.elapsedMs)}`);

		if (result.data) log.result(result.data);
		else log.error(result.error);
	},
});
