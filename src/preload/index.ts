import { contextBridge, ipcRenderer } from "electron";
import { LogEntry } from "../shared/types/logger.types";

contextBridge.exposeInMainWorld("electron", {
  logger: {
    log: (entry: LogEntry) => {
      ipcRenderer.send("logger:log", entry);
    },
    getConfig: async () => {
      return await ipcRenderer.invoke("logger:getConfig");
    },
    getLogDir: async () => {
      return await ipcRenderer.invoke("logger:getLogDir");
    },
    openLogDir: () => {
      ipcRenderer.send("logger:openLogDir");
    },
  },
});

declare global {
  interface Window {
    electron: {
      logger: {
        log: (entry: LogEntry) => void;
        getConfig: () => Promise<any>;
        getLogDir: () => Promise<string>;
        openLogDir: () => void;
      };
    };
  }
}
