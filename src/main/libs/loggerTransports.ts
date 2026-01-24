
import { LogLevel, LogEntry } from "../../shared/types/logger.types";
import path from 'path';
import fs from 'fs';

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
        const levelStr = `[${entry.level.toUpperCase()}]`;

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

export class FileTransport  {
    private logDir: string;
    private maxFileSize: number; // en bytes
    private maxFiles: number;
    private currentFile: string;
    private fileWriteStream?: fs.WriteStream;

    private ensureLogDirectory(): void { 
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    private initialiazedFileWriteStream(): void { 
        this.fileWriteStream = fs.createWriteStream(this.currentFile, { flags: 'a', encoding: 'utf-8' });
    }

    constructor(logDir: string, maxFileSize: number = 5 * 1024 * 1024, maxFiles: number = 5) { 
        this.logDir = logDir;
        this.maxFileSize = maxFileSize
        this.maxFiles = maxFiles
        this.currentFile = path.join(this.logDir, 'launcher_log.log');

        this.ensureLogDirectory();
        this.initialiazedFileWriteStream();
    }
    
    private async rotateLogFile(): Promise<void> {
    // Cerrar el stream actual
    if (this.fileWriteStream) {
      this.fileWriteStream.end();
    }

    // Renombrar archivos existentes
    for (let i = this.maxFiles - 1; i >= 1; i--) {
      const oldFile = path.join(this.logDir, `launcher.${i}.log`);
      const newFile = path.join(this.logDir, `launcher.${i + 1}.log`);
      
      if (fs.existsSync(oldFile)) {
        if (i + 1 >= this.maxFiles) {
          // Eliminar el archivo más antiguo
          fs.unlinkSync(oldFile);
        } else {
          fs.renameSync(oldFile, newFile);
        }
      }
    }

    // Renombrar el archivo actual
    const archiveFile = path.join(this.logDir, 'launcher_log_1.log');
    if (fs.existsSync(this.currentFile)) {
      fs.renameSync(this.currentFile, archiveFile);
    }

    // Reinicializar el stream
    this.initialiazedFileWriteStream();
  }

  private async checkRotation(): Promise<void> {
    if (!fs.existsSync(this.currentFile)) {
      return;
    }

    const stats = fs.statSync(this.currentFile);
    if (stats.size >= this.maxFileSize) {
      await this.rotateLogFile();
    }
  }

  async log(entry: LogEntry): Promise<void> {
    await this.checkRotation();

    const logLine = JSON.stringify({
      timestamp: entry.timestamp,
      level: entry.level,
      context: entry.context,
      message: entry.message,
      metadata: entry.metadata,
      stack: entry.stack
    }) + '\n';

    if (this.fileWriteStream) {
      this.fileWriteStream.write(logLine);
    }
  }

  close(): void {
    if (this.fileWriteStream) {
      this.fileWriteStream.end();
    }
  }
}
