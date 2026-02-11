import * as p from "@clack/prompts";
import { defineCommand } from "citty";
import { resolveApiKey } from "../lib/folders.js";
import * as log from "../lib/log.js";
import * as scrapegraphai from "../lib/scrapegraphai.js";

export default defineCommand({
	meta: {
		name: "generate-schema",
		description: "Generate a JSON schema from a natural language prompt",
	},
	args: {
		prompt: {
			type: "positional",
			description: "Describe the schema you need",
			required: true,
		},
		"existing-schema": {
			type: "string",
			description: "Existing schema to modify (as JSON string)",
		},
	},
	run: async ({ args }) => {
		const key = await resolveApiKey();

		const params: scrapegraphai.GenerateSchemaParams = {
			user_prompt: args.prompt,
		};

		if (args["existing-schema"]) params.existing_schema = JSON.parse(args["existing-schema"]);

		const s = p.spinner();
		s.start("Generating schema");
		const result = await scrapegraphai.generateSchema(key, params, (status) => {
			s.message(`Status: ${status}`);
		});
		s.stop(`Done in ${log.elapsed(result.elapsedMs)}`);

		if (result.data) log.result(result.data);
		else log.error(result.error);
	},
});
