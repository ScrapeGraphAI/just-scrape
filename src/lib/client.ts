import { scrapegraphai } from "scrapegraph-js";
import { resolveApiKey } from "./folders.js";

let cached: ReturnType<typeof scrapegraphai> | null = null;

export async function createClient(quiet = false) {
	const apiKey = await resolveApiKey(quiet);

	if (cached) return cached;

	const baseUrl = process.env.SGAI_API_URL || undefined;
	const timeout = process.env.SGAI_TIMEOUT_S
		? Number(process.env.SGAI_TIMEOUT_S) * 1000
		: undefined;

	cached = scrapegraphai({ apiKey, baseUrl, timeout });
	return cached;
}
