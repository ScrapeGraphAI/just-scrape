import { defineCommand } from "citty";
import { scrape } from "scrapegraph-js";
import type { ApiScrapeFormatEntry, ApiScrapeRequest } from "scrapegraph-js";
import { resolveApiKey } from "../lib/folders.js";
import * as log from "../lib/log.js";

const FORMATS = [
	"markdown",
	"html",
	"screenshot",
	"branding",
	"links",
	"images",
	"summary",
	"json",
] as const;
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

		const htmlMode = (args["html-mode"] ?? "normal") as "normal" | "reader" | "prune";
		const requested = (args.format ?? "markdown")
			.split(",")
			.map((f) => f.trim())
			.filter(Boolean);

		const formats: ApiScrapeFormatEntry[] = [];
		for (const f of requested) {
			if (!FORMATS.includes(f as Format)) {
				out.error(`Unknown format: ${f}. Valid: ${FORMATS.join(", ")}`);
			}
			switch (f as Format) {
				case "markdown":
					formats.push({ type: "markdown", mode: htmlMode });
					break;
				case "html":
					formats.push({ type: "html", mode: htmlMode });
					break;
				case "json":
					if (!args.prompt) out.error("--prompt is required when format includes json");
					formats.push({
						type: "json",
						prompt: args.prompt as string,
						...(args.schema ? { schema: JSON.parse(args.schema) } : {}),
						mode: htmlMode,
					});
					break;
				case "screenshot":
					formats.push({ type: "screenshot" });
					break;
				case "branding":
					formats.push({ type: "branding" });
					break;
				case "links":
					formats.push({ type: "links" });
					break;
				case "images":
					formats.push({ type: "images" });
					break;
				case "summary":
					formats.push({ type: "summary" });
					break;
			}
		}

		const fetchConfig: Record<string, unknown> = {};
		if (args.mode) fetchConfig.mode = args.mode;
		if (args.stealth) fetchConfig.stealth = true;
		if (args.scrolls) fetchConfig.scrolls = Number(args.scrolls);
		if (args.country) fetchConfig.country = args.country;

		const params: ApiScrapeRequest = { url: args.url, formats };
		if (Object.keys(fetchConfig).length > 0)
			(params as unknown as Record<string, unknown>).fetchConfig = fetchConfig;

		out.start("Scraping");
		const result = await scrape(apiKey, params);
		out.stop(result.elapsedMs);

		if (result.data) out.result(result.data);
		else out.error(result.error);
	},
});
