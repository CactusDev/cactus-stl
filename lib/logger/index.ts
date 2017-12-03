
import { title } from "../util";

import * as Colors from "colors/safe";

export class Logger {

	private static isDebug: boolean;

	public static setDebug(debug: boolean) {
		this.isDebug = debug;
	}

	public static info(container: string, ...message: string[]) {
		let joined = message.join(" ");
		console.log(`${Colors.green("info")}(${Colors.cyan(container)}): ${joined}`);
	}

	public static warn(container: string, ...message: string[]) {
		let joined = message.join(" ");
		console.log(`${Colors.yellow("warn")}(${Colors.cyan(container)}): ${joined}`);
	}

	public static error(container: string, ...message: string[]) {
		let joined = message.join(" ");
		console.log(`${Colors.red("error")}(${Colors.cyan(container)}): ${joined}`);
	}

	public static debug(container: string, ...message: string[]) {
		if (!this.debug) {
			return;
		}
		let joined = message.join(" ");
		console.log(`${Colors.blue("debug")}(${Colors.cyan(container)}): ${joined}`);
	}
}
