import "dotenv/config";
import "./lib/env.js";
import { defineCommand, runMain } from "citty";
import {
	crawlCommand,
	creditsCommand,
	extractCommand,
	historyCommand,
	markdownifyCommand,
	monitorCommand,
	scrapeCommand,
	searchCommand,
} from "./commands.js";
import { getVersion, showBanner } from "./utils/banner.js";

showBanner();

const main = defineCommand({
	meta: {
		name: "just-scrape",
		version: getVersion(),
		description: "ScrapeGraph AI CLI tool",
	},
	subCommands: {
		extract: extractCommand,
		search: searchCommand,
		scrape: scrapeCommand,
		markdownify: markdownifyCommand,
		crawl: crawlCommand,
		monitor: monitorCommand,
		history: historyCommand,
		credits: creditsCommand,
	},
});

runMain(main);
