import { defineCommand } from "citty";
import { checkHealth } from "scrapegraph-js";
import { resolveApiKey } from "../lib/folders.js";
import * as log from "../lib/log.js";

export default defineCommand({
	meta: {
		name: "validate",
		description: "Validate your API key (health check)",
	},
	args: {
		json: { type: "boolean", description: "Output raw JSON (pipeable)" },
	},
	run: async ({ args }) => {
		const out = log.create(!!args.json);
		const apiKey = await resolveApiKey(!!args.json);

		out.start("Checking API health");
		const result = await checkHealth(apiKey);
		out.stop(result.elapsedMs);

		if (result.data) out.result(result.data);
		else out.error(result.error);
	},
});
