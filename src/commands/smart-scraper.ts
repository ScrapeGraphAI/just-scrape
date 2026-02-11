import * as p from "@clack/prompts";
import { defineCommand } from "citty";
import { resolveApiKey } from "../lib/folders.js";
import * as log from "../lib/log.js";
import * as scrapegraphai from "../lib/scrapegraphai.js";

export default defineCommand({
	meta: {
		name: "smart-scraper",
		description: "Extract structured data from a URL using AI",
	},
	args: {
		url: {
			type: "positional",
			description: "Website URL to scrape",
			required: true,
		},
		prompt: {
			type: "string",
			alias: "p",
			description: "Extraction prompt",
			required: true,
		},
		schema: {
			type: "string",
			description: "Output JSON schema (as JSON string)",
		},
		scrolls: {
			type: "string",
			description: "Number of infinite scrolls (0-100)",
		},
		pages: {
			type: "string",
			description: "Total pages to scrape (1-100)",
		},
		"render-js": {
			type: "boolean",
			description: "Enable heavy JS rendering (+1 credit)",
		},
		stealth: {
			type: "boolean",
			description: "Bypass bot detection (+4 credits)",
		},
		cookies: {
			type: "string",
			description: "Cookies as JSON object string",
		},
		headers: {
			type: "string",
			description: "Custom headers as JSON object string",
		},
		"plain-text": {
			type: "boolean",
			description: "Return plain text instead of JSON",
		},
	},
	run: async ({ args }) => {
		log.docs("https://docs.scrapegraphai.com/services/smartscraper");
		const key = await resolveApiKey();

		const params: scrapegraphai.SmartScraperParams = {
			website_url: args.url,
			user_prompt: args.prompt,
		};

		if (args.schema) params.output_schema = JSON.parse(args.schema);
		if (args.scrolls) params.number_of_scrolls = Number(args.scrolls);
		if (args.pages) params.total_pages = Number(args.pages);
		if (args["render-js"]) params.render_heavy_js = true;
		if (args.stealth) params.stealth = true;
		if (args.cookies) params.cookies = JSON.parse(args.cookies);
		if (args.headers) params.headers = JSON.parse(args.headers);
		if (args["plain-text"]) params.plain_text = true;

		const s = p.spinner();
		s.start("Scraping");
		const result = await scrapegraphai.smartScraper(key, params, (status) => {
			s.message(`Status: ${status}`);
		});
		s.stop(`Done in ${log.elapsed(result.elapsedMs)}`);

		if (result.data) log.result(result.data);
		else log.error(result.error);
	},
});
