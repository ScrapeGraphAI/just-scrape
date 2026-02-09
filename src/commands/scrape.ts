import * as p from "@clack/prompts";
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
		"render-js": {
			type: "boolean",
			description: "Enable heavy JS rendering (+1 credit)",
		},
		stealth: {
			type: "boolean",
			description: "Bypass bot detection (+4 credits)",
		},
		branding: {
			type: "boolean",
			description: "Extract branding info (+2 credits)",
		},
		"country-code": {
			type: "string",
			description: "ISO country code for geo-targeting",
		},
	},
	run: async ({ args }) => {
		const key = await resolveApiKey();

		const params: scrapegraphai.ScrapeParams = {
			website_url: args.url,
		};

		if (args["render-js"]) params.render_heavy_js = true;
		if (args.stealth) params.stealth = true;
		if (args.branding) params.branding = true;
		if (args["country-code"]) params.country_code = args["country-code"];

		const s = p.spinner();
		s.start("Scraping");
		const result = await scrapegraphai.scrape(key, params, (status) => {
			s.message(`Status: ${status}`);
		});
		s.stop(`Done in ${log.elapsed(result.elapsedMs)}`);

		if (result.data) log.result(result.data);
		else log.error(result.error);
	},
});
