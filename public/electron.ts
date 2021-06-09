import {app,BrowserWindow} from "electron";
import path from "path";
import isDev from "electron-is-dev";

let mainWindow:Electron.BrowserWindow;

function createWindow() {
    mainWindow = new BrowserWindow({width: 900, height: 680});
    mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`);
    //@ts-ignore
    mainWindow.on('closed', () => mainWindow = null);
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});