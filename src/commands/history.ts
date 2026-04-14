import * as p from "@clack/prompts";
import chalk from "chalk";
import { defineCommand } from "citty";
import { history } from "scrapegraph-js";
import { getApiKey } from "../lib/client.js";
import * as log from "../lib/log.js";

const HISTORY_SERVICES = ["scrape", "extract", "schema", "search", "monitor", "crawl"] as const;
const VALID = HISTORY_SERVICES.join(", ");
const LOAD_MORE = "__load_more__";

type HistoryRow = Record<string, unknown>;

function getId(row: HistoryRow): string {
	return String(row.id ?? "unknown");
}

function label(row: HistoryRow): string {
	const id = getId(row);
	const short = id.length > 12 ? `${id.slice(0, 12)}...` : id;
	const status = String(row.status ?? "—");

	const params = row.params as Record<string, unknown> | undefined;
	const url = String(params?.url ?? params?.query ?? "");
	const urlShort = url.length > 50 ? `${url.slice(0, 49)}...` : url;

	const color =
		status === "completed"
			? chalk.green
			: status === "failed"
				? chalk.red
				: chalk.yellow;

	return `${chalk.dim(short)}  ${color(status)}  ${urlShort}`;
}

function hint(row: HistoryRow): string {
	const ts = row.createdAt;
	if (!ts) return "";
	const d = new Date(String(ts));
	return Number.isNaN(d.getTime()) ? String(ts) : d.toLocaleString();
}

export default defineCommand({
	meta: {
		name: "history",
		description: "View request history for a service",
	},
	args: {
		service: {
			type: "positional",
			description: `Service name (${VALID})`,
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
					value: getId(row),
					label: label(row),
					hint: hint(row),
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

				const match = allRows.find((r) => getId(r) === selected);
				if (match) out.result(match);

				const back = await p.confirm({ message: "Back to list?" });
				if (p.isCancel(back) || !back) return;
			}
		} catch (err) {
			out.error(err instanceof Error ? err.message : String(err));
		}
	},
});
