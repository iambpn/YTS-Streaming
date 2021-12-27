"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("api", {
    send: (channel, data) => {
        let allow_channels = ["ExternalLink:Open", "Cache:ClearCache", "Cache:ShowSpaceRequest", "download:stop",
            "download:pause", "download:resume", "style:caption"];
        if (allow_channels.includes(channel)) {
            electron_1.ipcRenderer.send(channel, data);
        }
    },
    invoke: (channel, data) => __awaiter(void 0, void 0, void 0, function* () {
        let allow_channels = ["video:play"];
        if (allow_channels.includes(channel)) {
            return yield electron_1.ipcRenderer.invoke(channel, data);
        }
    }),
    receive: (channel, func) => {
        let allow_channels = ["Cache:ShowSpaceResponse", "download:info", "get:style:caption"];
        if (allow_channels.includes(channel)) {
            electron_1.ipcRenderer.on(channel, (e, ...args) => func(...args));
        }
    }
});
