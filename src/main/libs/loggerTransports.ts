
import { LogLevel, LogEntry } from "../../shared/types/logger.types";
/**
 * Colores ANSI para la consola
 */
const colors = {
  [LogLevel.ERROR]: '\x1b[31m',   // Rojo
  [LogLevel.WARN]: '\x1b[33m',    // Amarillo
  [LogLevel.INFO]: '\x1b[36m',    // Cyan
  [LogLevel.DEBUG]: '\x1b[35m',   // Magenta
  [LogLevel.VERBOSE]: '\x1b[37m', // Blanco
  reset: '\x1b[0m'
};

export class ConsoleTranport {
    private useColors: boolean;

    constructor(useColors: boolean = true) {
        this.useColors = useColors;
    }

    log(entry: LogEntry): void { 
        const color = this.useColors ? colors[entry.level] : '';
        const reset = this.useColors ? colors.reset : '';

        const timestamp = new Date(entry.timestamp).toLocaleDateString()
        const contextStr = entry.context ? `[${entry.context}]` : '';
        const levelStr = entry.level.toUpperCase().padEnd(7);

        let message = `${color}${timestamp} ${levelStr}${reset} ${contextStr} ${entry.message}`;

        if (entry.metadata && Object.keys(entry.metadata).length > 0) {
            message += `\n${color}Metadata:${reset} ${JSON.stringify(entry.metadata, null, 2)}`;
        }
        if (entry.stack) {
            message += `\n${color}Stack:${reset}\n${entry.stack}`;
        }

        console.log(message);
    }
}
