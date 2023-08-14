import { colors } from "../deps.ts";

interface LogLevel {
	name: string;
	color: number;
}

const LogLevels: Record<string, LogLevel> = {
	Info:    { name: "info",  color: 0x00aaff },
	Warning: { name: "warn",  color: 0xffff00 },
	Error:   { name: "error", color: 0xff3300 },
	Debug:   { name: "debug", color: 0x00ffaa }
}

export type LogType = string | number | boolean | unknown

export class Logger {
	/**
	 * Log a message to the console.
	 * 
	 * @param level Log level
	 * @param message Message to log to the console
	 */
	public static log(level: LogLevel, message: LogType[]): void {
		const status = colors.bold(colors.rgb24(level.name, level.color));
		const line = `${status} ${colors.gray("»")}`;

        console.log(line, ...message);
    }

	public static debug(...message: LogType[]) { this.log(LogLevels.Debug,   message); }
	public static info(...message: LogType[])  { this.log(LogLevels.Info,    message); }
	public static warn(...message: LogType[])  { this.log(LogLevels.Warning, message); }
	public static error(...message: LogType[]) { this.log(LogLevels.Error,   message); }
}