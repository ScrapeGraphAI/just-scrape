import * as p from "@clack/prompts";
import chalk from "chalk";

function highlight(json: string): string {
	return json
		.replace(/("(?:\\.|[^"\\])*")\s*:/g, (_, key) => `${chalk.cyan(key)}:`)
		.replace(/:\s*("(?:\\.|[^"\\])*")/g, (match, val) => match.replace(val, chalk.green(val)))
		.replace(/:\s*(\d+(?:\.\d+)?)\b/g, (_, num) => `: ${chalk.yellow(num)}`)
		.replace(/:\s*(true|false|null)\b/g, (_, lit) => `: ${chalk.magenta(lit)}`);
}

function elapsed(ms: number): string {
	if (ms < 1000) return `${ms}ms`;
	return `${(ms / 1000).toFixed(1)}s`;
}

export function create(quiet = false) {
	const s = p.spinner();
	return {
		docs(url: string) {
			if (!quiet) console.log(chalk.dim(`Docs: ${url}`));
		},
		start(msg: string) {
			if (!quiet) s.start(msg);
		},
		stop(ms: number) {
			if (!quiet) s.stop(`Done in ${elapsed(ms)}`);
		},
		poll(status: string) {
			if (!quiet) s.message(`Status: ${status}`);
		},
		result(data: unknown) {
			if (quiet) console.log(JSON.stringify(data, null, 2));
			else console.log(`\n${highlight(JSON.stringify(data, null, 2))}\n`);
		},
		error(message?: string) {
			p.log.error(message ?? "Unknown error");
			process.exit(1);
		},
	};
}

export type Logger = ReturnType<typeof create>;
