import { LogLevel, ILogger } from "../../shared/types/logger.types";

class RendererLogger implements ILogger {
    private context: string;

    constructor(context: string = "Renderer:") {
        this.context = context;
    }

    private sendToMainProcess(
        level: LogLevel,
        message: string,
        context?: string,
        metadata?: Record<string, any>
    ): void {
        const logContext = context || this.context;

        if (window.electron && window.electron.logger) {
            window.electron.logger.log({
                level,
                message,
                context: logContext,
                metadata,
                timestamp: new Date().toISOString(),
            })
        }
    }

    error(message: string, context?: string, metadata?: Record<string, any>): void {
        this.sendToMainProcess(LogLevel.ERROR, message, context, metadata);
    }

    warn(message: string, context?: string, metadata?: Record<string, any>): void {
        this.sendToMainProcess(LogLevel.WARN, message, context, metadata);
    }

    info(message: string, context?: string, metadata?: Record<string, any>): void {
        this.sendToMainProcess(LogLevel.INFO, message, context, metadata);
    }

    debug(message: string, context?: string, metadata?: Record<string, any>): void { 
        this.sendToMainProcess(LogLevel.DEBUG, message, context, metadata);
    }

    verbose(message: string, context?: string, metadata?: Record<string, any>): void {
        this.sendToMainProcess(LogLevel.VERBOSE, message, context, metadata);
    }

    setContext(context: string): void { 
        this.context = context;
    }
}

let loggerInstance: RendererLogger | null = null;

export function getLogger(context?: string): RendererLogger { 
    if (!loggerInstance) { 
        loggerInstance = new RendererLogger(context);
    } else if (context) { 
        loggerInstance.setContext(context);
    }
    return loggerInstance;
}

export function createLogger(context: string): RendererLogger { 
    return new RendererLogger(context);
}

export { RendererLogger };
export default getLogger;