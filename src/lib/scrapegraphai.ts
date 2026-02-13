import type {
	AgenticScraperParams,
	ApiResult,
	CrawlParams,
	GenerateSchemaParams,
	HistoryParams,
	MarkdownifyParams,
	ScrapeParams,
	SearchScraperParams,
	SitemapParams,
	SmartScraperParams,
} from "../types/index.js";
import { env } from "./env.js";
import {
	AgenticScraperSchema,
	CrawlSchema,
	GenerateSchemaSchema,
	HistorySchema,
	MarkdownifySchema,
	ScrapeSchema,
	SearchScraperSchema,
	SitemapSchema,
	SmartScraperSchema,
} from "./schemas.js";

export type {
	AgenticScraperParams,
	ApiResult,
	CrawlParams,
	GenerateSchemaParams,
	HistoryParams,
	MarkdownifyParams,
	ScrapeParams,
	SearchScraperParams,
	SitemapParams,
	SmartScraperParams,
} from "../types/index.js";

const BASE_URL = "https://api.scrapegraphai.com/v1";
const POLL_INTERVAL_MS = 3000;

function debug(label: string, data?: unknown) {
	if (!env.debug) return;
	const ts = new Date().toISOString();
	if (data !== undefined) console.error(`[${ts}] ${label}`, JSON.stringify(data, null, 2));
	else console.error(`[${ts}] ${label}`);
}

function getTimeoutMs(): number {
	return env.timeoutS * 1000;
}

function ok<T>(data: T, elapsedMs: number): ApiResult<T> {
	return { status: "success", data, elapsedMs };
}

function fail(err: unknown): ApiResult<never> {
	if (err instanceof DOMException && err.name === "TimeoutError")
		return { status: "error", data: null, error: "Request timed out", elapsedMs: 0 };
	const message =
		err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
	return { status: "error", data: null, error: message, elapsedMs: 0 };
}

function mapHttpError(status: number): string {
	switch (status) {
		case 401:
			return "Invalid or missing API key";
		case 402:
			return "Insufficient credits — purchase more at https://dashboard.scrapegraphai.com";
		case 422:
			return "Invalid parameters — check your request";
		case 429:
			return "Rate limited — slow down and retry";
		case 500:
			return "Server error — try again later";
		default:
			return `HTTP ${status}`;
	}
}

type RequestResult<T> = { data: T; elapsedMs: number };

async function request<T>(
	method: "GET" | "POST",
	path: string,
	apiKey: string,
	body?: object,
): Promise<RequestResult<T>> {
	const url = `${BASE_URL}${path}`;
	debug(`→ ${method} ${url}`, body);

	const start = performance.now();
	const res = await fetch(url, {
		method,
		headers: {
			"SGAI-APIKEY": apiKey,
			...(body ? { "Content-Type": "application/json" } : {}),
		},
		body: body ? JSON.stringify(body) : undefined,
		signal: AbortSignal.timeout(getTimeoutMs()),
	});

	if (!res.ok) {
		let detail = mapHttpError(res.status);
		try {
			const errBody = await res.json();
			debug(`← ${res.status}`, errBody);
			if (errBody?.detail) detail = `${detail}: ${errBody.detail}`;
		} catch {}
		throw new Error(detail);
	}

	const data = (await res.json()) as T;
	const elapsedMs = Math.round(performance.now() - start);
	debug(`← ${res.status} (${elapsedMs}ms)`, data);
	return { data, elapsedMs };
}

type PollResponse = {
	status: string;
	request_id?: string;
	crawl_id?: string;
	error?: string;
	[key: string]: unknown;
};

async function pollUntilDone(
	path: string,
	id: string,
	apiKey: string,
	onPoll?: (status: string) => void,
): Promise<RequestResult<PollResponse>> {
	const deadline = Date.now() + getTimeoutMs();
	let totalMs = 0;

	while (Date.now() < deadline) {
		const { data, elapsedMs } = await request<PollResponse>("GET", `${path}/${id}`, apiKey);
		totalMs += elapsedMs;
		onPoll?.(data.status);

		if (data.status === "completed" || data.status === "done") return { data, elapsedMs: totalMs };
		if (data.status === "failed") throw new Error(data.error ?? "Job failed");

		await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
	}

	throw new Error("Polling timed out");
}

async function submitAndPoll(
	path: string,
	apiKey: string,
	body: object,
	idField: string,
	onPoll?: (status: string) => void,
): Promise<RequestResult<unknown>> {
	const { data: res, elapsedMs } = await request<PollResponse>("POST", path, apiKey, body);
	if (res.status === "completed" || res.status === "done") return { data: res, elapsedMs };
	const id = res[idField];
	if (typeof id !== "string") throw new Error(`Missing ${idField} in response`);
	const poll = await pollUntilDone(path, id, apiKey, onPoll);
	return { data: poll.data, elapsedMs: elapsedMs + poll.elapsedMs };
}

// --- Async endpoints ---

export async function smartScraper(
	apiKey: string,
	params: SmartScraperParams,
	onPoll?: (status: string) => void,
): Promise<ApiResult<unknown>> {
	try {
		SmartScraperSchema.parse(params);
		const { data, elapsedMs } = await submitAndPoll(
			"/smartscraper",
			apiKey,
			params,
			"request_id",
			onPoll,
		);
		return ok(data, elapsedMs);
	} catch (err) {
		return fail(err);
	}
}

export async function searchScraper(
	apiKey: string,
	params: SearchScraperParams,
	onPoll?: (status: string) => void,
): Promise<ApiResult<unknown>> {
	try {
		SearchScraperSchema.parse(params);
		const { data, elapsedMs } = await submitAndPoll(
			"/searchscraper",
			apiKey,
			params,
			"request_id",
			onPoll,
		);
		return ok(data, elapsedMs);
	} catch (err) {
		return fail(err);
	}
}

export async function markdownify(
	apiKey: string,
	params: MarkdownifyParams,
	onPoll?: (status: string) => void,
): Promise<ApiResult<unknown>> {
	try {
		MarkdownifySchema.parse(params);
		const { data, elapsedMs } = await submitAndPoll(
			"/markdownify",
			apiKey,
			params,
			"request_id",
			onPoll,
		);
		return ok(data, elapsedMs);
	} catch (err) {
		return fail(err);
	}
}

export async function scrape(
	apiKey: string,
	params: ScrapeParams,
	onPoll?: (status: string) => void,
): Promise<ApiResult<unknown>> {
	try {
		ScrapeSchema.parse(params);
		const { data, elapsedMs } = await submitAndPoll(
			"/scrape",
			apiKey,
			params,
			"request_id",
			onPoll,
		);
		return ok(data, elapsedMs);
	} catch (err) {
		return fail(err);
	}
}

export async function crawl(
	apiKey: string,
	params: CrawlParams,
	onPoll?: (status: string) => void,
): Promise<ApiResult<unknown>> {
	try {
		CrawlSchema.parse(params);
		const { data, elapsedMs } = await submitAndPoll("/crawl", apiKey, params, "crawl_id", onPoll);
		return ok(data, elapsedMs);
	} catch (err) {
		return fail(err);
	}
}

export async function agenticScraper(
	apiKey: string,
	params: AgenticScraperParams,
	onPoll?: (status: string) => void,
): Promise<ApiResult<unknown>> {
	try {
		AgenticScraperSchema.parse(params);
		const { data, elapsedMs } = await submitAndPoll(
			"/agentic-scrapper",
			apiKey,
			params,
			"request_id",
			onPoll,
		);
		return ok(data, elapsedMs);
	} catch (err) {
		return fail(err);
	}
}

export async function generateSchema(
	apiKey: string,
	params: GenerateSchemaParams,
	onPoll?: (status: string) => void,
): Promise<ApiResult<unknown>> {
	try {
		GenerateSchemaSchema.parse(params);
		const { data, elapsedMs } = await submitAndPoll(
			"/generate_schema",
			apiKey,
			params,
			"request_id",
			onPoll,
		);
		return ok(data, elapsedMs);
	} catch (err) {
		return fail(err);
	}
}

// --- Sync endpoints ---

export async function sitemap(apiKey: string, params: SitemapParams): Promise<ApiResult<unknown>> {
	try {
		SitemapSchema.parse(params);
		const { data, elapsedMs } = await request("POST", "/sitemap", apiKey, params);
		return ok(data, elapsedMs);
	} catch (err) {
		return fail(err);
	}
}

export async function getCredits(apiKey: string): Promise<ApiResult<unknown>> {
	try {
		const { data, elapsedMs } = await request("GET", "/credits", apiKey);
		return ok(data, elapsedMs);
	} catch (err) {
		return fail(err);
	}
}

export async function checkHealth(apiKey: string): Promise<ApiResult<unknown>> {
	try {
		const { data, elapsedMs } = await request("GET", "/healthz", apiKey);
		return ok(data, elapsedMs);
	} catch (err) {
		return fail(err);
	}
}

export async function history(apiKey: string, params: HistoryParams): Promise<ApiResult<unknown>> {
	try {
		const parsed = HistorySchema.parse(params);
		const qs = new URLSearchParams();
		qs.set("page", String(parsed.page));
		qs.set("page_size", String(parsed.page_size));
		const { data, elapsedMs } = await request("GET", `/history/${parsed.service}?${qs}`, apiKey);
		return ok(data, elapsedMs);
	} catch (err) {
		return fail(err);
	}
}
