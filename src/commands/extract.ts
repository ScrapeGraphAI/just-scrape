import { defineCommand } from "citty";
import { createClient } from "../lib/client.js";
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
		scrolls: { type: "string", description: "Number of infinite scrolls (0-100)" },
		mode: { type: "string", description: "Fetch mode: auto (default), fast, js, direct+stealth, js+stealth" },
		cookies: { type: "string", description: "Cookies as JSON object string" },
		headers: { type: "string", description: "Custom headers as JSON object string" },
		country: { type: "string", description: "ISO country code for geo-targeting" },
		json: { type: "boolean", description: "Output raw JSON (pipeable)" },
	},
	run: async ({ args }) => {
		const out = log.create(!!args.json);
		out.docs("https://docs.scrapegraphai.com/api-reference/extract");
		const sgai = await createClient(!!args.json);

		const fetchConfig: Record<string, unknown> = {};
		if (args.scrolls) fetchConfig.scrolls = Number(args.scrolls);
		if (args.mode) fetchConfig.mode = args.mode;
		if (args.cookies) fetchConfig.cookies = JSON.parse(args.cookies);
		if (args.headers) fetchConfig.headers = JSON.parse(args.headers);
		if (args.country) fetchConfig.country = args.country;

		const extractOptions: Record<string, unknown> = { prompt: args.prompt };
		if (args.schema) extractOptions.schema = JSON.parse(args.schema);
		if (Object.keys(fetchConfig).length > 0) extractOptions.fetchConfig = fetchConfig;

		out.start("Extracting");
		const t0 = performance.now();
		try {
			const result = await sgai.extract(args.url, extractOptions as any);
			out.stop(Math.round(performance.now() - t0));
			out.result(result.data);
		} catch (err) {
			out.stop(Math.round(performance.now() - t0));
			out.error(err instanceof Error ? err.message : String(err));
		}
	},
});
