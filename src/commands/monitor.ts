import * as p from "@clack/prompts";
import chalk from "chalk";
import { defineCommand } from "citty";
import { monitor } from "scrapegraph-js";
import type {
	ApiMonitorCreateInput,
	ApiMonitorUpdateInput,
	ApiScrapeFormatEntry,
} from "scrapegraph-js";
import { resolveApiKey } from "../lib/folders.js";
import * as log from "../lib/log.js";

const ACTIONS = [
	"create",
	"list",
	"get",
	"update",
	"delete",
	"pause",
	"resume",
	"activity",
] as const;
type Action = (typeof ACTIONS)[number];

const FORMATS = [
	"markdown",
	"html",
	"screenshot",
	"branding",
	"links",
	"images",
	"summary",
] as const;

function buildFormats(raw: string): ApiScrapeFormatEntry[] {
	return raw
		.split(",")
		.map((f) => f.trim())
		.filter(Boolean)
		.map((f) => {
			if (f === "markdown" || f === "html") return { type: f, mode: "normal" as const };
			return { type: f } as ApiScrapeFormatEntry;
		});
}

export default defineCommand({
	meta: {
		name: "monitor",
		description: `Manage page-change monitors (${ACTIONS.join(", ")})`,
	},
	args: {
		action: {
			type: "positional",
			description: `Action: ${ACTIONS.join(", ")}`,
			required: true,
		},
		id: { type: "string", description: "Monitor ID (cronId)" },
		url: { type: "string", description: "URL to monitor (create)" },
		name: { type: "string", description: "Monitor name" },
		interval: {
			type: "string",
			description: "Cron expression or shorthand (e.g. '0 * * * *', '1h') — required for create",
		},
		format: {
			type: "string",
			alias: "f",
			description: `Formats to track, comma-separated: ${FORMATS.join(", ")} (default: markdown)`,
		},
		"webhook-url": { type: "string", description: "Webhook URL for change notifications" },
		mode: { type: "string", alias: "m", description: "Fetch mode: auto (default), fast, js" },
		stealth: { type: "boolean", description: "Enable stealth mode" },
		limit: { type: "string", description: "Ticks per page for activity (max 100)" },
		cursor: { type: "string", description: "Pagination cursor for activity" },
		json: { type: "boolean", description: "Output raw JSON (pipeable)" },
	},
	run: async ({ args }) => {
		const out = log.create(!!args.json);
		out.docs("https://docs.scrapegraphai.com/api-reference/monitor");
		const apiKey = await resolveApiKey(!!args.json);
		const action = args.action as Action;

		if (!ACTIONS.includes(action)) {
			out.error(`Unknown action: ${action}. Valid: ${ACTIONS.join(", ")}`);
			return;
		}

		const needsId: Action[] = ["get", "update", "delete", "pause", "resume", "activity"];
		if (needsId.includes(action) && !args.id) {
			out.error(`--id is required for ${action}`);
			return;
		}

		const fetchConfig: Record<string, unknown> = {};
		if (args.mode) fetchConfig.mode = args.mode;
		if (args.stealth) fetchConfig.stealth = true;

		switch (action) {
			case "create": {
				if (!args.url) return out.error("--url is required for create");
				if (!args.interval) return out.error("--interval is required for create");

				const params: ApiMonitorCreateInput = {
					url: args.url,
					interval: args.interval,
					formats: buildFormats(args.format ?? "markdown"),
				};
				const mut = params as Record<string, unknown>;
				if (args.name) mut.name = args.name;
				if (args["webhook-url"]) mut.webhookUrl = args["webhook-url"];
				if (Object.keys(fetchConfig).length > 0) mut.fetchConfig = fetchConfig;

				out.start("Creating monitor");
				const result = await monitor.create(apiKey, params);
				out.stop(result.elapsedMs);
				if (result.data) out.result(result.data);
				else out.error(result.error);
				return;
			}

			case "list": {
				out.start("Fetching monitors");
				const result = await monitor.list(apiKey);
				out.stop(result.elapsedMs);
				if (!result.data) return out.error(result.error);
				if (args.json) return out.result(result.data);
				if (result.data.length === 0) {
					p.log.warning("No monitors found.");
					return;
				}
				for (const m of result.data) {
					const color = m.status === "active" ? chalk.green : chalk.yellow;
					p.log.info(
						`${chalk.dim(m.cronId)}  ${color(m.status)}  ${m.config.url}  ${chalk.dim(m.interval)}`,
					);
				}
				return;
			}

			case "get": {
				out.start("Fetching monitor");
				const result = await monitor.get(apiKey, args.id as string);
				out.stop(result.elapsedMs);
				if (result.data) out.result(result.data);
				else out.error(result.error);
				return;
			}

			case "update": {
				const params: ApiMonitorUpdateInput = {};
				const mut = params as Record<string, unknown>;
				if (args.name) mut.name = args.name;
				if (args.interval) mut.interval = args.interval;
				if (args["webhook-url"]) mut.webhookUrl = args["webhook-url"];
				if (args.format) mut.formats = buildFormats(args.format);
				if (Object.keys(fetchConfig).length > 0) mut.fetchConfig = fetchConfig;

				out.start("Updating monitor");
				const result = await monitor.update(apiKey, args.id as string, params);
				out.stop(result.elapsedMs);
				if (result.data) out.result(result.data);
				else out.error(result.error);
				return;
			}

			case "delete": {
				out.start("Deleting monitor");
				const result = await monitor.delete(apiKey, args.id as string);
				out.stop(result.elapsedMs);
				if (result.data) out.result(result.data);
				else out.error(result.error);
				return;
			}

			case "pause": {
				out.start("Pausing monitor");
				const result = await monitor.pause(apiKey, args.id as string);
				out.stop(result.elapsedMs);
				if (result.data) out.result(result.data);
				else out.error(result.error);
				return;
			}

			case "resume": {
				out.start("Resuming monitor");
				const result = await monitor.resume(apiKey, args.id as string);
				out.stop(result.elapsedMs);
				if (result.data) out.result(result.data);
				else out.error(result.error);
				return;
			}

			case "activity": {
				const qp: { limit?: number; cursor?: string } = {};
				if (args.limit) qp.limit = Number(args.limit);
				if (args.cursor) qp.cursor = args.cursor;

				out.start("Fetching monitor activity");
				const result = await monitor.activity(apiKey, args.id as string, qp);
				out.stop(result.elapsedMs);
				if (result.data) out.result(result.data);
				else out.error(result.error);
				return;
			}
		}
	},
});
