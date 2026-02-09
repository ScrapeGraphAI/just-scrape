import chalk from "chalk";

const BANNER = `
 ___                         ___               _      ___ _    ___
/ __|__ _ _ __ _ _ __  ___  / __|_ _ __ _ _ __| |_   / __| |  |_ _|
\\__ / _| '_/ _\` | '_ \\/ -_)| (_ | '_/ _\` | '_ \\ ' \\ | (__| |__ | |
|___\\__|_| \\__,_| .__/\\___| \\___|_| \\__,_| .__/_||_| \\___|____|___|
                |_|                       |_|`;

const BANNER_COLOR = "#DB895F";

export function showBanner() {
	const colored = BANNER.split("\n")
		.map((line) => chalk.hex(BANNER_COLOR)(line))
		.join("\n");

	console.log(colored);
	console.log(chalk.hex(BANNER_COLOR)("ScrapeGraph AI v0.1.0"));
	console.log(chalk.hex("#E0E0E0")("Created by ScrapeGraph Team\n"));
}
