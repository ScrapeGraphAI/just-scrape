import { defineCommand } from "citty";
import { extract } from "scrapegraph-js";
import { getApiKey } from "../lib/client.js";
import * as log from "../lib/log.js";

export default defineCommand({
	meta: {
		name: "extract",
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
		schema: { type: "string", description: "Output JSON schema (as JSON string)" },
		mode: { type: "string", description: "HTML processing mode: normal (default), reader, prune" },
		scrolls: { type: "string", description: "Number of infinite scrolls (0-100)" },
		stealth: { type: "boolean", description: "Enable stealth mode" },
		cookies: { type: "string", description: "Cookies as JSON object string" },
		headers: { type: "string", description: "Custom headers as JSON object string" },
		country: { type: "string", description: "ISO country code for geo-targeting" },
		json: { type: "boolean", description: "Output raw JSON (pipeable)" },
	},
	run: async ({ args }) => {
		const out = log.create(!!args.json);
		out.docs("https://docs.scrapegraphai.com/api-reference/extract");
		const apiKey = await getApiKey(!!args.json);

		const fetchConfig: Record<string, unknown> = {};
		if (args.scrolls) fetchConfig.scrolls = Number(args.scrolls);
		if (args.stealth) fetchConfig.stealth = true;
		if (args.cookies) fetchConfig.cookies = JSON.parse(args.cookies);
		if (args.headers) fetchConfig.headers = JSON.parse(args.headers);
		if (args.country) fetchConfig.country = args.country;

		const params: Record<string, unknown> = {
			url: args.url,
			prompt: args.prompt,
		};
		if (args.schema) params.schema = JSON.parse(args.schema);
		if (args.mode) params.mode = args.mode;
		if (Object.keys(fetchConfig).length > 0) params.fetchConfig = fetchConfig;

		out.start("Extracting");
		try {
			const result = await extract(apiKey, params as any);
			out.stop(result.elapsedMs);
			out.result(result.data);
		} catch (err) {
			out.stop(0);
			out.error(err instanceof Error ? err.message : String(err));
		}
	},
});
