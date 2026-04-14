import * as p from "@clack/prompts";
import chalk from "chalk";
import { defineCommand } from "citty";
import { monitor } from "scrapegraph-js";
import { getApiKey } from "../lib/client.js";
import * as log from "../lib/log.js";

const ACTIONS = ["create", "list", "get", "update", "delete", "pause", "resume"] as const;
type Action = (typeof ACTIONS)[number];

const FORMATS = [
	"markdown",
	"html",
	"screenshot",
	"branding",
	"links",
	"images",
	"summary",
	"json",
] as const;

export default defineCommand({
	meta: {
		name: "monitor",
		description: "Create and manage page-change monitors",
	},
	args: {
		action: {
			type: "positional",
			description: `Action: ${ACTIONS.join(", ")}`,
			required: true,
		},
		url: {
			type: "string",
			description: "URL to monitor (for create)",
		},
		id: {
			type: "string",
			description: "Monitor ID (for get, update, delete, pause, resume)",
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
			description: `Formats to track: ${FORMATS.join(", ")} (default: markdown). Comma-separate for multi-format.`,
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
		json: { type: "boolean", description: "Output raw JSON (pipeable)" },
	},
	run: async ({ args }) => {
		const out = log.create(!!args.json);
		const apiKey = await getApiKey(!!args.json);
		const action = args.action as Action;

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

				const requestedFormats = (args.format ?? "markdown")
					.split(",")
					.map((f) => f.trim())
					.filter(Boolean);

				const formats = requestedFormats.map((f) => {
					if (f === "markdown" || f === "html")
						return { type: f as "markdown" | "html", mode: "normal" as const };
					return { type: f };
				});

				const params: Record<string, unknown> = {
					url: args.url,
					interval: args.interval,
					formats,
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
				if (args.format) {
					params.formats = args.format
						.split(",")
						.map((f) => f.trim())
						.filter(Boolean)
						.map((f) => {
							if (f === "markdown" || f === "html") return { type: f, mode: "normal" as const };
							return { type: f };
						});
				}

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

			default:
				out.error(`Unknown action: ${action}. Valid: ${ACTIONS.join(", ")}`);
		}
	},
});
