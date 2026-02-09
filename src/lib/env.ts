import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { z } from "zod";

export const CONFIG_DIR = join(homedir(), ".scrapegraphai");
export const CONFIG_PATH = join(CONFIG_DIR, "config.json");

function loadConfigFile(): Record<string, unknown> {
	if (!existsSync(CONFIG_PATH)) return {};
	try {
		return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
	} catch {
		return {};
	}
}

const EnvSchema = z.object({
	apiKey: z.string().optional(),
	debug: z.boolean().default(false),
	timeoutS: z.number().int().positive().default(120),
});

export type Env = z.infer<typeof EnvSchema>;

function resolve(): Env {
	const config = loadConfigFile();

	return EnvSchema.parse({
		apiKey: process.env.SGAI_API_KEY || (config["api-key"] as string) || undefined,
		debug: process.env.SGAI_CLI_DEBUG === "1",
		timeoutS: process.env.SGAI_CLI_TIMEOUT_S ? Number(process.env.SGAI_CLI_TIMEOUT_S) : undefined,
	});
}

export const env = resolve();
