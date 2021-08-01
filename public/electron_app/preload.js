"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("api", {
    send: (channel, data) => {
        let allow_channels = ["ExternalLink:Open", "Cache:ClearCache", "Cache:ShowSpaceRequest", "video:play",
            "download:stop", "download:pause", "download:resume", "style:caption"];
        if (allow_channels.includes(channel)) {
            electron_1.ipcRenderer.send(channel, data);
        }
    },
    receive: (channel, func) => {
        let allow_channels = ["Cache:ShowSpaceResponse", "download:info", "get:style:caption"];
        if (allow_channels.includes(channel)) {
            electron_1.ipcRenderer.on(channel, (e, ...args) => func(...args));
        }
    }
});
