import { expect, test } from "bun:test";
import { crawl, extract, getCredits, history, monitor, scrape, search } from "scrapegraph-js";

test("sdk v2 exports expected functions", () => {
	expect(typeof scrape).toBe("function");
	expect(typeof extract).toBe("function");
	expect(typeof search).toBe("function");
	expect(typeof getCredits).toBe("function");
	expect(typeof history.list).toBe("function");
	expect(typeof history.get).toBe("function");
	expect(typeof crawl.start).toBe("function");
	expect(typeof crawl.get).toBe("function");
	expect(typeof monitor.create).toBe("function");
	expect(typeof monitor.list).toBe("function");
});
