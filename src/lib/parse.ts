import type { Logger } from "./log.js";

export function parseJsonArg(raw: string, field: string, out: Logger): unknown {
	try {
		return JSON.parse(raw);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		out.error(`--${field}: invalid JSON (${msg})`);
	}
}

export function parseIntArg(raw: string, field: string, out: Logger): number {
	const n = Number(raw);
	if (!Number.isFinite(n)) {
		out.error(`--${field}: expected a number, got "${raw}"`);
	}
	return n;
}
