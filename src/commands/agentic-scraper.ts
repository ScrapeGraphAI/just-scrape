import { defineCommand } from "citty";
import { resolveApiKey } from "../lib/folders.js";
import * as log from "../lib/log.js";
import * as scrapegraphai from "../lib/scrapegraphai.js";

export default defineCommand({
	meta: {
		name: "agentic-scraper",
		description: "Browser automation with AI (login, click, navigate, fill forms)",
	},
	args: {
		url: {
			type: "positional",
			description: "Starting URL",
			required: true,
		},
		steps: {
			type: "string",
			alias: "s",
			description: 'Comma-separated browser steps (e.g. "Click login,Fill email with x")',
		},
		prompt: {
			type: "string",
			alias: "p",
			description: "Extraction prompt (used with --ai-extraction)",
		},
		schema: { type: "string", description: "Output JSON schema (as JSON string)" },
		"ai-extraction": { type: "boolean", description: "Enable AI extraction after steps" },
		"use-session": { type: "boolean", description: "Persist browser session across requests" },
		json: { type: "boolean", description: "Output raw JSON (pipeable)" },
	},
	run: async ({ args }) => {
		const out = log.create(!!args.json);
		out.docs("https://docs.scrapegraphai.com/services/agenticscraper");
		const key = await resolveApiKey(!!args.json);

		const params: scrapegraphai.AgenticScraperParams = { url: args.url };

		if (args.steps) params.steps = args.steps.split(",").map((s) => s.trim());
		if (args.prompt) params.user_prompt = args.prompt;
		if (args.schema) params.output_schema = JSON.parse(args.schema);
		if (args["ai-extraction"]) params.ai_extraction = true;
		if (args["use-session"]) params.use_session = true;

		out.start("Running browser automation");
		const result = await scrapegraphai.agenticScraper(key, params, out.poll);
		out.stop(result.elapsedMs);

		if (result.data) out.result(result.data);
		else out.error(result.error);
	},
});
