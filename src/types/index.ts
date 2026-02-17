import type { z } from "zod";
import type {
	AgenticScraperSchema,
	CrawlSchema,
	GenerateSchemaSchema,
	HistorySchema,
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
export type HistoryParams = z.input<typeof HistorySchema>;

export type ApiResult<T> = {
	status: "success" | "error";
	data: T | null;
	error?: string;
	elapsedMs: number;
};

export type SmartScraperResponse = {
	request_id: string;
	status: string;
	website_url: string;
	user_prompt: string;
	result: Record<string, unknown> | null;
	error?: string;
};

export type SearchScraperResponse = {
	request_id: string;
	status: string;
	user_prompt: string;
	result: Record<string, unknown> | null;
	reference_urls: string[];
	error?: string;
};

export type MarkdownifyResponse = {
	request_id: string;
	status: string;
	website_url: string;
	result: string | null;
	error?: string;
};

export type CrawlPage = {
	url: string;
	markdown: string;
};

export type CrawlResponse = {
	crawl_id: string;
	status: string;
	result?: Record<string, unknown> | null;
	crawled_urls?: string[];
	pages?: CrawlPage[];
	error?: string;
};

export type ScrapeResponse = {
	request_id: string;
	status: string;
	html: string;
	branding?: Record<string, unknown>;
	error?: string;
};

export type AgenticScraperResponse = {
	request_id: string;
	status: string;
	result: Record<string, unknown> | null;
	error?: string;
};

export type GenerateSchemaResponse = {
	request_id: string;
	status: string;
	user_prompt: string;
	refined_prompt?: string | null;
	generated_schema?: Record<string, unknown> | null;
	error?: string | null;
	created_at?: string | null;
	updated_at?: string | null;
};

export type SitemapResponse = {
	request_id?: string;
	status?: string;
	website_url?: string;
	urls: string[];
	error?: string;
};

export type CreditsResponse = {
	remaining_credits: number;
	total_credits_used: number;
};

export type HealthResponse = {
	status: string;
};

export type HistoryResponse = {
	requests: HistoryEntry[];
	total_count: number;
	page: number;
	page_size: number;
};

export type HistoryEntry = {
	request_id: string;
	status: string;
	[key: string]: unknown;
};
