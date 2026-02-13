import * as p from "@clack/prompts";
import chalk from "chalk";
import { defineCommand } from "citty";
import { resolveApiKey } from "../lib/folders.js";
import * as log from "../lib/log.js";
import { HISTORY_SERVICES } from "../lib/schemas.js";
import * as scrapegraphai from "../lib/scrapegraphai.js";

const VALID = HISTORY_SERVICES.join(", ");
const LOAD_MORE = "__load_more__";

function getId(row: Record<string, unknown>): string {
	return String(row.request_id ?? row.crawl_id ?? row.id ?? "unknown");
}

function label(row: Record<string, unknown>): string {
	const id = getId(row);
	const short = id.length > 12 ? `${id.slice(0, 12)}…` : id;
	const status = String(row.status ?? "—");
	const url = String(row.website_url ?? row.url ?? row.user_prompt ?? "");
	const urlShort = url.length > 50 ? `${url.slice(0, 49)}…` : url;

	const color =
		status === "completed" || status === "done"
			? chalk.green
			: status === "failed"
				? chalk.red
				: chalk.yellow;

	return `${chalk.dim(short)}  ${color(status)}  ${urlShort}`;
}

function hint(row: Record<string, unknown>): string {
	const ts = row.created_at ?? row.timestamp ?? row.updated_at;
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
			required: true,
		},
		page: { type: "string", description: "Page number (default: 1)" },
		"page-size": { type: "string", description: "Results per page (default: 10, max: 100)" },
		json: { type: "boolean", description: "Output raw JSON (pipeable)" },
	},
	run: async ({ args }) => {
		const quiet = !!args.json;
		const out = log.create(quiet);
		const key = await resolveApiKey(quiet);
		const service = args.service as scrapegraphai.HistoryParams["service"];
		const requestId = (args as { _: string[] })._.at(1);
		const pageSize = args["page-size"] ? Number(args["page-size"]) : 10;
		let page = args.page ? Number(args.page) : 1;

		const fetchPage = async (pg: number) => {
			const r = await scrapegraphai.history(key, { service, page: pg, page_size: pageSize });
			if (r.status === "error") out.error(r.error);
			const d = r.data as { requests: Record<string, unknown>[]; next_key?: string };
			return { rows: d.requests ?? [], hasMore: !!d.next_key, ms: r.elapsedMs };
		};

		if (quiet || requestId) {
			const { rows } = await fetchPage(page);
			if (requestId) {
				const match = rows.find((r) => getId(r) === requestId);
				if (!match) out.error(`Request ${requestId} not found on page ${page}`);
				out.result(match);
				return;
			}
			out.result(rows);
			return;
		}

		out.start(`Fetching ${service} history`);
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
	},
});
