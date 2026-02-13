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
		json: { type: "boolean", description: "Output raw JSON (pipeable)" },
	},
	run: async ({ args }) => {
		const out = log.create(!!args.json);
		const key = await resolveApiKey(!!args.json);

		const params: scrapegraphai.GenerateSchemaParams = { user_prompt: args.prompt };
		if (args["existing-schema"]) params.existing_schema = JSON.parse(args["existing-schema"]);

		out.start("Generating schema");
		const result = await scrapegraphai.generateSchema(key, params, out.poll);
		out.stop(result.elapsedMs);

		if (result.data) out.result(result.data);
		else out.error(result.error);
	},
});
