import type { FormatConfig } from "scrapegraph-js";

export const BASE_FORMATS = [
	"markdown",
	"html",
	"screenshot",
	"branding",
	"links",
	"images",
	"summary",
] as const;

export type BaseFormat = (typeof BASE_FORMATS)[number];
export type HtmlMode = "normal" | "reader" | "prune";

export function buildBaseFormat(f: BaseFormat, mode: HtmlMode = "normal"): FormatConfig {
	switch (f) {
		case "markdown":
			return { type: "markdown", mode };
		case "html":
			return { type: "html", mode };
		case "screenshot":
			return { type: "screenshot" };
		case "branding":
			return { type: "branding" };
		case "links":
			return { type: "links" };
		case "images":
			return { type: "images" };
		case "summary":
			return { type: "summary" };
	}
}
