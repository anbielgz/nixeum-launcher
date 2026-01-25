import { ipcMain, shell } from "electron";
import { getLogger } from "../utils/logger";
import { LogEntry } from "../../shared/types/logger.types";

export function registerLoggerHandlers(): void {
  const logger = getLogger();

  console.log("[IPC] Logger handlers registered in main process.");

  ipcMain.on("logger:log", (_event, entry: LogEntry) => {
    try {
      switch (entry.level) {
        case "error":
          logger.error(entry.message, entry.context, entry.metadata);
          break;
        case "warn":
          logger.warn(entry.message, entry.context, entry.metadata);
          break;
        case "info":
          logger.info(entry.message, entry.context, entry.metadata);
          break;
        case "debug":
          logger.debug(entry.message, entry.context, entry.metadata);
          break;
        case "verbose":
          logger.verbose(entry.message, entry.context, entry.metadata);
          break;
      }
    } catch (error) {
      console.error("[IPC] Error processing log from renderer:", error);
    }
  });

  ipcMain.handle("logger:getLogDir", async () => {
    try {
      return logger.getLogsDir();
    } catch (error) {
      logger.error(
        "Error getting log directory:",
        "Main Process Electron:IPC",
        {
          error,
        },
      );
    }
  });

  ipcMain.handle("logger:getConfig", async () => {
    try {
      return logger.getConfig();
    } catch (error) {
      logger.error("Error getting config Logger", "Main Process Electron:IPC", {
        error,
      });
    }
  });

  ipcMain.on("logger:openLogDir", () => {
    try {
      const logDir = logger.getLogsDir();
      shell.openPath(logDir);
      logger.info("Open log directory", "Main Process Electron:IPC", {
        logDir,
      });
    } catch (error) {
      logger.error(
        "Error opening log directory:",
        "Main Process Electron:IPC",
        {
          error,
        },
      );
    }
  });
}

export function unregisterLoggerHandlers(): void {
  ipcMain.removeAllListeners("logger:log");
  ipcMain.removeHandler("logger:getLogDir");
  ipcMain.removeAllListeners("logger:openLogDir");
}
