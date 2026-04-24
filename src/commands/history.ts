import * as p from "@clack/prompts";
import chalk from "chalk";
import { defineCommand } from "citty";
import { history } from "scrapegraph-js";
import type { HistoryEntry, Service } from "scrapegraph-js";
import { resolveApiKey } from "../lib/folders.js";
import * as log from "../lib/log.js";
import { parseIntArg } from "../lib/parse.js";

const SERVICES = ["scrape", "extract", "search", "monitor", "crawl"] as const;
const VALID = SERVICES.join(", ");
const LOAD_MORE = "__load_more__";

function entryUrl(e: HistoryEntry): string {
	const params = e.params as Record<string, unknown>;
	return String(params.url ?? params.query ?? "");
}

function entryLabel(e: HistoryEntry): string {
	const short = e.id.length > 12 ? `${e.id.slice(0, 12)}…` : e.id;
	const url = entryUrl(e);
	const urlShort = url.length > 50 ? `${url.slice(0, 49)}…` : url;
	const color =
		e.status === "completed" ? chalk.green : e.status === "failed" ? chalk.red : chalk.yellow;
	return `${chalk.dim(short)}  ${color(e.status)}  ${urlShort}`;
}

function entryHint(e: HistoryEntry): string {
	if (!e.createdAt) return "";
	const d = new Date(e.createdAt);
	return Number.isNaN(d.getTime()) ? e.createdAt : d.toLocaleString();
}

export default defineCommand({
	meta: {
		name: "history",
		description: "View request history",
	},
	args: {
		service: {
			type: "positional",
			description: `Service (optional): ${VALID}`,
			required: false,
		},
		page: { type: "string", description: "Page number (default: 1)" },
		"page-size": { type: "string", description: "Results per page (default: 20, max: 100)" },
		json: { type: "boolean", description: "Output raw JSON (pipeable)" },
	},
	run: async ({ args }) => {
		const quiet = !!args.json;
		const out = log.create(quiet);
		const apiKey = await resolveApiKey(quiet);
		const rawService = args.service;
		if (rawService && !SERVICES.includes(rawService as Service)) {
			out.error(`Invalid service. Valid: ${VALID}`);
		}
		const service = rawService as Service | undefined;
		const requestId = (args as { _: string[] })._.at(1);
		const limit = args["page-size"] ? parseIntArg(args["page-size"], "page-size", out) : 20;
		let page = args.page ? parseIntArg(args.page, "page", out) : 1;

		const fetchPage = async (pg: number) => {
			const r = await history.list(apiKey, {
				page: pg,
				limit,
				...(service ? { service } : {}),
			});
			if (!r.data) out.error(r.error);
			const d = r.data as { data: HistoryEntry[]; pagination: { total: number } };
			return {
				rows: d.data ?? [],
				hasMore: (d.pagination?.total ?? 0) > pg * limit,
				ms: r.elapsedMs,
			};
		};

		if (requestId) {
			const result = await history.get(apiKey, requestId);
			if (result.data) out.result(result.data);
			else out.error(result.error);
			return;
		}

		if (quiet) {
			const { rows } = await fetchPage(page);
			out.result(rows);
			return;
		}

		out.start(`Fetching ${service ?? "all"} history`);
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
				value: row.id,
				label: entryLabel(row),
				hint: entryHint(row),
			}));

			if (hasMore) {
				options.push({
					value: LOAD_MORE,
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

			if (selected === LOAD_MORE) {
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

			const match = allRows.find((r) => r.id === selected);
			if (match) out.result(match);

			const back = await p.confirm({ message: "Back to list?" });
			if (p.isCancel(back) || !back) return;
		}
	},
});
