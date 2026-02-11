import * as p from "@clack/prompts";
import chalk from "chalk";

function highlight(json: string): string {
	return json
		.replace(/("(?:\\.|[^"\\])*")\s*:/g, (_, key) => `${chalk.cyan(key)}:`)
		.replace(/:\s*("(?:\\.|[^"\\])*")/g, (match, val) => match.replace(val, chalk.green(val)))
		.replace(/:\s*(\d+(?:\.\d+)?)\b/g, (_, num) => `: ${chalk.yellow(num)}`)
		.replace(/:\s*(true|false|null)\b/g, (_, lit) => `: ${chalk.magenta(lit)}`);
}

export function elapsed(ms: number): string {
	if (ms < 1000) return `${ms}ms`;
	return `${(ms / 1000).toFixed(1)}s`;
}

export function result(data: unknown) {
	console.log(`\n${highlight(JSON.stringify(data, null, 2))}\n`);
}

export function docs(url: string) {
	console.log(chalk.dim(`Docs: ${url}`));
}

export function error(message?: string) {
	p.log.error(message ?? "Unknown error");
	process.exit(1);
}
