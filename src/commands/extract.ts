import { defineCommand } from "citty";
import { extract } from "scrapegraph-js";
import type { ApiExtractRequest } from "scrapegraph-js";
import { resolveApiKey } from "../lib/folders.js";
import * as log from "../lib/log.js";

export default defineCommand({
	meta: {
		name: "extract",
		description: "Extract structured data from a URL using AI",
	},
	args: {
		url: {
			type: "positional",
			description: "Website URL to extract from",
			required: true,
		},
		prompt: {
			type: "string",
			alias: "p",
			description: "Extraction prompt",
			required: true,
		},
		schema: { type: "string", description: "Output JSON schema (JSON string)" },
		mode: { type: "string", description: "Fetch mode: auto (default), fast, js" },
		"html-mode": {
			type: "string",
			description: "HTML processing mode: normal (default), reader, prune",
		},
		stealth: { type: "boolean", description: "Enable stealth mode" },
		scrolls: { type: "string", description: "Number of infinite scrolls (0-100)" },
		cookies: { type: "string", description: "Cookies as JSON object string" },
		headers: { type: "string", description: "Custom headers as JSON object string" },
		country: { type: "string", description: "ISO country code for geo-targeting" },
		json: { type: "boolean", description: "Output raw JSON (pipeable)" },
	},
	run: async ({ args }) => {
		const out = log.create(!!args.json);
		out.docs("https://docs.scrapegraphai.com/api-reference/extract");
		const apiKey = await resolveApiKey(!!args.json);

		const fetchConfig: Record<string, unknown> = {};
		if (args.mode) fetchConfig.mode = args.mode;
		if (args.stealth) fetchConfig.stealth = true;
		if (args.scrolls) fetchConfig.scrolls = Number(args.scrolls);
		if (args.cookies) fetchConfig.cookies = JSON.parse(args.cookies);
		if (args.headers) fetchConfig.headers = JSON.parse(args.headers);
		if (args.country) fetchConfig.country = args.country;

		const params: ApiExtractRequest = { url: args.url, prompt: args.prompt };
		if (args.schema) (params as Record<string, unknown>).schema = JSON.parse(args.schema);
		if (args["html-mode"]) (params as Record<string, unknown>).mode = args["html-mode"];
		if (Object.keys(fetchConfig).length > 0)
			(params as Record<string, unknown>).fetchConfig = fetchConfig;

		out.start("Extracting");
		const result = await extract(apiKey, params);
		out.stop(result.elapsedMs);

		if (result.data) out.result(result.data);
		else out.error(result.error);
	},
});
