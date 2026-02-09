import * as p from "@clack/prompts";
import { defineCommand } from "citty";
import { resolveApiKey } from "../lib/folders.js";
import * as log from "../lib/log.js";
import * as scrapegraphai from "../lib/scrapegraphai.js";

export default defineCommand({
	meta: {
		name: "markdownify",
		description: "Convert a webpage to clean markdown",
	},
	args: {
		url: {
			type: "positional",
			description: "Website URL to convert",
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
		headers: {
			type: "string",
			description: "Custom headers as JSON object string",
		},
	},
	run: async ({ args }) => {
		const key = await resolveApiKey();

		const params: scrapegraphai.MarkdownifyParams = {
			website_url: args.url,
		};

		if (args["render-js"]) params.render_heavy_js = true;
		if (args.stealth) params.stealth = true;
		if (args.headers) params.headers = JSON.parse(args.headers);

		const s = p.spinner();
		s.start("Converting to markdown");
		const result = await scrapegraphai.markdownify(key, params, (status) => {
			s.message(`Status: ${status}`);
		});
		s.stop(`Done in ${log.elapsed(result.elapsedMs)}`);

		if (result.data) log.result(result.data);
		else log.error(result.error);
	},
});
