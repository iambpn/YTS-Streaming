"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
class MainWindow extends electron_1.BrowserWindow {
    constructor(url, state) {
        super({
            x: state.x,
            y: state.y,
            width: state.width,
            height: state.height,
            minWidth: 1000,
            minHeight: 600,
            darkTheme: true,
            backgroundColor: "#060606",
            title: "YTS-Streaming",
            webPreferences: {
                preload: path_1.default.join(__dirname, "preload.js"),
                backgroundThrottling: false
            }
        });
        this.loadURL(url);
    }
}
exports.default = MainWindow;
