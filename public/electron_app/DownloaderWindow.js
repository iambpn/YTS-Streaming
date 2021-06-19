"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
class DownloaderWindow extends electron_1.BrowserWindow {
    constructor(url) {
        super({
            width: 550,
            height: 220,
            resizable: false,
            darkTheme: true,
            backgroundColor: "#060606",
            title: "Downloader",
            webPreferences: {
                preload: path_1.default.join(__dirname, "preload.js"),
                enableRemoteModule: false
            }
        });
        this.setMenuBarVisibility(false);
        this.loadURL(url);
    }
}
exports.default = DownloaderWindow;
