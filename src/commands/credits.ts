import { defineCommand } from "citty";
import { getCredits } from "scrapegraph-js";
import { resolveApiKey } from "../lib/folders.js";
import * as log from "../lib/log.js";

export default defineCommand({
	meta: {
		name: "credits",
		description: "Check your credit balance",
	},
	args: {
		json: { type: "boolean", description: "Output raw JSON (pipeable)" },
	},
	run: async ({ args }) => {
		const out = log.create(!!args.json);
		const apiKey = await resolveApiKey(!!args.json);

		out.start("Fetching credits");
		const result = await getCredits(apiKey);
		out.stop(result.elapsedMs);

		if (result.data) out.result(result.data);
		else out.error(result.error);
	},
});
