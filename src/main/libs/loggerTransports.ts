import { LogLevel, LogEntry } from "../../shared/types/logger.types";
import path from "path";
import fs from "fs";

/**
 * Colores ANSI para la consola
 */
const colors = {
  [LogLevel.ERROR]: "\x1b[31m", // Rojo
  [LogLevel.WARN]: "\x1b[33m", // Amarillo
  [LogLevel.INFO]: "\x1b[36m", // Cyan
  [LogLevel.DEBUG]: "\x1b[35m", // Magenta
  [LogLevel.VERBOSE]: "\x1b[37m", // Blanco
  reset: "\x1b[0m",
};

export class ConsoleTranport {
  private useColors: boolean;

  constructor(useColors: boolean = true) {
    this.useColors = useColors;
  }

  log(entry: LogEntry): void {
    const color = this.useColors ? colors[entry.level] : "";
    const reset = this.useColors ? colors.reset : "";

    const timestamp = new Date(entry.timestamp).toLocaleDateString();
    const contextStr = entry.context ? `[${entry.context}]` : "";
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

export class FileTransport {
  private logDir: string;
  private maxFileSize: number; // en bytes
  private maxFiles: number;
  private currentDate: string;
  private currentFile: string;
  private fileWriteStream?: fs.WriteStream;

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private initializeFileWriteStream(): void {
    this.fileWriteStream = fs.createWriteStream(this.currentFile, {
      flags: "a",
      encoding: "utf-8",
    });
  }

  constructor(
    logDir: string,
    maxFileSize: number = 5 * 1024 * 1024,
    maxFiles: number = 5,
  ) {
    this.logDir = logDir;
    this.maxFileSize = maxFileSize;
    this.maxFiles = maxFiles;
    this.currentDate = new Date().toISOString().split("T")[0];
    this.currentFile = path.join(
      this.logDir,
      `${this.currentDate}-launcher.log`,
    );

    this.ensureLogDirectory();

    this.initializeFileWriteStream();
  }

  private checkDateChange(): void {
    const today = new Date().toISOString().split("T")[0];

    if (this.currentDate !== today) {
      if (this.fileWriteStream) {
        this.fileWriteStream.end();
      }

      this.currentDate = today;
      this.currentFile = path.join(
        this.logDir,
        `${this.currentDate}-launcher.log`,
      );

      this.initializeFileWriteStream();
    }
  }

  private async rotateLogFile(): Promise<void> {
    //verifica si el arhivo actual existe, si no exite, no hay nada que rotar
    if (!fs.existsSync(this.currentFile)) {
      return;
    }

    //verifica el tamaño del archivo
    const stats = fs.statSync(this.currentFile);

    if (stats.size < this.maxFileSize) {
      return;
    }

    // Cerrar el stream actual
    if (this.fileWriteStream) {
      this.fileWriteStream.end();
    }

    let sequenceNumber = 0;
    let rotatedFileName: string;

    do {
      rotatedFileName = path.join(
        this.logDir,
        `${this.currentDate}-launcher.${sequenceNumber}.log`,
      );
      sequenceNumber++;
    } while (fs.existsSync(rotatedFileName));

    //renombrar el archivo actual
    fs.renameSync(this.currentFile, rotatedFileName);

    console.log(`[Logger] Log file rotated: ${path.basename(rotatedFileName)}`);

    this.initializeFileWriteStream();
  }

  async log(entry: LogEntry): Promise<void> {
    //Verificar si la fecha ha cambiado
    this.checkDateChange();

    //verificar si es necesario rotar el archivo
    await this.rotateLogFile();

    const logLine =
      JSON.stringify({
        timestamp: entry.timestamp,
        level: entry.level,
        context: entry.context,
        message: entry.message,
        metadata: entry.metadata,
        stack: entry.stack,
      }) + "\n";

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
