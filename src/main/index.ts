import { app, BrowserWindow} from 'electron'
import path from 'path'
import { initializeLogger } from './libs/logger'
import { LogLevel } from '../shared/types/logger.types'

const logger = initializeLogger({
    level: LogLevel.DEBUG,
})

logger.info('Application starting...', 'Main Process Electron');

let win: BrowserWindow | null = null

async function createWindow(){
    win = new BrowserWindow({
        width: 1289,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, '../preload/index.js'),
            nodeIntegration: false,
            contextIsolation: true,
        }
    })

    logger.info('Creating main window...', 'Main Process Electron');
    
    win.removeMenu()
    if (process.env.VITE_DEV_SERVER_URL) {
        win.loadURL(process.env.VITE_DEV_SERVER_URL)
        win.webContents.openDevTools()
    } else {
        win.loadFile(path.join(__dirname, '../renderer/index.html'))
    }

}

app.whenReady().then(async() => {
    await createWindow()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})