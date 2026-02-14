import { defineCommand } from "citty";
import { resolveApiKey } from "../lib/folders.js";
import * as log from "../lib/log.js";
import * as scrapegraphai from "../lib/scrapegraphai.js";

export default defineCommand({
	meta: {
		name: "scrape",
		description: "Get raw HTML content from a URL",
	},
	args: {
		url: {
			type: "positional",
			description: "Website URL to scrape",
			required: true,
		},
		stealth: { type: "boolean", description: "Bypass bot detection (+4 credits)" },
		branding: { type: "boolean", description: "Extract branding info (+2 credits)" },
		"country-code": { type: "string", description: "ISO country code for geo-targeting" },
		json: { type: "boolean", description: "Output raw JSON (pipeable)" },
	},
	run: async ({ args }) => {
		const out = log.create(!!args.json);
		out.docs("https://docs.scrapegraphai.com/services/scrape");
		const key = await resolveApiKey(!!args.json);

		const params: scrapegraphai.ScrapeParams = { website_url: args.url };

		if (args.stealth) params.stealth = true;
		if (args.branding) params.branding = true;
		if (args["country-code"]) params.country_code = args["country-code"];

		out.start("Scraping");
		const result = await scrapegraphai.scrape(key, params, out.poll);
		out.stop(result.elapsedMs);

		if (result.data) out.result(result.data);
		else out.error(result.error);
	},
});
