import * as p from "@clack/prompts";
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
		schema: {
			type: "string",
			description: "Output JSON schema (as JSON string)",
		},
		"ai-extraction": {
			type: "boolean",
			description: "Enable AI extraction after steps",
		},
		"use-session": {
			type: "boolean",
			description: "Persist browser session across requests",
		},
	},
	run: async ({ args }) => {
		const key = await resolveApiKey();

		const params: scrapegraphai.AgenticScraperParams = {
			url: args.url,
		};

		if (args.steps) params.steps = args.steps.split(",").map((s) => s.trim());
		if (args.prompt) params.user_prompt = args.prompt;
		if (args.schema) params.output_schema = JSON.parse(args.schema);
		if (args["ai-extraction"]) params.ai_extraction = true;
		if (args["use-session"]) params.use_session = true;

		const s = p.spinner();
		s.start("Running browser automation");
		const result = await scrapegraphai.agenticScraper(key, params, (status) => {
			s.message(`Status: ${status}`);
		});
		s.stop(`Done in ${log.elapsed(result.elapsedMs)}`);

		if (result.data) log.result(result.data);
		else log.error(result.error);
	},
});
