import * as p from "@clack/prompts";
import { defineCommand } from "citty";
import { resolveApiKey } from "../lib/folders.js";
import * as log from "../lib/log.js";
import * as scrapegraphai from "../lib/scrapegraphai.js";

export default defineCommand({
	meta: {
		name: "validate",
		description: "Validate your API key (health check)",
	},
	run: async () => {
		const key = await resolveApiKey();
		const s = p.spinner();
		s.start("Checking API health");
		const result = await scrapegraphai.checkHealth(key);
		s.stop(`Done in ${log.elapsed(result.elapsedMs)}`);

		if (result.data) log.result(result.data);
		else log.error(result.error);
	},
});
