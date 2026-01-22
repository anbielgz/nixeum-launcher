import { LogLevel, LogEntry, LoggerConfig, ILogger, LoggerTransport } from "../../shared/types/logger.types";
import { ConsoleTranport, FileTransport } from "./loggerTransports";
import { app } from 'electron';
import { join } from "path";

class Logger implements ILogger {
    private config: LoggerConfig;
    private transports: LoggerTransport[];
    private consoleTransport?: ConsoleTranport;
    private fileTransport?: FileTransport;
  
    constructor(config?: Partial<LoggerConfig>) {
        this.config ={
            level: LogLevel.INFO,
            enableConsole: true,
            enableFile: true,
            maxFileSize: 10, // 10 MB
            maxFiles: 5,
            logDir: this.getDefaultLogDir(),
            ...config
        }

        this.transports = [];
        this.initalizeTransports();
    }

    //obitiene la ruta por defecto para los logs
    //en la carpeta dependiendo del sistema operativo
    // Windows: %APPDATA%/YourAppName/logs - MAC: ~/Library/Logs/YourAppName - Linux: ~/.config/YourAppName/logs
    private getDefaultLogDir(): string {
        const userDataPath = app.getPath('userData');
        return join (userDataPath, 'logs');
    }

    //verifica el nivel del log, para saber si debe registrarse o no
    private shouldLog(level: LogLevel): boolean {
        const levels = [
            LogLevel.ERROR,
            LogLevel.WARN,
            LogLevel.INFO,
            LogLevel.DEBUG,
            LogLevel.VERBOSE
        ]

        const configLevelIndex = levels.indexOf(this.config.level);
        const messageLevelIndex = levels.indexOf(level);

        return messageLevelIndex <= configLevelIndex;
    }

    //Inicializa los transportes de log
    //Como consola y archivo
    private initalizeTransports(): void {
        // Console transport
        if (this.config.enableConsole) {
            this.consoleTransport = new ConsoleTranport(true);
            this.transports.push((entry ) => this.consoleTransport!.log(entry));
        }
        if (this.config.enableFile && this.config.logDir) { 
            this.fileTransport = new FileTransport(
                this.config.logDir,
                this.config.maxFileSize * 1024 * 1024, // Convertir MB a bytes
                this.config.maxFiles
            );
            this.transports.push((entry) => this.fileTransport!.log(entry) );
        }
    } 

    //Crea una entrada de log estandarizada siguiente los tipos declarado en logger.types.ts
    private createLogEntry(
        level: LogLevel,
        message: string,
        context?: string,
        metadata?: Record<string, any>,
        error?: Error
    ): LogEntry {
        return {
            timestamp: new Date().toISOString(),
            level,
            message,
            context,
            metadata,
            stack: error?.stack
        }
    }


    //Procesa una entrada de log enviandola a los transportes configurados
    private async processLogEntry(entry: LogEntry): Promise<void> {
        if (!this.shouldLog(entry.level)) {
            return;
        }

        const promises = this.transports.map(transport => {
            try {
                return Promise.resolve(transport(entry));
            } catch (error) {
                console.error('Error in logger transport:', error);
                return Promise.resolve();
            }
        })

        await Promise.all(promises);
     }
    

     //metodos de log para cada nivel
     error(message: string, context?: string, metadata?: Record<string, any>): void {
        const error = metadata?.error instanceof Error ? metadata.error : undefined;
        const entry = this.createLogEntry(LogLevel.ERROR, message, context, metadata, error);
        this.processLogEntry(entry);
     }

     warn(message: string, context?: string, metadata?: Record<string, any>): void { 
        const entry = this.createLogEntry(LogLevel.WARN, message, context, metadata);
        this.processLogEntry(entry);
     }

     info(message: string, context?: string, metadata?: Record<string, any>): void { 
        const entry = this.createLogEntry(LogLevel.INFO, message, context, metadata);
        this.processLogEntry(entry);
     }

     debug(message: string, context?: string, metadata?: Record<string, any>): void { 
        const entry = this.createLogEntry(LogLevel.DEBUG, message, context, metadata);
        this.processLogEntry(entry);
     }

     verbose(message: string, context?: string, metadata?: Record<string, any>): void { 
        const entry = this.createLogEntry(LogLevel.VERBOSE, message, context, metadata);
        this.processLogEntry(entry);
     }


     //obtiene la ruta por defecnto o configurada para los logs
     getLogsDir(): string {
        return this.config.logDir || this.getDefaultLogDir();
     }

     close(): void {
        /*
        if (this.fileTransport) { 
            this.fileTransport.close();
        }
        if (this.levelFileTransport) {
            this.levelFileTransport.close();
        }
        */
     }

}

// Instancia singleton del logger
let loggerInstance: Logger | null = null;

/**
 * Inicializa el logger (debe llamarse una vez al inicio de la aplicación)
 */
export function initializeLogger(config?: Partial<LoggerConfig>): Logger {
  if (!loggerInstance) {
    loggerInstance = new Logger(config);
  }
  return loggerInstance;
}

/**
 * Obtiene la instancia del logger
 */
export function getLogger(): Logger {
  if (!loggerInstance) {
    loggerInstance = new Logger();
  }
  return loggerInstance;
}
/**
 * Cierra el logger y libera recursos
 */
export function closeLogger(): void {
  if (loggerInstance) {
    loggerInstance.close();
    loggerInstance = null;
  }
}


export { Logger };
export default getLogger;