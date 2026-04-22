import { defineCommand } from "citty";
import { scrape } from "scrapegraph-js";
import type { FetchConfig, FormatConfig, ScrapeRequest } from "scrapegraph-js";
import { resolveApiKey } from "../lib/folders.js";
import { BASE_FORMATS, type BaseFormat, type HtmlMode, buildBaseFormat } from "../lib/formats.js";
import * as log from "../lib/log.js";
import { parseIntArg, parseJsonArg } from "../lib/parse.js";

const FORMATS = [...BASE_FORMATS, "json"] as const;
type Format = (typeof FORMATS)[number];

export default defineCommand({
	meta: {
		name: "scrape",
		description: `Scrape a URL (formats: ${FORMATS.join(", ")})`,
	},
	args: {
		url: {
			type: "positional",
			description: "Website URL to scrape",
			required: true,
		},
		format: {
			type: "string",
			alias: "f",
			description: `Output format(s), comma-separated: ${FORMATS.join(", ")} (default: markdown)`,
		},
		prompt: {
			type: "string",
			alias: "p",
			description: "Prompt (required when format includes json)",
		},
		schema: { type: "string", description: "JSON schema for json format (JSON string)" },
		"html-mode": {
			type: "string",
			description: "HTML/markdown extraction mode: normal (default), reader, prune",
		},
		mode: { type: "string", alias: "m", description: "Fetch mode: auto (default), fast, js" },
		stealth: { type: "boolean", description: "Enable stealth mode" },
		scrolls: { type: "string", description: "Number of infinite scrolls (0-100)" },
		country: { type: "string", description: "ISO country code for geo-targeting" },
		json: { type: "boolean", description: "Output raw JSON (pipeable)" },
	},
	run: async ({ args }) => {
		const out = log.create(!!args.json);
		out.docs("https://docs.scrapegraphai.com/api-reference/scrape");
		const apiKey = await resolveApiKey(!!args.json);

		const htmlMode = (args["html-mode"] ?? "normal") as HtmlMode;
		const requested = (args.format ?? "markdown")
			.split(",")
			.map((f) => f.trim())
			.filter(Boolean);

		const formats: FormatConfig[] = [];
		for (const f of requested) {
			if (!FORMATS.includes(f as Format)) {
				out.error(`Unknown format: ${f}. Valid: ${FORMATS.join(", ")}`);
			}
			if (f === "json") {
				if (!args.prompt) out.error("--prompt is required when format includes json");
				formats.push({
					type: "json",
					prompt: args.prompt as string,
					...(args.schema && {
						schema: parseJsonArg(args.schema, "schema", out) as Record<string, unknown>,
					}),
					mode: htmlMode,
				});
			} else {
				formats.push(buildBaseFormat(f as BaseFormat, htmlMode));
			}
		}

		const fetchConfig: Record<string, unknown> = {};
		if (args.mode) fetchConfig.mode = args.mode;
		if (args.stealth) fetchConfig.stealth = true;
		if (args.scrolls) fetchConfig.scrolls = parseIntArg(args.scrolls, "scrolls", out);
		if (args.country) fetchConfig.country = args.country;

		const params: ScrapeRequest = {
			url: args.url,
			formats,
			...(Object.keys(fetchConfig).length > 0 && { fetchConfig: fetchConfig as FetchConfig }),
		};

		out.start("Scraping");
		const result = await scrape(apiKey, params);
		out.stop(result.elapsedMs);

		if (result.data) out.result(result.data);
		else out.error(result.error);
	},
});
