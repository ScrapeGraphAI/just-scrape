import { defineCommand } from "citty";
import { getCredits } from "scrapegraph-js";
import { getApiKey } from "../lib/client.js";
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
