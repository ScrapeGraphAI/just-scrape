import { z } from "zod";

const jsonObject = z.record(z.string(), z.unknown());
const jsonStringObject = z.record(z.string(), z.string());

export const SmartScraperSchema = z.object({
	website_url: z.string().url().optional(),
	website_html: z.string().optional(),
	website_markdown: z.string().optional(),
	user_prompt: z.string().min(1),
	output_schema: jsonObject.optional(),
	number_of_scrolls: z.number().int().min(0).max(100).optional(),
	total_pages: z.number().int().min(1).max(100).optional(),
	stealth: z.boolean().optional(),
	cookies: jsonStringObject.optional(),
	headers: jsonStringObject.optional(),
	plain_text: z.boolean().optional(),
	webhook_url: z.string().url().optional(),
});

export const SearchScraperSchema = z.object({
	user_prompt: z.string().min(1),
	num_results: z.number().int().min(3).max(20).optional(),
	extraction_mode: z.boolean().optional(),
	output_schema: jsonObject.optional(),
	stealth: z.boolean().optional(),
	headers: jsonStringObject.optional(),
	webhook_url: z.string().url().optional(),
});

export const MarkdownifySchema = z.object({
	website_url: z.string().url(),
	stealth: z.boolean().optional(),
	headers: jsonStringObject.optional(),
	webhook_url: z.string().url().optional(),
});

export const CrawlSchema = z.object({
	url: z.string().url(),
	prompt: z.string().optional(),
	extraction_mode: z.boolean().optional(),
	max_pages: z.number().int().positive().optional(),
	depth: z.number().int().positive().optional(),
	schema: jsonObject.optional(),
	rules: jsonObject.optional(),
	sitemap: z.boolean().optional(),
	stealth: z.boolean().optional(),
	webhook_url: z.string().url().optional(),
});

export const GenerateSchemaSchema = z.object({
	user_prompt: z.string().min(1),
	existing_schema: jsonObject.optional(),
});

export const SitemapSchema = z.object({
	website_url: z.string().url(),
});

export const ScrapeSchema = z.object({
	website_url: z.string().url(),
	stealth: z.boolean().optional(),
	branding: z.boolean().optional(),
	country_code: z.string().optional(),
});

export const AgenticScraperSchema = z.object({
	url: z.string().url(),
	steps: z.array(z.string()).optional(),
	user_prompt: z.string().optional(),
	output_schema: jsonObject.optional(),
	ai_extraction: z.boolean().optional(),
	use_session: z.boolean().optional(),
});

export const HISTORY_SERVICES = [
	"markdownify",
	"smartscraper",
	"searchscraper",
	"scrape",
	"crawl",
	"agentic-scraper",
	"sitemap",
] as const;

export const HistorySchema = z.object({
	service: z.enum(HISTORY_SERVICES),
	page: z.number().int().positive().default(1),
	page_size: z.number().int().positive().max(100).default(10),
});
