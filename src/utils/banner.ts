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
	"╔═╗╔═╗╦═╗╔═╗╔═╗╔═╗╔═╗╦═╗╔═╗╔═╗╦ ╦╔═╗╦",
	"╚═╗║  ╠╦╝╠═╣╠═╝║╣ ║ ╦╠╦╝╠═╣╠═╝╠═╣╠═╣║",
	"╚═╝╚═╝╩╚═╩ ╩╩  ╚═╝╚═╝╩╚═╩ ╩╩  ╩ ╩╩ ╩╩",
].join("\n");

const BANNER_COLOR = "#bd93f9";

export function showBanner() {
	const colored = BANNER.split("\n")
		.map((line) => chalk.hex(BANNER_COLOR)(line))
		.join("\n");

	console.log(colored);
	console.log(chalk.hex(BANNER_COLOR)(`v${getVersion()}`));
	console.log();
}
