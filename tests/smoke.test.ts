import { expect, test } from "bun:test";
import { ScrapeGraphAI, crawl, extract, monitor, scrape, search } from "scrapegraph-js";

test("v2 SDK exports are available", () => {
	expect(typeof scrape).toBe("function");
	expect(typeof extract).toBe("function");
	expect(typeof search).toBe("function");
	expect(typeof crawl.start).toBe("function");
	expect(typeof monitor.create).toBe("function");
	expect(typeof ScrapeGraphAI).toBe("function");
});
