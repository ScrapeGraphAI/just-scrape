import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import * as p from "@clack/prompts";
import { CONFIG_DIR, CONFIG_PATH, env } from "./env.js";

let cachedKey: string | null = null;

export async function resolveApiKey(): Promise<string> {
	if (cachedKey) return cachedKey;

	if (env.apiKey) {
		p.log.info("Using API key from environment");
		cachedKey = env.apiKey;
		return env.apiKey;
	}

	const key = await p.text({
		message: "Enter your ScrapeGraph API key (get one at https://dashboard.scrapegraphai.com):",
		placeholder: "sgai-...",
		validate: (v) => {
			if (!v.trim()) return "API key is required";
		},
	});

	if (p.isCancel(key)) {
		p.cancel("Operation cancelled");
		process.exit(1);
	}

	const trimmed = (key as string).trim();
	mkdirSync(CONFIG_DIR, { recursive: true });
	try {
		const config = JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
		config["api-key"] = trimmed;
		writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
	} catch {
		writeFileSync(CONFIG_PATH, JSON.stringify({ "api-key": trimmed }, null, 2));
	}
	p.log.success("API key saved to ~/.scrapegraphai/config.json");

	cachedKey = trimmed;
	return trimmed;
}
