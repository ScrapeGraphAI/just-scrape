import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";

mock.module("../src/lib/env.js", () => ({
	env: { debug: false, timeoutS: 120 },
	CONFIG_DIR: "/tmp/test-scrapegraphai",
	CONFIG_PATH: "/tmp/test-scrapegraphai/config.json",
}));

import * as scrapegraphai from "../src/lib/scrapegraphai.js";

const API_KEY = "test-sgai-key-abc123";
const BASE = "https://api.scrapegraphai.com/v1";

function json(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

let fetchSpy: ReturnType<typeof spyOn<typeof globalThis, "fetch">>;

afterEach(() => {
	fetchSpy?.mockRestore();
});

function expectPost(callIndex: number, path: string, body?: object) {
	const [url, init] = fetchSpy.mock.calls[callIndex] as [string, RequestInit];
	expect(url).toBe(`${BASE}${path}`);
	expect(init.method).toBe("POST");
	expect((init.headers as Record<string, string>)["SGAI-APIKEY"]).toBe(API_KEY);
	expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
	if (body) expect(JSON.parse(init.body as string)).toEqual(body);
}

function expectGet(callIndex: number, path: string) {
	const [url, init] = fetchSpy.mock.calls[callIndex] as [string, RequestInit];
	expect(url).toBe(`${BASE}${path}`);
	expect(init.method).toBe("GET");
	expect((init.headers as Record<string, string>)["SGAI-APIKEY"]).toBe(API_KEY);
}

// ---------------------------------------------------------------------------
// smartScraper — exhaustive (tests all shared internals)
// ---------------------------------------------------------------------------

describe("smartScraper", () => {
	const params = { user_prompt: "Extract prices", website_url: "https://example.com" };

	test("immediate completion", async () => {
		const body = { status: "completed", result: { prices: [10, 20] } };
		fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce(json(body));

		const res = await scrapegraphai.smartScraper(API_KEY, params);

		expect(res.status).toBe("success");
		expect(res.data).toEqual(body);
		expect(res.elapsedMs).toBeGreaterThanOrEqual(0);
		expect(fetchSpy).toHaveBeenCalledTimes(1);
		expectPost(0, "/smartscraper", params);
	});

	test("polls when POST returns pending", async () => {
		const pollResult = { status: "completed", request_id: "req-1", result: { data: "scraped" } };
		fetchSpy = spyOn(globalThis, "fetch")
			.mockResolvedValueOnce(json({ status: "pending", request_id: "req-1" }))
			.mockResolvedValueOnce(json(pollResult));

		const res = await scrapegraphai.smartScraper(API_KEY, params);

		expect(res.status).toBe("success");
		expect(res.data).toEqual(pollResult);
		expect(fetchSpy).toHaveBeenCalledTimes(2);
		expectPost(0, "/smartscraper", params);
		expectGet(1, "/smartscraper/req-1");
	});

	test("calls onPoll callback", async () => {
		const statuses: string[] = [];
		fetchSpy = spyOn(globalThis, "fetch")
			.mockResolvedValueOnce(json({ status: "pending", request_id: "req-1" }))
			.mockResolvedValueOnce(json({ status: "completed", request_id: "req-1" }));

		await scrapegraphai.smartScraper(API_KEY, params, (s) => statuses.push(s));

		expect(statuses).toEqual(["completed"]);
	});

	test("poll failure", async () => {
		fetchSpy = spyOn(globalThis, "fetch")
			.mockResolvedValueOnce(json({ status: "pending", request_id: "req-1" }))
			.mockResolvedValueOnce(json({ status: "failed", error: "Job exploded" }));

		const res = await scrapegraphai.smartScraper(API_KEY, params);

		expect(res.status).toBe("error");
		expect(res.error).toBe("Job exploded");
	});

	test("validation failure", async () => {
		const res = await scrapegraphai.smartScraper(API_KEY, { user_prompt: "" } as any);

		expect(res.status).toBe("error");
		expect(res.error).toBeDefined();
	});

	test("HTTP 401", async () => {
		fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce(
			json({ detail: "Invalid key" }, 401),
		);
		const res = await scrapegraphai.smartScraper(API_KEY, params);

		expect(res.status).toBe("error");
		expect(res.error).toContain("Invalid or missing API key");
	});

	test("HTTP 402", async () => {
		fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce(json({}, 402));
		const res = await scrapegraphai.smartScraper(API_KEY, params);

		expect(res.status).toBe("error");
		expect(res.error).toContain("Insufficient credits");
	});

	test("HTTP 422", async () => {
		fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce(json({}, 422));
		const res = await scrapegraphai.smartScraper(API_KEY, params);

		expect(res.status).toBe("error");
		expect(res.error).toContain("Invalid parameters");
	});

	test("HTTP 429", async () => {
		fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce(json({}, 429));
		const res = await scrapegraphai.smartScraper(API_KEY, params);

		expect(res.status).toBe("error");
		expect(res.error).toContain("Rate limited");
	});

	test("HTTP 500", async () => {
		fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce(json({}, 500));
		const res = await scrapegraphai.smartScraper(API_KEY, params);

		expect(res.status).toBe("error");
		expect(res.error).toContain("Server error");
	});

	test("HTTP error with detail", async () => {
		fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce(
			json({ detail: "quota exceeded" }, 402),
		);
		const res = await scrapegraphai.smartScraper(API_KEY, params);

		expect(res.status).toBe("error");
		expect(res.error).toContain("quota exceeded");
	});

	test("timeout", async () => {
		fetchSpy = spyOn(globalThis, "fetch").mockRejectedValueOnce(
			new DOMException("The operation was aborted", "TimeoutError"),
		);
		const res = await scrapegraphai.smartScraper(API_KEY, params);

		expect(res.status).toBe("error");
		expect(res.error).toBe("Request timed out");
	});

	test("network error", async () => {
		fetchSpy = spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("fetch failed"));
		const res = await scrapegraphai.smartScraper(API_KEY, params);

		expect(res.status).toBe("error");
		expect(res.error).toBe("fetch failed");
	});
});

// ---------------------------------------------------------------------------
// searchScraper
// ---------------------------------------------------------------------------

describe("searchScraper", () => {
	const params = { user_prompt: "Best pizza in NYC" };

	test("success", async () => {
		const body = { status: "completed", results: [{ title: "Joe's Pizza" }] };
		fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce(json(body));

		const res = await scrapegraphai.searchScraper(API_KEY, params);

		expect(res.status).toBe("success");
		expect(res.data).toEqual(body);
		expectPost(0, "/searchscraper", params);
	});

	test("validation failure", async () => {
		const res = await scrapegraphai.searchScraper(API_KEY, { user_prompt: "" } as any);
		expect(res.status).toBe("error");
	});
});

// ---------------------------------------------------------------------------
// markdownify
// ---------------------------------------------------------------------------

describe("markdownify", () => {
	const params = { website_url: "https://example.com" };

	test("success", async () => {
		const body = { status: "completed", result: "# Hello" };
		fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce(json(body));

		const res = await scrapegraphai.markdownify(API_KEY, params);

		expect(res.status).toBe("success");
		expect(res.data).toEqual(body);
		expectPost(0, "/markdownify", params);
	});

	test("validation failure", async () => {
		const res = await scrapegraphai.markdownify(API_KEY, { website_url: "not-a-url" } as any);
		expect(res.status).toBe("error");
	});
});

// ---------------------------------------------------------------------------
// scrape
// ---------------------------------------------------------------------------

describe("scrape", () => {
	const params = { website_url: "https://example.com" };

	test("success", async () => {
		const body = { status: "completed", html: "<html>...</html>" };
		fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce(json(body));

		const res = await scrapegraphai.scrape(API_KEY, params);

		expect(res.status).toBe("success");
		expectPost(0, "/scrape", params);
	});

	test("validation failure", async () => {
		const res = await scrapegraphai.scrape(API_KEY, { website_url: "" } as any);
		expect(res.status).toBe("error");
	});
});

// ---------------------------------------------------------------------------
// crawl — uses crawl_id instead of request_id
// ---------------------------------------------------------------------------

describe("crawl", () => {
	const params = { url: "https://example.com" };

	test("immediate completion", async () => {
		const body = { status: "done", pages: [{ url: "https://example.com", content: "data" }] };
		fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce(json(body));

		const res = await scrapegraphai.crawl(API_KEY, params);

		expect(res.status).toBe("success");
		expect(res.data).toEqual(body);
		expectPost(0, "/crawl", params);
	});

	test("polls with crawl_id", async () => {
		fetchSpy = spyOn(globalThis, "fetch")
			.mockResolvedValueOnce(json({ status: "pending", crawl_id: "crawl-99" }))
			.mockResolvedValueOnce(json({ status: "done", crawl_id: "crawl-99", pages: [] }));

		const res = await scrapegraphai.crawl(API_KEY, params);

		expect(res.status).toBe("success");
		expect(fetchSpy).toHaveBeenCalledTimes(2);
		expectGet(1, "/crawl/crawl-99");
	});

	test("validation failure", async () => {
		const res = await scrapegraphai.crawl(API_KEY, { url: "not-a-url" } as any);
		expect(res.status).toBe("error");
	});
});

// ---------------------------------------------------------------------------
// agenticScraper
// ---------------------------------------------------------------------------

describe("agenticScraper", () => {
	const params = { url: "https://example.com", steps: ["Click login"] };

	test("success", async () => {
		const body = { status: "completed", result: { screenshot: "base64..." } };
		fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce(json(body));

		const res = await scrapegraphai.agenticScraper(API_KEY, params);

		expect(res.status).toBe("success");
		expectPost(0, "/agentic-scrapper", params);
	});

	test("validation failure", async () => {
		const res = await scrapegraphai.agenticScraper(API_KEY, { url: "nope" } as any);
		expect(res.status).toBe("error");
	});
});

// ---------------------------------------------------------------------------
// generateSchema
// ---------------------------------------------------------------------------

describe("generateSchema", () => {
	const params = { user_prompt: "Schema for product" };

	test("success", async () => {
		const body = { status: "completed", schema: { type: "object" } };
		fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce(json(body));

		const res = await scrapegraphai.generateSchema(API_KEY, params);

		expect(res.status).toBe("success");
		expectPost(0, "/generate_schema", params);
	});

	test("validation failure", async () => {
		const res = await scrapegraphai.generateSchema(API_KEY, { user_prompt: "" } as any);
		expect(res.status).toBe("error");
	});
});

// ---------------------------------------------------------------------------
// sitemap — sync endpoint (POST, no polling)
// ---------------------------------------------------------------------------

describe("sitemap", () => {
	const params = { website_url: "https://example.com" };

	test("success", async () => {
		const body = { urls: ["https://example.com/a", "https://example.com/b"] };
		fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce(json(body));

		const res = await scrapegraphai.sitemap(API_KEY, params);

		expect(res.status).toBe("success");
		expect(res.data).toEqual(body);
		expectPost(0, "/sitemap", params);
	});

	test("validation failure", async () => {
		const res = await scrapegraphai.sitemap(API_KEY, { website_url: "garbage" } as any);
		expect(res.status).toBe("error");
	});
});

// ---------------------------------------------------------------------------
// getCredits — GET, no body
// ---------------------------------------------------------------------------

describe("getCredits", () => {
	test("success", async () => {
		const body = { remaining_credits: 420, total_credits_used: 69 };
		fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce(json(body));

		const res = await scrapegraphai.getCredits(API_KEY);

		expect(res.status).toBe("success");
		expect(res.data).toEqual(body);
		expectGet(0, "/credits");
	});
});

// ---------------------------------------------------------------------------
// checkHealth — GET, no body
// ---------------------------------------------------------------------------

describe("checkHealth", () => {
	test("success", async () => {
		const body = { status: "ok" };
		fetchSpy = spyOn(globalThis, "fetch").mockResolvedValueOnce(json(body));

		const res = await scrapegraphai.checkHealth(API_KEY);

		expect(res.status).toBe("success");
		expect(res.data).toEqual(body);
		expectGet(0, "/healthz");
	});
});
