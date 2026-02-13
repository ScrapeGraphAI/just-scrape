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
		"render-js": { type: "boolean", description: "Enable heavy JS rendering (+1 credit)" },
		stealth: { type: "boolean", description: "Bypass bot detection (+4 credits)" },
		headers: { type: "string", description: "Custom headers as JSON object string" },
		json: { type: "boolean", description: "Output raw JSON (pipeable)" },
	},
	run: async ({ args }) => {
		const out = log.create(!!args.json);
		out.docs("https://docs.scrapegraphai.com/services/markdownify");
		const key = await resolveApiKey(!!args.json);

		const params: scrapegraphai.MarkdownifyParams = {
			website_url: args.url,
		};

		if (args["render-js"]) params.render_heavy_js = true;
		if (args.stealth) params.stealth = true;
		if (args.headers) params.headers = JSON.parse(args.headers);

		out.start("Converting to markdown");
		const result = await scrapegraphai.markdownify(key, params, out.poll);
		out.stop(result.elapsedMs);

		if (result.data) out.result(result.data);
		else out.error(result.error);
	},
});
