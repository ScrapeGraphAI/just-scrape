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
		json: { type: "boolean", description: "Output raw JSON (pipeable)" },
	},
	run: async ({ args }) => {
		const out = log.create(!!args.json);
		out.docs("https://docs.scrapegraphai.com/services/sitemap");
		const key = await resolveApiKey(!!args.json);

		out.start("Fetching sitemap");
		const result = await scrapegraphai.sitemap(key, { website_url: args.url });
		out.stop(result.elapsedMs);

		if (result.data) out.result(result.data);
		else out.error(result.error);
	},
});
