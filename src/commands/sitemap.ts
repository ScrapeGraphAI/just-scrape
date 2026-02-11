import * as p from "@clack/prompts";
import { defineCommand } from "citty";
import { resolveApiKey } from "../lib/folders.js";
import * as log from "../lib/log.js";
import * as scrapegraphai from "../lib/scrapegraphai.js";

export default defineCommand({
	meta: {
		name: "sitemap",
		description: "Get all URLs from a website's sitemap",
	},
	args: {
		url: {
			type: "positional",
			description: "Website URL",
			required: true,
		},
	},
	run: async ({ args }) => {
		log.docs("https://docs.scrapegraphai.com/services/sitemap");
		const key = await resolveApiKey();
		const s = p.spinner();
		s.start("Fetching sitemap");
		const result = await scrapegraphai.sitemap(key, { website_url: args.url });
		s.stop(`Done in ${log.elapsed(result.elapsedMs)}`);

		if (result.data) log.result(result.data);
		else log.error(result.error);
	},
});
