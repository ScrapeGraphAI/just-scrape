import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const CONFIG_DIR = join(homedir(), ".scrapegraphai");
export const CONFIG_PATH = join(CONFIG_DIR, "config.json");

if (process.env.JUST_SCRAPE_API_URL && !process.env.SGAI_API_URL)
	process.env.SGAI_API_URL = process.env.JUST_SCRAPE_API_URL;

if (process.env.JUST_SCRAPE_DEBUG === "1" && !process.env.SGAI_DEBUG) process.env.SGAI_DEBUG = "1";

// Bridge legacy JUST_SCRAPE_TIMEOUT_S and SGAI_TIMEOUT_S to the new SGAI_TIMEOUT var
// (renamed in scrapegraph-js v2; see scrapegraph-js PR #13 / commit 2eba148).
if (process.env.JUST_SCRAPE_TIMEOUT_S && !process.env.SGAI_TIMEOUT)
	process.env.SGAI_TIMEOUT = process.env.JUST_SCRAPE_TIMEOUT_S;

if (process.env.SGAI_TIMEOUT_S && !process.env.SGAI_TIMEOUT)
	process.env.SGAI_TIMEOUT = process.env.SGAI_TIMEOUT_S;

function loadConfigFile(): Record<string, unknown> {
	if (!existsSync(CONFIG_PATH)) return {};
	try {
		return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
	} catch {
		return {};
	}
}

export type Env = {
	apiKey?: string;
};

function resolve(): Env {
	const config = loadConfigFile();
	return {
		apiKey: process.env.SGAI_API_KEY || (config["api-key"] as string) || undefined,
	};
}

export const env = resolve();
