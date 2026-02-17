import { expect, test } from "bun:test";
import { HISTORY_SERVICES, smartScraper } from "scrapegraph-js";

test("sdk exports are available", () => {
	expect(typeof smartScraper).toBe("function");
	expect(HISTORY_SERVICES.length).toBeGreaterThan(0);
});
