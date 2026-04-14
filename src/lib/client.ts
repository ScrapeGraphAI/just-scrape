import { resolveApiKey } from "./folders.js";

let cached: string | null = null;

export async function getApiKey(quiet = false): Promise<string> {
	if (cached) return cached;
	cached = await resolveApiKey(quiet);
	return cached;
}
