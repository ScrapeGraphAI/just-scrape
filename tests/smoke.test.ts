import { expect, test } from "bun:test";
import { ScrapeGraphAI } from "scrapegraph-js";

test("sdk v2 factory is callable and exposes expected methods", () => {
	expect(typeof ScrapeGraphAI).toBe("function");

	const client = ScrapeGraphAI({ apiKey: "sgai-test" });
	expect(typeof client.scrape).toBe("function");
	expect(typeof client.extract).toBe("function");
	expect(typeof client.search).toBe("function");
	expect(typeof client.credits).toBe("function");
	expect(typeof client.history.list).toBe("function");
	expect(typeof client.history.get).toBe("function");
	expect(typeof client.crawl.start).toBe("function");
	expect(typeof client.crawl.get).toBe("function");
});
