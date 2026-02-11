import * as p from "@clack/prompts";
import { defineCommand } from "citty";
import { resolveApiKey } from "../lib/folders.js";
import * as log from "../lib/log.js";
import * as scrapegraphai from "../lib/scrapegraphai.js";

export default defineCommand({
	meta: {
		name: "credits",
		description: "Check your credit balance",
	},
	run: async () => {
		const key = await resolveApiKey();
		const s = p.spinner();
		s.start("Fetching credits");
		const result = await scrapegraphai.getCredits(key);
		s.stop(`Done in ${log.elapsed(result.elapsedMs)}`);

		if (result.data) log.result(result.data);
		else log.error(result.error);
	},
});
