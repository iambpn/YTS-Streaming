import {app, ipcMain, shell} from "electron";
import isDev from "electron-is-dev";
import windowStateKeeper from "electron-window-state";

import path from "path";

import MainWindow from "./electron_app/MainWindow";
import "./electron_app/HandelIPC";

let mainWindow: Electron.BrowserWindow;

function createWindow() {
    let url = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`;
    let state = windowStateKeeper({
        defaultWidth:1200,
        defaultHeight:1000
    });

    mainWindow = new MainWindow(url,state);
    //@ts-ignore
    mainWindow.on('closed', () => mainWindow = null);

    if(isDev) {
        mainWindow.setAutoHideMenuBar(true);
    }
    else{
        mainWindow.setMenuBarVisibility(false);
    }

    state.manage(mainWindow);
}

app.on('ready', () => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (MainWindow.getAllWindows().length === 0) {
        createWindow();
    }
});