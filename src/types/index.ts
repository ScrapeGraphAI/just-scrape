import type { z } from "zod";
import type {
	AgenticScraperSchema,
	CrawlSchema,
	GenerateSchemaSchema,
	MarkdownifySchema,
	ScrapeSchema,
	SearchScraperSchema,
	SitemapSchema,
	SmartScraperSchema,
} from "../lib/schemas.js";

export type SmartScraperParams = z.infer<typeof SmartScraperSchema>;
export type SearchScraperParams = z.infer<typeof SearchScraperSchema>;
export type MarkdownifyParams = z.infer<typeof MarkdownifySchema>;
export type CrawlParams = z.infer<typeof CrawlSchema>;
export type GenerateSchemaParams = z.infer<typeof GenerateSchemaSchema>;
export type SitemapParams = z.infer<typeof SitemapSchema>;
export type ScrapeParams = z.infer<typeof ScrapeSchema>;
export type AgenticScraperParams = z.infer<typeof AgenticScraperSchema>;

export type ApiResult<T> = {
	status: "success" | "error";
	data: T | null;
	error?: string;
	elapsedMs: number;
};
