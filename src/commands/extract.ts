import { defineCommand } from "citty";
import { extract } from "scrapegraph-js";
import type { ExtractRequest, FetchConfig } from "scrapegraph-js";
import { resolveApiKey } from "../lib/folders.js";
import * as log from "../lib/log.js";
import { parseIntArg, parseJsonArg } from "../lib/parse.js";

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
		if (args.scrolls) fetchConfig.scrolls = parseIntArg(args.scrolls, "scrolls", out);
		if (args.cookies) fetchConfig.cookies = parseJsonArg(args.cookies, "cookies", out);
		if (args.headers) fetchConfig.headers = parseJsonArg(args.headers, "headers", out);
		if (args.country) fetchConfig.country = args.country;

		const params: ExtractRequest = {
			url: args.url,
			prompt: args.prompt,
			...(args.schema && {
				schema: parseJsonArg(args.schema, "schema", out) as Record<string, unknown>,
			}),
			...(args["html-mode"] && { mode: args["html-mode"] as "normal" | "reader" | "prune" }),
			...(Object.keys(fetchConfig).length > 0 && { fetchConfig: fetchConfig as FetchConfig }),
		};

		out.start("Extracting");
		const result = await extract(apiKey, params);
		out.stop(result.elapsedMs);

		if (result.data) out.result(result.data);
		else out.error(result.error);
	},
});
