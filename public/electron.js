"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electron_is_dev_1 = __importDefault(require("electron-is-dev"));
const electron_window_state_1 = __importDefault(require("electron-window-state"));
const path_1 = __importDefault(require("path"));
const MainWindow_1 = __importDefault(require("./electron_app/MainWindow"));
require("./electron_app/HandelIPC");
let mainWindow;
function createWindow() {
    let url = electron_is_dev_1.default ? 'http://localhost:3000' : `file://${path_1.default.join(__dirname, '../build/index.html')}`;
    let state = electron_window_state_1.default({
        defaultWidth: 1200,
        defaultHeight: 1000
    });
    mainWindow = new MainWindow_1.default(url, state);
    //@ts-ignore
    mainWindow.on('closed', () => mainWindow = null);
    if (electron_is_dev_1.default) {
        mainWindow.setAutoHideMenuBar(true);
    }
    else {
        mainWindow.setMenuBarVisibility(false);
    }
    state.manage(mainWindow);
}
electron_1.app.on('ready', () => {
    createWindow();
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (MainWindow_1.default.getAllWindows().length === 0) {
        createWindow();
    }
});
