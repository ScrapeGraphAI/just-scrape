import { createRequire } from "node:module";
import chalk from "chalk";

// ESM has no require() — createRequire builds one anchored to this file's location
const _require = createRequire(import.meta.url);

export function getVersion(): string {
	for (const p of ["../../package.json", "../package.json"]) {
		try {
			return _require(p).version;
		} catch {}
	}
	return "0.0.0";
}

const BANNER = [
	"╔═╗╦ ╦╔═╗╔╦╗   ╔═╗╔═╗╦═╗╔═╗╔═╗╔═╗",
	"  ║║ ║╚═╗ ║ ═══╚═╗║  ╠╦╝╠═╣╠═╝║╣ ",
	"╚═╝╚═╝╚═╝ ╩    ╚═╝╚═╝╩╚═╩ ╩╩  ╚═╝",
];

const TAGLINE = "made with ♥ from scrapegraphai team";

const BANNER_COLOR = "#bd93f9";

export function showBanner() {
	if (process.argv.includes("--json")) return;

	const text = BANNER.map((line) => chalk.hex(BANNER_COLOR)(line)).join("\n");
	console.log(text);
	console.log(chalk.hex(BANNER_COLOR)(TAGLINE));
	console.log(chalk.hex(BANNER_COLOR)(`v${getVersion()}`));
	if (process.env.JUST_SCRAPE_API_URL) {
		console.log(chalk.yellow(`→ Custom API: ${process.env.JUST_SCRAPE_API_URL}`));
	}
	console.log();
}
