import "dotenv/config";
import { defineCommand, runMain } from "citty";
import { getVersion, showBanner } from "./utils/banner.js";

showBanner();

const main = defineCommand({
	meta: {
		name: "scrapegraphai",
		version: getVersion(),
		description: "ScrapeGraph AI CLI tool",
	},
	subCommands: {
		"smart-scraper": () => import("./commands/smart-scraper.js").then((m) => m.default),
		"search-scraper": () => import("./commands/search-scraper.js").then((m) => m.default),
		markdownify: () => import("./commands/markdownify.js").then((m) => m.default),
		crawl: () => import("./commands/crawl.js").then((m) => m.default),
		sitemap: () => import("./commands/sitemap.js").then((m) => m.default),
		scrape: () => import("./commands/scrape.js").then((m) => m.default),
		"agentic-scraper": () => import("./commands/agentic-scraper.js").then((m) => m.default),
		"generate-schema": () => import("./commands/generate-schema.js").then((m) => m.default),
		credits: () => import("./commands/credits.js").then((m) => m.default),
		validate: () => import("./commands/validate.js").then((m) => m.default),
	},
});

runMain(main);
