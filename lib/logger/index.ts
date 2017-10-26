
const Winston = require("winston");

import { title } from "../util";

let winston: any;

export class Logger {

	public static initialize() {
		winston = new (Winston.Logger)();

		Winston.addColors({
			info: "green",
			warn: "yellow",
			error: "red"
		});
	}

	public static addContainer(container: string, debug?: boolean, disableColor?: boolean) {
		Winston.loggers.add(container.toLowerCase(), {
			console: {
				level: !!debug ? "debug" : "info",
				colorize: !!disableColor ? false : true,
				label: title(container)
			}
		});
	}

	public static log(container: string, ...message: string[]) {
		const joined = message.map(part => part.toString());
		Winston.loggers.get(container.toLowerCase()).info(joined);
	}

	public static warn(container: string, ...message: string[]) {
		const joined = message.map(part => part.toString());
		Winston.loggers.warn(container.toLowerCase()).info(joined);
	}

	public static error(container: string, ...message: string[]) {
		const joined = message.map(part => part.toString());
		Winston.loggers.get(container.toLowerCase()).error(joined);
	}
}
