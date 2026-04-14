import { defineCommand } from "citty";
import { scrape } from "scrapegraph-js";
import { getApiKey } from "../lib/client.js";
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
		description:
			"Scrape content from a URL (markdown, html, screenshot, branding, links, images, summary, json)",
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
			description: `Output format: ${FORMATS.join(", ")} (default: markdown). Comma-separate for multi-format output.`,
		},
		prompt: {
			type: "string",
			alias: "p",
			description: "Prompt for json format (required when --format includes json)",
		},
		schema: {
			type: "string",
			description: "Schema for json format (JSON string)",
		},
		mode: {
			type: "string",
			alias: "m",
			description: "Fetch mode: auto (default), fast, js",
		},
		stealth: { type: "boolean", description: "Enable stealth mode" },
		"html-mode": {
			type: "string",
			description: "HTML/markdown extraction mode: normal (default), reader, prune",
		},
		scrolls: { type: "string", description: "Number of infinite scrolls (0-100)" },
		country: { type: "string", description: "ISO country code for geo-targeting" },
		json: { type: "boolean", description: "Output raw JSON (pipeable)" },
	},
	run: async ({ args }) => {
		const out = log.create(!!args.json);
		out.docs("https://docs.scrapegraphai.com/api-reference/scrape");
		const apiKey = await getApiKey(!!args.json);

		const fetchConfig: Record<string, unknown> = {};
		if (args.mode) fetchConfig.mode = args.mode;
		if (args.stealth) fetchConfig.stealth = true;
		if (args.scrolls) fetchConfig.scrolls = Number(args.scrolls);
		if (args.country) fetchConfig.country = args.country;

		const requestedFormats = (args.format ?? "markdown")
			.split(",")
			.map((f) => f.trim())
			.filter(Boolean) as Format[];
		const htmlMode = (args["html-mode"] as "normal" | "reader" | "prune" | undefined) ?? "normal";

		const formats = requestedFormats.map((f) => {
			switch (f) {
				case "markdown":
					return { type: "markdown" as const, mode: htmlMode };
				case "html":
					return { type: "html" as const, mode: htmlMode };
				case "screenshot":
					return { type: "screenshot" as const };
				case "branding":
					return { type: "branding" as const };
				case "links":
					return { type: "links" as const };
				case "images":
					return { type: "images" as const };
				case "summary":
					return { type: "summary" as const };
				case "json": {
					if (!args.prompt) {
						out.error("--prompt is required when --format includes json");
						return { type: "json" as const, prompt: "" };
					}
					return {
						type: "json" as const,
						prompt: args.prompt,
						schema: args.schema ? JSON.parse(args.schema) : undefined,
						mode: htmlMode,
					};
				}
				default:
					out.error(`Unknown format: ${f}. Valid: ${FORMATS.join(", ")}`);
					return { type: "markdown" as const, mode: htmlMode };
			}
		});

		const params: Record<string, unknown> = { url: args.url, formats };
		if (Object.keys(fetchConfig).length > 0) params.fetchConfig = fetchConfig;

		out.start("Scraping");
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
