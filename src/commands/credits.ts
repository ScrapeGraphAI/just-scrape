import { defineCommand } from "citty";
import { createClient } from "../lib/client.js";
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
		const sgai = await createClient(!!args.json);

		out.start("Fetching credits");
		const t0 = performance.now();
		try {
			const result = await sgai.credits();
			out.stop(Math.round(performance.now() - t0));
			out.result(result.data);
		} catch (err) {
			out.stop(Math.round(performance.now() - t0));
			out.error(err instanceof Error ? err.message : String(err));
		}
	},
});
