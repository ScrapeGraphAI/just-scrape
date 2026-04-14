import { defineCommand } from "citty";
import { scrape } from "scrapegraph-js";
import { getApiKey } from "../lib/client.js";
import * as log from "../lib/log.js";

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
		mode: { type: "string", alias: "m", description: "Fetch mode: auto (default), fast, js" },
		stealth: { type: "boolean", description: "Enable stealth mode" },
		headers: { type: "string", description: "Custom headers as JSON object string" },
		json: { type: "boolean", description: "Output raw JSON (pipeable)" },
	},
	run: async ({ args }) => {
		const out = log.create(!!args.json);
		out.docs("https://docs.scrapegraphai.com/api-reference/scrape");
		const apiKey = await getApiKey(!!args.json);

		const fetchConfig: Record<string, unknown> = {};
		if (args.mode) fetchConfig.mode = args.mode;
		if (args.stealth) fetchConfig.stealth = true;
		if (args.headers) fetchConfig.headers = JSON.parse(args.headers);

		const params: Record<string, unknown> = {
			url: args.url,
			formats: [{ type: "markdown", mode: "normal" }],
		};
		if (Object.keys(fetchConfig).length > 0) params.fetchConfig = fetchConfig;

		out.start("Converting to markdown");
		try {
			const result = await scrape(apiKey, params as any);
			out.stop(result.elapsedMs);
			out.result(result.data);
		} catch (err) {
			out.stop(0);
			out.error(err instanceof Error ? err.message : String(err));
		}
	},
});
