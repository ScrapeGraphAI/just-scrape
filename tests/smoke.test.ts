import { expect, test } from "bun:test";
import { scrapegraphai } from "scrapegraph-js";

test("sdk v2 factory is callable and exposes expected methods", () => {
	expect(typeof scrapegraphai).toBe("function");

	const client = scrapegraphai({ apiKey: "sgai-test" });
	expect(typeof client.scrape).toBe("function");
	expect(typeof client.extract).toBe("function");
	expect(typeof client.search).toBe("function");
	expect(typeof client.credits).toBe("function");
	expect(typeof client.history).toBe("function");
	expect(typeof client.crawl.start).toBe("function");
	expect(typeof client.crawl.status).toBe("function");
});
