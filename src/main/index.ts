import { app, BrowserWindow } from "electron";
import {
  registerLoggerHandlers,
  unregisterLoggerHandlers,
} from "./ipc/loggerHandlers";
import path from "path";
import { closeLogger, initializeLogger } from "./utils/logger";
import { LogLevel } from "../shared/types/logger.types";

const logger = initializeLogger({
  level: LogLevel.DEBUG,
});

logger.info("Application starting...", "Main Process Electron", {
  appVersion: app.getVersion(),
  os: process.platform,
  arch: process.arch,
  env: process.env.NODE_ENV,
});

let win: BrowserWindow | null = null;

async function createWindow() {
  win = new BrowserWindow({
    width: 1289,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  logger.info("Creating main window...", "Main Process Electron");

  win.removeMenu();
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    logger.info("Getting URL by VITE DEV SERVER", "Main Process Electron");

    win.webContents.openDevTools();
    logger.warn("Opennig DevTools Windows", "Main Process Electron");
  } else {
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(async () => {
  try {
    registerLoggerHandlers();
    await createWindow();
  } catch (error) {
    logger.error(
      "Error durante la inicialización de la aplicación:",
      "Main Process Electron",
      { error },
    );
    app.quit();
  }
});

app.on("before-quit", () => {
  unregisterLoggerHandlers();
});

app.on("quit", () => {
  logger.info("Saliendo de la aplicación...", "Main Process Electron");
  closeLogger();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
