import "dotenv/config";
import "./lib/env.js";
import { defineCommand, runMain } from "citty";
import { getVersion, showBanner } from "./utils/banner.js";

showBanner();

const main = defineCommand({
	meta: {
		name: "just-scrape",
		version: getVersion(),
		description: "ScrapeGraph AI CLI tool",
	},
	subCommands: {
		scrape: () => import("./commands/scrape.js").then((m) => m.default),
		extract: () => import("./commands/extract.js").then((m) => m.default),
		search: () => import("./commands/search.js").then((m) => m.default),
		crawl: () => import("./commands/crawl.js").then((m) => m.default),
		monitor: () => import("./commands/monitor.js").then((m) => m.default),
		history: () => import("./commands/history.js").then((m) => m.default),
		credits: () => import("./commands/credits.js").then((m) => m.default),
		validate: () => import("./commands/validate.js").then((m) => m.default),
	},
});

runMain(main);
