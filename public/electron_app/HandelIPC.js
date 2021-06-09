"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
electron_1.ipcMain.on("ExternalLink:Open", (event, link) => {
    electron_1.shell.openExternal(link);
});
electron_1.ipcMain.on("Cache:ClearCache", (event, data) => {
    let dir = path_1.default.join(os_1.default.tmpdir(), 'webtorrent');
    if (fs_1.default.existsSync(dir)) {
        fs_1.default.rmdir(dir, { recursive: true }, () => {
        });
    }
});
electron_1.ipcMain.on("Cache:ShowSpaceRequest", (event, data) => {
    let dir = path_1.default.join(os_1.default.tmpdir(), 'webtorrent');
    if (fs_1.default.existsSync(dir)) {
        fs_1.default.readdir(dir, (err, files) => {
            event.sender.send("Cache:ShowSpaceResponse", `${files.length} folder are in cache. About ${files.length * 500} MB data`);
        });
    }
    else {
        event.sender.send("Cache:ShowSpaceResponse", `0 folder are in cache.`);
    }
});
