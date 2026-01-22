//Definición de tipos relacionados con el logger

//Nivels de log
export enum LogLevel {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    DEBUG = 'debug',
    VERBOSE = 'verbose'
}

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: string;
    metadata?: Record<string, any>;
    stack?: string;
}

export interface LoggerConfig {
    level: LogLevel;
    enableConsole: boolean;
    enableFile: boolean;
    maxFileSize: number; // en MB
    maxFiles: number;
    logDir?: string;
}

export interface ILogger {
    error(message: string, context?: string, metadata?: Record<string, any>): void;
    warn(message: string, context?: string, metadata?: Record<string, any>): void;
    info(message: string, context?: string, metadata?: Record<string, any>): void;
    debug(message: string, context?: string, metadata?: Record<string, any>): void;
    verbose(message: string, context?: string, metadata?: Record<string, any>): void;
}

export type LoggerTransport = (entry: LogEntry) => void | Promise<void>;