import * as p from "@clack/prompts";
import chalk from "chalk";
import { defineCommand } from "citty";
import { crawl, extract, getCredits, history, monitor, scrape, search } from "scrapegraph-js";
import { getApiKey } from "./lib/client.js";
import * as log from "./lib/log.js";

// ---------------------------------------------------------------------------
// extract
// ---------------------------------------------------------------------------

export const extractCommand = defineCommand({
	meta: {
		name: "extract",
		description: "Extract structured data from a URL using AI",
	},
	args: {
		url: {
			type: "positional",
			description: "Website URL to scrape",
			required: true,
		},
		prompt: {
			type: "string",
			alias: "p",
			description: "Extraction prompt",
			required: true,
		},
		schema: { type: "string", description: "Output JSON schema (as JSON string)" },
		mode: { type: "string", description: "HTML processing mode: normal (default), reader, prune" },
		scrolls: { type: "string", description: "Number of infinite scrolls (0-100)" },
		stealth: { type: "boolean", description: "Enable stealth mode" },
		cookies: { type: "string", description: "Cookies as JSON object string" },
		headers: { type: "string", description: "Custom headers as JSON object string" },
		country: { type: "string", description: "ISO country code for geo-targeting" },
		json: { type: "boolean", description: "Output raw JSON (pipeable)" },
	},
	run: async ({ args }) => {
		const out = log.create(!!args.json);
		out.docs("https://docs.scrapegraphai.com/api-reference/extract");
		const apiKey = await getApiKey(!!args.json);

		const fetchConfig: Record<string, unknown> = {};
		if (args.scrolls) fetchConfig.scrolls = Number(args.scrolls);
		if (args.stealth) fetchConfig.stealth = true;
		if (args.cookies) fetchConfig.cookies = JSON.parse(args.cookies);
		if (args.headers) fetchConfig.headers = JSON.parse(args.headers);
		if (args.country) fetchConfig.country = args.country;

		const params: Record<string, unknown> = {
			url: args.url,
			prompt: args.prompt,
		};
		if (args.schema) params.schema = JSON.parse(args.schema);
		if (args.mode) params.mode = args.mode;
		if (Object.keys(fetchConfig).length > 0) params.fetchConfig = fetchConfig;

		out.start("Extracting");
		try {
			const result = await extract(apiKey, params as any);
			out.stop(result.elapsedMs);
			out.result(result.data);
		} catch (err) {
			out.stop(0);
			out.error(err instanceof Error ? err.message : String(err));
		}
	},
});

// ---------------------------------------------------------------------------
// search
// ---------------------------------------------------------------------------

export const searchCommand = defineCommand({
	meta: {
		name: "search",
		description: "Search the web and extract data with AI",
	},
	args: {
		query: {
			type: "positional",
			description: "Search query",
			required: true,
		},
		prompt: {
			type: "string",
			alias: "p",
			description: "Extraction prompt for search results",
		},
		"num-results": {
			type: "string",
			description: "Number of websites to scrape (1-20, default 3)",
		},
		schema: { type: "string", description: "Output JSON schema (as JSON string)" },
		country: {
			type: "string",
			description: "Country code for geo-targeted search (e.g. 'us', 'de', 'jp')",
		},
		"time-range": {
			type: "string",
			description:
				"Filter results by recency: past_hour, past_24_hours, past_week, past_month, past_year",
		},
		format: {
			type: "string",
			description: "Result format: markdown (default) or html",
		},
		headers: { type: "string", description: "Custom headers as JSON object string" },
		json: { type: "boolean", description: "Output raw JSON (pipeable)" },
	},
	run: async ({ args }) => {
		const out = log.create(!!args.json);
		out.docs("https://docs.scrapegraphai.com/api-reference/search");
		const apiKey = await getApiKey(!!args.json);

		const params: Record<string, unknown> = { query: args.query };
		if (args["num-results"]) params.numResults = Number(args["num-results"]);
		if (args.schema) params.schema = JSON.parse(args.schema);
		if (args.prompt) params.prompt = args.prompt;
		if (args.country) params.country = args.country;
		if (args["time-range"]) params.timeRange = args["time-range"];
		if (args.format) params.format = args.format;
		if (args.headers) params.fetchConfig = { headers: JSON.parse(args.headers) };

		out.start("Searching");
		try {
			const result = await search(apiKey, params as any);
			out.stop(result.elapsedMs);
			out.result(result.data);
		} catch (err) {
			out.stop(0);
			out.error(err instanceof Error ? err.message : String(err));
		}
	},
});

// ---------------------------------------------------------------------------
// scrape
// ---------------------------------------------------------------------------

const SCRAPE_FORMATS = [
	"markdown",
	"html",
	"screenshot",
	"branding",
	"links",
	"images",
	"summary",
	"json",
] as const;
type ScrapeFormat = (typeof SCRAPE_FORMATS)[number];

export const scrapeCommand = defineCommand({
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
			description: `Output format: ${SCRAPE_FORMATS.join(", ")} (default: markdown). Comma-separate for multi-format output.`,
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
			.filter(Boolean) as ScrapeFormat[];
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
					out.error(`Unknown format: ${f}. Valid: ${SCRAPE_FORMATS.join(", ")}`);
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

// ---------------------------------------------------------------------------
// markdownify — convenience wrapper for `scrape --format markdown`
// ---------------------------------------------------------------------------

export const markdownifyCommand = defineCommand({
	meta: {
		name: "markdownify",
		description: "Convert a webpage to clean markdown",
	},
	args: {
		url: {
			type: "positional",
			description: "Website URL to convert",
			required: true,
		},
		mode: { type: "string", alias: "m", description: "Fetch mode: auto (default), fast, js" },
		stealth: { type: "boolean", description: "Enable stealth mode" },
		headers: { type: "string", description: "Custom headers as JSON object string" },
		json: { type: "boolean", description: "Output raw JSON (pipeable)" },
	},
	run: async ({ args }) => {
		const out = log.create(!!args.json);
		out.docs("https://docs.scrapegraphai.com/api-reference/scrape");
		const apiKey = await getApiKey(!!args.json);

		const fetchConfig: Record<string, unknown> = {};
		if (args.mode) fetchConfig.mode = args.mode;
		if (args.stealth) fetchConfig.stealth = true;
		if (args.headers) fetchConfig.headers = JSON.parse(args.headers);

		const params: Record<string, unknown> = {
			url: args.url,
			formats: [{ type: "markdown", mode: "normal" }],
		};
		if (Object.keys(fetchConfig).length > 0) params.fetchConfig = fetchConfig;

		out.start("Converting to markdown");
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

// ---------------------------------------------------------------------------
// crawl — starts a job then polls until completion
// ---------------------------------------------------------------------------

const CRAWL_POLL_INTERVAL_MS = 3000;

export const crawlCommand = defineCommand({
	meta: {
		name: "crawl",
		description: "Crawl and extract data from multiple pages",
	},
	args: {
		url: {
			type: "positional",
			description: "Starting URL to crawl",
			required: true,
		},
		"max-pages": { type: "string", description: "Maximum pages to crawl (default 50)" },
		"max-depth": { type: "string", description: "Crawl depth (default 2)" },
		"max-links-per-page": { type: "string", description: "Max links per page (default 10)" },
		"allow-external": { type: "boolean", description: "Allow crawling external domains" },
		format: {
			type: "string",
			alias: "f",
			description:
				"Page format: markdown (default), html, screenshot, branding, links, images, summary. Comma-separate for multi-format.",
		},
		mode: {
			type: "string",
			alias: "m",
			description: "Fetch mode: auto (default), fast, js",
		},
		stealth: { type: "boolean", description: "Enable stealth mode" },
		json: { type: "boolean", description: "Output raw JSON (pipeable)" },
	},
	run: async ({ args }) => {
		const out = log.create(!!args.json);
		out.docs("https://docs.scrapegraphai.com/api-reference/crawl");
		const apiKey = await getApiKey(!!args.json);

		const requestedFormats = (args.format ?? "markdown")
			.split(",")
			.map((f) => f.trim())
			.filter(Boolean);

		const formats = requestedFormats.map((f) => {
			if (f === "markdown" || f === "html")
				return { type: f as "markdown" | "html", mode: "normal" as const };
			return { type: f };
		});

		const params: Record<string, unknown> = { url: args.url, formats };
		if (args["max-pages"]) params.maxPages = Number(args["max-pages"]);
		if (args["max-depth"]) params.maxDepth = Number(args["max-depth"]);
		if (args["max-links-per-page"]) params.maxLinksPerPage = Number(args["max-links-per-page"]);
		if (args["allow-external"]) params.allowExternal = true;

		const fetchConfig: Record<string, unknown> = {};
		if (args.mode) fetchConfig.mode = args.mode;
		if (args.stealth) fetchConfig.stealth = true;
		if (Object.keys(fetchConfig).length > 0) params.fetchConfig = fetchConfig;

		out.start("Crawling");
		try {
			const job = await crawl.start(apiKey, params as any);
			const jobData = job.data as { id: string; status: string } | null;

			if (!jobData?.id) {
				out.stop(job.elapsedMs);
				out.result(job.data);
				return;
			}

			while (true) {
				await new Promise((r) => setTimeout(r, CRAWL_POLL_INTERVAL_MS));
				const status = await crawl.get(apiKey, jobData.id);
				const statusData = status.data as { status: string; [key: string]: unknown } | null;
				out.poll(statusData?.status ?? "unknown");

				if (
					statusData?.status === "completed" ||
					statusData?.status === "failed" ||
					statusData?.status === "deleted"
				) {
					out.stop(job.elapsedMs + status.elapsedMs);
					out.result(status.data);
					return;
				}
			}
		} catch (err) {
			out.stop(0);
			out.error(err instanceof Error ? err.message : String(err));
		}
	},
});

// ---------------------------------------------------------------------------
// monitor — create, list, get, update, delete, pause, resume, activity
// ---------------------------------------------------------------------------

const MONITOR_ACTIONS = [
	"create",
	"list",
	"get",
	"update",
	"delete",
	"pause",
	"resume",
	"activity",
] as const;
type MonitorAction = (typeof MONITOR_ACTIONS)[number];

const MONITOR_FORMATS = [
	"markdown",
	"html",
	"screenshot",
	"branding",
	"links",
	"images",
	"summary",
	"json",
] as const;

export const monitorCommand = defineCommand({
	meta: {
		name: "monitor",
		description: "Create and manage page-change monitors",
	},
	args: {
		action: {
			type: "positional",
			description: `Action: ${MONITOR_ACTIONS.join(", ")}`,
			required: true,
		},
		url: {
			type: "string",
			description: "URL to monitor (for create)",
		},
		id: {
			type: "string",
			description: "Monitor ID (for get, update, delete, pause, resume, activity)",
		},
		name: {
			type: "string",
			description: "Monitor name",
		},
		interval: {
			type: "string",
			description: "Check interval (e.g. '1h', '30m', '1d') — required for create",
		},
		format: {
			type: "string",
			alias: "f",
			description: `Formats to track: ${MONITOR_FORMATS.join(", ")} (default: markdown). Comma-separate for multi-format.`,
		},
		"webhook-url": {
			type: "string",
			description: "Webhook URL to notify on changes",
		},
		mode: {
			type: "string",
			alias: "m",
			description: "Fetch mode: auto (default), fast, js",
		},
		stealth: { type: "boolean", description: "Enable stealth mode" },
		limit: {
			type: "string",
			description: "Ticks per page for activity (max 100)",
		},
		cursor: {
			type: "string",
			description: "Pagination cursor for activity",
		},
		json: { type: "boolean", description: "Output raw JSON (pipeable)" },
	},
	run: async ({ args }) => {
		const out = log.create(!!args.json);
		const apiKey = await getApiKey(!!args.json);
		const action = args.action as MonitorAction;

		const buildFormats = (raw: string) =>
			raw
				.split(",")
				.map((f) => f.trim())
				.filter(Boolean)
				.map((f) => {
					if (f === "markdown" || f === "html") return { type: f, mode: "normal" as const };
					return { type: f };
				});

		switch (action) {
			case "create": {
				if (!args.url) {
					out.error("--url is required for create");
					return;
				}
				if (!args.interval) {
					out.error("--interval is required for create");
					return;
				}

				const params: Record<string, unknown> = {
					url: args.url,
					interval: args.interval,
					formats: buildFormats(args.format ?? "markdown"),
				};
				if (args.name) params.name = args.name;
				if (args["webhook-url"]) params.webhookUrl = args["webhook-url"];

				const fetchConfig: Record<string, unknown> = {};
				if (args.mode) fetchConfig.mode = args.mode;
				if (args.stealth) fetchConfig.stealth = true;
				if (Object.keys(fetchConfig).length > 0) params.fetchConfig = fetchConfig;

				out.start("Creating monitor");
				try {
					const result = await monitor.create(apiKey, params as any);
					out.stop(result.elapsedMs);
					out.result(result.data);
				} catch (err) {
					out.stop(0);
					out.error(err instanceof Error ? err.message : String(err));
				}
				break;
			}

			case "list": {
				out.start("Fetching monitors");
				try {
					const result = await monitor.list(apiKey);
					out.stop(result.elapsedMs);

					if (args.json) {
						out.result(result.data);
						return;
					}

					const monitors = result.data as Array<Record<string, unknown>> | null;
					if (!monitors?.length) {
						p.log.warning("No monitors found.");
						return;
					}

					for (const m of monitors) {
						const status = String(m.status ?? "");
						const color = status === "active" ? chalk.green : chalk.yellow;
						p.log.info(
							`${chalk.dim(String(m.cronId ?? m.scheduleId ?? ""))}  ${color(status)}  ${String((m.config as Record<string, unknown>)?.url ?? "")}  ${chalk.dim(String(m.interval ?? ""))}`,
						);
					}
				} catch (err) {
					out.stop(0);
					out.error(err instanceof Error ? err.message : String(err));
				}
				break;
			}

			case "get": {
				if (!args.id) {
					out.error("--id is required for get");
					return;
				}
				out.start("Fetching monitor");
				try {
					const result = await monitor.get(apiKey, args.id);
					out.stop(result.elapsedMs);
					out.result(result.data);
				} catch (err) {
					out.stop(0);
					out.error(err instanceof Error ? err.message : String(err));
				}
				break;
			}

			case "update": {
				if (!args.id) {
					out.error("--id is required for update");
					return;
				}
				const params: Record<string, unknown> = {};
				if (args.name) params.name = args.name;
				if (args.interval) params.interval = args.interval;
				if (args["webhook-url"]) params.webhookUrl = args["webhook-url"];
				if (args.format) params.formats = buildFormats(args.format);

				out.start("Updating monitor");
				try {
					const result = await monitor.update(apiKey, args.id, params as any);
					out.stop(result.elapsedMs);
					out.result(result.data);
				} catch (err) {
					out.stop(0);
					out.error(err instanceof Error ? err.message : String(err));
				}
				break;
			}

			case "delete": {
				if (!args.id) {
					out.error("--id is required for delete");
					return;
				}
				out.start("Deleting monitor");
				try {
					const result = await monitor.delete(apiKey, args.id);
					out.stop(result.elapsedMs);
					out.result(result.data);
				} catch (err) {
					out.stop(0);
					out.error(err instanceof Error ? err.message : String(err));
				}
				break;
			}

			case "pause": {
				if (!args.id) {
					out.error("--id is required for pause");
					return;
				}
				out.start("Pausing monitor");
				try {
					const result = await monitor.pause(apiKey, args.id);
					out.stop(result.elapsedMs);
					out.result(result.data);
				} catch (err) {
					out.stop(0);
					out.error(err instanceof Error ? err.message : String(err));
				}
				break;
			}

			case "resume": {
				if (!args.id) {
					out.error("--id is required for resume");
					return;
				}
				out.start("Resuming monitor");
				try {
					const result = await monitor.resume(apiKey, args.id);
					out.stop(result.elapsedMs);
					out.result(result.data);
				} catch (err) {
					out.stop(0);
					out.error(err instanceof Error ? err.message : String(err));
				}
				break;
			}

			case "activity": {
				if (!args.id) {
					out.error("--id is required for activity");
					return;
				}
				const params: { limit?: number; cursor?: string } = {};
				if (args.limit) params.limit = Number(args.limit);
				if (args.cursor) params.cursor = args.cursor;

				out.start("Fetching monitor activity");
				try {
					const result = await monitor.activity(apiKey, args.id, params);
					out.stop(result.elapsedMs);
					out.result(result.data);
				} catch (err) {
					out.stop(0);
					out.error(err instanceof Error ? err.message : String(err));
				}
				break;
			}

			default:
				out.error(`Unknown action: ${action}. Valid: ${MONITOR_ACTIONS.join(", ")}`);
		}
	},
});

// ---------------------------------------------------------------------------
// history — interactive browser with pagination, or direct by request-id
// ---------------------------------------------------------------------------

const HISTORY_SERVICES = ["scrape", "extract", "schema", "search", "monitor", "crawl"] as const;
const HISTORY_LOAD_MORE = "__load_more__";

type HistoryRow = Record<string, unknown>;

function historyId(row: HistoryRow): string {
	return String(row.id ?? "unknown");
}

function historyLabel(row: HistoryRow): string {
	const id = historyId(row);
	const short = id.length > 12 ? `${id.slice(0, 12)}...` : id;
	const status = String(row.status ?? "—");

	const params = row.params as Record<string, unknown> | undefined;
	const url = String(params?.url ?? params?.query ?? "");
	const urlShort = url.length > 50 ? `${url.slice(0, 49)}...` : url;

	const color =
		status === "completed" ? chalk.green : status === "failed" ? chalk.red : chalk.yellow;

	return `${chalk.dim(short)}  ${color(status)}  ${urlShort}`;
}

function historyHint(row: HistoryRow): string {
	const ts = row.createdAt;
	if (!ts) return "";
	const d = new Date(String(ts));
	return Number.isNaN(d.getTime()) ? String(ts) : d.toLocaleString();
}

export const historyCommand = defineCommand({
	meta: {
		name: "history",
		description: "View request history for a service",
	},
	args: {
		service: {
			type: "positional",
			description: `Service name (${HISTORY_SERVICES.join(", ")})`,
			required: false,
		},
		page: { type: "string", description: "Page number (default: 1)" },
		"page-size": { type: "string", description: "Results per page (default: 20, max: 100)" },
		json: { type: "boolean", description: "Output raw JSON (pipeable)" },
	},
	run: async ({ args }) => {
		const quiet = !!args.json;
		const out = log.create(quiet);
		const apiKey = await getApiKey(quiet);
		const service = args.service as (typeof HISTORY_SERVICES)[number] | undefined;
		const requestId = (args as { _: string[] })._.at(1);
		const limit = args["page-size"] ? Number(args["page-size"]) : 20;
		let page = args.page ? Number(args.page) : 1;

		const fetchPage = async (pg: number) => {
			const params: Record<string, unknown> = { page: pg, limit };
			if (service) params.service = service;
			const r = await history.list(apiKey, params as any);
			const d = r.data as {
				data?: HistoryRow[];
				pagination?: { page: number; limit: number; total: number };
			} | null;
			const rows = d?.data ?? [];
			const total = d?.pagination?.total ?? 0;
			return {
				rows,
				hasMore: total > pg * limit,
				ms: r.elapsedMs,
			};
		};

		if (quiet && !requestId) {
			try {
				const { rows } = await fetchPage(page);
				out.result(rows);
			} catch (err) {
				out.error(err instanceof Error ? err.message : String(err));
			}
			return;
		}

		if (requestId) {
			try {
				const result = await history.get(apiKey, requestId);
				out.result(result.data);
			} catch (err) {
				out.error(err instanceof Error ? err.message : String(err));
			}
			return;
		}

		out.start(`Fetching ${service ?? "all"} history`);
		try {
			const first = await fetchPage(page);
			out.stop(first.ms);

			if (first.rows.length === 0) {
				p.log.warning("No history found.");
				return;
			}

			const allRows = [...first.rows];
			let hasMore = first.hasMore;

			while (true) {
				const options = allRows.map((row) => ({
					value: historyId(row),
					label: historyLabel(row),
					hint: historyHint(row),
				}));

				if (hasMore) {
					options.push({
						value: HISTORY_LOAD_MORE,
						label: chalk.blue.bold("↓ Load more…"),
						hint: `page ${page + 1}`,
					});
				}

				const selected = await p.select({
					message: `${allRows.length} requests — select one to view`,
					options,
					maxItems: 15,
				});

				if (p.isCancel(selected)) {
					p.cancel("Cancelled");
					return;
				}

				if (selected === HISTORY_LOAD_MORE) {
					page++;
					const ls = p.spinner();
					ls.start(`Loading page ${page}`);
					const next = await fetchPage(page);
					ls.stop("Done");

					if (next.rows.length === 0) {
						hasMore = false;
						p.log.warning("No more results.");
						continue;
					}

					allRows.push(...next.rows);
					hasMore = next.hasMore;
					continue;
				}

				const match = allRows.find((r) => historyId(r) === selected);
				if (match) out.result(match);

				const back = await p.confirm({ message: "Back to list?" });
				if (p.isCancel(back) || !back) return;
			}
		} catch (err) {
			out.error(err instanceof Error ? err.message : String(err));
		}
	},
});

// ---------------------------------------------------------------------------
// credits
// ---------------------------------------------------------------------------

export const creditsCommand = defineCommand({
	meta: {
		name: "credits",
		description: "Check your credit balance",
	},
	args: {
		json: { type: "boolean", description: "Output raw JSON (pipeable)" },
	},
	run: async ({ args }) => {
		const out = log.create(!!args.json);
		const apiKey = await getApiKey(!!args.json);

		out.start("Fetching credits");
		try {
			const result = await getCredits(apiKey);
			out.stop(result.elapsedMs);
			out.result(result.data);
		} catch (err) {
			out.stop(0);
			out.error(err instanceof Error ? err.message : String(err));
		}
	},
});
