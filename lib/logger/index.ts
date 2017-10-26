
const Winston = require("winston");

import { title } from "../util";

export class Logger {

	public static initialize() {

		Winston.addColors({
			info: "green",
			warn: "yellow",
			error: "red"
		});
	}

	public static addContainer(container: string, level?: string, disableColor?: boolean) {
		Winston.loggers.add(container.toLowerCase(), {
			console: {
				level: level || "debug",
				colorize: !!disableColor || true,
				label: title(container)
			}
		});
	}

	public static log(container: string, ...message: string[]) {
		let joined = "";
		message.forEach(part => joined += part.toString());
		Winston.loggers.get(container.toLowerCase()).info(joined);
	}

	public static warn(container: string, ...message: string[]) {
		let joined = "";
		message.forEach(part => joined += part.toString());
		Winston.loggers.warn(container.toLowerCase()).warn(joined);
	}

	public static error(container: string, ...message: string[]) {
		let joined = "";
		message.forEach(part => joined += part.toString());
		Winston.loggers.get(container.toLowerCase()).error(joined);
	}
}
